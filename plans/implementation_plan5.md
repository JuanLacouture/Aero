# Plan de Entrega Final — Proyecto AERO
## Deadline: 20 de Mayo 2026

---

## Contexto y Estado Actual

El proyecto tiene **toda la funcionalidad core implementada** (avance2.md confirma ~90% de módulos ✅). Lo que falta para la entrega final son **integraciones externas, polish de frontend, y tareas de la rúbrica de entrega**.

### ✅ Lo que YA funciona
- Auth email/password con protección de rutas por rol
- DB completa (14 tablas + RLS + triggers)
- CRUD productos vendedor, dashboard, pedidos realtime
- Wallet real (recarga, deducción, historial)
- Flujo completo de pedido → tracking → entrega con código 4 dígitos
- Calificaciones, favoritos, reportes semanales
- Push notifications (VAPID) — falta `SUPABASE_SERVICE_ROLE_KEY`
- Mapa de puntos de entrega (código listo, falta API key)

### 🔴 Lo que falta (rúbrica + análisis)

| # | Requerimiento | Estado |
|---|---|---|
| 1 | OAuth Google | Código existe, falta config en Google Cloud Console + Supabase |
| 2 | OAuth Microsoft | Código existe, falta config en Azure Portal + Supabase |
| 3 | Google Maps API (rastreo pedido) | Página `/student/map` existe con fallback, falta API key |
| 4 | Frontend web-first con UX premium + dark mode | Actual es funcional pero mobile-only, sin breakpoints desktop, sin animaciones |
| 5 | Pruebas Unitarias | No existen |
| 6 | QA de Interfaz | No documentado |
| 7 | Pruebas de Carga | No existen |
| 8 | Despliegue (Deploy) | No desplegado — Vercel, dominio TBD |
| 9 | Analytics & Monitoreo | No configurado |
| 10 | Backup & Recovery | No configurado |
| 11 | Protección de Datos | No hay página de políticas/términos |
| 12 | Feedback Loop | No existe canal de reporte de errores |

---

## Decisiones Confirmadas

- **Deploy**: Vercel (dominio será decidido después, usamos `.vercel.app` por ahora)
- **Dark mode**: ✅ Incluido
- **Pruebas de carga**: Contra deploy en Vercel
- **Consolas OAuth**: El usuario tiene acceso a Google Cloud Console y Azure Portal

---

## Proposed Changes

7 bloques por orden de prioridad, independientes entre sí.

---

### Bloque 1 — OAuth Google y Microsoft

**Esfuerzo**: ~1 hora código + config manual

El código de OAuth **ya existe** en `login/page.tsx` y `callback/route.ts`. Solo falta configuración.

#### Paso a paso — Google Cloud Console

```
1. Ir a https://console.cloud.google.com
2. Crear proyecto (o usar uno existente) → nombre "AERO"
3. Menú lateral → APIs & Services → OAuth consent screen
   - User Type: External
   - App name: AERO
   - User support email: tu email
   - Authorized domains: supabase.co
   - Guardar
4. Menú lateral → APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: AERO Web
   - Authorized JavaScript origins:
     - http://localhost:3000
     - https://<tu-app>.vercel.app  (agregar después del deploy)
   - Authorized redirect URIs:
     - https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback
   - Crear
5. Copiar "Client ID" y "Client Secret"
6. Ir a Supabase Dashboard → https://supabase.com/dashboard/project/vtngzjobuhqjnckuyrsx
   - Auth → Providers → Google → Habilitar
   - Pegar Client ID y Client Secret
   - Guardar
```

#### Paso a paso — Azure Portal (Microsoft)

```
1. Ir a https://portal.azure.com
2. Azure Active Directory → App registrations → New registration
   - Name: AERO
   - Supported account types: "Accounts in any organizational directory" 
     (para que funcione con @unisabana.edu.co)
   - Redirect URI: Web → https://vtngzjobuhqjnckuyrsx.supabase.co/auth/v1/callback
   - Registrar
3. En la app creada:
   - Overview → copiar "Application (client) ID"
   - Certificates & secrets → New client secret → copiar "Value"
4. Ir a Supabase Dashboard
   - Auth → Providers → Azure → Habilitar
   - Pegar Application ID como "Client ID"
   - Pegar Secret Value como "Client Secret"  
   - Azure Tenant URL: https://login.microsoftonline.com/common
   - Guardar
```

