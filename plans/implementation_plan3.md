# Plan de Implementación Final — AERO

**Fecha:** 12 de mayo de 2026  
**Objetivo:** Completar toda la funcionalidad pendiente del proyecto. Frontend polish queda para otra sesión.

---

## Estado Actual (ya funcional ✅)

| Módulo | Estado |
|---|---|
| Auth email + registro + callback OAuth | ✅ |
| Vendor dashboard, menú CRUD, panel pedidos (Realtime) | ✅ |
| Student home, menú, carrito, pedido, tracking | ✅ |
| API ratings (`POST /api/ratings`) | ✅ |
| API wallet topup (`POST /api/wallet/topup`) | ✅ |
| UI calificar pedido (`/student/order/[id]/rate`) | ✅ |
| UI wallet (`/student/wallet`) | ✅ |
| UI perfil estudiante (`/student/profile`) | ✅ |
| UI perfil vendedor (`/vendor/profile`) | ✅ |
| UI favoritos (`/student/favorites` + corazón en menú) | ✅ |
| Mapa de entregas (`/student/map` — Google Maps) | ✅ |
| Reportes semanales (Edge Function + UI) | ✅ |
| RLS 14 tablas + Storage buckets + policies | ✅ |

---

## Decisiones Confirmadas

| Pregunta | Decisión |
|---|---|
| Google Cloud Console | El usuario tiene acceso e intentará darme acceso para configurar |
| Azure Portal | Tiene acceso desde cuenta personal. Implementar registro, luego probar con correos institucionales |
| Push Notifications | **VAPID puro** con `web-push` (ya instalado) |
| Pasarelas de pago reales | **NO se implementan** — no hay RUT real. Los webhooks de Kushki/Nequi/Daviplata se quedan como stubs 501. El pago simulado actual es suficiente para la demo |

---

## FASE 1 — Marcar Pedido Entregado + Wallet Real (~1h)

### Contexto
El endpoint `/api/orders/[id]/delivered` retorna 501. La transición `ready → delivered` ya funciona vía `/api/orders/[id]/status`, pero el endpoint dedicado no existe. Además, el pago con wallet es 100% simulado — nunca toca `wallet_balance`.

---

### 1.1 Endpoint Delivered

#### [MODIFY] [route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/orders/%5Bid%5D/delivered/route.ts)

Reemplazar el stub 501 con:
- `PUT` — verificar `auth.uid() = vendor_id`
- Validar transición `ready → delivered`
- Cambiar `status → delivered`
- Si `payment_method = wallet` y el descuento no se hizo al crear el pedido: descontar `wallet_balance` del estudiante, insertar `wallet_transactions` tipo `purchase`

```ts
// Lógica:
// 1. Auth check
// 2. Fetch order (id, status, vendor_id, student_id, total_amount, payment_method)
// 3. Verify vendor ownership
// 4. Verify status === 'ready'
// 5. Update order status → 'delivered'
// 6. If payment_method === 'wallet' y aún no se descontó:
//    a. Fetch student.wallet_balance
//    b. Verify balance >= total_amount
//    c. Decrement wallet_balance
//    d. Insert wallet_transaction (type: 'purchase')
```

---

### 1.2 Wallet Real en Creación de Pedido

#### [MODIFY] [route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/orders/route.ts)

Actualmente líneas 116-125 simulan el pago sin tocar `wallet_balance`. Cambiar a:

- Si `payment_method = wallet`: verificar `students.wallet_balance >= total` **antes** de crear el pedido
- Descontar `wallet_balance` al crear el pedido
- Insertar `wallet_transactions` con type `purchase` y `balance_after`
- Si el balance es insuficiente: retornar 402 "Saldo insuficiente"
- Para otros métodos de pago (QR, Nequi, Daviplata): mantener el pago simulado actual (insertar payment con `status: 'paid'`)

> [!NOTE]
> El `CHECK (wallet_balance >= 0)` en la DB rechaza saldo negativo como safety net, pero debemos validar antes para dar un error legible.

---

## FASE 2 — OAuth Google + Microsoft (~45min)

### Contexto
Los botones OAuth ya existen en `login/page.tsx` (líneas 161-195) y llaman `supabase.auth.signInWithOAuth({ provider: 'google' | 'azure' })`. El callback handler ya existe y maneja role setup. **No hay código Next.js que cambiar** — solo configuración en consolas externas + Supabase Dashboard.

---

### 2.1 Google OAuth + Maps API Key

#### Si me das acceso a Google Cloud Console, yo hago:

1. Crear/seleccionar proyecto → Nombre: `AERO`
2. Configurar OAuth consent screen (External, scopes: email/profile/openid)
3. Crear OAuth 2.0 Client ID (Web) con redirect URI: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
4. Habilitar **Maps JavaScript API**
5. Crear API Key para Maps (restringida por HTTP referrer)
6. Configurar el provider Google en **Supabase Dashboard → Auth → Providers**

