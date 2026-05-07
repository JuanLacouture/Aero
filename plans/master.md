# MASTER.MD — Documento Master del Proyecto AERO
## Plataforma Digital de Conexión Alimentaria · Sabana Centro
**Universidad de La Sabana · Ingeniería Informática · Capstone 2026-1**

> Este documento es la **fuente única de verdad (Single Source of Truth)** del proyecto.
> Cualquier agente, desarrollador o IA que trabaje en este repositorio **debe leer este archivo antes de hacer cualquier cosa**.

---

## ÍNDICE
1. [Visión del Proyecto](#1-visión-del-proyecto)
2. [Decisiones de Arquitectura](#2-decisiones-de-arquitectura)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Paleta de Colores y Design Tokens](#5-paleta-de-colores-y-design-tokens)
6. [Tipografía](#6-tipografía)
7. [Arquitectura General](#7-arquitectura-general)
8. [Base de Datos — Modelo Entidad-Relación](#8-base-de-datos--modelo-entidad-relación)
9. [Autenticación](#9-autenticación)
10. [APIs Externas e Integraciones](#10-apis-externas-e-integraciones)
11. [Módulos de la Plataforma](#11-módulos-de-la-plataforma)
12. [Pantallas Mobile First (Figma)](#12-pantallas-mobile-first-figma)
13. [Requisitos Funcionales](#13-requisitos-funcionales)
14. [Requisitos No Funcionales (ISO 25010)](#14-requisitos-no-funcionales-iso-25010)
15. [Historias de Usuario — Backlog Completo](#15-historias-de-usuario--backlog-completo)
16. [Flujo de Interacción Principal](#16-flujo-de-interacción-principal)
17. [Endpoints — API Routes de Next.js](#17-endpoints--api-routes-de-nextjs)
18. [Sprint 1 — Plan de Trabajo](#18-sprint-1--plan-de-trabajo)
19. [Roles del Equipo](#19-roles-del-equipo)
20. [Criterios de Éxito (Triple Impacto)](#20-criterios-de-éxito-triple-impacto)
21. [Guía para Agentes IA](#21-guía-para-agentes-ia)

---

## 1. Visión del Proyecto

### Problema
Existe una **desconexión estructural de mercado** en el ecosistema alimentario del entorno de la Universidad de La Sabana (Sabana Centro, Cundinamarca, Colombia):

- Los estudiantes enfrentan **precios excluyentes** en la oferta formal y no portan efectivo.
- Los microemprendedores informales operan **sin canales digitales**, sin visibilidad comercial y en condiciones precarias.
- El **24% de encuestados** reporta inseguridad al desplazarse a buscar comida económica.
- El **8%** de los diagnósticos señala tensiones de convivencia en el espacio público.

### Solución
**Una plataforma web responsive con filosofía Mobile First** que:
1. Conecta la oferta alimentaria informal con la demanda estudiantil universitaria.
2. Permite pedidos digitales, pagos sin efectivo y recogida en puntos seguros.
3. Provee analítica básica al vendedor para reducir desperdicio.
4. Funciona perfectamente en celular desde el navegador (sin necesidad de descargar una app).

### Propuesta de Valor
> "Una plataforma digital que transforma la informalidad alimentaria en una economía organizada, segura y accesible: el estudiante decide desde donde está, el vendedor vende con dignidad y el entorno urbano gana orden."

### ODS Alineado
- **ODS 8** — Trabajo decente y crecimiento económico.

---

## 2. Decisiones de Arquitectura

### ✅ Web Responsive (Mobile First) — NO app nativa
- La plataforma es una **web app** construida con Next.js 14.
- La filosofía es **Mobile First**: se diseña primero para pantallas de 375px y se escala hacia arriba.
- El usuario accede desde el navegador del celular — no hay que descargar nada.
- En una fase futura (lejana) se puede envolver en React Native o una PWA instalable.

### ✅ Next.js 14 como único framework (frontend + backend)
- **API Routes de Next.js** reemplazan a NestJS para el POC/MVP.
- Supabase provee la mayoría de la lógica de servidor: auth, DB, storage, realtime.
- Esto reduce drásticamente la complejidad y el tiempo de desarrollo.

### ✅ Supabase como Backend-as-a-Service
Supabase cubre:
- **Base de datos**: PostgreSQL gestionado.
- **Auth**: login con Google, Apple, Microsoft/Outlook + email/password.
- **Storage**: bucket para imágenes de platos y avatares.
- **Realtime**: suscripciones en tiempo real para estado de pedidos y mapa.
- **Edge Functions**: lógica serverless si se necesita (webhooks de pago, cron jobs).
- **Row Level Security (RLS)**: seguridad a nivel de fila en la DB.

### ✅ Sin NestJS en el POC
NestJS queda descartado para esta fase. Si el proyecto escala más allá del MVP y requiere una arquitectura de microservicios, se puede migrar el backend a NestJS sin tocar el frontend.

---

## 3. Stack Tecnológico

### Frontend + Backend (un solo proyecto)
| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | **Next.js 14** (App Router) | SSR, API Routes, optimización de imágenes, routing integrado |
| Lenguaje | **TypeScript** (strict mode) | Tipado fuerte en todo el proyecto |
| Estilos | **Tailwind CSS** | Utility-first, perfecto para mobile first con breakpoints |
| Componentes | **shadcn/ui** + componentes custom | Base sólida, totalmente personalizable |
| Estado global | **Zustand** | Ligero, sin boilerplate |
| Peticiones / cache | **TanStack Query (React Query)** | Cache, loading states, refetch automático |
| Formularios | **React Hook Form + Zod** | Validación tipada end-to-end |
| Animaciones | **Framer Motion** | Transiciones fluidas, gestos mobile |
| Mapas | **Google Maps JS API** (via `@vis.gl/react-google-maps`) | Puntos de entrega seguros |
| Realtime | **Supabase Realtime** | Estado del pedido en vivo, mapa en vivo |
| Notificaciones | **Web Push API** + **Supabase Edge Functions** | Push notifications en mobile browser |

### Backend-as-a-Service
| Servicio | Tecnología | Uso |
|---------|-----------|-----|
| Base de datos | **Supabase (PostgreSQL 15)** | Todas las tablas del proyecto |
| Auth | **Supabase Auth** | Google, Apple, Microsoft OAuth + email |
| Storage | **Supabase Storage** | Fotos de platos, avatares, reportes PDF/CSV |
| Realtime | **Supabase Realtime** | Pedidos en vivo, disponibilidad de vendedores |
| Edge Functions | **Supabase Edge Functions** (Deno) | Webhooks de pago, cron reports semanales |
| Ref del proyecto | `vtngzjobuhqjnckuyrsx` | ID del proyecto en Supabase |

### Pagos
| Integración | Uso |
|-------------|-----|
| **Kushki** | Gateway principal — QR y tarjetas débito/crédito |
| **Nequi** | Billetera digital colombiana |
| **Daviplata** | Billetera digital colombiana |

### Infraestructura y DevOps
| Componente | Tecnología |
|-----------|-----------|
| Hosting | **Vercel** (Next.js nativo, deployments automáticos) |
| CI/CD | **GitHub Actions** + Vercel automático en push |
| Monitoreo | **Sentry** (errores frontend + API routes) |
| Tests de carga | **k6** |
| Control de versiones | **Git + GitHub** |

---

## 4. Estructura del Proyecto

```
aero/                              ← Carpeta raíz del proyecto
│
├── .claude/                       ← Configuración de Claude Code
│   ├── CLAUDE.md                  ← Instrucciones para el agente Claude
│   └── skills/                    ← Skills de Supabase y otros agentes
│
├── plans/                         ← Implementation plans (este documento y los sucesivos)
│   ├── master.md                  ← Este archivo (Single Source of Truth)
│   ├── 01-implementation-plan.md  ← Plan de implementación Sprint 1
│   └── ...
│
├── apps/
│   └── web/                       ← Aplicación Next.js 14 (única app del proyecto)
│       ├── app/                   ← App Router de Next.js
│       │   ├── (auth)/            ← Rutas de autenticación (login, register)
│       │   ├── (student)/         ← Rutas del flujo estudiante
│       │   │   ├── home/
│       │   │   ├── vendor/[id]/
│       │   │   ├── order/
│       │   │   ├── payment/
│       │   │   ├── tracking/
│       │   │   ├── map/
│       │   │   ├── wallet/
│       │   │   └── favorites/
│       │   ├── (vendor)/          ← Rutas del flujo vendedor
│       │   │   ├── dashboard/
│       │   │   ├── orders/
│       │   │   ├── menu/
│       │   │   └── reports/
│       │   ├── api/               ← API Routes (backend serverless)
│       │   │   ├── auth/
│       │   │   ├── orders/
│       │   │   ├── payments/
│       │   │   ├── vendors/
│       │   │   └── webhooks/
│       │   ├── layout.tsx
│       │   └── page.tsx           ← Splash / landing
│       │
│       ├── components/
│       │   ├── ui/                ← shadcn/ui base components
│       │   ├── student/           ← Componentes exclusivos del estudiante
│       │   ├── vendor/            ← Componentes exclusivos del vendedor
│       │   └── shared/            ← Componentes compartidos
│       │
│       ├── lib/
│       │   ├── supabase/          ← Cliente Supabase (browser + server)
│       │   ├── hooks/             ← Custom hooks (useOrders, useVendors, etc.)
│       │   ├── stores/            ← Zustand stores
│       │   ├── validations/       ← Schemas Zod
│       │   └── utils/
│       │
│       ├── types/                 ← TypeScript types generados desde Supabase
│       │   └── database.ts        ← Auto-generado por `supabase gen types`
│       │
│       ├── public/
│       ├── tailwind.config.ts
│       ├── next.config.ts
│       └── package.json
│
├── supabase/                      ← Configuración local de Supabase
│   ├── migrations/                ← Migraciones SQL
│   ├── seed.sql                   ← Datos iniciales
│   └── functions/                 ← Edge Functions (Deno)
│       ├── weekly-report/         ← Cron: resumen semanal
│       └── payment-webhook/       ← Webhook de pagos
│
├── .env.local                     ← Variables de entorno (NO commitear)
├── .env.example                   ← Template de variables de entorno
├── .gitignore
└── README.md
```

---

## 5. Paleta de Colores y Design Tokens

El prototipo Figma usa dos interfaces diferenciadas por color:

**Prototipo Figma**: https://www.figma.com/design/sF5JNuO3ubvwcZ3qbCnUiU/

### Interfaz Estudiante — Tema Azul
```css
--color-primary:         #1A6BFF;   /* Azul principal — CTAs, botones primarios */
--color-primary-dark:    #0D4ECC;   /* Hover / pressed state */
--color-primary-light:   #E8F0FF;   /* Fondos de tarjetas, chips seleccionados */
--color-accent:          #00C9A7;   /* Verde teal — disponibilidad, éxito */
--color-warning:         #FF9500;   /* Naranja — alertas de tiempo */
--color-error:           #FF3B30;   /* Rojo — errores, agotado */
--color-surface:         #FFFFFF;
--color-background:      #F5F7FA;
--color-text-primary:    #1C1C1E;
--color-text-secondary:  #6E6E73;
--color-text-disabled:   #AEAEB2;
--color-border:          #E5E5EA;
--color-overlay:         rgba(0,0,0,0.4);
```

### Interfaz Vendedor — Tema Naranja
```css
--color-vendor-primary:       #FF6B00;
--color-vendor-primary-dark:  #CC5500;
--color-vendor-primary-light: #FFF0E6;
--color-vendor-accent:        #FFD60A;
--color-vendor-success:       #34C759;
--color-vendor-surface:       #FFFFFF;
--color-vendor-background:    #FFF8F5;
```

### Semántica de Estado
```css
--status-available:   #34C759;
--status-busy:        #FF9500;
--status-unavailable: #FF3B30;
--status-pending:     #FFD60A;
```

### Tailwind Config (design tokens)
```ts
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: '#1A6BFF',
    dark: '#0D4ECC',
    light: '#E8F0FF',
  },
  vendor: {
    DEFAULT: '#FF6B00',
    dark: '#CC5500',
    light: '#FFF0E6',
    accent: '#FFD60A',
  },
  accent: '#00C9A7',
  // ... resto de tokens
}
```

---

## 6. Tipografía

```css
/* Display / Headers */
font-family: 'Plus Jakarta Sans', sans-serif;   /* weights: 400, 500, 600, 700, 800 */

/* Body / UI */
font-family: 'DM Sans', sans-serif;              /* weights: 400, 500, 600 */

/* Monoespaciado — precios, IDs, códigos */
font-family: 'JetBrains Mono', monospace;        /* weights: 400, 700 */
```

### Escala Tipográfica Mobile (base 375px)
```
text-xs:   11px / lh: 16px
text-sm:   13px / lh: 18px
text-base: 15px / lh: 22px
text-md:   17px / lh: 24px
text-lg:   20px / lh: 28px
text-xl:   24px / lh: 32px
text-2xl:  28px / lh: 36px
text-3xl:  34px / lh: 42px
```

---

## 7. Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Mobile / Desktop)               │
│                                                             │
│   Next.js 14 App (Vercel)                                   │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  App Router (RSC + Client Components)               │  │
│   │  ┌─────────────┐  ┌─────────────┐                  │  │
│   │  │ /student/*  │  │ /vendor/*   │                  │  │
│   │  └──────┬──────┘  └──────┬──────┘                  │  │
│   │         └────────────────┘                          │  │
│   │              API Routes (/api/*)                     │  │
│   └──────────────────┬──────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                     SUPABASE                                │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │    DB    │  │ Storage  │  │ Realtime │  │
│  │ (OAuth)  │  │(Postgres)│  │(Buckets) │  │(Sockets) │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Edge Functions (Deno)                   │  │
│  │   payment-webhook  │  weekly-report-cron             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │       SERVICIOS EXTERNOS    │
        │  · Google OAuth             │
        │  · Apple Sign In            │
        │  · Microsoft OAuth          │
        │  · Kushki (pagos)           │
        │  · Nequi API                │
        │  · Daviplata API            │
        │  · Google Maps JS API       │
        │  · Web Push (VAPID)         │
        └─────────────────────────────┘
```

### Realtime con Supabase
Los siguientes canales usan Supabase Realtime (PostgreSQL changes):
- `orders:status` → estudiante recibe actualización del estado de su pedido
- `orders:new` → vendedor recibe nuevo pedido entrante
- `delivery_points:updated` → mapa de puntos se actualiza
- `vendors:availability` → estudiante recibe que favorito se activó

---

## 8. Base de Datos — Modelo Entidad-Relación

**Motor**: PostgreSQL 15 (Supabase managed)
**Project ref**: `vtngzjobuhqjnckuyrsx`

### Schema SQL completo

```sql
-- =============================================
-- EXTENSIONES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para coordenadas geoespaciales

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('student', 'vendor', 'admin');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple', 'microsoft');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('qr', 'nequi', 'daviplata', 'card', 'wallet');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE security_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE wallet_tx_type AS ENUM ('topup', 'purchase', 'refund');
CREATE TYPE report_status AS ENUM ('pending', 'generated', 'failed');

-- =============================================
-- PROFILES (extiende auth.users de Supabase)
-- =============================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    VARCHAR(500),
  role          user_role NOT NULL DEFAULT 'student',
  fcm_token     VARCHAR(500),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE students (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   VARCHAR(50),
  wallet_balance  DECIMAL(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0)
);

-- =============================================
-- VENDORS
-- =============================================
CREATE TABLE vendors (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name   VARCHAR(255) NOT NULL,
  description     TEXT,
  cover_image_url VARCHAR(500),
  rating_avg      DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count    INTEGER DEFAULT 0,
  schedule_start  TIME DEFAULT '06:00',
  schedule_end    TIME DEFAULT '15:00',
  is_open         BOOLEAN DEFAULT FALSE,
  location_lat    DECIMAL(10,8),
  location_lng    DECIMAL(11,8),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  price           DECIMAL(8,2) NOT NULL CHECK (price > 0),
  category        VARCHAR(100),
  is_available    BOOLEAN DEFAULT TRUE,
  stock_limit     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCT IMAGES (max 3 por producto)
-- =============================================
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   VARCHAR(500) NOT NULL,
  order_index INTEGER DEFAULT 0 CHECK (order_index BETWEEN 0 AND 2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint: máximo 3 imágenes por producto
CREATE UNIQUE INDEX idx_product_images_max3 ON product_images(product_id, order_index);

-- =============================================
-- DELIVERY POINTS
-- =============================================
CREATE TABLE delivery_points (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  lat             DECIMAL(10,8) NOT NULL,
  lng             DECIMAL(11,8) NOT NULL,
  is_illuminated  BOOLEAN DEFAULT TRUE,
  security_level  security_level DEFAULT 'high',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TIME SLOTS
-- =============================================
CREATE TABLE time_slots (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_point_id   UUID NOT NULL REFERENCES delivery_points(id),
  slot_start          TIME NOT NULL,
  slot_end            TIME NOT NULL,
  date                DATE NOT NULL,
  max_capacity        INTEGER DEFAULT 10 CHECK (max_capacity > 0),
  current_count       INTEGER DEFAULT 0 CHECK (current_count >= 0),
  CONSTRAINT chk_slot_end_after_start CHECK (slot_end > slot_start),
  CONSTRAINT chk_count_not_exceed_capacity CHECK (current_count <= max_capacity)
);

CREATE UNIQUE INDEX idx_time_slots_point_date_start 
  ON time_slots(delivery_point_id, date, slot_start);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES students(id),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  time_slot_id        UUID REFERENCES time_slots(id),
  delivery_point_id   UUID REFERENCES delivery_points(id),
  status              order_status DEFAULT 'pending',
  total_amount        DECIMAL(8,2) NOT NULL CHECK (total_amount > 0),
  payment_method      payment_method NOT NULL,
  payment_status      payment_status DEFAULT 'pending',
  notes               TEXT,
  estimated_minutes   INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(8,2) NOT NULL CHECK (unit_price > 0),
  subtotal    DECIMAL(8,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  student_id      UUID NOT NULL REFERENCES students(id),
  amount          DECIMAL(8,2) NOT NULL,
  method          payment_method NOT NULL,
  external_tx_id  VARCHAR(255),
  status          payment_status DEFAULT 'pending',
  failure_reason  VARCHAR(500),
  log_data        JSONB NOT NULL DEFAULT '{}', -- Log inmutable
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WALLET TRANSACTIONS
-- =============================================
CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES students(id),
  type            wallet_tx_type NOT NULL,
  amount          DECIMAL(8,2) NOT NULL,
  balance_after   DECIMAL(8,2) NOT NULL,
  reference       VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RATINGS
-- =============================================
CREATE TABLE ratings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) UNIQUE,
  student_id   UUID NOT NULL REFERENCES students(id),
  vendor_id    UUID NOT NULL REFERENCES vendors(id),
  hygiene      INTEGER NOT NULL CHECK (hygiene BETWEEN 1 AND 5),
  punctuality  INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  quality      INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 5),
  avg_score    DECIMAL(3,2) GENERATED ALWAYS AS 
               ((hygiene + punctuality + quality) / 3.0) STORED,
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAVORITES
-- =============================================
CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id),
  vendor_id   UUID NOT NULL REFERENCES vendors(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, vendor_id)
);

-- =============================================
-- WEEKLY REPORTS
-- =============================================
CREATE TABLE weekly_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       UUID NOT NULL REFERENCES vendors(id),
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  total_orders    INTEGER DEFAULT 0,
  total_revenue   DECIMAL(10,2) DEFAULT 0.00,
  top_product_id  UUID REFERENCES products(id),
  report_data     JSONB DEFAULT '{}',
  pdf_url         VARCHAR(500),
  csv_url         VARCHAR(500),
  generated_at    TIMESTAMPTZ,
  status          report_status DEFAULT 'pending',
  UNIQUE (vendor_id, week_start)
);

-- =============================================
-- ÍNDICES DE PERFORMANCE
-- =============================================
CREATE INDEX idx_orders_student_id ON orders(student_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_available ON products(vendor_id, is_available);
CREATE INDEX idx_time_slots_date ON time_slots(date, delivery_point_id);
CREATE INDEX idx_ratings_vendor_id ON ratings(vendor_id);
CREATE INDEX idx_favorites_student_id ON favorites(student_id);
CREATE INDEX idx_vendors_is_open ON vendors(is_open);

-- =============================================
-- TRIGGERS — updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER — Actualizar rating promedio del vendedor
-- =============================================
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET 
    rating_avg   = (SELECT AVG(avg_score) FROM ratings WHERE vendor_id = NEW.vendor_id),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE vendor_id = NEW.vendor_id)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vendor_rating
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (el agente debe expandirlas)
-- Cada usuario solo ve su propio perfil
CREATE POLICY "profiles: own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Vendedores públicos (para el home)
CREATE POLICY "vendors: public read" ON vendors
  FOR SELECT USING (true);

-- Productos públicos
CREATE POLICY "products: public read" ON products
  FOR SELECT USING (true);

-- Puntos de entrega públicos
CREATE POLICY "delivery_points: public read" ON delivery_points
  FOR SELECT USING (true);
```

---

## 9. Autenticación

Supabase Auth gestiona toda la autenticación. Se configuran los siguientes providers:

### Providers OAuth
| Provider | Uso | Configuración |
|---------|-----|--------------|
| **Google** | Login estudiantes y vendedores | Google Cloud Console → OAuth 2.0 → callback: `https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback` |
| **Apple** | Login iOS (requerido por Apple) | Apple Developer → Sign In with Apple → configurar Services ID |
| **Microsoft (Azure AD)** | Login con cuentas @unisabana.edu.co | Azure Portal → App Registration → callback Supabase |

### Flujo de Auth en Next.js
```
1. Usuario hace clic en "Continuar con Google/Apple/Microsoft"
2. Supabase redirige al provider OAuth
3. Provider retorna a /auth/callback
4. Next.js middleware verifica la sesión (supabase.auth.getSession())
5. Si es nuevo usuario → crear perfil en tabla `profiles` (trigger automático)
6. Redirigir según rol: /student/home o /vendor/dashboard
```

### Middleware de Next.js
```ts
// middleware.ts — proteger rutas según rol
export const config = {
  matcher: ['/student/:path*', '/vendor/:path*', '/api/:path*']
}
```

### Variables de Entorno requeridas
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://vtngzjobuhqjnckuyrsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # Solo en servidor, nunca en cliente

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>
KUSHKI_PUBLIC_KEY=<key>
KUSHKI_PRIVATE_KEY=<key>
NEQUI_API_KEY=<key>
DAVIPLATA_API_KEY=<key>

NEXT_PUBLIC_VAPID_PUBLIC_KEY=<key>   # Web Push
VAPID_PRIVATE_KEY=<key>
```

---

## 10. APIs Externas e Integraciones

### Google Maps JavaScript API
| Endpoint / Servicio | Uso |
|--------------------|-----|
| Maps JavaScript API | Mostrar mapa con puntos de entrega |
| Places API | Autocompletar dirección del vendedor |
| Geocoding API | Convertir coordenadas ↔ dirección |

**Implementación**: `@vis.gl/react-google-maps` (wrapper oficial React)

```tsx
// Ejemplo de uso
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'

<APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
  <Map defaultCenter={{ lat: 4.8615, lng: -74.0317 }} defaultZoom={15}>
    {deliveryPoints.map(point => (
      <Marker key={point.id} position={{ lat: point.lat, lng: point.lng }} />
    ))}
  </Map>
</APIProvider>
```

### Supabase Storage — Buckets
| Bucket | Contenido | Acceso | Max size |
|--------|-----------|--------|---------|
| `product-images` | Fotos de platos | Público (read) | 5 MB → comprimido a 200 KB |
| `avatars` | Fotos de perfil | Público (read) | 2 MB |
| `reports` | PDFs y CSVs semanales | Privado (solo vendedor dueño) | 10 MB |
| `covers` | Fotos de portada del vendedor | Público (read) | 5 MB |

**Compresión de imágenes**: usar `browser-image-compression` en el cliente antes de subir.

```ts
// Comprimir antes de subir a Supabase Storage
import imageCompression from 'browser-image-compression'

const compressed = await imageCompression(file, {
  maxSizeMB: 0.2,          // 200 KB
  maxWidthOrHeight: 1200,
  useWebWorker: true,
})
await supabase.storage.from('product-images').upload(path, compressed)
```

### Kushki — Pagos
- **Modo sandbox** para POC, producción para MVP.
- Acepta: tarjetas débito/crédito, QR.
- Webhooks hacia `/api/webhooks/kushki` (Edge Function o API Route).

### Nequi API
- Cobro a número de celular Nequi.
- Webhook de confirmación hacia `/api/webhooks/nequi`.

### Daviplata API
- Cobro a número de celular Daviplata.
- Webhook de confirmación hacia `/api/webhooks/daviplata`.

### Web Push Notifications (VAPID)
- Alternativa a FCM para web browsers.
- Librería: `web-push` (Node.js) en API Routes / Edge Functions.
- El frontend solicita permiso con `Notification.requestPermission()`.
- El service worker maneja los eventos push.

### Supabase Realtime — Canales
```ts
// Estado del pedido — estudiante
supabase
  .channel('order-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `student_id=eq.${userId}`
  }, (payload) => updateOrderStatus(payload.new))
  .subscribe()

// Nuevo pedido — vendedor
supabase
  .channel('new-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `vendor_id=eq.${vendorId}`
  }, (payload) => addOrderToPanel(payload.new))
  .subscribe()
```

---

## 11. Módulos de la Plataforma

### Módulo A — Vitrina Digital y Pedido
- Menú en tiempo real con fotos, precio y disponibilidad
- Pedido digital en ≤4 pasos
- Pago QR / Nequi / Daviplata / Tarjeta
- Reserva anticipada desde las 6:00 a.m.

### Módulo B — Sistema de Entrega Segura
- Puntos fijos, iluminados y seguros en el mapa (Google Maps)
- Franjas horarias de 15 min asignadas automáticamente
- Máximo 30% de turnos por intervalo
- Seguimiento: Recibido → En preparación → Listo

### Módulo C — Sistema de Confianza y Analítica
- Perfil del vendedor con calificaciones (higiene, puntualidad, calidad 1-5⭐)
- Panel de pedidos anticipados en tiempo real (Supabase Realtime)
- Resumen semanal automático (Edge Function cron, lunes 5:45 a.m.)
- Exportable en PDF (Supabase Storage `/reports`)

---

## 12. Pantallas Mobile First (Figma)

**Viewport base**: 375px | **Safe area top**: 44px | **Padding horizontal**: 16px
**Border radius cards**: 16px | **Border radius buttons**: 12px

### Flujo Estudiante (Tema Azul `#1A6BFF`)
| # | Ruta Next.js | Pantalla | HU |
|---|-------------|---------|-----|
| 1 | `/` | Splash + landing | — |
| 2 | `/auth/login` | Login (email + Google + Apple + Microsoft) | — |
| 3 | `/auth/register` | Registro | — |
| 4 | `/student/home` | Home — vendedores activos, búsqueda | HU-01 |
| 5 | `/student/vendor/[id]` | Perfil del vendedor | HU-09 |
| 6 | `/student/vendor/[id]/menu` | Menú del día | HU-01 |
| 7 | `/student/order/new` | Crear pedido (carrito) | HU-02 |
| 8 | `/student/order/timeslot` | Selección franja horaria | HU-07, HU-04 |
| 9 | `/student/order/payment` | Pago | HU-03 |
| 10 | `/student/order/[id]/confirmed` | Pedido confirmado | HU-05 |
| 11 | `/student/order/[id]/tracking` | Seguimiento en tiempo real | HU-08 |
| 12 | `/student/map` | Mapa puntos de entrega | HU-06 |
| 13 | `/student/order/[id]/rate` | Calificación post-compra | HU-10 |
| 14 | `/student/wallet` | Cartera virtual | HU-13 |
| 15 | `/student/favorites` | Favoritos | HU-14 |
| 16 | `/student/profile` | Perfil del usuario | — |

### Flujo Vendedor (Tema Naranja `#FF6B00`)
| # | Ruta Next.js | Pantalla | HU |
|---|-------------|---------|-----|
| 1 | `/vendor/dashboard` | Dashboard — resumen del día | HU-12 |
| 2 | `/vendor/orders` | Panel de pedidos en tiempo real | HU-12 |
| 3 | `/vendor/orders/[id]` | Detalle del pedido | HU-08 |
| 4 | `/vendor/menu` | Gestión del menú | HU-11 |
| 5 | `/vendor/reports` | Reporte semanal | HU-15 |
| 6 | `/vendor/profile` | Editar perfil y horario | — |

---

## 13. Requisitos Funcionales

| ID | HU | Descripción | Criterio |
|----|-----|-------------|---------|
| RF-01 | HU-01 | Menú del día en tiempo real | Cambios en ≤10 seg |
| RF-02 | HU-02 | Pedido en ≤4 pasos | Flujo completo ≤4 pasos |
| RF-03 | HU-03 | Pagos QR/Nequi/Daviplata/Tarjeta | Tasa ≥98% |
| RF-04 | HU-04 | Reserva desde 6:00 a.m. | Asignación ≤2 seg |
| RF-05 | HU-05 | Push "listo para recoger" | Notificación ≤5 seg |
| RF-06 | HU-06 | Mapa puntos de entrega en tiempo real | Actualización ≤10 seg |
| RF-07 | HU-07 | Franja 15 min, máx 30% por intervalo | Asignación ≤2 seg |
| RF-08 | HU-08 | Estado del pedido en tiempo real | Actualización ≤5 seg |
| RF-09 | HU-09, HU-10 | Perfil + calificaciones 1-5⭐ | Visible ≤10 seg |
| RF-10 | HU-11 | Hasta 3 fotos por plato (≤5 MB → 200 KB) | Compresión automática |
| RF-11 | HU-12 | Panel pedidos anticipados del vendedor | Actualización ≤5 seg |
| RF-12 | HU-13 | Recarga cartera virtual | Tasa ≥98%, log inmutable |
| RF-13 | HU-14 | Favoritos + push al activarse | Push ≤10 seg (95% envíos) |
| RF-14 | HU-15 | Resumen semanal automático lunes 6:00 a.m. | Disponible en 99% ciclos |

---

## 14. Requisitos No Funcionales (ISO 25010)

| ID | Categoría | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| RNF-01 | Rendimiento | Carga menú ≤3 seg con 150 usuarios concurrentes | Alta |
| RNF-02 | Seguridad | TLS 1.2+, sin datos financieros en texto plano, Ley 1581 Colombia | **Crítica** |
| RNF-03 | Fiabilidad | Disponibilidad ≥99.9% mensual en horario 6:00-15:00 L-V | Alta |
| RNF-04 | Usabilidad | Primer pedido en ≤3 min y ≤5 pasos sin experiencia técnica | Alta |
| RNF-05 | Rendimiento | Push notifications ≤5 seg | Alta |
| RNF-06 | Usabilidad | Mapa actualizado ≤10 seg sin recarga manual | Media |
| RNF-07 | Escalabilidad | 30% max por intervalo garantizado con 200 reservas simultáneas | Media |
| RNF-08 | Integridad | Calificaciones persistidas ≤3 seg | Media |
| RNF-09 | Eficiencia | Imágenes comprimidas a ≤200 KB automáticamente | Media |
| RNF-10 | Escalabilidad | 200 pedidos simultáneos en ≤3 seg | Alta |
| RNF-11 | Seguridad | Log inmutable por transacción, retención 12 meses | Alta |
| RNF-12 | Rendimiento | Push favoritos ≤10 seg en 95% de envíos | Media |
| RNF-13 | Fiabilidad | Reporte semanal: 3 reintentos con 15 min de espera | Baja |
| RNF-14 | Integridad | Actualizaciones puntos/franjas propagadas ≤5 seg | Alta |

---

## 15. Historias de Usuario — Backlog Completo

### Resumen de priorización

| HU | Descripción | Épica | POC | MVP |
|----|-------------|-------|-----|-----|
| HU-01 | Ver menú del día | Descubrimiento | Must Have | Must Have |
| HU-02 | Pedido desde celular | Descubrimiento | Must Have | Must Have |
| HU-03 | Pago digital | Pago | Must Have | Must Have |
| HU-04 | Reserva anticipada | Descubrimiento | Must Have | Must Have |
| HU-05 | Confirmación recepción | Entrega | Must Have | Must Have |
| HU-06 | Mapa puntos seguros | Entrega | Must Have | Must Have |
| HU-07 | Franja horaria | Entrega | Must Have | Must Have |
| HU-08 | Tiempo estimado | Entrega | Should Have | Must Have |
| HU-09 | Perfil del vendedor | Confianza | Should Have | Must Have |
| HU-10 | Calificación higiene | Confianza | Should Have | Must Have |
| HU-11 | Fotos de platos | Confianza | Should Have | Must Have |
| HU-12 | Panel pedidos anticipados | Vendedor | Should Have | Must Have |
| HU-13 | Recarga de saldo | Pago | Should Have | Must Have |
| HU-14 | Favoritos | Vendedor | Could Have | Must Have |
| HU-15 | Resumen semanal | Vendedor | Could Have | Must Have |

*(Ver historias completas con criterios de aceptación en el documento original del Capstone)*

---

## 16. Flujo de Interacción Principal

```
[ESTUDIANTE]         [Next.js / Supabase]          [VENDEDOR]

1. Login OAuth   →   Supabase Auth → JWT
2. Ver Home      →   SELECT vendors WHERE is_open = true
3. Ver menú      →   SELECT products WHERE vendor_id = ? AND is_available = true
4. Crear pedido  →   INSERT orders + UPDATE time_slots.current_count++
5. Pagar         →   API Route /api/payments → Kushki/Nequi/Daviplata
6. Pago OK       ←   Webhook → UPDATE orders.payment_status = 'paid'
7. Push confirm  ←   Web Push al estudiante
                      Realtime INSERT → orders                   ↓
8. Vendedor ve   →                               Supabase Realtime
9. Confirma      →   UPDATE orders.status = 'confirmed'
10. Preparando   →   UPDATE orders.status = 'preparing'
11. Listo        →   UPDATE orders.status = 'ready'
                      Web Push al estudiante ←
12. Estudiante recoge → UPDATE orders.status = 'delivered'
13. Califica     →   INSERT ratings → TRIGGER actualiza vendor.rating_avg
```

---

## 17. Endpoints — API Routes de Next.js

**Base**: `/api/` (Next.js App Router Route Handlers)

```
POST  /api/auth/callback          # OAuth callback handler
POST  /api/orders                 # Crear orden + reservar franja
PUT   /api/orders/[id]/status     # Cambiar estado (vendedor)
PUT   /api/orders/[id]/delivered  # Confirmar recogida (estudiante)
POST  /api/payments/intent        # Crear intención de pago
POST  /api/webhooks/kushki        # Webhook Kushki
POST  /api/webhooks/nequi         # Webhook Nequi
POST  /api/webhooks/daviplata     # Webhook Daviplata
POST  /api/wallet/topup           # Recargar cartera
POST  /api/ratings                # Crear calificación
POST  /api/push/subscribe         # Registrar suscripción Web Push
POST  /api/push/send              # Enviar push notification (interno)
GET   /api/reports/[vendorId]/weekly  # Obtener reporte semanal
```

*La mayoría de los GETs van directo al cliente Supabase sin pasar por API Routes.*

---

## 18. Sprint 1 — Plan de Trabajo

**Objetivo**: flujo mínimo funcional — estudiante ingresa → hace pedido → vendedor lo recibe.
**Duración**: 2 semanas.

| ID | Tarea | Responsable | Resultado |
|----|-------|-------------|-----------|
| S1 | Crear proyecto Next.js + Tailwind + Supabase en `/aero/apps/web` | Andrés | Proyecto corriendo en localhost |
| S2 | Correr migraciones SQL en Supabase, configurar RLS | Andrés | DB lista con todas las tablas |
| S3 | Configurar Auth: email + Google + Microsoft | Valentina | Login funcional con redirección por rol |
| S4 | Pantallas Home y listado de vendedores | Santiago | Vendedores activos visibles |
| S5 | Pantallas Menú + Detalle del plato | Santiago | Menú con fotos, precio, disponibilidad |
| S6 | Lógica de pedido + selección de franja | Andrés | Pedido creado en DB, franja reservada |
| S7 | Integración Kushki sandbox (pago simulado) | Valentina | Flujo de pago funcionando |
| S8 | Dashboard básico del vendedor | Juan | Lista de pedidos pendientes |
| S9 | Realtime: pedido llega al panel del vendedor | Andrés | Supabase Realtime funcional |
| S10 | Pruebas con 3 estudiantes y 1 vendedor | Todos | Retroalimentación documentada |

---

## 19. Roles del Equipo

| Integrante | Rol | Foco |
|-----------|-----|------|
| **Juan Andrés Lacouture Daza** | Análisis y QA | Requerimientos, pruebas, historias de usuario |
| **Santiago Carrillo Piñeros** | UX/UI + Frontend | Figma, componentes Next.js, responsive design |
| **Andrés Felipe Sánchez García** | Backend + DB | Supabase, migraciones, API Routes, Realtime |
| **Valentina Alejandra López Romero** | Full Stack + Docs | Auth, pagos, integración, documentación |

---

## 20. Criterios de Éxito (Triple Impacto)

| Dimensión | Funcionalidad | Indicador |
|-----------|--------------|-----------|
| **Social** | Puntos de entrega seguros + perfil del vendedor | Reducción ≥50% en desplazamientos inseguros |
| **Económico** | Menú digital + pagos + analítica semanal | ≥20% aumento en pedidos del vendedor (primer mes piloto) |
| **Urbano-Ambiental** | Franjas horarias + mapa organizado | Reducción ≥30% en aglomeraciones en horas pico |

---

## 21. Guía para Agentes IA

> Para cualquier IA (Claude Code, Cursor, Copilot, etc.) que trabaje en este repositorio.

### Lo más importante
- **Framework**: Next.js 14 con App Router. NO React Native, NO NestJS.
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions). NO servidor propio.
- **La app es WEB RESPONSIVE**. Mobile First (375px base). No es app nativa.
- **TypeScript strict** en todo. Cero `any`.
- **Supabase project ref**: `vtngzjobuhqjnckuyrsx`

### Colores
- UI Estudiante → azul `#1A6BFF`
- UI Vendedor → naranja `#FF6B00`

### Orden de construcción
```
1. Setup Next.js + Tailwind + Supabase client
2. Migraciones SQL (ver sección 8) → `supabase/migrations/`
3. Auth (Google + Apple + Microsoft) via Supabase Auth
4. Tipos TypeScript auto-generados → `supabase gen types typescript`
5. Páginas estudiante: Home → Menú → Pedido → Pago → Tracking
6. Páginas vendedor: Dashboard → Panel pedidos → Menú
7. Supabase Realtime para pedidos en vivo
8. Integración pagos (Kushki sandbox primero)
9. Google Maps para puntos de entrega
10. Web Push para notificaciones
11. Edge Functions: webhook pagos + cron reporte semanal
12. Ratings, Favorites, Wallet
```

### FAQ
- **¿Cómo se asigna la franja?** API Route `/api/orders` busca `time_slots` donde `current_count / max_capacity < 0.30` y `date = TODAY`. Asigna el slot más próximo disponible y hace `UPDATE time_slots SET current_count = current_count + 1`.
- **¿Cómo se comprime la imagen?** En el browser con `browser-image-compression` antes de hacer upload a Supabase Storage. Target: 200 KB max.
- **¿Realtime cómo funciona?** Supabase Realtime escucha cambios en PostgreSQL via replication. El cliente se suscribe con `supabase.channel()`. Ver sección 10.
- **¿Dónde van los reportes PDF?** Se generan en una Edge Function (Deno) y se suben al bucket `reports` de Supabase Storage. La URL firmada se guarda en `weekly_reports.pdf_url`.
- **¿Los pagos van por Edge Function o API Route?** Los webhooks de Kushki/Nequi/Daviplata van a API Routes de Next.js en producción. Para el POC, usar sandbox de Kushki.
- **¿Qué pasa si el pago falla?** El pedido queda en `payment_status = 'failed'`, no se decrementa el stock, se muestra mensaje con `failure_reason`. El usuario puede reintentar.

---

*MASTER.MD — Actualizado: Mayo 2026 | Arquitectura: Next.js 14 + Supabase | Fase: POC Sprint 1*
*Universidad de La Sabana · Capstone 2026-1*