# Avance 2 — Proyecto AERO
**Conexión Alimentaria Sabana Centro · Universidad de La Sabana · Capstone 2026-1**
**Fecha de corte:** 12 de mayo de 2026 (actualizado misma fecha)

---

## ¿Qué cambió en este avance?

Este avance tiene dos fases:

**Fase 2A** — Funcionalidad backend pendiente del MVP: wallet real, endpoint de entrega, push notifications VAPID, historial de pedidos del estudiante, cancelación de pedidos desde el panel del vendedor.

**Fase 2B** — 8 mejoras UX + corrección de bugs críticos: rediseño de navegación, foto en registro de vendedor, corazones de favoritos en home, flujo de entrega con QR, botón Entregar para vendedor (corrige reportes en cero), buscador eliminado, puntos de entrega correctos, tipos TypeScript regenerados.

---

## Nuevos Archivos Creados

| Archivo | Descripción |
|---|---|
| `apps/web/public/sw.js` | Service worker para push notifications |
| `apps/web/lib/supabase/admin.ts` | Cliente Supabase con service role key (bypassa RLS) |
| `apps/web/lib/hooks/usePushSubscription.ts` | Hook: solicita permiso, registra SW, suscribe pushManager |
| `apps/web/app/student/orders/page.tsx` | Historial de pedidos del estudiante (tabs Activos/Anteriores) |
| `apps/web/components/shared/ActiveOrderBubble.tsx` | Burbuja flotante de pedido activo (solo visible cuando hay pedido en curso) |
| `apps/web/components/shared/PushSubscriptionInit.tsx` | Client boundary para inicializar push desde layout server component |
| `apps/web/components/student/VendorCardList.tsx` | Cards de vendedor con corazones de favoritos (client component) |
| `apps/web/components/vendor/QRScannerModal.tsx` | Modal con cámara para escanear QR del estudiante al entregar |

---

## Archivos Modificados

### Backend (API Routes)

#### [`app/api/orders/route.ts`](../apps/web/app/api/orders/route.ts)

**Problema anterior:** Pago con wallet 100% simulado. `payment_method` hardcodeado.

**Cambios:**
- Acepta `payment_method` del body
- Wallet: verifica saldo antes de crear pedido → 402 si insuficiente
- Descuenta `wallet_balance` y crea `wallet_transactions`
- QR/Nequi/Daviplata: mantiene simulación existente

---

#### [`app/api/orders/[id]/delivered/route.ts`](../apps/web/app/api/orders/%5Bid%5D/delivered/route.ts)

**Problema anterior:** Retornaba 501. **Nunca se llamaba desde UI** → causa raíz de reportes en cero.

**Ahora:** Verifica vendor, valida `status === 'ready'`, actualiza a `delivered`, safety net wallet.

---

#### [`app/api/orders/[id]/status/route.ts`](../apps/web/app/api/orders/%5Bid%5D/status/route.ts)

Agrega `student_id` al SELECT. Fire-and-forget push cuando `newStatus === 'ready'`.

---

#### [`app/api/push/subscribe/route.ts`](../apps/web/app/api/push/subscribe/route.ts) · [`app/api/push/send/route.ts`](../apps/web/app/api/push/send/route.ts)

Implementados (antes 501). Subscribe guarda en `profiles.fcm_token`. Send usa admin client + `webpush.sendNotification()`.

---

### Frontend (UI) — Fase 2A

#### [`app/student/order/new/page.tsx`](../apps/web/app/student/order/new/page.tsx)

Muestra saldo real en paso de pago, incluye `payment_method` en POST, advertencia roja si insuficiente.

#### [`app/student/orders/page.tsx`](../apps/web/app/student/orders/page.tsx) *(nuevo)*

Historial de pedidos con tabs Activos / Anteriores. Click → tracking. Botón "Calificar" en delivered sin rating.

#### [`app/vendor/orders/page.tsx`](../apps/web/app/vendor/orders/page.tsx)

