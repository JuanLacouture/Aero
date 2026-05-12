# Trabajo Pendiente — AERO
**Última actualización:** 11 de mayo de 2026  
**Criterio:** Backend + lógica clave primero. Frontend al final.

---

## Estado actual (funcional hoy)

| Módulo | Estado |
|---|---|
| Auth email/contraseña login + registro | ✅ |
| Registro vendedor (trigger + API) | ✅ |
| Callback OAuth + setup post-email-confirmation | ✅ |
| Vendor dashboard (realtime, toggle is_open) | ✅ |
| Vendor menú CRUD con imágenes (Zod, WebP, storage) | ✅ |
| Vendor panel de pedidos (realtime, filtros, máquina de estados) | ✅ |
| Student home (lista vendedores) | ✅ |
| Student menú (productos, carrito, carrusel) | ✅ |
| Flujo de pedido (cart → franja → pago simulado → recibo) | ✅ |
| API crear pedido (validación slot, productos, pago simulado) | ✅ |
| API estado pedido (`pending→confirmed→preparing→ready→delivered`) | ✅ |
| RLS en 14 tablas | ✅ |
| Storage buckets + policies | ✅ |

---

## FASE 1 — Backend y lógica clave (próxima sesión)

### 1.1 Marcar pedido entregado
**Archivo:** `apps/web/app/api/orders/[id]/delivered/route.ts`  
**Estado:** Retorna 501.  
**Qué hacer:**
- `PUT` → verificar que `auth.uid() = vendor_id`, cambiar `status → delivered`, descontar `wallet_balance` del estudiante si `payment_method = wallet`.
- Reutilizar lógica de `/api/orders/[id]/status` (validar transición `ready → delivered`).

```ts
// Transición ya soportada en la máquina de estados — solo falta este endpoint dedicado
// + descuento de wallet si aplica
```

---

### 1.2 Sistema de calificaciones
**Archivos:** `apps/web/app/api/ratings/route.ts`  
**Estado:** Retorna 501.  
**Qué hacer:**
- `POST /api/ratings` → insertar en tabla `ratings` (hygiene, punctuality, quality 1-5).
- Validar que el pedido existe, pertenece al estudiante, está `delivered`, y **no tiene rating previo** (constraint `UNIQUE(order_id)`).
- El trigger `update_vendor_rating` ya existe en DB — actualiza `vendors.rating_avg` automáticamente.
- **No necesita cambios en DB** — solo implementar el route handler.

```ts
// Tabla ratings: order_id (UNIQUE), student_id, vendor_id, hygiene, punctuality, quality
// avg_score es columna generada → automático
// Trigger update_vendor_rating → actualiza vendors.rating_avg automáticamente
```

---

### 1.3 Wallet — top-up y descuento real
**Archivos:** `apps/web/app/api/wallet/topup/route.ts`  
**Estado:** Retorna 501.  
**Qué hacer:**
- `POST /api/wallet/topup` → validar `amount > 0`, incrementar `students.wallet_balance`, insertar en `wallet_transactions` (type: `topup`).
- Al confirmar pedido con `payment_method = wallet`: verificar `wallet_balance >= total`, descontar, insertar `wallet_transactions` (type: `purchase`).
- Actualmente el pago con wallet es 100% simulado sin tocar `wallet_balance`.

**Cambio en `api/orders/route.ts` también** — agregar validación y descuento real si `payment_method = wallet`.

```ts
// students.wallet_balance tiene CHECK: wallet_balance >= 0 — el DB rechaza saldo negativo
// wallet_transactions: type wallet_tx_type (topup | purchase | refund), balance_after
```

---

### 1.4 Push notifications
**Archivos:** `apps/web/app/api/push/subscribe/route.ts`, `apps/web/app/api/push/send/route.ts`  
**Estado:** Retorna 501.  
**Qué hacer:**
- `POST /api/push/subscribe` → guardar `fcm_token` en `profiles` del usuario.
- `POST /api/push/send` → enviar notificación a un token específico vía Web Push (VAPID) o Firebase Admin SDK.
- **Trigger real:** cuando vendedor cambia estado a `ready` → notificar al estudiante.
- **Requiere** generar par VAPID o configurar Firebase y añadir env vars:
  ```
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=
  VAPID_PRIVATE_KEY=
  VAPID_EMAIL=mailto:...
  ```

---

### 1.5 OAuth Google + Microsoft
**No hay código que cambiar en Next.js.** Solo configurar en Supabase Dashboard:

**Google:**
1. [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID (Web)
2. Redirect URI: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Auth → Providers → Google → Client ID + Secret

**Microsoft (Azure):**
1. [portal.azure.com](https://portal.azure.com) → App registrations → New
2. Redirect URI: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Auth → Providers → Azure → Client ID + Secret

---

### 1.6 Pasarelas de pago reales (baja prioridad, capstone puede quedarse simulado)
**Archivos:** `api/webhooks/kushki/route.ts`, `api/webhooks/nequi/route.ts`, `api/webhooks/daviplata/route.ts`  
**Estado:** 501.  
**Decisión:** Para demo académica, el pago simulado es suficiente. Implementar solo si hay tiempo o requisito del jurado.  
**Si se implementa:**
- Kushki: `POST /api/webhooks/kushki` → verificar firma HMAC, actualizar `payments.status`, `orders.payment_status`.
- Nequi/Daviplata: mismo patrón con su SDK respectivo.
- Requiere `KUSHKI_PRIVATE_KEY`, credenciales Nequi/Daviplata sandbox.

---

## FASE 2 — Páginas funcionales (backend-heavy)

### 2.1 Calificar pedido — `/student/order/[id]/rate`
**Estado:** Solo `<h1>RateOrder</h1>`.  
**Depende de:** 1.2 (API ratings).  
**Qué hacer:** Formulario con 3 sliders (higiene, puntualidad, calidad) + comentario opcional. Submit → `POST /api/ratings`. Redirigir a home.

---

### 2.2 Wallet estudiante — `/student/wallet`
**Estado:** Solo `<h1>Wallet</h1>`.  
**Depende de:** 1.3 (API wallet).  
**Qué hacer:** Mostrar saldo actual (leer `students.wallet_balance`), historial de `wallet_transactions`, botón "Recargar" → modal con monto → `POST /api/wallet/topup`.

---

### 2.3 Perfil vendedor — `/vendor/profile`
**Estado:** Solo `<h1>VendorProfile</h1>`.  
**Qué hacer:**
- Leer `vendors` row del vendedor autenticado.
- Editar: `business_name`, `description`, `schedule_start`, `schedule_end`, `cover_image_url`.
- Subir cover → bucket `covers`.
- `PUT` a tabla `vendors` directamente (RLS `vendors: own write` ya permite).

---

### 2.4 Perfil estudiante — `/student/profile`
**Estado:** Solo `<h1>StudentProfile</h1>`.  
**Qué hacer:** Ver/editar `full_name`, `avatar_url` (bucket `avatars`), `university_id`. Update en `profiles` + `students`.

---

### 2.5 Favoritos — `/student/favorites`
**Estado:** Solo `<h1>Favorites</h1>`.  
**Qué hacer:** Listar vendors de tabla `favorites` donde `student_id = auth.uid()`. Botón de corazón en home y menú del vendor → INSERT/DELETE en `favorites`. RLS ya configurada.

---

### 2.6 Mapa de puntos de entrega — `/student/map`
**Estado:** Solo `<h1>DeliveryMap</h1>`.  
**Qué hacer:** Mostrar los 3 `delivery_points` (ya tienen `lat`/`lng`) en un mapa. Opciones:
- **Leaflet** (sin API key, gratis) — recomendado para demo.
- Google Maps (requiere API key + billing).

---

### 2.7 Reportes vendedor — `/vendor/reports`
**Estado:** Solo `<h1>VendorReports</h1>`.  
**Qué hacer (versión mínima):** Leer `orders` del vendedor, calcular totales por semana, mostrar tabla. Exportar CSV client-side (no requiere Edge Function). El PDF y `weekly_reports` table son para producción.

---

## FASE 3 — Mejoras de frontend (última)

| Mejora | Dónde | Qué |
|---|---|---|
| Imagen de portada en tarjetas de vendor | `student/home` | Fallback con gradiente naranja si no hay cover |
| Animaciones de entrada | `student/home`, `vendor/menu` | Framer Motion stagger en listas |
| Skeleton loaders | Todas las páginas con fetch | Reemplazar spinner por skeletons |
| Empty states ilustrados | Pedidos, favoritos, wallet | Ilustraciones SVG + CTA |
| Confirmación de eliminar producto | `vendor/menu` | Modal de confirmación antes de DELETE |
| Historial de pedidos estudiante | `student/` (nueva ruta) | Lista de pedidos pasados con estado |
| Historial de pedidos vendedor | `/vendor/orders` tab Finalizados | Ya existe, mejorar UI |
| Dark mode | Global | Tailwind `dark:` classes, `prefers-color-scheme` |
| PWA manifest + service worker | `public/` | `manifest.json`, ícono, `theme-color` |
| Búsqueda en home | `student/home` | Filtrar vendors por nombre (client-side) |

---

## Orden recomendado para próxima sesión

```
1. → 1.1 Marcar entregado (1 archivo, 30 min)
2. → 1.2 API ratings (1 archivo, 30 min)
3. → 2.1 UI calificar pedido (depende de 1.2, 45 min)
4. → 1.3 Wallet top-up real (45 min)
5. → 2.2 UI wallet (depende de 1.3, 45 min)
6. → 2.3 Perfil vendedor (45 min)
7. → 2.4 Perfil estudiante (30 min)
8. → 2.5 Favoritos (30 min)
9. → 1.5 OAuth Google/Microsoft (config Supabase, 0 código)
10. → 1.4 Push notifications (si hay tiempo)
11. → FASE 3 frontend mejoras
```

---

## Env vars que faltan (agregar a `.env.local` cuando corresponda)

```bash
# Push / VAPID (Fase 1.4)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:aero@unisabana.edu.co

# Firebase Admin (alternativa a VAPID)
FIREBASE_SERVICE_ACCOUNT_JSON=

# Kushki (si se implementa pago real)
KUSHKI_PRIVATE_KEY=
NEXT_PUBLIC_KUSHKI_PUBLIC_KEY=

# Google Maps (si se usa para mapa)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

---

*Archivo de sesión — AERO Capstone 2026-1*
