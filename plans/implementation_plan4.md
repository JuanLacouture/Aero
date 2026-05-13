# Fix: Confusión de sesiones + Reportes en cero

Corrección de dos bugs críticos en la plataforma AERO que afectan la separación de roles (estudiante/vendedor) y la generación de reportes semanales.

---

## Bug 1: Confusión de sesiones entre estudiante y vendedor

### Diagnóstico

Al analizar el flujo de "Calificar pedido" desde la sesión de estudiante:

1. El estudiante hace clic en **"Calificar"** en `/student/orders` → navega a `/student/order/{id}/rate`
2. La página de calificación carga correctamente, el estudiante llena estrellas y envía
3. El `POST /api/ratings` se ejecuta desde una **API Route** que usa `createClient()` de `@/lib/supabase/server`
4. **Problema encontrado**: La API Route en `/api/ratings/route.ts` usa `supabase.auth.getUser()` para obtener al usuario autenticado. Si el user no tiene `student_id` en la tabla `students` (o la RLS bloquea la lectura del pedido), la calificación falla silenciosamente

**La causa raíz más probable es la RLS en la tabla `ratings`:**

```sql
-- Política actual (001_initial_schema.sql, línea 398):
CREATE POLICY "ratings: student write" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = student_id);
```

Esta política solo permite `INSERT`, pero **no hay política de `SELECT` para el estudiante** en la tabla `ratings`. Veamos las implicaciones:

- En `rate/page.tsx` línea 76-80: se ejecuta `supabase.from('ratings').select('id').eq('order_id', id).maybeSingle()` — esto sí funciona porque hay una política `ratings: public read` (SELECT USING true)
- En `/api/ratings/route.ts` línea 39-43: también hace SELECT, que funciona por la misma política

**Pero el problema REAL está en el middleware y la redirección post-calificación:**

En `middleware.ts`, el matcher incluye `/api/:path*`. Esto significa que cada request a `/api/ratings` pasa por `updateSession()` en `lib/supabase/middleware.ts`. El middleware:

1. Obtiene el `user` (línea 25)
2. Lee `user.user_metadata?.role` (línea 37)
3. **Si el role es `undefined`** → hace fallback a `profiles.role` en DB (línea 40-45)