Agrega botón "Cancelar" (rojo) para `pending`/`confirmed` con modal de confirmación.

---

### Frontend (UI) — Fase 2B

#### [`components/shared/StudentBottomNav.tsx`](../apps/web/components/shared/StudentBottomNav.tsx)

**Antes:** ShoppingBag ("Pedido") como segundo tab.
**Ahora:** Heart ("Favoritos") → `/student/favorites`. Tab de pedido eliminado — reemplazado por `ActiveOrderBubble`.

#### [`components/shared/ActiveOrderBubble.tsx`](../apps/web/components/shared/ActiveOrderBubble.tsx) *(nuevo)*

Burbuja flotante `fixed bottom-20` que solo aparece cuando el estudiante tiene un pedido activo. Verde cuando está `ready`, azul en otros estados. Realtime via Supabase channel. Link a `/student/order/{id}/tracking`.

#### [`app/student/layout.tsx`](../apps/web/app/student/layout.tsx)

Server Component. Importa `PushSubscriptionInit` y `ActiveOrderBubble` como client boundaries.

#### [`app/student/home/page.tsx`](../apps/web/app/student/home/page.tsx)

- **Buscador eliminado** (era decorativo, no funcional)
- Cards de vendedor reemplazadas por `<VendorCardList>` (client component con corazones)

#### [`components/student/VendorCardList.tsx`](../apps/web/components/student/VendorCardList.tsx) *(nuevo)*

Client component. Carga favoritos del usuario en mount. Cada card tiene botón Heart que inserta/elimina de tabla `favorites` con optimistic update. Badge Abierto/Cerrado movido a top-left para no solapar el corazón.

#### [`app/student/order/[id]/tracking/page.tsx`](../apps/web/app/student/order/%5Bid%5D/tracking/page.tsx)

Agrega sección **Código de entrega** con QR generado con `qrcode` (encodes order UUID). Visible mientras el pedido está activo (pending → ready). El vendedor escanea este QR para confirmar entrega.

#### [`app/vendor/orders/page.tsx`](../apps/web/app/vendor/orders/page.tsx)

- Botón **"Entregar"** (verde, ícono Truck) para pedidos en `ready`
- Abre `QRScannerModal` (dynamic import `ssr:false`)
- Verifica que el QR escaneado coincida con el ID del pedido
- Llama `PUT /api/orders/{id}/delivered` → pedido pasa a `delivered`
- Toast de confirmación/error
- Fallback manual: ingresar código si la cámara no está disponible

#### [`app/(auth)/register/page.tsx`](../apps/web/app/%28auth%29/register/page.tsx)

Agrega campo de foto opcional en sección de vendedor. Muestra preview. Después del registro, comprime con `compressImage()` y sube a bucket `covers/{userId}/cover.webp`. Actualiza `vendors.cover_image_url`.

#### [`app/student/vendor/[id]/menu/page.tsx`](../apps/web/app/student/vendor/%5Bid%5D/menu/page.tsx)

Banner amarillo "Calificar pedido anterior →" visible si el estudiante tiene pedidos `delivered` sin calificar de ese vendedor. Link a `/student/order/{orderId}/rate`.

---

### Base de Datos

#### Migración `update_delivery_points_names` (ejecutada en Supabase)

Renombra los 3 puntos de entrega existentes por ID (preserva FK refs a `time_slots` y `orders`):

| Antes | Ahora |
|---|---|
| Entrada Principal | Puente de la Clínica |
| Bloque H | Puente de Ad Portas |
| Cafetería Central | Entrada peatonal del CA |

---

### Tipos TypeScript

#### [`apps/web/types/database.ts`](../apps/web/types/database.ts)

**Regenerados desde Supabase** via MCP `generate_typescript_types`. Antes: solo `Json` type → todas las queries Supabase retornaban `never`. Ahora: tipos completos para las 14 tablas + enums + relaciones. Elimina ~80 errores `TS2339` / `TS2345` del compilador.