#### [MODIFY] [callback/route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/(auth)/callback/route.ts)
- Verificar que el callback crea perfil automáticamente para nuevos usuarios OAuth
- Manejo de error robusto con redirect a `/login?error=oauth_failed`

#### [MODIFY] [login/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/(auth)/login/page.tsx)
- Actualizar `redirectTo` para usar `NEXT_PUBLIC_APP_URL` en vez de `window.location.origin`

---

### Bloque 2 — Google Maps API para Rastreo de Pedido

**Esfuerzo**: ~2 horas

#### Paso a paso — Google Cloud Console (misma cuenta del Bloque 1)

```
1. En el proyecto AERO de Google Cloud Console
2. APIs & Services → Library → buscar "Maps JavaScript API" → Enable
3. Opcional: buscar "Places API" → Enable
4. Opcional: buscar "Geocoding API" → Enable  
5. APIs & Services → Credentials → Create Credentials → API Key
6. Opcional: restringir la key:
   - Application restrictions: HTTP referrers
   - Agregar: localhost:3000/*, <tu-app>.vercel.app/*
   - API restrictions: Maps JavaScript API, Places API
7. Copiar la API Key
8. En tu archivo apps/web/.env.local agregar:
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<tu_api_key>
```

#### [MODIFY] [tracking/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/order/[id]/tracking/page.tsx)
- Agregar mini-mapa embebido mostrando el punto de entrega asignado al pedido
- Marker del punto de entrega con InfoWindow
- Link "Ver en mapa completo" → `/student/map`

#### [MODIFY] [map/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/map/page.tsx)
- Responsive: mapa más alto en desktop (`md:h-[500px]`)
- Markers custom con colores AERO
- Estilo de mapa mejorado

---

### Bloque 3 — Rediseño Frontend Web-First + UX Premium + Dark Mode

**Esfuerzo**: ~8-10 horas (el bloque más grande)

> [!IMPORTANT]
> Cambio más visible para la entrega. Frontend actual es funcional pero **solo mobile**. Necesita layouts responsivos desktop, animaciones, skeleton loaders, y dark mode completo.

#### 3.1 Dark Mode + Sistema de Colores

##### [MODIFY] [globals.css](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/globals.css)
- Convertir CSS variables AERO a HSL para soporte `dark:`
- Agregar `.dark` con variantes oscuras de todos los colores AERO
- Student dark: fondo `#0F1117`, primary intacto `#1A6BFF`
- Vendor dark: fondo `#1A1008`, vendor primary intacto `#FF6B00`
- Custom scrollbar para desktop
- Animaciones CSS: fade-in, slide-up, shimmer (skeleton)

##### [MODIFY] [tailwind.config.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/tailwind.config.ts)
- Agregar `darkMode: 'class'`
- Extender con colores dark-aware

##### [MODIFY] [layout.tsx (root)](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/layout.tsx)
- Agregar script de detección de preferencia de color del sistema
- Meta tags SEO completos

##### [NEW] `lib/hooks/useTheme.ts`
- Hook para toggle dark/light mode
- Persistir en localStorage
- Respetar `prefers-color-scheme` del sistema

#### 3.2 Layout Responsivo — Navegación Desktop

##### [NEW] `components/shared/DesktopSidebar.tsx`
- Sidebar adaptable: variante student (azul) y vendor (naranja)
- Logo AERO + links de navegación + toggle dark mode
- Visible solo en `md:` breakpoint

##### [MODIFY] [student/layout.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/layout.tsx)
- Desktop (`md:`): sidebar lateral + contenido principal en grid
- Mobile: mantener bottom nav actual
- Importar DesktopSidebar con variante `student`

##### [MODIFY] [vendor/layout.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/layout.tsx)
- Mismo patrón: sidebar naranja en desktop, bottom nav en mobile

##### [MODIFY] [StudentBottomNav.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/components/shared/StudentBottomNav.tsx)
- Agregar `md:hidden` para ocultar en desktop

