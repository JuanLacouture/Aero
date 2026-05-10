# Avance 1 — Proyecto AERO
**Conexión Alimentaria Sabana Centro · Universidad de La Sabana · Capstone 2026-1**
**Fecha de corte:** 10 de mayo de 2026

---

## ¿Qué es AERO?

Plataforma móvil-first para que estudiantes de la Universidad de La Sabana pidan comida a vendedores del campus. El estudiante escoge un vendedor, arma su carrito, elige franja horaria y punto de entrega, y paga. El vendedor recibe y gestiona los pedidos desde su propio panel.

**Stack tecnológico:**
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Base de datos:** Supabase (PostgreSQL) con Row Level Security (RLS)
- **Auth:** Supabase Auth — email/contraseña + OAuth (Google, Microsoft)
- **Storage:** Supabase Storage (imágenes de productos, avatares, portadas)
- **Estado global:** Zustand (carrito del estudiante)
- **Animaciones:** Framer Motion
- **Validaciones:** Zod
- **Compresión de imágenes:** browser-image-compression (WebP, ≤200 KB)

---

## Estructura del Repositorio

```
Aero/
├── apps/
│   └── web/                        # Aplicación Next.js principal
│       ├── app/
│       │   ├── (auth)/             # Login y registro
│       │   ├── student/            # Rutas del estudiante
│       │   ├── vendor/             # Rutas del vendedor
│       │   └── api/                # API Routes (serverless)
│       ├── components/
│       │   ├── vendor/             # ProductCard, ProductFormModal, ImageUploader
│       │   └── shared/             # Navbars, layouts compartidos
│       ├── lib/
│       │   ├── supabase/           # Clientes browser/server
│       │   ├── stores/             # Zustand (cart)
│       │   ├── utils/              # image-compression, storage helpers
│       │   └── validations/        # Schemas Zod
│       └── types/                  # Tipos TypeScript generados desde Supabase
├── supabase/
│   └── migrations/                 # Migraciones SQL aplicadas
├── plans/                          # Planes de implementación detallados
└── avances/                        # Este documento y futuros reportes
```

---

## Base de Datos (Estado Actual)

### Tablas implementadas (14 en total)

| Tabla | Filas actuales | Descripción |
|---|---|---|
| `profiles` | 3 | Perfil base de todos los usuarios (roles: student, vendor, admin) |
| `students` | 2 | Datos extra del estudiante (wallet_balance, university_id) |
| `vendors` | 1 | Datos del vendedor (business_name, horario, is_open, rating) |
| `products` | 0 | Productos del vendedor (precio, categoría, stock_limit) |
| `product_images` | 0 | Hasta 3 imágenes por producto (order_index 0-2) |
| `delivery_points` | 3 | Puntos de entrega en campus (lat/lng, seguridad, iluminación) |
| `time_slots` | 108 | Franjas horarias por punto y día (capacidad máx: 10 pedidos) |
| `orders` | 0 | Pedidos de estudiantes a vendedores |
| `order_items` | 0 | Ítems dentro de cada pedido |
| `payments` | 0 | Registros de pago (método, estado, external_tx_id) |
| `wallet_transactions` | 0 | Historial de movimientos del monedero |
| `ratings` | 0 | Calificaciones (higiene, puntualidad, calidad — promedio auto-calculado) |
| `favorites` | 0 | Vendedores favoritos del estudiante |
| `weekly_reports` | 0 | Reportes semanales del vendedor (PDF/CSV) |

### Seguridad de datos
- **RLS habilitado en todas las tablas** — los usuarios solo ven y modifican sus propios datos
- **Trigger `handle_new_user`**: se dispara al crear un usuario en Supabase Auth → crea automáticamente el perfil en `profiles` y la fila en `students` (si es estudiante)
- **Storage Buckets**: `product-images` (5 MB), `avatars` (2 MB), `covers` (5 MB), `reports` (10 MB, privado)
- **Políticas de storage**: lectura pública para imágenes, escritura solo para usuarios autenticados, eliminación solo para el dueño del folder