---

### Dependencias Nuevas

```bash
# apps/web
qrcode          # Genera QR code como data URL (client-side)
@types/qrcode   # Tipos TypeScript para qrcode
html5-qrcode    # Escanea QR con cámara del dispositivo (vendor)
```

---

## Bugs Corregidos (Fase 2A — 12 Mayo 2026)

| # | Bug | Causa | Fix |
|---|---|---|---|
| 8 | `next` unused variable en `callback/route.ts` | Variable nunca consumida | Eliminada |
| 9 | `let productNames` en `vendor/reports/page.tsx` | `let` nunca reasignado | Cambiado a `const` |

## Bugs Corregidos (Fase 2B — 12 Mayo 2026)

| # | Bug | Causa | Fix |
|---|---|---|---|
| 10 | Reportes siempre en cero | `weekly-report` solo cuenta `delivered`, pero ningún botón en UI llamaba el endpoint `/delivered` | Botón "Entregar" + QR flow completan la máquina de estados |
| 11 | `'use client'` en layout rompía webpack | Layout `student/layout.tsx` marcado como client component causaba que chunks `main-app.js` no se generaran | Revertido a Server Component, client code en boundaries separados |

---

## Estado del Build

```
✓ Compiled successfully
✓ Linting passed (solo warnings pre-existentes de <img>)
✓ 35 páginas generadas
✓ Todas las API routes activas
✓ tipos/database.ts regenerado — ~80 errores TS eliminados
```

---

## Lo Que Falta Implementar

### 🔴 Crítico para funcionamiento completo

#### 1. `SUPABASE_SERVICE_ROLE_KEY`

Sin esta key, push notifications cross-user no funcionan.