#### Si necesitas hacerlo manualmente (paso a paso):

1. [console.cloud.google.com](https://console.cloud.google.com) → Crear proyecto `AERO`
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → App name: `AERO`
   - Authorized domains: `supabase.co`
   - Scopes: `email`, `profile`, `openid`
3. **Credentials → Create → OAuth 2.0 Client ID**:
   - Type: **Web application** → Name: `AERO Web`
   - Authorized redirect URIs: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
4. Copiar **Client ID** y **Client Secret**
5. **APIs & Services → Library** → Buscar y habilitar **Maps JavaScript API**
6. **Credentials → Create → API Key** → Restringir a HTTP referrers
7. Supabase Dashboard → **Auth → Providers → Google** → Pegar Client ID + Secret → Guardar

#### [MODIFY] `.env.local`
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<API key del paso 6>
```

---

### 2.2 Microsoft (Azure AD) OAuth

#### Si me das acceso al Azure Portal, yo hago:

1. App registration con redirect URI apuntando a Supabase
2. Crear client secret
3. Configurar permisos de Graph API
4. Configurar provider Azure en Supabase Dashboard

#### Si necesitas hacerlo manualmente:

1. [portal.azure.com](https://portal.azure.com) → Loguearte con cuenta personal
2. **Azure Active Directory → App registrations → New registration**:
   - Name: `AERO`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Web** → `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
3. Copiar **Application (client) ID**
4. **Certificates & secrets → New client secret** → Description: `AERO Supabase`, Expires: 24 months
5. Copiar el **Value** (⚠️ solo visible una vez)
6. **API permissions → Add → Microsoft Graph → Delegated**: `email`, `openid`, `profile`, `User.Read`
7. Supabase Dashboard → **Auth → Providers → Azure** → Toggle ON
8. Pegar Application ID (Client ID) + Client Secret
9. Azure URL: dejar como `https://login.microsoftonline.com` (multi-tenant con `common`)
10. Guardar

> [!IMPORTANT]
> Primero probamos con cuenta personal de Microsoft. Luego probamos login con `@unisabana.edu.co` — si el tenant lo permite, funcionará automáticamente.

---

## FASE 3 — Push Notifications con VAPID (~1.5h)

### Contexto
Los stubs `api/push/subscribe` y `api/push/send` retornan 501. La librería `web-push` ya está en `package.json` con types. Se necesita: generar VAPID keys, crear service worker, implementar APIs, y conectar al flujo de pedido.

---

### 3.1 Generar VAPID Keys

```bash
cd apps/web
npx web-push generate-vapid-keys
```

#### [MODIFY] `.env.local`
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key generada>
VAPID_PRIVATE_KEY=<private key generada>
VAPID_SUBJECT=mailto:aero@unisabana.edu.co
```

---

### 3.2 Service Worker

#### [NEW] `apps/web/public/sw.js`

Service worker que escucha eventos `push` y muestra notificación del browser:

```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'AERO', body: 'Tienes una actualización' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: data.url ? { url: data.url } : undefined,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
```

---

### 3.3 API Subscribe

#### [MODIFY] [route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/push/subscribe/route.ts)

- `POST` body: `{ subscription }` (PushSubscription object serializado del browser)
- Guardar JSON stringified en `profiles.fcm_token` (la columna es `VARCHAR(500)`, cabe)
- Auth check: solo usuarios autenticados
- Retornar 200

---

### 3.4 API Send

#### [MODIFY] [route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/push/send/route.ts)

- `POST` body: `{ user_id, title, body, url? }`
- Fetch `profiles.fcm_token` del `user_id`
- Si no tiene subscription: retornar 200 (no-op, sin error)
- Parse como PushSubscription → `webpush.sendNotification()` con VAPID keys
- Retornar 200

---

### 3.5 Hook Frontend para Solicitar Permiso

#### [NEW] `apps/web/lib/hooks/usePushSubscription.ts`

Custom hook que:
1. Verifica soporte de `Notification` y `serviceWorker` en el browser
2. Solicita permiso con `Notification.requestPermission()`
3. Registra el service worker (`/sw.js`)
4. Obtiene subscription con `pushManager.subscribe({ applicationServerKey })`
5. Envía la subscription a `POST /api/push/subscribe`

Llamar este hook desde `student/layout.tsx` al montar.

---

### 3.6 Trigger: Notificar al Estudiante cuando Pedido = Ready

#### [MODIFY] [route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/orders/%5Bid%5D/status/route.ts)

Después de actualizar exitosamente el status, si `newStatus === 'ready'`:
- Necesitamos agregar `student_id` al SELECT de la línea 32 (actualmente solo selecciona `id, status, vendor_id`)
- Fire-and-forget: llamar internamente a `/api/push/send` con los datos del estudiante
- Non-blocking: no afecta la respuesta al vendedor si falla

---

## FASE 4 — Historial de Pedidos del Estudiante (~45min)

### Contexto
No existe una página donde el estudiante vea sus pedidos pasados. Es funcionalidad core.

---

### 4.1 Página de Historial

#### [NEW] `apps/web/app/student/orders/page.tsx`

- Fetch `orders` del estudiante autenticado, join con `vendors(business_name)` y `order_items(quantity, unit_price, products(name))`
- Dos tabs: **Activos** (pending, confirmed, preparing, ready) / **Anteriores** (delivered, cancelled)
- Cada tarjeta: fecha, nombre del vendedor, resumen de items, total en COP, badge de estado con color
- Click → navega a `/student/order/[id]/tracking`
- Botón "Calificar" visible solo si status=delivered y no tiene rating aún

---

### 4.2 Agregar al Navegación del Estudiante

#### [MODIFY] `apps/web/app/student/layout.tsx`

Agregar link/ícono "Mis pedidos" en la barra de navegación inferior del estudiante.

---

## FASE 5 — Botón Cancelar Pedido en UI del Vendedor (~30min)

### Contexto
La API ya soporta `pending → cancelled` y `confirmed → cancelled`, pero no hay botón en la UI.

---

#### [MODIFY] `apps/web/app/vendor/orders/page.tsx`

- Agregar botón "Cancelar" (rojo, con icono X) en tarjetas de pedidos con status `pending` o `confirmed`
- Modal de confirmación antes de ejecutar ("¿Estás seguro de cancelar este pedido?")
- Llamar `PUT /api/orders/[id]/status` con `{ status: 'cancelled' }`
- Actualizar estado local después de confirmar

---

## FASE 6 — Limpieza Final

### 6.1 Actualizar `.env.example`

#### [MODIFY] [.env.example](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/.env.example)

Verificar que estén documentadas las variables VAPID. Las de OAuth se configuran en Supabase Dashboard (no en código).

### 6.2 Regenerar Tipos TypeScript

```bash
npx supabase gen types typescript --project-id vtngzjobuhqjnckuyrsx --schema public > apps/web/types/database.ts
```

---

## FUERA DE ALCANCE — Próxima Sesión (Frontend Polish)

> [!NOTE]
> Estas mejoras se abordarán en una sesión dedicada de frontend.

| Mejora | Dónde |
|---|---|
| Imagen de portada + fallback gradiente en tarjetas vendor | `student/home` |
| Animaciones de entrada (Framer Motion stagger) | `student/home`, `vendor/menu` |
| Skeleton loaders en lugar de spinners | Todas las páginas con fetch |
| Empty states ilustrados (SVG + CTA) | Pedidos, favoritos, wallet |
| Modal de confirmación al eliminar producto | `vendor/menu` |
| Mejorar UI historial pedidos vendedor | `/vendor/orders` tab Finalizados |
| Dark mode con Tailwind `dark:` classes | Global |
| PWA manifest + service worker mejorado | `public/manifest.json` |
| Búsqueda/filtro de vendors en home | `student/home` |
| Micro-animaciones y hover effects | Global |

---

## Verification Plan

| Fase | Verificación |
|---|---|
| 1.1 Delivered | Pedido en `ready` → `PUT /api/orders/[id]/delivered` → status=delivered + wallet descontada si aplica |
| 1.2 Wallet real | Pedido con wallet → `wallet_balance` decrementada → `wallet_transactions` type=purchase |
| 2.1 Google | Click "Continuar con Google" → redirect → callback → redirige según rol |
| 2.2 Microsoft | Click "Microsoft" → redirect → callback → redirige según rol |
| 3 Push | Estudiante acepta notificaciones → vendor marca `ready` → push aparece en browser |
| 4 Historial | `/student/orders` → tabs activos/anteriores → click lleva a tracking |
| 5 Cancelar | Vendor ve pedido pending → click cancelar → confirmar → status=cancelled |
| Build | `cd apps/web && npm run build` sin errores |

---

## Orden de Ejecución

```
1. FASE 1.1 → Endpoint delivered                    (~30 min)
2. FASE 1.2 → Wallet real en orders                 (~30 min)
3. FASE 2   → OAuth Google + Microsoft (config)     (~45 min)
4. FASE 3   → Push notifications VAPID              (~1.5 h)
5. FASE 4   → Historial pedidos estudiante           (~45 min)
6. FASE 5   → Botón cancelar en vendor orders        (~30 min)
7. FASE 6   → Env vars + tipos                       (~15 min)
8. VERIFICACIÓN                                       (~30 min)
```

**Tiempo estimado total: ~5 horas**

---

*Implementation Plan — AERO Capstone 2026-1 | 12-Mayo-2026*