### ENUMs definidos
- `user_role`: student, vendor, admin
- `order_status`: pending, confirmed, preparing, ready, delivered, cancelled
- `payment_method`: qr, nequi, daviplata, card, wallet
- `payment_status`: pending, paid, failed, refunded
- `wallet_tx_type`: topup, purchase, refund
- `security_level`: high, medium, low
- `report_status`: pending, generated, failed

---

## Lo que está Implementado y Funcional

### Autenticación y Registro ✅

| Funcionalidad | Archivo |
|---|---|
| Login con email/contraseña | `app/(auth)/login/page.tsx` |
| Login con OAuth (Google, Microsoft) | `app/(auth)/login/page.tsx` |
| Registro con selección de rol (Estudiante / Vendedor) | `app/(auth)/register/page.tsx` |
| Callback OAuth + setup post-confirmación de email | `app/(auth)/callback/route.ts` |
| Registro de vendedor en DB (profile + vendor row) | `app/api/vendors/register/route.ts` |
| Middleware de auth protegiendo `/student/*`, `/vendor/*`, `/api/*` | `middleware.ts` |

**Flujo de registro de vendedor:**
1. Usuario llena el formulario con nombre, email, contraseña y nombre del negocio
2. Supabase crea el usuario y dispara el trigger `handle_new_user`
3. Si hay sesión inmediata (email confirmation desactivado): se llama `/api/vendors/register` directamente
4. Si requiere confirmación de email: el usuario confirma → el callback route detecta `role: vendor` y completa el setup automáticamente
5. Redirección a `/vendor/dashboard`

---

### Panel del Vendedor ✅

#### Dashboard (`/vendor/dashboard`)
- Estadísticas en tiempo real: pedidos del día, ingresos, estado del local
- Toggle **is_open** para abrir/cerrar el local
- Escucha cambios con **Supabase Realtime**
- Listado de pedidos activos con estados

#### Gestión de Menú (`/vendor/menu`) ✅
- Grid de productos con tarjetas premium (imagen, nombre, precio en COP, categoría, stock)
- **FAB** (botón flotante naranja) para agregar producto
- **Toggle de disponibilidad** por producto con animación
- **Editar y eliminar** producto con confirmación
- **Modal de crear/editar** con:
  - Subida de hasta 3 imágenes con preview
  - Compresión automática a WebP ≤ 200 KB
  - Campos: nombre*, descripción, precio*, categoría (con sugerencias), stock límite
  - Validación en tiempo real con Zod
  - Estado de carga y manejo de errores
- Filtro por categoría con chips animados
- Estado vacío con CTA cuando no hay productos

#### API de Productos ✅

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/vendors/products` | GET | Lista productos del vendedor autenticado con imágenes |
| `/api/vendors/products` | POST | Crea producto (validado con Zod) |
| `/api/vendors/products/[id]` | PUT | Actualiza producto (solo el dueño) |
| `/api/vendors/products/[id]` | DELETE | Elimina producto + imágenes del storage |
| `/api/vendors/products/[id]/images` | POST | Sube imagen (máx 3 por producto) |
| `/api/vendors/products/[id]/images` | DELETE | Elimina imagen específica del storage y DB |

#### Gestión de Pedidos (`/vendor/orders`) ✅

Panel completo para que el vendedor vea y gestione todos sus pedidos en tiempo real.

**Funcionalidades implementadas:**
- Lista de pedidos con ítems, total en COP y badge de estado con colores
- Tabs de filtro: **Activos** (pending, confirmed, preparing, ready) y **Finalizados** (delivered, cancelled)
- Botones de avance de estado por pedido: **Confirmar → Preparando → Listo para recoger**
- **Supabase Realtime**: escucha `INSERT` y `UPDATE` en la tabla `orders` filtrado por `vendor_id` — los pedidos nuevos aparecen automáticamente sin recargar la página
- Estado de carga con spinner naranja

**Máquina de estados del pedido** (`/api/orders/[id]/status`):

```
pending → confirmed → preparing → ready → delivered
    ↘ cancelled        ↘ cancelled