> [!IMPORTANT]
> **Hallazgo crítico**: El middleware actual SÍ tiene el fallback a `profiles.role`, pero hay un problema fundamental: la **política RLS de `profiles`** (línea 326-329 del schema) solo permite `SELECT` si `auth.uid() = id`. Esto es correcto, no debería fallar.
>
> Sin embargo, el middleware usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` para crear su Supabase client. Si `user_metadata.role` es `undefined` (porque el usuario se registró antes de que se añadiera esa metadata), el query a `profiles` debería funcionar porque el middleware tiene la cookie del usuario. 
>
> **La confusión real viene de otro lugar**: Cuando hay **dos cuentas registradas en el mismo navegador** (una de estudiante y otra de vendedor), las **cookies de sesión** se sobrescriben mutuamente. Supabase usa la misma cookie `sb-{ref}-auth-token` para ambas cuentas. Si el usuario se loguea como vendedor en una pestaña y como estudiante en otra, la última sesión gana.

### Escenario reproducible de confusión

1. Usuario A se loguea como **estudiante** en pestaña 1
2. Usuario B se loguea como **vendedor** en pestaña 2 (mismo navegador)
3. La cookie `sb-vtngzjobuhqjnckuyrsx-auth-token` ahora tiene la sesión del **vendedor**
4. El estudiante (pestaña 1) hace clic en "Calificar" → el request a `/api/ratings` lleva la cookie del **vendedor**
5. La API valida `order.student_id !== user.id` (línea 34 de ratings/route.ts) → retorna **403**
6. La calificación falla con "No autorizado", y como el middleware detecta que el `role` es `vendor` en una ruta `/student/*`, **redirige al dashboard del vendedor**

### Solución propuesta

> [!WARNING]
> Este bug es inherente a probar dos cuentas en el mismo navegador. Sin embargo, podemos mejorar significativamente la experiencia:

#### A. Mejorar el manejo de errores en la página de calificación

**[MODIFY]** [page.tsx (rate)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/order/%5Bid%5D/rate/page.tsx)

- En `handleSubmit()`, si la respuesta es 403, mostrar un error claro: "Tu sesión ha cambiado. Vuelve a iniciar sesión como estudiante."
- Evitar que el error se trague silenciosamente

#### B. Verificar el rol del usuario en páginas críticas del estudiante (client-side)

**[MODIFY]** [page.tsx (rate)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/order/%5Bid%5D/rate/page.tsx)

- En el `useEffect` de carga, verificar que el usuario autenticado es realmente un estudiante:
  ```tsx
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.replace('/login'); return }
  // Verificar rol
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'student') {
    router.replace('/vendor/dashboard')
    return
  }
  ```

#### C. Añadir verificación de sesión en el layout del estudiante

**[MODIFY]** [layout.tsx (student)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/layout.tsx)

- Crear un componente client `<SessionGuard role="student" />` que se monta en el layout
- Verifica periódicamente que la sesión actual corresponde al rol esperado
- Si detecta cambio de sesión, redirige al login o al dashboard correcto

**[NEW]** [SessionGuard.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/components/shared/SessionGuard.tsx)

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SessionGuard({ role }: { role: 'student' | 'vendor' }) {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const actualRole = profile?.role ?? user.user_metadata?.role
      if (actualRole && actualRole !== role) {
        router.replace(actualRole === 'vendor' ? '/vendor/dashboard' : '/student/home')
      }
    }
    check()
    // Escuchar cambios de auth state (cuando otra pestaña cambia la sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        check()
      }
    })
    return () => subscription.unsubscribe()
  }, [role, router])
  return null
}
```

#### D. Añadir SessionGuard al layout del vendedor también

**[MODIFY]** [layout.tsx (vendor)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/layout.tsx)

- Importar y añadir `<SessionGuard role="vendor" />`

#### E. Mejorar la API de ratings para dar errores claros

**[MODIFY]** [route.ts (ratings API)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/ratings/route.ts)

- Si `order.student_id !== user.id`, dar un mensaje más descriptivo en vez de solo "No autorizado"
- Incluir un hint de que la sesión puede haber cambiado

---

## Bug 2: Reportes mostrando todo en ceros

### Diagnóstico

El `avance2.md` documenta que el `week_offset` ya fue cambiado de `1` a `0` en la UI (`vendor/reports/page.tsx`, línea 92). Sin embargo, el bug persiste. Hay **tres capas** donde puede fallar:

#### Capa 1: Edge Function `weekly-report/index.ts` — cálculo de fecha

```ts
// Línea 4-14:
function getWeekBounds(offset = 0): { week_start: string; week_end: string } {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7) - offset * 7)
  // ...
}
```

> [!CAUTION]
> **Bug confirmado**: La función usa `getUTCDay()` y `setUTCDate()` (UTC), pero los pedidos tienen `created_at` con zona horaria. Si estás en Colombia (UTC-5), un pedido creado el martes 13 de mayo a las 11am local (16:00 UTC) se almacena correctamente, pero:
> 
> - `getWeekBounds(0)` calcula lunes como `2026-05-11` y domingo como `2026-05-17` en **UTC**
> - El filtro `gte('created_at', '2026-05-11T00:00:00.000Z')` captura pedidos desde las 7pm del domingo 10 de mayo hora Colombia
> - El filtro `lte('created_at', '2026-05-17T23:59:59.999Z')` captura hasta las 6:59pm del domingo 17 hora Colombia
> 
> Esto debería funcionar **aproximadamente** bien, pero el problema puede ser que no hay pedidos con status `delivered` en ese rango.

#### Capa 2: El query filtra `status = 'delivered'`

```ts
// Línea 51-57:
const { data: orders } = await supabase
  .from('orders')
  .select('id, total_amount, created_at')
  .eq('vendor_id', vendor_id)
  .eq('status', 'delivered')       // ← SOLO delivered
  .gte('created_at', weekStartTs)
  .lte('created_at', weekEndTs)
```

**Si los pedidos no llegaron al status `delivered`, el reporte será cero.** Esto requiere que el flujo completo de entrega se haya completado:
1. Vendedor avanza pedido a `ready`
2. Vendedor toca "Entregar" → ingresa código de 4 dígitos
3. Solo ahí el pedido pasa a `delivered`

> [!IMPORTANT]
> **Hipótesis principal**: Si durante las pruebas los pedidos se dejaron en `ready` (o incluso en `pending`/`confirmed`/`preparing`) sin completar el flujo de entrega con código, el reporte siempre será cero. Esta es la **causa más probable** si aún ves ceros después del fix de `week_offset`.

#### Capa 3: La UI llama a la Edge Function y la respuesta puede fallar silenciosamente

En `vendor/reports/page.tsx` línea 91-93:
```ts
await supabase.functions.invoke('weekly-report', {
  body: { vendor_id: user.id, week_offset: 0 },
})
```

No se verifica si la invocación fue exitosa. Si la Edge Function no está desplegada o retorna un error, el frontend simplemente recarga `loadReports()` y muestra lo que hay en DB (que puede ser nada o un reporte con ceros).

### Solución propuesta

#### A. Añadir modo fallback local para generación de reportes

**[MODIFY]** [page.tsx (reports)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/reports/page.tsx)

- Si `supabase.functions.invoke()` falla, **generar el reporte localmente desde el frontend** consultando directamente las órdenes `delivered`:

```ts
async function generateReport() {
  setGenerating(true)
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Intentar via Edge Function primero
    const { error: fnError } = await supabase.functions.invoke('weekly-report', {
      body: { vendor_id: user.id, week_offset: 0 },
    })

    // Si la Edge Function falla, generar localmente
    if (fnError) {
      await generateReportLocally(supabase, user.id)
    }

    await loadReports()
  } finally {
    setGenerating(false)
  }
}
```

#### B. Implementar `generateReportLocally()` como safety net

**[MODIFY]** [page.tsx (reports)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/reports/page.tsx)

- Función que replica la lógica de la Edge Function pero ejecutada desde el cliente:
  1. Calcular `week_start` y `week_end` de la semana actual (lunes a domingo) usando hora **local** del navegador
  2. Consultar `orders` donde `status = 'delivered'` AND `vendor_id = user.id` AND `created_at` dentro del rango
  3. Calcular totales y daily breakdown
  4. Upsert en `weekly_reports`

#### C. Verificar que hay pedidos `delivered` (diagnóstico en UI)

**[MODIFY]** [page.tsx (reports)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/reports/page.tsx)

- Añadir un indicador que muestre cuántos pedidos `delivered` tiene el vendedor en la semana actual
- Si hay 0 pedidos delivered, mostrar un mensaje explicativo: "No hay pedidos entregados esta semana. Para que aparezcan en el reporte, completa la entrega con el código de 4 dígitos."

#### D. Corregir timezone en Edge Function

**[MODIFY]** [index.ts (weekly-report)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/supabase/functions/weekly-report/index.ts)

- Cambiar `getWeekBounds()` para usar un offset explícito de UTC-5 (Colombia):
```ts
function getWeekBounds(offset = 0): { week_start: string; week_end: string } {
  // Use Colombia time (UTC-5) to determine "today"
  const now = new Date()
  const colombiaOffset = -5 * 60 // -5 hours in minutes
  const colombiaTime = new Date(now.getTime() + (colombiaOffset + now.getTimezoneOffset()) * 60000)
  
  const dayOfWeek = colombiaTime.getDay() // 0=Sun
  const monday = new Date(colombiaTime)
  monday.setDate(colombiaTime.getDate() - ((dayOfWeek + 6) % 7) - offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { week_start: fmt(monday), week_end: fmt(sunday) }
}
```

#### E. Verificar políticas RLS de `weekly_reports`

La política actual solo permite `SELECT`:
```sql
CREATE POLICY "weekly_reports: vendor own" ON weekly_reports
  FOR SELECT USING (auth.uid() = vendor_id);
```

**No hay política de INSERT/UPDATE para vendedores.** Esto significa que la Edge Function DEBE usar `SUPABASE_SERVICE_ROLE_KEY` para insertar/actualizar reportes. Si esa key no está configurada en el ambiente de Edge Functions, el upsert falla silenciosamente.

> [!IMPORTANT]
> El fallback local en el frontend **también tendrá este problema** si intenta hacer upsert con el anon key. Necesitamos:
> 1. Verificar que `SUPABASE_SERVICE_ROLE_KEY` está en el ambiente de Edge Functions (Supabase lo provee automáticamente, pero vale la pena verificar)
> 2. Para el fallback local, crear una **API Route** (`/api/reports/generate`) que use el admin client para hacer el upsert

**[NEW]** [route.ts (generate report API)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/reports/generate/route.ts)

- API Route que replica la lógica de la Edge Function
- Usa `createAdminClient()` para bypasear RLS
- Acepta `vendor_id` en el body, verifica que el usuario autenticado es ese vendedor
- Calcula la semana actual, consulta pedidos `delivered`, genera totales, upsert en `weekly_reports`

---

## Resumen de cambios

| # | Archivo | Acción | Bug |
|---|---------|--------|-----|
| 1 | `components/shared/SessionGuard.tsx` | **[NEW]** — Componente que verifica que la sesión activa corresponde al rol del layout | Bug 1 |
| 2 | `app/student/layout.tsx` | **[MODIFY]** — Añadir `<SessionGuard role="student" />` | Bug 1 |
| 3 | `app/vendor/layout.tsx` | **[MODIFY]** — Añadir `<SessionGuard role="vendor" />` | Bug 1 |
| 4 | `app/student/order/[id]/rate/page.tsx` | **[MODIFY]** — Verificar rol al cargar + mejor manejo de error 403 | Bug 1 |
| 5 | `app/api/ratings/route.ts` | **[MODIFY]** — Mensajes de error más claros | Bug 1 |
| 6 | `app/api/reports/generate/route.ts` | **[NEW]** — API Route para generar reporte con admin client | Bug 2 |
| 7 | `app/vendor/reports/page.tsx` | **[MODIFY]** — Fallback a API Route si Edge Function falla + indicador de pedidos delivered + mensajes explicativos | Bug 2 |
| 8 | `supabase/functions/weekly-report/index.ts` | **[MODIFY]** — Corregir timezone a Colombia (UTC-5) | Bug 2 |

## Open Questions

> [!IMPORTANT]
> **¿Estás probando con dos cuentas (estudiante + vendedor) en el MISMO navegador?** Si es así, ese es el origen del Bug 1. Supabase solo mantiene UNA sesión por dominio/referencia de proyecto. La solución de `SessionGuard` detectará el problema y redirigirá al dashboard correcto, pero la forma definitiva de probar es usar **ventana incógnita/privada** para la segunda cuenta, o dos navegadores distintos (ej: Chrome + Edge).

> [!IMPORTANT]
> **¿Tienes la `SUPABASE_SERVICE_ROLE_KEY` configurada en `.env.local`?** Sin ella, el admin client (`lib/supabase/admin.ts`) cae al anon key, lo que hace que la nueva API Route de reportes no pueda insertar en `weekly_reports` (RLS lo bloquea). Necesito saber si ya la tienes para decidir si la API Route es suficiente o si necesitamos también añadir una política RLS temporal de INSERT.

> [!NOTE]
> **¿Has completado el flujo completo de entrega (con código de 4 dígitos) al menos una vez esta semana?** Si los pedidos están en `ready` pero no en `delivered`, el reporte correctamente muestra cero. Necesitamos confirmar que hay pedidos `delivered` para descartar esta causa.

## Herramientas disponibles

- **Supabase MCP**: Para ejecutar SQL directamente, verificar RLS policies activas en la DB, y consultar el estado actual de las tablas
- **Supabase Skill**: Para las mejores prácticas de auth, RLS y SSR con `@supabase/ssr`
- **Supabase Postgres Best Practices Skill**: Para optimización de queries

## Verification Plan

### Automated Tests
1. `npm run build` en `apps/web` — verificar que compila sin errores
2. Verificar en el browser:
   - Abrir dos ventanas (normal + incógnito)
   - Login como estudiante en ventana 1, vendedor en ventana 2
   - Crear pedido → avanzar a `delivered` → calificar desde estudiante
   - Verificar que la calificación se guarda correctamente
   - Generar reporte → verificar que muestra datos reales

### Manual Verification
1. Probar el flujo de calificación con sesión correcta y verificar que se guarda
2. Probar el SessionGuard: loguearse como vendedor y navegar manualmente a `/student/home` → debe redirigir
3. Generar reporte después de tener pedidos `delivered` → verificar que no muestra ceros
4. Verificar en Supabase dashboard que las filas de `ratings` y `weekly_reports` se crearon
