# Avance 3 — Proyecto AERO
**Conexión Alimentaria Sabana Centro · Universidad de La Sabana · Capstone 2026-1**
**Fecha de corte:** 16 de mayo de 2026

---

## ¿Qué cambió en este avance?

**Avance 3** cierra las integraciones externas del proyecto: OAuth Google y Microsoft completamente configurados y funcionales, Google Maps integrado en el flujo de rastreo de pedido con visualización doble (vendor → punto de entrega), y corrección de bugs críticos en el trigger de creación de usuarios.

---

## Estado de APIs Externas

| API | Estado | Notas |
|---|---|---|
| OAuth Google | ✅ Funcional | Login + registro con Google funciona. Email y nombre se guardan correctamente. |
| OAuth Microsoft | ✅ Funcional con limitación | Login exitoso. Cuentas `@unisabana.edu.co` (Azure AD) retornan email y nombre. Cuentas Microsoft personales (MSA) no retornan email por limitación de Microsoft con el tenant consumer `9188040d...` — fuera de nuestro control. |
| Google Maps | ✅ Funcional | Mini-mapa en tracking + mapa completo en `/student/map`. Requiere `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env.local`. |
| Push Notifications | ✅ Funcional (avance 2) | VAPID configurado. |

---

## Archivos Modificados

### `apps/web/app/(auth)/callback/route.ts`

**Problema anterior:** El callback de OAuth no creaba perfil para usuarios nuevos que llegaban por Google/Microsoft. El trigger `handle_new_user` de Supabase fallaba con cuentas OAuth porque usaba un cast inseguro `::user_role` en el campo `role` del metadata — cuentas de Microsoft inyectan claims de rol (ej. "User") que no son valores válidos del enum.

**Cambios:**
- Reescritura completa con patrón de early-return limpio
- Si no hay perfil: crea `profiles` + `students` con fallback de nombre desde `full_name` → `name` → parte del email
- Si perfil existe con `role='vendor'`: verifica y crea entrada en `vendors` si no existe
- Log de errores en consola para debugging: `console.error('[OAuth callback error]', ...)`

```typescript
// Flujo nuevo
exchangeCodeForSession(code)
  → getUser()
  → SELECT profiles WHERE id = user.id
  → si no existe: INSERT profiles + INSERT students → redirect /student/home
  → si existe y es vendor: verificar vendors → redirect /vendor/dashboard
  → si existe y es student: redirect /student/home
```

---

### `apps/web/app/(auth)/login/page.tsx`

**Cambios:**
- `redirectTo` usa `process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin` en vez de solo `window.location.origin` (necesario para producción en Vercel)
- Azure OAuth recibe `scopes: 'openid email profile'` para solicitar datos de perfil
- Sin cambios visuales

```typescript
options: {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/callback`,
  skipBrowserRedirect: true,
  ...(provider === 'azure' && { scopes: 'openid email profile' }),
}
```

---

### `apps/web/app/student/order/[id]/tracking/page.tsx`

**Problema anterior:** Mini-mapa de solo 144px (`h-36`), no interactivo, mostraba únicamente el marcador del punto de entrega. No había contexto de dónde venía el pedido.

**Cambios:**
- Importa `useMap` de `@vis.gl/react-google-maps`
- Query ahora incluye `location_lat, location_lng` del vendedor
- Nuevo componente interno `MapContent` que usa `useMap()` para llamar `fitBounds` y mostrar ambos marcadores automáticamente
- Mapa crece a `h-52` y se vuelve interactivo (`gestureHandling="greedy"`)
- **Dos marcadores**: 🍽 en la ubicación del vendedor (cocina) + 📍 en el punto de entrega
- Mapa se auto-ajusta para mostrar ambos pins con `map.fitBounds(bounds, 60)`
- Label status-aware: cuando `status === 'ready'` → "Ve a recoger tu pedido en" en vez de "Punto de recogida"
- Muestra "Preparándose en [nombre vendedor]" si el vendedor tiene coordenadas
- Fallback graceful si el vendedor no tiene ubicación: solo muestra el punto de entrega como antes

**Tipo actualizado:**
```typescript
vendors: { 
  business_name: string
  location_lat: number | null
  location_lng: number | null 
} | null
```

---

### `apps/web/app/student/map/page.tsx`

**Cambio menor:** Mapa responsive — `h-72` → `h-72 md:h-[500px]` para verse mejor en desktop.

---

## Cambios en Base de Datos

### Migración: `fix_handle_new_user_safe_role_cast`

**Problema:** El trigger `handle_new_user` (llamado en INSERT a `auth.users`) usaba:
```sql
(NEW.raw_user_meta_data->>'role')::public.user_role
```
Esto crasheaba cuando Microsoft inyectaba claims como `"role": "User"` que no son valores válidos del enum `user_role ('student', 'vendor', 'admin')`.

**Fix:** Reemplazado por CASE statement que solo acepta valores válidos:
```sql
CASE WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'vendor', 'admin')
  THEN (NEW.raw_user_meta_data->>'role')::public.user_role
  ELSE 'student'::public.user_role
