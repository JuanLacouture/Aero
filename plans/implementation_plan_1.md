# Implementation Plan #01 — AERO Project Foundation

**Objetivo**: Configurar completamente el proyecto AERO — estructura, dependencias, base de datos, y documentación de integraciones — para que el equipo pueda construir features sin fricciones.

**Fuente de verdad**: [MASTER.md](file:///c:/Users/berri/Desktop/Universidad/Captzone/Aero/MASTER.md)

---

## User Review Required

> [!IMPORTANT]
> **Reorganización de carpetas**: El repositorio actual tiene `Planes/` (mayúscula, vacía), `MASTER.md` en la raíz, y una carpeta `AERO/` vacía. Propongo:
> - Renombrar `Planes/` → `plans/`
> - Mover `MASTER.md` → `plans/master.md`
> - Eliminar carpeta `AERO/` vacía (el proyecto Next.js irá en `apps/web/`)
> - El archivo `CLAUDE.mc` vacío en la raíz — ¿se puede eliminar? (ya existe `.claude/` como directorio de configuración)

> [!NOTE]
> **Supabase MCP**: Ya está conectado en Claude Code. La migración SQL y las configuraciones de dashboard (Auth providers, Storage, Realtime) serán documentadas paso a paso para que las ejecutes tú vía el MCP o el dashboard de Supabase.

> [!NOTE]
> **Agent Skills**: Ya se están instalando (`npx skills add supabase/agent-skills` en ejecución). Se asumirá que estarán disponibles en `.claude/skills/`.

---

## Resolved Questions

| Pregunta | Resolución |
|---|---|
| Credenciales Supabase (`.env.local`) | Se usará el MCP ya conectado en Claude Code. Yo creo `.env.example` con todas las variables; tú llenas `.env.local` desde el dashboard. |
| shadcn/ui configuración | Uso configuración por defecto: estilo `default`, color base `slate`, CSS variables habilitadas. |
| `@next/font` deprecado | Uso `next/font/google` (built-in en Next.js 14) — no se instala paquete extra. |
| `--src-dir=false` | Confirmado. `app/` va directamente bajo `apps/web/`, sin carpeta `src/`. |

---

## Proposed Changes

La implementación se divide en **5 fases** ejecutadas secuencialmente.

---

### Phase 1 — Reorganizar Repositorio y Crear Estructura

#### [MODIFY] Reorganización de la raíz

| Acción | De | A |
|---|---|---|
| Renombrar | `Planes/` | `plans/` |
| Mover | `MASTER.md` (raíz) | `plans/master.md` |
| Eliminar | `AERO/` (vacía) | — |

#### [NEW] Estructura completa de `apps/web/`

**Páginas del flujo de autenticación:**
- `app/(auth)/login/page.tsx` — Login (Google + Apple + Microsoft + email)
- `app/(auth)/register/page.tsx` — Registro
- `app/(auth)/callback/route.ts` — OAuth callback handler

**Páginas del flujo estudiante (tema azul `#1A6BFF`):**

| Archivo | HU | Descripción |
|---|---|---|
| `app/(student)/home/page.tsx` | HU-01 | Home — vendedores activos, búsqueda |
| `app/(student)/vendor/[id]/page.tsx` | HU-09 | Perfil del vendedor |
| `app/(student)/vendor/[id]/menu/page.tsx` | HU-01 | Menú del día |
| `app/(student)/order/new/page.tsx` | HU-02 | Crear pedido (carrito) |
| `app/(student)/order/timeslot/page.tsx` | HU-07, HU-04 | Selección franja horaria |
| `app/(student)/order/payment/page.tsx` | HU-03 | Pago |
| `app/(student)/order/[id]/confirmed/page.tsx` | HU-05 | Pedido confirmado |
| `app/(student)/order/[id]/tracking/page.tsx` | HU-08 | Seguimiento en tiempo real |
| `app/(student)/order/[id]/rate/page.tsx` | HU-10 | Calificación post-compra |
| `app/(student)/map/page.tsx` | HU-06 | Mapa puntos de entrega |
| `app/(student)/wallet/page.tsx` | HU-13 | Cartera virtual |
| `app/(student)/favorites/page.tsx` | HU-14 | Favoritos |
| `app/(student)/profile/page.tsx` | — | Perfil del usuario |

**Páginas del flujo vendedor (tema naranja `#FF6B00`):**

| Archivo | HU | Descripción |
|---|---|---|
| `app/(vendor)/dashboard/page.tsx` | HU-12 | Dashboard — resumen del día |
| `app/(vendor)/orders/page.tsx` | HU-12 | Panel de pedidos en tiempo real |
| `app/(vendor)/orders/[id]/page.tsx` | HU-08 | Detalle del pedido |
| `app/(vendor)/menu/page.tsx` | HU-11 | Gestión del menú |
| `app/(vendor)/reports/page.tsx` | HU-15 | Reporte semanal |
| `app/(vendor)/profile/page.tsx` | — | Editar perfil y horario |

**API Routes:**

| Archivo | Método | Descripción |
|---|---|---|
| `app/api/auth/callback/route.ts` | POST | OAuth callback |
| `app/api/orders/route.ts` | POST | Crear orden + reservar franja |
| `app/api/orders/[id]/status/route.ts` | PUT | Cambiar estado (vendedor) |
| `app/api/orders/[id]/delivered/route.ts` | PUT | Confirmar recogida (estudiante) |
| `app/api/payments/intent/route.ts` | POST | Crear intención de pago |
| `app/api/webhooks/kushki/route.ts` | POST | Webhook Kushki |
| `app/api/webhooks/nequi/route.ts` | POST | Webhook Nequi |
| `app/api/webhooks/daviplata/route.ts` | POST | Webhook Daviplata |
| `app/api/wallet/topup/route.ts` | POST | Recargar cartera |
| `app/api/ratings/route.ts` | POST | Crear calificación |
| `app/api/push/subscribe/route.ts` | POST | Registrar suscripción push |
| `app/api/push/send/route.ts` | POST | Enviar push notification |

**Layouts:**
- `app/(student)/layout.tsx` — Tema azul, bottom navigation mobile
- `app/(vendor)/layout.tsx` — Tema naranja, vendor navigation
- `app/layout.tsx` — Root layout con fuentes + metadata AERO

**Bibliotecas y utilidades:**
- `lib/supabase/client.ts` — Cliente browser (`createBrowserClient`)
- `lib/supabase/server.ts` — Cliente servidor (`createServerClient`)
- `lib/supabase/middleware.ts` — Helper para middleware
- `lib/hooks/` — Directorio vacío para custom hooks
- `lib/stores/` — Directorio vacío para Zustand stores
- `lib/validations/` — Directorio vacío para Zod schemas
- `lib/utils/` — Utilidades compartidas

**Otros:**
- `components/ui/` — Poblado por shadcn/ui
- `components/student/` — Vacío, listo para features
- `components/vendor/` — Vacío, listo para features
- `components/shared/` — Vacío, listo para features
- `types/database.ts` — Placeholder (se genera después de la migración)
- `middleware.ts` — Protección de rutas por rol
- `public/icons/` — Directorio para iconos

#### [NEW] supabase/
- `migrations/001_initial_schema.sql` — Migración completa
- `seed.sql` — Datos de seed vacío/inicial
- `functions/weekly-report/index.ts` — Edge Function scaffold
- `functions/payment-webhook/index.ts` — Edge Function scaffold

#### [NEW] Archivos raíz
- `.env.example` — Todas las variables de entorno
- `.gitignore` — Actualizado para Next.js + Supabase
- `README.md` — Descripción completa del proyecto AERO

---

### Phase 2 — Inicializar Next.js y Configurar Dependencias

#### Inicialización

```bash
# En apps/web/
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-npm

# Dependencias principales
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod
npm install framer-motion
npm install @vis.gl/react-google-maps
npm install browser-image-compression
npm install web-push
npm install @types/web-push --save-dev

# shadcn/ui (configuración default)
npx shadcn@latest init -d
npx shadcn@latest add button input card badge avatar tabs dialog sheet toast
```

#### [MODIFY] tailwind.config.ts — Design Tokens Completos

```typescript
// Colores del master.md sección 5
colors: {
  primary: { DEFAULT: '#1A6BFF', dark: '#0D4ECC', light: '#E8F0FF' },
  vendor: { DEFAULT: '#FF6B00', dark: '#CC5500', light: '#FFF0E6', accent: '#FFD60A' },
  accent: '#00C9A7',
  warning: '#FF9500',
  error: '#FF3B30',
  success: '#34C759',
  surface: '#FFFFFF',
  background: '#F5F7FA',
  'vendor-bg': '#FFF8F5',
  'text-primary': '#1C1C1E',
  'text-secondary': '#6E6E73',
  'text-disabled': '#AEAEB2',
  border: '#E5E5EA',
  status: { available: '#34C759', busy: '#FF9500', unavailable: '#FF3B30', pending: '#FFD60A' }
}

// Tipografía del master.md sección 6
fontFamily: {
  display: ['Plus Jakarta Sans', 'sans-serif'],  // Headers
  body: ['DM Sans', 'sans-serif'],               // Body/UI
  mono: ['JetBrains Mono', 'monospace']          // Precios, IDs
}

// Escala tipográfica mobile (sección 6)
fontSize: {
  xs: ['11px', { lineHeight: '16px' }],
  sm: ['13px', { lineHeight: '18px' }],
  base: ['15px', { lineHeight: '22px' }],
  md: ['17px', { lineHeight: '24px' }],
  lg: ['20px', { lineHeight: '28px' }],
  xl: ['24px', { lineHeight: '32px' }],
  '2xl': ['28px', { lineHeight: '36px' }],
  '3xl': ['34px', { lineHeight: '42px' }]
}

// Border radius del master.md sección 12
borderRadius: { card: '16px', button: '12px' }
```

#### [MODIFY] next.config.ts
- `images.remotePatterns` → `vtngzjobuhqjnckuyrsx.supabase.co`
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

#### [MODIFY] app/globals.css
- CSS custom properties para todos los design tokens
- Reset mobile-first (375px base)

#### [MODIFY] app/layout.tsx
- Fuentes via `next/font/google`: Plus Jakarta Sans, DM Sans, JetBrains Mono
- Metadata: `title: "AERO"`, description, viewport

---

### Phase 3 — Supabase MCP y Agent Skills (Documentación)

> [!NOTE]
> El MCP ya está conectado. Las Agent Skills se están instalando. Esta fase es solo documentación de referencia.

**Pasos ya ejecutados por el usuario:**
1. ✅ MCP conectado en Claude Code
2. 🔄 `npx skills add supabase/agent-skills` (en ejecución)

**Documentaré en el README:**
- Cómo reconectar el MCP si se desconecta
- Referencia al project ref `vtngzjobuhqjnckuyrsx`
- Skills disponibles en `.claude/skills/`

---

### Phase 4 — Base de Datos en Supabase

#### [NEW] supabase/migrations/001_initial_schema.sql

Migración completa con:

**ENUMs (7):**
`user_role`, `order_status`, `payment_method`, `payment_status`, `security_level`, `wallet_tx_type`, `report_status`

**Tablas (14):**

| Tabla | FK Principal | Descripción |
|---|---|---|
| `profiles` | `auth.users(id)` | Perfil extendido del usuario |
| `students` | `profiles(id)` | Datos específicos del estudiante |
| `vendors` | `profiles(id)` | Datos del vendedor |
| `products` | `vendors(id)` | Productos del menú |
| `product_images` | `products(id)` | Hasta 3 fotos por producto |
| `delivery_points` | — | Puntos de entrega seguros |
| `time_slots` | `delivery_points(id)` | Franjas horarias por punto |
| `orders` | `students(id)`, `vendors(id)` | Pedidos |
| `order_items` | `orders(id)`, `products(id)` | Ítems del pedido |
| `payments` | `orders(id)`, `students(id)` | Registros de pago |
| `wallet_transactions` | `students(id)` | Movimientos de cartera |
| `ratings` | `orders(id)`, `students(id)`, `vendors(id)` | Calificaciones |
| `favorites` | `students(id)`, `vendors(id)` | Favoritos |
| `weekly_reports` | `vendors(id)` | Reportes semanales |

**Triggers (5):**
1. `trg_profiles_updated_at` — Auto-update `updated_at` en profiles
2. `trg_products_updated_at` — Auto-update `updated_at` en products
3. `trg_orders_updated_at` — Auto-update `updated_at` en orders
4. `trg_on_auth_user_created` — Crear perfil automáticamente al registrarse
5. `trg_update_vendor_rating` — Recalcular `rating_avg` al insertar/actualizar rating

**RLS + Políticas:**
- RLS habilitado en las 14 tablas
- Políticas para: perfil propio, lectura pública de vendors/products/delivery_points, gestión de pedidos por rol, favoritos propios, etc.

**Índices (10):**
Optimización para queries frecuentes (orders por student/vendor/status, products por vendor, time_slots por fecha, etc.)

#### Pasos manuales para el dashboard de Supabase:

**4.2 — Auth Providers** (documentado paso a paso en `plans/02-apis-and-integrations.md`):
- Google OAuth → Client ID + Secret desde Google Cloud Console
- Apple Sign In → Services ID + Key desde Apple Developer
- Microsoft → App Registration desde Azure Portal

**4.3 — Storage Buckets:**
- `product-images` (público) — Fotos de platos
- `avatars` (público) — Fotos de perfil
- `covers` (público) — Portadas de vendedores
- `reports` (privado) — PDFs/CSVs de reportes

**4.4 — Tipos TypeScript:**
```bash
npx supabase gen types typescript --project-id vtngzjobuhqjnckuyrsx --schema public > apps/web/types/database.ts
```

**4.5 — Realtime:**
Habilitar en: `orders`, `vendors`, `delivery_points`

---

### Phase 5 — Documentación de APIs e Integraciones

#### [NEW] plans/02-apis-and-integrations.md

Documento completo cubriendo las **10 integraciones** del proyecto:

| # | Integración | Contenido clave |
|---|---|---|
| A | **Supabase** | Browser vs Server client, Auth helpers, Storage API, Realtime subscriptions, Edge Functions |
| B | **Google OAuth** | Cloud Console setup, scopes `email`+`profile`, flujo con Supabase Auth |
| C | **Microsoft OAuth** | Azure Portal, tenant `common` vs `unisabana.edu.co`, flujo completo |
| D | **Apple Sign In** | Developer Console, Services ID, domain verification |
| E | **Google Maps JS API** | API key + restrictions, `<Map>` component, markers, Places API |
| F | **Kushki** | Sandbox, card/QR flows, webhook `/api/webhooks/kushki`, HMAC verification |
| G | **Nequi** | Push charge, headers, webhook, estados PENDING/SUCCESS/FAILED |
| H | **Daviplata** | Similar a Nequi, diferencias clave |
| I | **Web Push (VAPID)** | Key generation, service worker `sw.js`, subscribe, send from API Route |
| J | **Supabase Storage** | Bucket paths, compression con `browser-image-compression`, public URLs |

Cada integración documenta: qué es, credenciales, env vars, endpoints, código TypeScript de ejemplo, y webhooks.

---

## Verification Plan

### Automated Tests

```bash
# Desde apps/web/
npm run build     # 0 errores TypeScript
npm run dev       # Inicia en localhost:3000
npm run lint      # Sin errores críticos
```

### Manual Verification

| Check | Cómo verificar |
|---|---|
| Rutas de estudiante cargan | Navegar a `/student/home` — muestra scaffold azul |
| Rutas de vendedor cargan | Navegar a `/vendor/dashboard` — muestra scaffold naranja |
| Design tokens funcionan | Inspeccionar CSS variables en devtools |
| `.env.example` completo | 11+ variables listadas con comentarios |
| SQL migration válida | Sin errores de sintaxis al ejecutar en Supabase |
| Documentación completa | `plans/02-apis-and-integrations.md` cubre las 10 integraciones |
| Estructura de archivos | Todos los archivos del árbol existen |

### Deliverables Checklist

- [ ] Estructura de carpetas completa
- [ ] Next.js corriendo en `localhost:3000`
- [ ] Tailwind con todos los design tokens
- [ ] MCP documentado (ya configurado por el usuario)
- [ ] Agent Skills documentadas (instalándose)
- [ ] Migración SQL en `supabase/migrations/001_initial_schema.sql`
- [ ] RLS + políticas + triggers
- [ ] Auth providers documentados paso a paso
- [ ] Storage buckets documentados
- [ ] TypeScript types placeholder
- [ ] Realtime documentado
- [ ] `.env.example` con todas las variables
- [ ] `plans/02-apis-and-integrations.md` completo
- [ ] Scaffolds de todas las páginas y API Routes
- [ ] `npm run build` sin errores
