# Avance 2 — Proyecto AERO
**Conexión Alimentaria Sabana Centro · Universidad de La Sabana · Capstone 2026-1**
**Fecha de corte:** 12 de mayo de 2026

---

## ¿Qué cambió en este avance?

Este avance completa la funcionalidad backend pendiente del MVP: wallet real, endpoint de entrega, push notifications VAPID, historial de pedidos del estudiante y cancelación de pedidos desde el panel del vendedor.

---

## Nuevos Archivos Creados

| Archivo | Descripción |
|---|---|
| `apps/web/public/sw.js` | Service worker para push notifications (eventos `push` y `notificationclick`) |
| `apps/web/lib/supabase/admin.ts` | Cliente Supabase con service role key (bypassa RLS para operaciones cross-user) |
| `apps/web/lib/hooks/usePushSubscription.ts` | Custom hook: solicita permiso, registra SW, suscribe pushManager, envía subscription al API |
| `apps/web/app/student/orders/page.tsx` | Página de historial de pedidos del estudiante (tabs Activos/Anteriores, botón Calificar) |
| `apps/web/app/student/orders/` | Directorio de la nueva ruta |

---

## Archivos Modificados

### Backend (API Routes)

#### [`app/api/orders/route.ts`](../apps/web/app/api/orders/route.ts)

**Problema anterior:** El pago con wallet era 100% simulado — nunca tocaba `wallet_balance` ni creaba `wallet_transactions`. El `payment_method` estaba hardcodeado a `'wallet'` sin importar qué elegía el usuario.

**Cambios:**
- Acepta `payment_method` en el body (default `'wallet'` si no se envía)
- Si `payment_method === 'wallet'`: verifica `students.wallet_balance >= total` **antes** de crear el pedido → retorna 402 con mensaje legible si es insuficiente
- Descuenta `wallet_balance` en `students` al crear el pedido
- Inserta registro en `wallet_transactions` (type: `purchase`, `balance_after`, `reference: ORDER-{id}`)
- Para QR / Nequi / Daviplata: mantiene el pago simulado existente

```typescript
// Verificación de saldo (nueva lógica)
if (payment_method === 'wallet') {
  const { data: student } = await supabase.from('students')
    .select('wallet_balance').eq('id', user.id).single()

  if (!student || student.wallet_balance < total) {
    return NextResponse.json(
      { error: `Saldo insuficiente. Disponible: $${...}` },
      { status: 402 }
    )
  }
}
```

---

#### [`app/api/orders/[id]/delivered/route.ts`](../apps/web/app/api/orders/%5Bid%5D/delivered/route.ts)

**Problema anterior:** Retornaba 501 (Not Implemented).

**Implementación completa:**
- Verifica autenticación
- Fetch del pedido con `id, status, vendor_id, student_id, total_amount, payment_method, payment_status`
- Valida que el usuario autenticado sea el `vendor_id`
- Valida que `status === 'ready'` (única transición válida hacia `delivered`)
- Actualiza `status → delivered`
- **Safety net wallet**: si `payment_method === 'wallet'` y `payment_status !== 'paid'` (caso de pedidos creados antes de FASE 1.2), descuenta el saldo y crea `wallet_transaction`

---

#### [`app/api/orders/[id]/status/route.ts`](../apps/web/app/api/orders/%5Bid%5D/status/route.ts)

**Cambio:** Se agrega `student_id` al SELECT del pedido. Cuando `newStatus === 'ready'`, hace un fetch fire-and-forget a `/api/push/send` para notificar al estudiante. No bloquea la respuesta al vendedor si falla.