**Pasos:**
1. Supabase Dashboard → proyecto `vtngzjobuhqjnckuyrsx`
2. Settings → API → Project API keys → copiar `service_role`
3. Pegar en `apps/web/.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

#### 2. OAuth Google (config externa)

1. [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID
2. Redirect URI: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Auth → Providers → Google → pegar Client ID + Secret

#### 3. OAuth Microsoft/Azure (config externa)

1. [portal.azure.com](https://portal.azure.com) → App registrations → New
2. Redirect URI: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Auth → Providers → Azure → pegar App ID + Secret

---

### 🟡 Mejoras Funcionales Pendientes

| Funcionalidad | Descripción | Prioridad |
|---|---|---|
| Reembolso en cancelación | Si se cancela pedido wallet-paid → reembolsar `wallet_balance` + `wallet_transaction` tipo `refund` | Alta |
| Push al cancelar | Notificación al estudiante cuando el vendedor cancela | Media |
| Deshabilitar "Pagar" si saldo insuficiente | UI proactiva antes del 402 | Baja |
| Time slots para nuevas fechas | `generate_day_slots` debe correr periódicamente o en demanda | Media |

---

### 🟢 Frontend Polish

| Mejora | Dónde |
|---|---|
| Skeleton loaders en lugar de spinners | Todas las páginas con fetch |
| Reemplazar `<img>` por `<Image />` de Next.js | Todas las páginas con imágenes |
| Animaciones Framer Motion stagger | `student/home`, `vendor/menu` |
| Empty states ilustrados | Pedidos, favoritos, wallet |
| Dark mode | Global con Tailwind `dark:` |
| PWA manifest + iconos | `public/manifest.json` |
| Micro-animaciones hover | Global |

---

## Resumen de Estado por Módulo (Actualizado 12 Mayo 2026)

| Módulo | Estado | Notas |
|---|---|---|
| Auth (login/registro) | ✅ Completo | Email + foto opcional para vendedores |
| OAuth Google | ⚙️ Config pendiente | Código listo, falta Google Cloud Console |
| OAuth Microsoft | ⚙️ Config pendiente | Código listo, falta Azure Portal |
| Base de datos + RLS | ✅ Completo | 14 tablas, tipos TS regenerados |
| Storage de imágenes | ✅ Completo | 4 buckets, foto subible desde registro |
| Dashboard del vendedor | ✅ Completo | Realtime, estadísticas, toggle is_open |
| CRUD de productos (vendedor) | ✅ Completo | Con imágenes, validación Zod |
| Home del estudiante | ✅ Completo | Cards con corazones, sin buscador falso |
| Favoritos | ✅ Completo | Corazón en home + menú vendedor + página `/student/favorites` accesible desde nav |
| Menú del vendedor (estudiante) | ✅ Completo | Rating CTA si tiene pedido sin calificar |
| Flujo de pedido + wallet | ✅ Completo | Saldo real, deducción real, 402 si insuficiente |
| Flujo de pedido + otros métodos | ✅ Demo | QR/Nequi/Daviplata simulados |
| Puntos de entrega | ✅ Completo | 3 puntos correctos: Clínica, Ad Portas, CA |
| Tracking del pedido | ✅ Completo | Realtime + QR code visible para mostrar al vendedor |
| Entrega con QR | ✅ Completo | Vendedor escanea QR → pedido pasa a `delivered` |
| Marcar pedido entregado | ✅ Completo | Endpoint + UI botón "Entregar" en panel vendedor |
| Gestión de pedidos (vendedor) | ✅ Completo | Realtime, estados, cancelar, entregar con QR |
| Historial de pedidos (estudiante) | ✅ Completo | Tabs, tarjetas, tracking, botón calificar |
| Calificaciones | ✅ Completo | API + UI 3 dimensiones + CTA en menú vendedor |
| Wallet | ✅ Completo | Recarga, historial, deducción real |
| Perfil estudiante | ✅ Completo | Avatar, datos, carné |
| Perfil vendedor | ✅ Completo | Portada (actualizable en registro y perfil), toggle, horario |
| Navegación estudiante | ✅ Completo | 4 tabs + burbuja flotante de pedido activo |
| Reportes semanales | ✅ Completo | Bug corregido: orders ahora llegan a `delivered` |
| Push Notifications (VAPID) | ✅ Implementado | Falta `SUPABASE_SERVICE_ROLE_KEY` en env |
| Tipos TypeScript | ✅ Completo | Regenerados via MCP Supabase |
| Pasarelas de pago reales | 🔜 Fuera de alcance | Stubs aceptados para demo |

---

## Cómo Probar las Nuevas Funcionalidades (Fase 2B)

### Flujo completo de entrega con QR
1. Estudiante hace pedido → llega al tracking → ver QR en pantalla
2. Vendedor en `/vendor/orders` → pedido pasa por estados hasta `Listo para recoger`
3. Vendedor toca **"Entregar"** → abre cámara → escanea QR del estudiante
4. Pedido pasa a `delivered` → toast de confirmación
5. Estudiante ve botón "Calificar" en historial y en menú del restaurante

### Favoritos en home
1. Ir a `/student/home` → cada card de vendedor tiene corazón top-right
2. Tocar corazón → rojo = guardado en favoritos
3. Nav → Favoritos (Heart tab) → ver lista en `/student/favorites`

### Burbuja de pedido activo
1. Hacer pedido → aparece burbuja azul sobre el nav
2. Vendedor marca "Listo para recoger" → burbuja cambia a verde + texto "¡Tu pedido está listo!"
3. Pedido entregado → burbuja desaparece

### Foto en registro de vendedor
1. Ir a `/register` → seleccionar rol Vendedor
2. Llenar nombre + negocio → campo de foto opcional aparece
3. Seleccionar imagen → preview visible
4. Registrarse → foto aparece en dashboard del vendedor

### Reportes (fix)
1. Entregar un pedido via QR flow (arriba)
2. Ir a `/vendor/reports` → "Generar"
3. Reporte debe mostrar pedidos y revenue reales (ya no cero)

---

*Documento actualizado: 12-Mayo-2026 | Proyecto AERO | Capstone 2026-1*