##### [MODIFY] [VendorBottomNav.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/components/shared/VendorBottomNav.tsx)
- Agregar `md:hidden` para ocultar en desktop

#### 3.3 Páginas — Polish UX

##### [MODIFY] [login/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/(auth)/login/page.tsx)
- Desktop: layout split — izquierda hero con branding AERO + gradiente animado, derecha formulario
- Framer Motion animaciones de entrada
- Dark mode support

##### [MODIFY] [register/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/(auth)/register/page.tsx)
- Mismo split-screen para desktop
- Stepper visual
- Dark mode

##### [MODIFY] [student/home/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/home/page.tsx)
- Desktop: grid 2-3 columnas para vendor cards
- Skeleton loaders
- Framer Motion stagger en cards
- Dark mode

##### [MODIFY] [VendorCardList.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/components/student/VendorCardList.tsx)
- Hover effects desktop (scale, shadow)
- Stagger animation
- Dark mode card backgrounds
- `next/image` en vez de `<img>`

##### [MODIFY] [vendor/dashboard/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/dashboard/page.tsx)
- Desktop: stats en fila, orders en grid
- Skeleton loaders + realtime flash highlight
- Dark mode

##### [MODIFY] [vendor/orders/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/orders/page.tsx)
- Desktop: vista tabla con columnas
- Micro-animaciones en cambio de estado
- Dark mode

##### Todas las demás páginas
- `dark:` variants en backgrounds, text, borders, cards
- Responsive grid para desktop donde aplique
- Reemplazar `<img>` por `<Image />` de Next.js

#### 3.4 Componentes Nuevos

##### [NEW] `components/shared/Skeleton.tsx`
- Skeleton reutilizable: variantes card, line, circle, rectangle

##### [NEW] `components/shared/PageTransition.tsx`
- Wrapper Framer Motion para transiciones de página

#### 3.5 Limpieza

##### [MODIFY] [package.json](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/package.json)
- Eliminar `qrcode`, `@types/qrcode`, `html5-qrcode` (no se usan desde avance2)

---

### Bloque 4 — Pruebas Unitarias + QA de Interfaz

**Esfuerzo**: ~3 horas

##### [NEW] `vitest.config.ts`
- Vitest con soporte React/TSX + `@testing-library/react`

##### [NEW] `__tests__/api/orders.test.ts`
- Crear pedido wallet suficiente → 200
- Crear pedido wallet insuficiente → 402
- Cambiar estados: pending → confirmed → preparing → ready
- Entregar con código correcto → 200 / incorrecto → 400

##### [NEW] `__tests__/api/wallet.test.ts`
- Topup incrementa balance + crea transaction
- Topup monto negativo → 400

##### [NEW] `__tests__/utils/deliveryCode.test.ts`
- Código determinista desde UUID
- Mismo UUID = mismo código siempre

##### [MODIFY] [package.json](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/package.json)
- Agregar devDeps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`

#### QA de Interfaz (browser subagent)
- Flujo estudiante completo en 375px, 768px, 1280px
- Flujo vendedor completo
- Dark mode toggle funcional

---

### Bloque 5 — Pruebas de Carga (k6 contra Vercel)

**Esfuerzo**: ~1.5 horas

##### [NEW] `k6/load-test.js`
- Escenario 1: 50 VUs → GET home page — p95 < 3s
- Escenario 2: 20 VUs → POST crear pedido simultáneo
- Escenario 3: 100 VUs → GET API vendors
- Reporte de métricas en markdown

##### [NEW] `k6/README.md`
- Instrucciones: `k6 run k6/load-test.js`
- Resultados obtenidos vs umbrales

---

### Bloque 6 — Deploy a Vercel + CI/CD

**Esfuerzo**: ~1 hora

#### Paso a paso — Vercel

```
1. Ir a https://vercel.com → Sign in con GitHub
2. Import → seleccionar repo "Aero"
3. Configurar:
   - Framework Preset: Next.js
   - Root Directory: apps/web
   - Build Command: npm run build (default)
   - Output Directory: (default)
4. Environment Variables → agregar:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   - NEXT_PUBLIC_VAPID_PUBLIC_KEY
   - VAPID_PRIVATE_KEY
   - VAPID_SUBJECT
   - NEXT_PUBLIC_APP_URL = https://<tu-app>.vercel.app