```typescript
if (newStatus === 'ready' && order.student_id) {
  fetch(`${appUrl}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: order.student_id,
      title: '¡Tu pedido está listo! 🎉',
      body: 'Ya puedes recoger tu pedido en el punto de entrega.',
      url: `/student/order/${id}/tracking`,
    }),
  }).catch(() => {/* non-blocking */})
}
```

---

#### [`app/api/push/subscribe/route.ts`](../apps/web/app/api/push/subscribe/route.ts)

**Problema anterior:** Retornaba 501.

**Implementación:**
- `POST` con body `{ subscription }` (objeto `PushSubscription` serializado del browser)
- Verifica autenticación
- Guarda `JSON.stringify(subscription)` en `profiles.fcm_token`
- Retorna 200

---

#### [`app/api/push/send/route.ts`](../apps/web/app/api/push/send/route.ts)

**Problema anterior:** Retornaba 501.

**Implementación:**
- `POST` con body `{ user_id, title, body, url? }`
- Usa `createAdminClient()` (service role) para leer `profiles.fcm_token` sin restricción RLS
- Si no hay token: retorna 200 con `{ skipped: true }` (no-op silencioso)
- Parsea el JSON del token como `PushSubscription`
- Llama `webpush.sendNotification()` con VAPID keys
- Si la suscripción está expirada o inválida: limpia `fcm_token` silenciosamente

---

### Frontend (UI)

#### [`app/student/order/new/page.tsx`](../apps/web/app/student/order/new/page.tsx)

**Cambios:**
1. Agrega estado `walletBalance: number | null`
2. Nuevo `useEffect` que se activa al entrar al paso `payment` — fetch del saldo real desde `students.wallet_balance`
3. El `submitOrder()` ahora incluye `payment_method` en el body del POST
4. Widget de Saldo AERO muestra saldo real (con spinner mientras carga) en lugar del valor hardcodeado `$50.000`
5. Muestra el saldo en verde si alcanza o rojo si es insuficiente
6. Muestra advertencia visible "Saldo insuficiente — recarga tu cartera" si no alcanza

---

#### [`app/student/orders/page.tsx`](../apps/web/app/student/orders/page.tsx) *(nuevo)*

Página de historial de pedidos del estudiante.

**Funcionalidades:**
- Fetch de `orders` del estudiante con join a `vendors(business_name)`, `order_items(quantity, unit_price, products(name))` y `ratings(id)`
- Dos tabs: **Activos** (pending, confirmed, preparing, ready) / **Anteriores** (delivered, cancelled)
- Cada tarjeta muestra: nombre del vendedor, ID corto, fecha, resumen de ítems, total en COP, badge de estado con color
- Click en tarjeta → navega a `/student/order/[id]/tracking`
- Botón **"Calificar"** visible solo si `status === 'delivered'` y no tiene rating (evita doble calificación)
- Estado vacío con CTA diferenciado para Activos vs Anteriores

---

#### [`components/shared/StudentBottomNav.tsx`](../apps/web/components/shared/StudentBottomNav.tsx)

**Cambio:** Reemplaza el ícono de Favoritos por "Mis pedidos" (`ClipboardList`) apuntando a `/student/orders`.

> **Nota:** El ícono de favoritos se eliminó del navbar inferior para dar espacio. Los favoritos siguen accesibles desde el menú del vendedor (corazón en portada) y desde el perfil del estudiante.

---

#### [`app/student/layout.tsx`](../apps/web/app/student/layout.tsx)

**Cambio:** Convierte el layout a `'use client'`. Agrega componente interno `PushInit` que llama `usePushSubscription()` al montar, disparando el flujo de solicitud de permiso de notificaciones.

---

#### [`app/vendor/orders/page.tsx`](../apps/web/app/vendor/orders/page.tsx)

**Cambio:** Agrega botón "Cancelar" (rojo con ícono X) en tarjetas con `status === 'pending'` o `'confirmed'`. Al hacer clic muestra modal de confirmación con dos opciones: **Mantener** / **Sí, cancelar**. La cancelación llama `PUT /api/orders/[id]/status` con `{ status: 'cancelled' }` y actualiza el estado local optimísticamente.

---

### Infraestructura y Configuración

#### [`apps/web/.env.local`](../apps/web/.env.local)

Agrega las nuevas variables de entorno:
```bash
SUPABASE_SERVICE_ROLE_KEY=   # pendiente — ver abajo
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BMfd7009ApEj_FuCQtCyLK3FS874oLkRPjwkh75Wv9T5slKEIL6pTWnBchpKVxoJtTTDV5NlfAKVEx1I0UllwKQ
VAPID_PRIVATE_KEY=y2pdovYttOisOtDgm9lHyQxJAgmOJaCmAJdBgiiAXYE
VAPID_SUBJECT=mailto:aero@unisabana.edu.co
```

#### [`.env.example`](../.env.example)

Documentadas las nuevas variables con instrucción para generar VAPID keys y `SUPABASE_SERVICE_ROLE_KEY`.

---

## Bugs Corregidos (12 Mayo 2026)

| # | Bug | Causa | Fix |
|---|---|---|---|
| 8 | `next` unused variable en `callback/route.ts` | Variable asignada desde `searchParams` pero nunca consumida | Eliminada la línea |
| 9 | `let productNames` en `vendor/reports/page.tsx` | Variable declarada con `let` pero nunca reasignada (solo mutación de propiedades) | Cambiado a `const` |

Ambos eran errores de ESLint que bloqueaban el build de producción.

---

## Estado del Build

```
✓ Compiled successfully
✓ Linting passed (solo warnings pre-existentes de <img> — no errores)
✓ 35 páginas generadas
✓ Todas las API routes activas
```

**Warnings pre-existentes** (no son errores, no bloquean build):
- `<img>` sin `<Image />` de Next.js en varias páginas de imágenes de productos — mejora de performance futura
- `useEffect` missing dependency `selectedPoint` en `order/new` — pre-existente, no introduce bugs

---

## Lo Que Falta Implementar

### 🔴 Crítico para funcionamiento completo

#### 1. `SUPABASE_SERVICE_ROLE_KEY` (acción manual requerida)

**Impacto:** Sin esta key, el endpoint `POST /api/push/send` usa el anon client que tiene RLS — no puede leer `profiles.fcm_token` de otros usuarios.

**Pasos:**
1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard) → proyecto `vtngzjobuhqjnckuyrsx`
2. **Settings → API → Project API keys**
3. Copiar el valor de **service_role** (secret)
4. Pegarlo en `apps/web/.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

