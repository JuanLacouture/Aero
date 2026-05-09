# Plan de Implementación Técnica — Entrega 13 de Mayo
**Proyecto:** AERO (Conexión Alimentaria Sabana Centro)
**Objetivo:** MVP Funcional (Happy Path) sin enfoque en UI/Figma.
**Stack:** Next.js 14 (App Router) + Supabase (`vtngzjobuhqjnckuyrsx`)
**Fecha límite:** 13 de mayo de 2026

---

## Estado del Repositorio (Verificado 8-May-2026)

### ✅ Ya completado
- Estructura de carpetas completa (`apps/web/`, `supabase/`, `plans/`)
- Next.js 14 + todas las dependencias instaladas
- Design tokens en Tailwind (colores, tipografía, escala)
- Fuentes Google Fonts (Plus Jakarta Sans, DM Sans, JetBrains Mono)
- Clientes Supabase: browser (`lib/supabase/client.ts`) y server (`lib/supabase/server.ts`)
- Middleware de auth protegiendo `/student/*`, `/vendor/*`, `/api/*`
- Auth callback OAuth funcional (`(auth)/callback/route.ts`)
- Migración SQL ejecutada en Supabase (14 tablas, ENUMs, triggers, RLS, índices)
- TypeScript types generados (`types/database.ts`)
- `.env.example` con las 11 variables
- Edge Functions scaffold (`payment-webhook`, `weekly-report`)
- Scaffolds vacíos de todas las páginas y API routes

### ❌ Pendiente para esta entrega
- Toda la lógica de negocio (API routes vacíos — devuelven 501)
- Todas las interfaces (páginas son solo `<h1>`)
- Realtime subscriptions
- Compresión de imágenes
- Storage buckets en Supabase dashboard

---

## 1. Infraestructura de Datos y Seguridad (Prioridad: Alta)

> **Estado:** ✅ Mayormente completo — migración ya ejecutada en Supabase.

* **Migración SQL:** ✅ `001_initial_schema.sql` ejecutada. Tablas activas: `profiles`, `students`, `vendors`, `products`, `product_images`, `delivery_points`, `time_slots`, `orders`, `order_items`, `payments`, `wallet_transactions`, `ratings`, `favorites`, `weekly_reports`.
* **Políticas RLS (18 políticas activas):**
    * `profiles`: Usuarios solo leen/editan su propio perfil.
    * `products`: Lectura pública para autenticados; escritura solo para el `vendor_id` dueño.
    * `pedidos`: Estudiantes ven sus pedidos; vendedores ven pedidos asociados a su `vendor_id`.
    * `order_items`: Acceso vinculado al acceso del pedido padre.
    * `payments`, `wallet_transactions`, `favorites`: Solo el estudiante dueño.
    * `ratings`: Lectura pública, escritura solo del estudiante.
    * `delivery_points`, `time_slots`: Lectura pública.
    * `weekly_reports`: Solo el vendedor dueño.
* **Triggers activos:**
    * `trg_on_auth_user_created`: Al registrarse en `auth.users` → crea automáticamente registro en `public.profiles` con rol `student` por defecto.
    * `trg_update_vendor_rating`: Recalcula `rating_avg` al insertar/actualizar rating.
    * `trg_profiles_updated_at`, `trg_products_updated_at`, `trg_orders_updated_at`: Auto-update `updated_at`.

### Pendientes de infraestructura
- [ ] Crear Storage buckets en Supabase dashboard: `product-images` (público), `avatars` (público), `covers` (público), `reports` (privado).
- [ ] Habilitar Realtime en dashboard para tablas: `orders`, `vendors`, `delivery_points`.
- [ ] Verificar que los 3 puntos de entrega están cargados en `delivery_points` (Entrada Principal, Bloque H, Cafetería Central).

---

## 2. Lógica de Negocio Crítica (API Routes)

### 2.1 Sistema de Franjas Horarias (RNF-07)
* **Archivo:** `app/api/orders/route.ts`
* Implementar lógica de asignación: solo permitir slots donde `current_count / max_capacity < 0.30`.
* Bloquear slots que superen esta capacidad para evitar aglomeraciones.
* Al crear pedido, hacer `UPDATE time_slots SET current_count = current_count + 1` atómicamente.
* Franjas de 15 minutos, asignación en ≤2 seg.