END
```

---

### Migración: `handle_new_user_exception_safe`

**Problema:** Incluso con el fix anterior, cuentas Microsoft personales fallaban con `null value in column "full_name"` — Microsoft no retorna `full_name` ni `name` en el metadata del token para cuentas del tenant consumer.

**Fix:** Trigger completamente exception-safe:
- `COALESCE(NULLIF(full_name, ''), NULLIF(name, ''), NULLIF(email_prefix, ''), 'Usuario')` como nombre final
- `ON CONFLICT (id) DO NOTHING` en ambos INSERTs (`profiles` + `students`)
- Bloque `EXCEPTION WHEN OTHERS THEN RAISE LOG '...' RETURN NEW` — si el trigger falla, el usuario se crea igual en `auth.users` (no bloquea el flujo de autenticación)

---

### Seed de ubicaciones de vendedores

Todos los vendors existentes tenían `location_lat = null`. Se sembraron coordenadas reales dentro del campus de La Sabana:

| Vendor | lat | lng |
|---|---|---|
| Frisby | 4.86080 | -74.03250 |
| cafecito buenobonitobarato | 4.86190 | -74.03180 |
| tiendota | 4.86140 | -74.03100 |
| Mi Negocio | 4.86050 | -74.03220 |
| (cualquier otro) | 4.86120 | -74.03150 |

---

## Bugs Corregidos

| Bug | Causa Raíz | Fix |
|---|---|---|
| Microsoft OAuth → "Database error saving new user" | Trigger `handle_new_user` con cast `::user_role` inseguro | Migración `fix_handle_new_user_safe_role_cast` |
| Microsoft OAuth → "null value in column full_name" | Microsoft personal accounts no retornan nombre/email | Migración `handle_new_user_exception_safe` con fallbacks |
| `SUPABASE_SERVICE_ROLE_KEY` mal configurado | Se había pegado la URL de Azure en vez de la key | Corregido manualmente desde Supabase Dashboard |
| Usuarios "ghost" de Microsoft sin email | Flujo OAuth creaba usuario pero sin datos | Limpieza con `DELETE FROM auth.users WHERE provider='azure' AND email IS NULL` |
| Google OAuth → "provider is not enabled" | Provider no habilitado en Supabase Dashboard | Habilitado manualmente en Auth → Providers → Google |

---

## Variables de Entorno Requeridas

Verificar que `.env.local` tenga todas estas (y las mismas en Vercel al momento del deploy):

```env
NEXT_PUBLIC_SUPABASE_URL=https://vtngzjobuhqjnckuyrsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service_role key del dashboard — NO la URL de Azure>
NEXT_PUBLIC_APP_URL=http://localhost:3000  # cambiar a URL de Vercel en producción
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAneqv-vUBHhOX0csOfOrpxaWHZn8cO4jY
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid public>
VAPID_PRIVATE_KEY=<vapid private>
VAPID_SUBJECT=mailto:<email>
```

---

## Nota sobre OAuth Microsoft con cuentas personales

Las cuentas Microsoft **personales** (`@hotmail.com`, `@outlook.com`, o Gmail vinculada a cuenta MS) usan el tenant consumer de Microsoft (`9188040d-6c67-4c5b-b112-36a304b66dad`). Este tenant **no retorna** `email` ni `name` en el token OIDC aunque se soliciten los scopes `email profile`. Es una limitación de Microsoft, no un bug nuestro.

**Impacto real en producción: ninguno.** Los usuarios de la app son estudiantes y vendedores de la Universidad de La Sabana → usan cuentas `@unisabana.edu.co` que son Azure AD organizacional → retornan email y nombre correctamente.

Para el demo y las pruebas del jurado, usar cuentas `@unisabana.edu.co`.

---

## Pendientes del `plans/implementation_plan5.md`

### 🔴 CRÍTICO para entrega (20 mayo)

#### Bloque 6 — Deploy a Vercel + CI/CD
**Esfuerzo estimado:** ~1 hora  
**Debe hacerse ANTES de las pruebas de carga**

Pasos manuales (el equipo debe hacer):
1. Ir a https://vercel.com → importar repo `Aero`
2. Root Directory: `apps/web`
3. Agregar todas las env vars listadas arriba (cambiar `NEXT_PUBLIC_APP_URL` a la URL de Vercel)
4. En Google Cloud Console → OAuth credentials → agregar `https://<tu-app>.vercel.app` en Authorized JavaScript origins y redirect URIs
5. En Azure Portal → App Registration → agregar `https://<tu-app>.vercel.app` en redirect URIs