> ⚠️ Nunca commitear esta key. Está en `.gitignore` via `.env.local`.

#### 2. OAuth Google (acción manual requerida)

Los botones ya existen en `login/page.tsx`. Solo falta configuración externa:

1. [console.cloud.google.com](https://console.cloud.google.com) → proyecto `AERO`
2. **APIs & Services → Credentials → OAuth 2.0 Client ID** (Web)
3. Authorized redirect URI: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
4. Copiar Client ID + Secret → **Supabase Dashboard → Auth → Providers → Google**
5. **APIs & Services → Library** → habilitar **Maps JavaScript API**
6. Crear API Key → agregar a `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>
   ```

#### 3. OAuth Microsoft/Azure (acción manual requerida)

1. [portal.azure.com](https://portal.azure.com) → **App registrations → New registration**
2. Nombre: `AERO` | Accounts: Any organizational directory + personal accounts
3. Redirect URI: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
4. **Certificates & secrets → New client secret** (guardar el Value)
5. **API permissions**: `email`, `openid`, `profile`, `User.Read`
6. **Supabase Dashboard → Auth → Providers → Azure** → pegar Application ID + Client Secret

---

### 🟡 Mejoras Funcionales Pendientes

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Regenerar tipos TypeScript | `npx supabase gen types typescript --project-id vtngzjobuhqjnckuyrsx > types/database.ts` | Alta |
| Favoritos en navbar | Se quitó el ícono del navbar para dar espacio — evaluar si agregar en perfil o como tab | Media |
| Refund en cancelación | Si se cancela un pedido pagado con wallet, debería reembolsar `wallet_balance` | Media |
| Validación saldo en UI | Deshabilitar botón "Pagar" si `paymentMethod === 'wallet'` y `walletBalance < total` | Baja |
| Notificación a estudiante al cancelar | Push notification cuando el vendedor cancela un pedido | Baja |

---

### 🟢 Frontend Polish (próxima sesión dedicada)

| Mejora | Dónde |
|---|---|
| Imagen de portada + fallback gradiente en tarjetas vendor | `student/home` |
| Animaciones de entrada (Framer Motion stagger) | `student/home`, `vendor/menu` |
| Skeleton loaders en lugar de spinners | Todas las páginas con fetch |
| Empty states ilustrados (SVG + CTA) | Pedidos, favoritos, wallet |
| Modal de confirmación al eliminar producto | `vendor/menu` |
| Mejorar UI historial pedidos vendedor | `/vendor/orders` tab Finalizados |
| Dark mode con Tailwind `dark:` classes | Global |
| PWA manifest + iconos para instalación | `public/manifest.json`, `public/icon-192.png` |
| Búsqueda/filtro de vendors en home | `student/home` |
| Micro-animaciones y hover effects | Global |
| Reemplazar `<img>` por `<Image />` de Next.js | Todas las páginas con imágenes |

---

## Resumen de Estado por Módulo (Actualizado)

| Módulo | Estado | Notas |
|---|---|---|
| Auth (login/registro) | ✅ Completo | Email + OAuth con botones listos |
| OAuth Google | ⚙️ Config pendiente | Código listo, falta Google Cloud Console |
| OAuth Microsoft | ⚙️ Config pendiente | Código listo, falta Azure Portal |
| Base de datos + RLS | ✅ Completo | 14 tablas, triggers, índices, policies |
| Storage de imágenes | ✅ Completo | 4 buckets, policies correctas |
| Dashboard del vendedor | ✅ Completo | Realtime, estadísticas, toggle is_open |
| CRUD de productos (vendedor) | ✅ Completo | Con imágenes, validación Zod, compresión |
| Home del estudiante | ✅ Completo | Lista vendedores abiertos/cerrados |
| Menú del vendedor (estudiante) | ✅ Completo | Imágenes, carrito, bottom sheet, favorito |
| Flujo de pedido + pago wallet | ✅ Completo | Saldo real, deducción real, 402 si insuficiente |
| Flujo de pedido + otros métodos | ✅ Demo | QR/Nequi/Daviplata siguen simulados |
| Tracking del pedido | ✅ Completo | Realtime, CTA de calificación al entregar |
| Marcar pedido entregado | ✅ Completo | Endpoint `/delivered` implementado |
| Gestión de pedidos (vendedor) | ✅ Completo | Realtime, máquina de estados, botón cancelar |
| Cancelar pedido (vendedor) | ✅ Completo | Modal de confirmación, pending + confirmed |
| Historial de pedidos (estudiante) | ✅ Completo | Tabs, tarjetas, botón calificar |
| Calificaciones | ✅ Completo | API + UI con estrellas |
| Wallet | ✅ Completo | Recarga, historial, deducción real en pedidos |
| Perfil estudiante | ✅ Completo | Avatar, datos, carné, enlace wallet |
| Perfil vendedor | ✅ Completo | Portada, toggle, horario |
| Favoritos | ✅ Completo | UI optimista, lista, corazón en menú |
| Mapa de entregas | ✅ Completo | Google Maps + lista (requiere API key) |
| Reportes semanales | ✅ Completo | Edge Function + UI con gráfico |
| Push Notifications (VAPID) | ✅ Implementado | Falta `SUPABASE_SERVICE_ROLE_KEY` en env |
| Pasarelas de pago reales | 🔜 Fuera de alcance | Sin RUT real — stubs 501 aceptados para demo |

---

## Cómo Probar las Nuevas Funcionalidades

### Wallet real
1. Iniciar sesión como estudiante
2. Ir a `/student/wallet` → verificar saldo actual
3. Crear pedido → paso de pago → seleccionar "Mi Saldo AERO" → debe mostrar saldo real
4. Si saldo < total: debe mostrar warning rojo y retornar 402 al intentar pagar
5. Confirmar pedido → revisar en `/student/wallet` que el saldo disminuyó

### Historial de pedidos
1. Iniciar sesión como estudiante con pedidos previos
2. Ir a `/student/orders` (ícono ClipboardList en navbar)
3. Tab "Activos": pedidos en curso · Tab "Anteriores": delivered + cancelled
4. Click en pedido → debe navegar a tracking
5. Pedido `delivered` sin calificación → debe mostrar botón "Calificar"

### Cancelar pedido (vendedor)
1. Iniciar sesión como vendedor con pedido en `pending` o `confirmed`
2. Ir a `/vendor/orders`
3. Tarjetas activas deben mostrar botón rojo "Cancelar" junto al avance de estado
4. Click → modal de confirmación
5. Confirmar → pedido pasa a `cancelled` y aparece en tab "Finalizados"

### Push Notifications
1. Iniciar sesión como estudiante
2. Browser debe pedir permiso de notificaciones al cargar cualquier ruta `/student/*`
3. Como vendedor, marcar un pedido como "Listo para recoger"
4. Si el estudiante tiene permiso y `SUPABASE_SERVICE_ROLE_KEY` configurado → debe recibir push notification

---

*Documento generado: 12-Mayo-2026 | Proyecto AERO | Capstone 2026-1*