### 2.2 Flujo de Pedidos
* **Archivo:** `app/api/orders/route.ts` (POST)
* Estado inicial: `status = 'pending'`, `payment_status = 'pending'`.
* Crear `order` + `order_items` en una transacción.
* Vincular `time_slot_id` y `delivery_point_id`.
* **Archivo:** `app/api/orders/[id]/status/route.ts` (PUT)
* Vendedor cambia estado: `pending` → `confirmed` → `preparing` → `ready` → `delivered`.
* Cada cambio dispara actualización Realtime al estudiante.

### 2.3 Pagos Simulados
> **Decisión:** Por condiciones legales, todo el sistema de pagos se simula. No se integra gateway real (Kushki/Nequi/Daviplata) en esta fase.

* **Archivo:** `app/api/payments/intent/route.ts`
* Simular flujo completo: recibir datos → esperar 1-2 seg → marcar como `paid`.
* Actualizar `orders.payment_status = 'paid'` automáticamente.
* Registrar transacción en tabla `payments` con `method = 'wallet'` y `log_data` inmutable.
* **Wallet simulada:** Funcionar como método de pago simulado — al crear pedido, el pago se procesa automáticamente sin validar saldo real.

### 2.4 Geolocalización
* **Los 3 puntos de entrega seguros** (ya cargados en seed):
    1. Entrada Principal (4.8615, -74.0317)
    2. Bloque H (4.8620, -74.0312)
    3. Cafetería Central (4.8610, -74.0320)

---

## 3. Registro y Autenticación

### 3.1 Registro de Estudiantes
* **Archivo:** `app/(auth)/register/page.tsx`
* Formulario: email + password (mínimo) + nombre completo.
* OAuth: botones Google, Microsoft, Apple.
* Al registrarse → trigger automático crea `profiles` con `role = 'student'`.
* Redirección post-registro a `/student/home`.

### 3.2 Registro de Vendedores
* **Archivo:** `app/(auth)/register/page.tsx` (flujo diferenciado)
* Opción de registrarse como vendedor: seleccionar rol en el formulario.
* Al seleccionar `vendor`, además del perfil se debe crear registro en tabla `vendors` con `business_name` obligatorio.
* Redirección post-registro a `/vendor/dashboard`.

### 3.3 Login
* **Archivo:** `app/(auth)/login/page.tsx`
* Email + password.
* Botones OAuth: Google, Microsoft, Apple.
* Post-login: leer `profiles.role` → redirigir a `/student/home` o `/vendor/dashboard`.

### 3.4 Auth Callback
* **Archivo:** `app/(auth)/callback/route.ts` — ✅ Ya implementado.
* Intercambia código OAuth por sesión de Supabase.

---

## 4. Funcionalidades del Estudiante (Frontend Logic)

> Enfoque: funcional, sin pulir UI. Interfaces básicas pero completas.

### 4.1 Vista de Menú (`app/student/home/page.tsx`)
* Fetching de vendedores activos: `SELECT * FROM vendors WHERE is_open = true`.
* Al hacer clic en un vendedor → ver sus productos.

### 4.2 Vista de Productos (`app/student/vendor/[id]/menu/page.tsx`)
* Productos filtrados: `SELECT * FROM products WHERE vendor_id = ? AND is_available = true`.
* Mostrar nombre, precio, descripción, disponibilidad.

### 4.3 Creación de Pedido (`app/student/order/new/page.tsx`)
* Selección de producto(s) + cantidad.
* Selección de Punto de Entrega (dropdown con los 3 puntos).
* Selección de Franja Horaria (time slot) — solo mostrar slots con < 30% ocupación.
* Inserción en tabla `orders` vinculando `punto_entrega_id` y `time_slot_id`.
* Pago simulado automático → `payment_status = 'paid'`.

### 4.4 Seguimiento de Pedido (`app/student/order/[id]/tracking/page.tsx`)
* Suscripción Realtime al canal `order-status`.
* Estados visibles: `pending` → `confirmed` → `preparing` → `ready` → `delivered`.
* Actualización en vivo sin recargar página.

---

## 5. Funcionalidades del Vendedor (Frontend Logic)

> Enfoque: funcional, sin pulir UI. Dashboard básico pero operativo.

### 5.1 Dashboard Realtime (`app/vendor/dashboard/page.tsx`)
* Suscripción al canal `new-orders` de Supabase Realtime.
* Mostrar listado de pedidos del día con estado actual.
* Notificación visual al recibir nuevo pedido (sin push notification por ahora).

### 5.2 Gestión de Estado de Pedidos (`app/vendor/orders/page.tsx`)
* Listado de pedidos activos.
* Botones para cambiar estado: `pending` → `confirmed` → `preparing` → `ready`.
* Cada cambio dispara actualización Realtime al estudiante.