```

La API valida cada transición — no se puede saltar estados ni retroceder. El vendedor solo ve el botón del siguiente paso válido.

---

### App del Estudiante ✅

#### Home (`/student/home`)
- Saludo personalizado según hora del día
- Listado de vendedores dividido en "Abiertos ahora" y "Próximamente"
- Tarjetas con imagen de portada, rating, descripción, horario
- Vendedores cerrados con estilo atenuado

#### Menú del Vendedor (`/student/vendor/[id]/menu`) ✅
- Info del vendedor: nombre, descripción, cover, rating, horario, estado
- Productos agrupados por categoría
- Carrusel de imágenes por producto (hasta 3 fotos)
- **Bottom sheet de detalle** con imágenes, descripción, precio
- Botones de agregar/quitar del carrito con controles de cantidad
- Botón flotante "Ver carrito" cuando hay ítems

#### Carrito — Zustand Store ✅
- `lib/stores/cart.ts`: add, remove, update quantity, clear, total
- Persiste entre navegación, se limpia al confirmar pedido

#### Flujo de Pedido (`/student/order/new`) ✅
- **Paso 1 — Carrito:** ítems, cantidades, subtotales, total
- **Paso 2 — Franja horaria:** selección de punto de entrega + franja (deshabilitada si ≥30% llena)
- **Paso 3 — Pago:** selección de método (wallet, QR, Nequi, Daviplata)
- Submit → crea pedido en DB → redirige a confirmación

#### API de Pedidos ✅

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/orders` | POST | Crea pedido con validación de capacidad de franja, verifica productos del vendedor, calcula total, simula pago con wallet |
| `/api/timeslots` | GET | Lista franjas disponibles por punto y fecha |
| `/api/orders/[id]/status` | PUT | Máquina de estados del pedido (pending→confirmed→preparing→ready→delivered) |

**Nota:** El pago actualmente es **simulado** (se inserta un registro de pago con `status: 'paid'` sin pasarela real).

#### Confirmación y Tracking ✅
- `/student/order/[id]/confirmed`: pantalla de éxito con número de pedido
- `/student/order/[id]/tracking`: consulta estado del pedido en tiempo real

---

## Bugs Corregidos (9-10 Mayo 2026)

Estos bugs bloqueaban completamente el flujo vendor→producto→estudiante:

| # | Bug | Causa | Fix |
|---|---|---|---|
| 1 | **Todos los usuarios quedaban como `student`** sin importar el rol seleccionado | El trigger `handle_new_user` leía `raw_app_meta_data->>'role'` pero `signUp()` escribe el rol en `raw_user_meta_data` | Migración SQL: cambiar campo leído en trigger |
| 2 | **El registro de vendedor nunca se completaba** cuando email confirmation está activo | `data.session = null` → la página mostraba "revisa tu correo" y paraba antes de llamar `/api/vendors/register` | Pasar `business_name` en metadata del signUp + el callback route completa el setup post-confirmación |
| 3 | **Eliminar imágenes de productos fallaba en storage** | No existía política DELETE en `storage.objects` para el bucket `product-images` | Migración SQL: `CREATE POLICY "Vendor delete own product-images"` |
| 4 | **Usuario vendedor existente atrapado como estudiante** | Usuario `andressangarssj@gmail.com` registrado con role vendor antes del fix del trigger | Migración SQL: `UPDATE profiles SET role='vendor'`, `DELETE FROM students`, `INSERT INTO vendors` |

---

## Últimos Cambios Implementados (9-10 Mayo 2026)

### Gestión de Pedidos para el Vendedor — `/vendor/orders`

El módulo completo de pedidos del vendedor fue implementado en esta sesión de trabajo.

#### ¿Qué se construyó?

**Panel de pedidos (`/vendor/orders/page.tsx`)**

El vendedor tiene ahora un panel dedicado para gestionar todos sus pedidos en tiempo real:

```
┌─────────────────────────────────────┐
│  ← Panel de Pedidos                 │  ← header naranja
├────────────────┬────────────────────┤
│  Activos       │   Finalizados      │  ← tabs de filtro
├────────────────┴────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ #A1B2C3D4                       │ │
│ │ Arepa con queso ×2, Jugo ×1    │ │
│ │ $15.000          [Confirmar]    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ #E5F6G7H8          Preparando  │ │
│ │ Bandeja paisa ×1               │ │
│ │ $12.000    [Listo para recoger] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- Cada tarjeta muestra: ID corto del pedido, ítems con cantidades, total en pesos colombianos, badge de estado con colores diferenciados
- Botón de avance contextual según el estado actual del pedido
- Pedidos activos y finalizados separados en tabs

**Actualizaciones en tiempo real (Supabase Realtime)**

Se suscribe a dos canales de Postgres Changes:
- `INSERT` en `orders` → el pedido nuevo aparece al tope de la lista instantáneamente
- `UPDATE` en `orders` → el badge de estado se actualiza en vivo (útil cuando otro sistema cambia el estado)

Ambos canales filtran por `vendor_id` del vendedor autenticado — cada vendedor solo ve sus propios pedidos.

**API de cambio de estado (`PUT /api/orders/[id]/status`)**

Implementa una máquina de estados estricta:

| Estado actual | Siguientes estados permitidos |
|---|---|
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `preparing`, `cancelled` |
| `preparing` | `ready` |
| `ready` | `delivered` |
| `delivered` | — (estado final) |
| `cancelled` | — (estado final) |

La API rechaza cualquier transición no válida con un error `400` explícito (`"Transición inválida: confirmed → pending"`). Además verifica que el vendedor que hace el request sea dueño del pedido antes de permitir el cambio.

#### Lo que quedó pendiente de este módulo

| Pendiente | Descripción |
|---|---|
| `PUT /api/orders/[id]/delivered` | Retorna 501 — el vendedor no puede marcar entrega desde esta ruta específica (aunque `ready → delivered` sí funciona vía `/api/orders/[id]/status`) |
| Notificación al estudiante | Cuando el pedido pasa a `ready`, idealmente el estudiante recibe push notification (requiere implementar `/api/push/send`) |
| Cancelación desde el panel | El botón de cancelar no está expuesto en la UI actual (la API sí lo soporta) |

---

## Lo que Falta Implementar

### Prioridad Alta (necesario para demo funcional)

#### 1. Desactivar email confirmation para desarrollo
- **Dónde:** Supabase Dashboard → Authentication → Providers → Email → toggle "Confirm email" OFF
- **Por qué:** Sin esto, registrar un vendedor nuevo requiere acceso al correo, lo cual dificulta las pruebas
- **Nota:** Reactivar en producción

#### 2. Crear productos de prueba (seed data)
- No hay productos en DB todavía
- El vendedor `andressangarssj@gmail.com` ya está registrado → puede crear productos desde `/vendor/menu`
- O insertar seed SQL con 8-10 productos de ejemplo

#### 3. UI completa de pedidos para el vendedor (`/vendor/orders`)
- La página tiene el Supabase client pero falta la UI
- Necesita: lista de pedidos activos, botones de cambio de estado (confirmar → preparando → listo), Realtime para notificaciones sin recargar

#### 4. Confirmación de entrega (`/api/orders/[id]/delivered`)
- Actualmente retorna 501
- El vendedor necesita marcar el pedido como entregado desde su panel

---

### Prioridad Media

#### 5. Sistema de Calificaciones
- API: `POST /api/ratings` → retorna 501
- UI: `/student/order/[id]/rate` → solo muestra `<h1>RateOrder</h1>`
- La tabla `ratings` ya existe con campos: higiene, puntualidad, calidad (promedio auto-calculado)
- Trigger de actualización del `rating_avg` en `vendors` ya existe (`update_vendor_rating`)

#### 6. Perfil del Vendedor (`/vendor/profile`)
- Actualmente solo `<h1>VendorProfile</h1>`
- Necesita: editar nombre del negocio, descripción, horario, imagen de portada
- Subida de cover image al bucket `covers`

#### 7. Perfil del Estudiante (`/student/profile`)
- Actualmente solo `<h1>StudentProfile</h1>`
- Necesita: ver y editar nombre, avatar, carné universitario

#### 8. Wallet del Estudiante (`/student/wallet`)
- Actualmente solo `<h1>Wallet</h1>`
- API `POST /api/wallet/topup` → retorna 501
- La tabla `wallet_transactions` ya existe
- Necesita: mostrar saldo, historial de movimientos, botón de recarga

---

### Prioridad Baja (para fases futuras)

#### 9. Integraciones de Pago Reales
- `POST /api/webhooks/kushki` → 501
- `POST /api/webhooks/nequi` → 501
- `POST /api/webhooks/daviplata` → 501
- `POST /api/payments/intent` → parcialmente implementado (falta lógica real)
- Actualmente todo pedido se "paga" con wallet simulado

#### 10. Push Notifications (FCM)
- `POST /api/push/subscribe` → 501
- `POST /api/push/send` → 501
- Tabla `profiles.fcm_token` ya existe para guardar el token

#### 11. Mapa de Puntos de Entrega (`/student/map`)
- Actualmente solo `<h1>DeliveryMap</h1>`
- Los puntos de entrega ya tienen lat/lng en DB (3 puntos configurados)
- Necesita integración con Google Maps o Leaflet

#### 12. Favoritos (`/student/favorites`)
- Actualmente solo `<h1>Favorites</h1>`
- Tabla `favorites` ya existe

#### 13. Reportes del Vendedor (`/vendor/reports`)
- Actualmente solo `<h1>VendorReports</h1>`
- Tabla `weekly_reports` ya existe con campos para PDF/CSV URL
- Requiere lógica de generación de reportes (edge function o cron)

---

## Resumen de Estado por Módulo

| Módulo | Estado | Notas |
|---|---|---|
| Auth (login/registro) | ✅ Completo | Vendedor requiere desactivar email confirmation para dev |
| Base de datos + RLS | ✅ Completo | 14 tablas, triggers, índices, policies |
| Storage de imágenes | ✅ Completo | 4 buckets, policies correctas |
| Dashboard del vendedor | ✅ Completo | Realtime, estadísticas, toggle is_open |
| CRUD de productos (vendedor) | ✅ Completo | Con imágenes, validación Zod, compresión |
| Home del estudiante | ✅ Completo | Lista vendedores abiertos/cerrados |
| Menú del vendedor (estudiante) | ✅ Completo | Imágenes, carrito, bottom sheet |
| Flujo de pedido (estudiante) | ✅ Completo | Cart → franja → pago simulado |
| Tracking del pedido | ✅ Completo | Consulta estado en tiempo real |
| Gestión de pedidos (vendedor) | ✅ Completo | Lista Realtime, máquina de estados, filtros activos/finalizados |
| Calificaciones | ❌ Pendiente | API 501, UI scaffold |
| Wallet | ❌ Pendiente | API 501, UI scaffold |
| Perfil vendedor/estudiante | ❌ Pendiente | Solo scaffold `<h1>` |
| Pasarelas de pago reales | ❌ Pendiente | Webhooks 501, pago simulado |
| Push Notifications | ❌ Pendiente | API 501 |
| Mapa de entregas | ❌ Pendiente | Solo scaffold |
| Favoritos | ❌ Pendiente | Solo scaffold |
| Reportes semanales | ❌ Pendiente | Solo scaffold |

---

## Cómo Probar el Flujo Actual

### Pre-requisitos
1. Tener las variables de entorno configuradas en `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://vtngzjobuhqjnckuyrsx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<clave anon>
   ```
2. Desactivar email confirmation en Supabase Dashboard (para desarrollo)

### Iniciar la app
```bash
cd apps/web
npm install
npm run dev
# Abre http://localhost:3000
```

### Flujo Vendedor → Crear Producto
1. Ir a `/register` → seleccionar "Vendedor" → llenar nombre, nombre del negocio, email, contraseña → Crear cuenta
2. Redirige automáticamente a `/vendor/dashboard`
3. Ir a `/vendor/menu` → click en botón "+" (FAB naranja)
4. Llenar nombre del producto, precio, categoría, subir foto → Guardar
5. El producto aparece en la lista con imagen

### Flujo Estudiante → Ver y Pedir
1. Crear cuenta de estudiante en `/register`
2. En `/student/home` → hacer click en el vendedor
3. Ver los productos con imágenes en el menú
4. Agregar al carrito → click "Ver carrito"
5. Seleccionar franja horaria y punto de entrega
6. Confirmar pedido → pantalla de confirmación

### Cuenta vendedor disponible para pruebas
- **Email:** `andressangarssj@gmail.com`
- **Contraseña:** la que usaste al registrarte
- Ya tiene perfil `vendor` y fila en `vendors` con nombre "Mi Negocio"

---

*Documento generado: 10-Mayo-2026 | Proyecto AERO | Capstone 2026-1*