Archivo a crear: `.github/workflows/ci.yml` con lint → build → test en push a main.

---

#### Bloque 3 — Rediseño Frontend Web-First + Dark Mode
**Esfuerzo estimado:** ~8-10 horas  
**El bloque más grande — empieza hoy**

Sub-tareas en orden de impacto:

1. **Dark mode system** (`globals.css` + `tailwind.config.ts`):
   - Variables CSS a HSL para soporte `dark:`
   - Clase `.dark` con variantes oscuras de todos los colores AERO
   - `darkMode: 'class'` en Tailwind
   - Hook `lib/hooks/useTheme.ts` con toggle + localStorage

2. **Layout responsivo desktop** (`student/layout.tsx` + `vendor/layout.tsx`):
   - Nuevo `components/shared/DesktopSidebar.tsx` — sidebar lateral con variantes student (azul) / vendor (naranja)
   - `md:hidden` en `StudentBottomNav` y `VendorBottomNav`
   - Grid sidebar + contenido en desktop

3. **Polish páginas principales:**
   - `login/page.tsx` → split-screen desktop: hero izquierda + formulario derecha
   - `register/page.tsx` → mismo patrón + stepper visual
   - `student/home/page.tsx` → grid 2-3 columnas para vendor cards en desktop
   - `vendor/dashboard/page.tsx` → stats en fila, orders en grid desktop
   - `vendor/orders/page.tsx` → vista tabla con columnas en desktop

4. **Componentes nuevos:**
   - `components/shared/Skeleton.tsx` — skeleton loaders (card, line, circle)
   - Reemplazar `<img>` por `<Image />` de Next.js en VendorCardList y demás

---

#### Bloque 4 — Pruebas Unitarias con Vitest
**Esfuerzo estimado:** ~3 horas

**Framework:** Jest + next/jest  
**Total:** 67 pruebas · 4 suites · ~2s de ejecución

Se configuró Jest con soporte nativo para Next.js (alias `@/`, transformación TypeScript) y se escribieron pruebas unitarias para los módulos de lógica de negocio más críticos.

### Archivos creados

| Archivo | Tests | Qué cubre |
|---|---|---|
| `__tests__/stores/cart.test.ts` | 16 | Store Zustand: addItem, cambio de vendor, updateQuantity, removeItem, total, count, clear |
| `__tests__/validations/product.test.ts` | 17 | Schemas Zod: nombre (mín 2, máx 255), precio positivo, descripción máx 500, stock entero positivo |
| `__tests__/api/order-transitions.test.ts` | 22 | Máquina de estados del pedido, cálculo de total, validación de capacidad de franjas horarias (30%) |
| `__tests__/api/ratings-schema.test.ts` | 12 | Schema de calificaciones: UUID válido, puntuaciones 1–5 enteras, comentario máx 500 chars |

### Configuración

`jest.config.js` usando `next/jest` para compatibilidad con el App Router.  
Scripts agregados en `package.json`:

```json
"test": "jest",
"test:coverage": "jest --coverage"

Cómo correr los tests:

cd apps/web
npm test
```

---

#### Bloque 7 — Items de Rúbrica
**Esfuerzo estimado:** ~2.5 horas

| Sub-bloque | Archivos | Descripción |
|---|---|---|
| 7.1 Sentry | `sentry.client.config.ts`, `sentry.server.config.ts` | Error monitoring. `npm install @sentry/nextjs` |
| 7.2 Backup doc | `README.md` | Documentar que Supabase hace backups diarios automáticos |
| 7.3 Páginas legales | `app/legal/privacy/page.tsx`, `app/legal/terms/page.tsx` | Ley 1581 (Habeas Data colombiana). Checkbox en register |
| 7.4 Feedback loop | `app/student/feedback/page.tsx`, `app/vendor/feedback/page.tsx` | Formulario bug/sugerencia. Tabla `feedback` en Supabase |

Migración SQL para 7.4:
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'sugerencia', 'otro')),
  description TEXT NOT NULL,
  screenshot_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback: own insert" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback: own read" ON feedback FOR SELECT USING (auth.uid() = user_id);
```

---

#### Bloque 5 — Pruebas de Carga (k6)
**Esfuerzo estimado:** ~1.5 horas  
**Requiere deploy en Vercel primero**

Archivo `k6/load-test.js`:
- Escenario 1: 50 VUs → GET home page → p95 < 3s
- Escenario 2: 20 VUs → POST crear pedido simultáneo
- Escenario 3: 100 VUs → GET API vendors

---

### Orden de ejecución recomendado para días restantes

```
Hoy (16 mayo) — lo que queda del día:
  → Bloque 3 parte 1: dark mode system + layouts desktop

Día 3 (17 mayo):
  → Bloque 3 parte 2: polish todas las páginas
  → Bloque 7.3: páginas legales (rápido, ~30 min)
  → Bloque 7.4: feedback form + migración SQL

Día 4 (18 mayo):
  → Bloque 4: pruebas Vitest
  → Bloque 7.1: Sentry
  → Bloque 6: Deploy Vercel (el equipo configura variables de entorno)

Día 5 (19 mayo):
  → Bloque 5: pruebas k6 contra Vercel
  → QA final: responsive 375px / 768px / 1280px, dark mode, OAuth, Maps
  → Limpieza de console.logs y código muerto

Día 6 (20 mayo — ENTREGA):
  → Buffer / fixes de última hora
  → ENTREGA
```

---

## Resumen de Estado General del Proyecto

| Módulo | Estado |
|---|---|
| Auth email/password | ✅ Completo |
| OAuth Google | ✅ Completo |
| OAuth Microsoft | ✅ Funcional (limitación MSA personal conocida y documentada) |
| Base de datos (14 tablas + RLS + triggers) | ✅ Completo |
| CRUD productos vendedor | ✅ Completo |
| Dashboard vendedor (realtime) | ✅ Completo |
| Flujo de pedido completo | ✅ Completo |
| Wallet real (recarga, deducción, historial) | ✅ Completo |
| Tracking con código 4 dígitos | ✅ Completo |
| Google Maps (tracking + mapa campus) | ✅ Completo |
| Push notifications | ✅ Completo |
| Calificaciones y favoritos | ✅ Completo |
| Reportes semanales vendedor | ✅ Completo |
| Frontend dark mode + desktop responsive | 🔴 Pendiente |
| Pruebas unitarias (Vitest) | 🔴 Pendiente |
| Pruebas de carga (k6) | 🔴 Pendiente |
| Deploy Vercel + CI/CD | 🔴 Pendiente |
| Páginas legales (Ley 1581) | 🔴 Pendiente |
| Sentry / monitoreo | 🔴 Pendiente |
| Formulario de feedback | 🔴 Pendiente |

---

## Referencia: Plan General

Para el detalle completo de cada bloque pendiente (paso a paso de configuración, archivos exactos a crear/modificar, migraciones SQL, y orden de ejecución por día), ver:

📄 [`plans/implementation_plan5.md`](../plans/implementation_plan5.md)