### 5.3 Gestión de Inventario (`app/vendor/menu/page.tsx`)
* CRUD básico de productos:
    * **Crear**: Nombre, Precio, Descripción, Categoría.
    * **Editar**: Cambiar precio, descripción, disponibilidad.
    * **Toggle disponibilidad**: `is_available = true/false`.
    * **Eliminar**: Borrar producto.

---

## 6. Requisitos Técnicos y Multimedia

### 6.1 Compresión de Imágenes (RNF-09)
* **Librería:** `browser-image-compression` (ya instalada).
* Máximo **200 KB** por imagen antes de subir.
* Formato preferido: WebP.
* **Archivo:** `lib/utils/image-compression.ts`

```ts
import imageCompression from 'browser-image-compression'

export async function compressImage(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.2,          // 200 KB
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  })
}
```

### 6.2 Storage Buckets
* `product-images`: Público. Estructura: `{vendor_id}/{product_id}.webp`.
* `reports`: Privado. Para almacenamiento de reportes semanales.

### 6.3 Edge Functions (Deno) — Solo esqueleto
* `process-payment` (`supabase/functions/payment-webhook/index.ts`): Webhook simulado que marca pedido como pagado.
* `weekly-report` (`supabase/functions/weekly-report/index.ts`): Esqueleto para el cron de los lunes 6:00 AM. Solo estructura, sin lógica completa.

---

## 7. Fuera de Alcance (Post 13-Mayo)

> Estas funcionalidades NO se implementan para esta entrega:

- [ ] UI pulida / diseño Figma pixel-perfect
- [ ] Integración real con Kushki, Nequi, Daviplata (solo simulado)
- [ ] Push notifications (Web Push / VAPID)
- [ ] Google Maps para puntos de entrega (se usa un listado simple)
- [ ] Sistema de favoritos
- [ ] Sistema de calificaciones/ratings
- [ ] Wallet con saldo real
- [ ] Reportes semanales automáticos (solo esqueleto)
- [ ] Deploy a Vercel / dominio / HTTPS
- [ ] CI/CD con GitHub Actions
- [ ] Tests de carga con k6
- [ ] Monitoreo con Sentry

---

## Checklist de Verificación

### Registro y Auth
- [ ] ¿El usuario puede registrarse con email/password y se le asigna el rol `student` por defecto?
- [ ] ¿Existe flujo de registro de vendedor que crea el registro en tabla `vendors`?
- [ ] ¿El login redirige según rol: `/student/home` o `/vendor/dashboard`?
- [ ] ¿El OAuth callback funciona correctamente?

### Flujo del Estudiante
- [ ] ¿El estudiante ve los vendedores activos al entrar al home?
- [ ] ¿Puede ver el menú de un vendedor con productos disponibles?
- [ ] ¿Puede crear un pedido seleccionando producto, punto de entrega y franja horaria?
- [ ] ¿Se valida que el slot de tiempo tenga menos del 30% de ocupación?
- [ ] ¿El pago se simula correctamente y el pedido queda como `paid`?
- [ ] ¿El estudiante ve el estado del pedido actualizarse en tiempo real?

### Flujo del Vendedor
- [ ] ¿El vendedor recibe el pedido en tiempo real sin recargar la pantalla?
- [ ] ¿Puede cambiar el estado del pedido (confirmed → preparing → ready)?
- [ ] ¿Puede crear, editar y eliminar productos de su menú?
- [ ] ¿Puede toggle su disponibilidad (`is_open`)?

### Infraestructura
- [ ] ¿Están activas las políticas RLS para proteger los datos de otros usuarios?
- [ ] ¿La migración SQL está ejecutada en Supabase?
- [ ] ¿Los 3 puntos de entrega están cargados?
- [ ] ¿Los Storage buckets están creados?
- [ ] ¿Las imágenes subidas pesan menos de 200KB?
- [ ] ¿Realtime está habilitado para `orders` y `vendors`?

---

## Responsables (según master.md sección 19)

| Tarea | Responsable |
|---|---|
| API Routes (orders, payments, status) | Andrés Sánchez |
| Auth + Login + Registro (estudiante y vendedor) | Valentina López |
| Páginas estudiante (home, menú, pedido, tracking) | Santiago Carrillo |
| Dashboard vendedor + Realtime | Juan Lacouture |
| Compresión de imágenes + Storage | Valentina López |
| Edge Functions (esqueleto) | Andrés Sánchez |

---

*Plan actualizado: 8-Mayo-2026 | Proyecto AERO | Universidad de La Sabana · Capstone 2026-1*