5. Deploy → SSL automático incluido
6. Después: Settings → Domains → agregar dominio custom cuando lo decidan
```

#### [NEW] `.github/workflows/ci.yml`
- On push to `main`: lint → build → test
- Vercel auto-deploy via GitHub integration

#### [MODIFY] [next.config.mjs](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/next.config.mjs)
- `images.remotePatterns` para Supabase Storage URLs
- Headers de seguridad

---

### Bloque 7 — Items de Rúbrica Restantes

**Esfuerzo**: ~2.5 horas

#### 7.1 Analytics & Monitoreo (Sentry)
- `npm install @sentry/nextjs`
- `sentry.client.config.ts`, `sentry.server.config.ts`
- Error boundary global
- Tracking de eventos básicos (pedido creado, error de pago)

#### 7.2 Backup & Recovery
- Documentar en README que Supabase provee backups automáticos diarios
- Agregar instrucciones de restore desde dashboard

#### 7.3 Protección de Datos (Habeas Data — Ley 1581)

##### [NEW] `app/legal/privacy/page.tsx`
- Política de privacidad adaptada a legislación colombiana
- Datos recopilados, finalidad, derechos ARCO

##### [NEW] `app/legal/terms/page.tsx`
- Términos y condiciones de uso

##### [MODIFY] [register/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/(auth)/register/page.tsx)
- Checkbox obligatorio: "Acepto los términos y la política de privacidad"

#### 7.4 Feedback Loop

##### [NEW] `app/student/feedback/page.tsx` + `app/vendor/feedback/page.tsx`
- Formulario: tipo (bug/sugerencia/otro) + descripción + screenshot opcional
- Guardado en tabla `feedback` de Supabase

##### [NEW] Migración SQL — tabla `feedback`
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

#### 7.5 Llaves de entorno
- Agregar `SUPABASE_SERVICE_ROLE_KEY` (del dashboard)
- Agregar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (del Bloque 2)

---

## Resumen de Esfuerzo

| Bloque | Esfuerzo | Dependencia externa |
|---|---|---|
| 1. OAuth Google + Microsoft | 1h | Config manual en consolas |
| 2. Google Maps API | 2h | API key de Google |
| 3. Frontend web + dark mode | 8-10h | Ninguna |
| 4. Pruebas unitarias + QA | 3h | Ninguna |
| 5. Pruebas de carga | 1.5h | Deploy en Vercel |
| 6. Deploy Vercel + CI/CD | 1h | Cuenta Vercel |
| 7. Rúbrica (analytics, legal, feedback) | 2.5h | Ninguna |
| **Total** | **~19-21h** | — |

---

## Orden de Ejecución

```
Día 1 (16-May — HOY):
  → Bloque 3 parte 1: Dark mode system, design tokens, layouts responsivos
  → Bloque 7.3: Páginas legales (rápido)

Día 2 (17-May):
  → Bloque 3 parte 2: Rediseño de todas las páginas
  → Bloque 3 parte 3: Componentes nuevos, skeleton, transiciones
  → Bloque 1: OAuth callback verificación

Día 3 (18-May):
  → Bloque 2: Google Maps en tracking
  → Bloque 4: Pruebas unitarias
  → Bloque 7 (analytics, feedback, backup doc)
  → TÚ: Configurar consolas OAuth + API key Maps

Día 4 (19-May):
  → Bloque 6: Deploy a Vercel
  → Bloque 5: Pruebas de carga contra Vercel
  → QA final con browser (responsive + dark mode)
  → Limpieza

Día 5 (20-May):
  → Buffer / fixes de última hora
  → ENTREGA
```

## Verification Plan

### Automated Tests
- `npm run test` — Vitest con 15+ tests
- `npm run build` — Build limpio
- `npm run lint` — Sin errores
- `k6 run k6/load-test.js` — p95 < 3s contra Vercel

### Browser QA
- Flujo completo estudiante y vendedor
- Responsive: 375px, 768px, 1280px
- Dark mode toggle
- OAuth redirects
- Google Maps render

### Manual (equipo)
- Deploy HTTPS accesible en Vercel
- OAuth con cuentas reales
- Push notifications en browser
