# Plan de Implementación — CRUD de Productos del Vendedor + Visualización Estudiante

**Proyecto:** AERO (Conexión Alimentaria Sabana Centro)  
**Objetivo:** Implementar el CRUD completo de productos del vendedor con UI premium y que el estudiante pueda visualizar los productos con imágenes reales.  
**Fuente de verdad:** [master.md](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/plans/master.md)  
**Supabase project ref:** `vtngzjobuhqjnckuyrsx`

---

## Análisis del Estado Actual (Verificado 9-May-2026)

### ✅ Ya implementado y funcional
| Componente | Estado | Archivo |
|---|---|---|
| Auth: Login email + OAuth (Google, Microsoft) | ✅ Completo | [login/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/(auth)/login/page.tsx) |
| Auth: Registro con selección de rol (student/vendor) | ✅ Completo | [register/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/(auth)/register/page.tsx) |
| API: Registro de vendedor + creación en tabla `vendors` | ✅ Completo | [vendors/register/route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/vendors/register/route.ts) |
| Middleware de auth protegiendo rutas | ✅ Completo | [middleware.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/middleware.ts) |
| Vendor Dashboard con Realtime + toggle is_open | ✅ Completo | [dashboard/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/dashboard/page.tsx) |
| Vendor Menu CRUD (básico, sin imágenes) | ✅ Funcional básico | [vendor/menu/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/vendor/menu/page.tsx) |
| Student Home: listado de vendedores activos | ✅ Completo | [home/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/home/page.tsx) |
| Student Menu View: ver productos + agregar al carrito | ✅ Completo | [vendor/\[id\]/menu/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/vendor/%5Bid%5D/menu/page.tsx) |
| Cart Store (Zustand) | ✅ Completo | [cart.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/lib/stores/cart.ts) |
| Student Order Flow: carrito → franja → pago | ✅ Completo | [order/new/page.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/student/order/new/page.tsx) |
| API: Crear pedido con validación de franjas | ✅ Completo | [api/orders/route.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/app/api/orders/route.ts) |
| Navigation: Bottom nav para estudiante y vendedor | ✅ Completo | [StudentBottomNav.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/components/shared/StudentBottomNav.tsx), [VendorBottomNav.tsx](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/components/shared/VendorBottomNav.tsx) |
| Base de datos: 14 tablas, ENUMs, triggers, RLS, índices | ✅ Completo | [001_initial_schema.sql](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/supabase/migrations/001_initial_schema.sql) |
| Design tokens: Tailwind config, colores, tipografía | ✅ Completo | [tailwind.config.ts](file:///c:/Users/danie/OneDrive/Documentos/GitHub/Aero/apps/web/tailwind.config.ts) |

### ❌ Brechas detectadas (relevantes para este plan)
| Brecha | Impacto |
|---|---|
| **No hay Storage buckets** creados en Supabase (`product-images`, `avatars`, `covers`) | El vendedor no puede subir fotos de sus productos |
| **No hay subida de imágenes** en el CRUD de productos del vendedor | Los productos solo muestran emoji 🍽️ como placeholder |
| **No hay utilidad de compresión de imágenes** | Las imágenes podrían ser muy pesadas (requisito: ≤200KB) |
| **No hay validación con Zod** en el formulario de productos | Los datos pueden llegar mal formateados |
| **UI del CRUD del vendedor es básica** — solo formulario tipo bottom sheet sin imágenes, sin micro-animaciones | No cumple con diseño premium Mobile First |
| **La vista del estudiante muestra emoji genérico** en lugar de fotos reales de productos | Experiencia pobre al visualizar el menú |
| **No hay `stock_limit`** editable en el CRUD de productos | El vendedor no puede gestionar inventario |
| **Vendor profile page** es solo scaffold `<h1>` | El estudiante no puede ver info completa del vendedor |
| **Policies RLS para products**: solo lectura pública y escritura del vendor_id dueño — necesitamos verificar que DELETE/UPDATE también estén correctas | Seguridad incompleta |

---

## User Review Required

> [!IMPORTANT]
> **Storage Buckets:** Se necesita crear los buckets `product-images` (público), `avatars` (público), y `covers` (público) en el Supabase Dashboard **antes** de poder subir imágenes. Esto se hará via MCP `execute_sql` o instrucciones para el dashboard.

> [!IMPORTANT]
> **Scope del plan:** Este plan se centra **exclusivamente** en el flujo de productos:
> 1. Vendor → CRUD de productos con imágenes y UI premium
> 2. Student → Visualizar menú con imágenes reales
> 
> **NO incluye:** Pedidos, pagos, realtime, ratings, favoritos, wallet, reportes, maps, push notifications (ya están cubiertos en el plan_13_mayo o quedan para fases futuras).

> [!NOTE]
> **Compresión de imágenes:** Se usará `browser-image-compression` (ya instalada en `package.json`) para comprimir a ≤200KB antes de subir a Supabase Storage, cumpliendo con RNF-09 del master.

---

## Open Questions

> [!IMPORTANT]
> **¿Quieres seed data de productos demo?** Puedo crear un archivo `seed_products.sql` con 8-10 productos ficticios de ejemplo (arepas, empanadas, jugos, etc.) con imágenes generadas por IA para que la plataforma se vea con contenido desde el primer momento.

> [!NOTE]
> **¿Mantener el número de imágenes por producto como máximo 3?** La tabla `product_images` ya tiene un constraint de máximo 3 por producto (`order_index BETWEEN 0 AND 2`). Este plan respeta esa restricción. ¿Está bien o quieres permitir más?

---

## Proposed Changes

La implementación se divide en **5 fases** secuenciales.

---

### Fase 1 — Infraestructura: Storage Buckets + RLS + Utilidades

> Configurar la infraestructura de Supabase necesaria para imágenes y verificar que las policies de seguridad sean correctas.

#### [NEW] Supabase Storage Buckets (via MCP o Dashboard)

Se crean 3 buckets:

| Bucket | Público | Límite | Tipos MIME |
|---|---|---|---|
| `product-images` | ✅ Sí | 5 MB por archivo | `image/jpeg`, `image/png`, `image/webp` |
| `avatars` | ✅ Sí | 2 MB por archivo | `image/jpeg`, `image/png`, `image/webp` |
| `covers` | ✅ Sí | 5 MB por archivo | `image/jpeg`, `image/png`, `image/webp` |

**Storage Policies:** 
- Lectura pública para los 3 buckets
- Escritura/Upsert solo para usuarios autenticados que sean dueños (vendor_id match)
- Delete solo para el dueño

#### [NEW] lib/utils/image-compression.ts

Utilidad de compresión de imágenes usando `browser-image-compression`:
```ts
// Comprime a máximo 200KB y 1200px de ancho/alto
// Convierte a WebP si el browser lo soporta
export async function compressImage(file: File): Promise<File>
```

#### [NEW] lib/utils/storage.ts

Funciones helper para interactuar con Supabase Storage:
```ts
export async function uploadProductImage(file: File, vendorId: string, productId: string, index: number): Promise<string>
export async function deleteProductImage(vendorId: string, productId: string, index: number): Promise<void>
export function getProductImageUrl(path: string): string
```

#### [VERIFY] RLS Policies para `products` y `product_images`

Verificar y/o crear las siguientes policies:

**`products`:**
- `SELECT`: Público para todos los autenticados ✅ (ya existe)
- `INSERT`: Solo el vendor_id dueño puede insertar
- `UPDATE`: Solo el vendor_id dueño puede actualizar
- `DELETE`: Solo el vendor_id dueño puede eliminar

**`product_images`:**
- `SELECT`: Público ✅ (ya existe o se crea)
- `INSERT/UPDATE/DELETE`: Solo si el `product.vendor_id` = `auth.uid()`

---

### Fase 2 — Validaciones Zod + API Route de Productos

> Crear schemas de validación y un API route dedicado para el CRUD de productos del vendedor.

#### [NEW] lib/validations/product.ts

Schemas Zod para validación del producto:
```ts
export const createProductSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(255),
  description: z.string().max(500).optional(),
  price: z.number().positive('Debe ser mayor a 0'),
  category: z.string().max(100).optional(),
  stock_limit: z.number().int().positive().optional(),
})

export const updateProductSchema = createProductSchema.partial()
```

#### [NEW] app/api/vendors/products/route.ts

API route para listar y crear productos del vendedor autenticado:
- `GET` → Lista productos del vendor autenticado con sus imágenes
- `POST` → Crea un nuevo producto (validado con Zod)

#### [NEW] app/api/vendors/products/[id]/route.ts

API route para editar y eliminar un producto específico:
- `PUT` → Actualiza producto (solo si `vendor_id = auth.uid()`)
- `DELETE` → Elimina producto y sus imágenes del Storage

#### [NEW] app/api/vendors/products/[id]/images/route.ts

API route para gestionar imágenes de un producto:
- `POST` → Recibe imagen (desde el frontend ya comprimida), la sube a Storage, y crea registro en `product_images`
- `DELETE` → Elimina una imagen específica del Storage y la tabla

---

### Fase 3 — UI Premium del CRUD de Productos del Vendedor (HU-11)

> Rediseñar la página de gestión del menú del vendedor con una UI premium, Mobile First, incluyendo subida de imágenes con preview, validaciones en tiempo real, animaciones, y gestión de stock.

#### [MODIFY] app/vendor/menu/page.tsx — Rediseño completo

**Diseño actual:** Formulario básico en bottom sheet, sin imágenes, sin animaciones.

**Nuevo diseño premium:**

1. **Header naranja** con estadísticas:
   - Número total de productos
   - Productos disponibles vs. no disponibles
   - Toggle rápido de `is_open` del vendedor

2. **FAB (Floating Action Button)** naranja para "Agregar plato"

3. **Grid de productos** con tarjetas premium:
   - Imagen del producto (o placeholder con gradiente si no hay)
   - Nombre, precio (formateado COP), categoría como badge
   - Toggle de disponibilidad con animación
   - Indicador de stock (`stock_limit`)
   - Botones de editar/eliminar con iconos

4. **Modal de crear/editar producto** (full-screen mobile):
   - **Zona de imágenes**: drag & drop / click para subir, máximo 3 fotos
   - Preview de imágenes con opción de reordenar y eliminar
   - Campos: nombre*, descripción, precio*, categoría (con sugerencias), stock límite
   - Validación en tiempo real con Zod (mensajes de error debajo de cada campo)
   - Botón guardar con estado de carga
   - Animaciones de entrada/salida con Framer Motion

5. **Filtros/búsqueda** por categoría en la lista principal

6. **Estados vacíos** con ilustración y CTA claro

**Componentes a crear:**

#### [NEW] components/vendor/ProductCard.tsx
Tarjeta de producto reutilizable con imagen, info, acciones.

#### [NEW] components/vendor/ProductFormModal.tsx
Modal de creación/edición con subida de imágenes y validación Zod.

#### [NEW] components/vendor/ImageUploader.tsx
Componente de subida de imágenes con:
- Preview grid (hasta 3 imágenes)
- Drag & drop
- Indicador de compresión
- Botón de eliminar por imagen
- Orden de imágenes

#### [NEW] components/vendor/CategoryFilter.tsx
Chips de filtro por categoría con animación.

---

### Fase 4 — UI de Visualización del Menú para el Estudiante

> Mejorar la vista del menú que ve el estudiante para mostrar imágenes reales de productos, diseño premium y una experiencia de navegación fluida.

#### [MODIFY] app/student/vendor/[id]/menu/page.tsx — Upgrade con imágenes

**Cambios principales:**

1. **Imagen de producto real** en lugar del emoji 🍽️:
   - Cargar `product_images` junto con los productos
   - Mostrar la imagen con `order_index = 0` como thumbnail
   - Fallback con gradiente + ícono si no hay imagen

2. **Product detail sheet mejorado:**
   - Carrusel de imágenes del producto (hasta 3)
   - Nombre, descripción, precio destacado
   - Botones de agregar al carrito con animación

3. **Cover image del vendedor:**
   - Ya se lee `cover_image_url` pero el fallback es un emoji
   - Mejorar el fallback con gradiente naranja del tema

4. **Micro-animaciones:**
   - Transición al abrir/cerrar product detail sheet
   - Animación de "agregar al carrito" con feedback visual
   - Smooth scroll entre categorías

#### [MODIFY] app/student/home/page.tsx — Mejoras visuales menores

1. **Imagen de cover del vendedor**: mejorar fallback (gradiente en vez de emoji)
2. **Badge de "productos disponibles"** en cada tarjeta de vendedor
3. **Animación de entrada** de las tarjetas con Framer Motion

#### [NEW] components/student/ProductImageCarousel.tsx

Carrusel simple de imágenes para el bottom sheet de detalle del producto:
- Swipe horizontal
- Indicadores de página (dots)
- Fallback elegante si no hay imágenes

---

### Fase 5 — Seed Data + Verificación

> Crear datos de prueba y verificar todo el flujo end-to-end.

#### [NEW] supabase/seed_products.sql (opcional, según respuesta del usuario)

Datos de ejemplo:
- 2 vendedores de prueba con `is_open = true`
- 8-10 productos con categorías (Desayunos, Almuerzos, Bebidas, Snacks)
- Precios en COP realistas (ej: arepa $3.500, almuerzo $10.000)

---

## Resumen de Archivos

### Archivos nuevos (12)
| # | Archivo | Descripción |
|---|---|---|
| 1 | `lib/utils/image-compression.ts` | Utilidad de compresión de imágenes |
| 2 | `lib/utils/storage.ts` | Helpers de Supabase Storage |
| 3 | `lib/validations/product.ts` | Schemas Zod de productos |
| 4 | `app/api/vendors/products/route.ts` | API: listar/crear productos |
| 5 | `app/api/vendors/products/[id]/route.ts` | API: editar/eliminar producto |
| 6 | `app/api/vendors/products/[id]/images/route.ts` | API: gestionar imágenes |
| 7 | `components/vendor/ProductCard.tsx` | Tarjeta de producto |
| 8 | `components/vendor/ProductFormModal.tsx` | Modal crear/editar producto |
| 9 | `components/vendor/ImageUploader.tsx` | Uploader de imágenes |
| 10 | `components/vendor/CategoryFilter.tsx` | Filtro por categoría |
| 11 | `components/student/ProductImageCarousel.tsx` | Carrusel de imágenes |
| 12 | `supabase/seed_products.sql` | Datos de prueba (opcional) |

### Archivos modificados (3)
| # | Archivo | Cambio |
|---|---|---|
| 1 | `app/vendor/menu/page.tsx` | Rediseño completo con UI premium + imágenes |
| 2 | `app/student/vendor/[id]/menu/page.tsx` | Agregar imágenes reales + carrusel |
| 3 | `app/student/home/page.tsx` | Mejoras visuales en tarjetas de vendedores |

### Infraestructura (via MCP/Dashboard)
| # | Acción | Detalle |
|---|---|---|
| 1 | Crear Storage buckets | `product-images`, `avatars`, `covers` |
| 2 | Crear Storage policies | Read público, write solo owner |
| 3 | Verificar/crear RLS policies | `products` + `product_images` completas |

---

## Verification Plan

### Automated Tests

```bash
# Desde apps/web/
npm run build     # 0 errores TypeScript
npm run dev       # Inicia en localhost:3000
npm run lint      # Sin errores críticos
```

### Browser Tests (via browser subagent)

| # | Test | Resultado esperado |
|---|---|---|
| 1 | Login como vendedor → ir a `/vendor/menu` | Página carga con diseño premium naranja |
| 2 | Click "Agregar plato" → llenar formulario → subir imagen → guardar | Producto aparece en la lista con imagen |
| 3 | Editar producto → cambiar precio → guardar | Precio actualizado en la tarjeta |
| 4 | Toggle disponibilidad de un producto | El toggle cambia visualmente y persiste en DB |
| 5 | Eliminar producto → confirmar | Producto desaparece de la lista |
| 6 | Login como estudiante → ir a `/student/home` | Vendedores aparecen con imágenes de cover |
| 7 | Click en vendedor → ver menú | Productos con imágenes reales (o fallback) |
| 8 | Click en producto → ver detalle | Bottom sheet con carrusel de imágenes |

### Manual Verification

| Check | Cómo verificar |
|---|---|
| Imágenes comprimidas a ≤200KB | Inspeccionar en Storage Dashboard de Supabase |
| RLS protege productos | Intentar editar producto de otro vendor → debe fallar |
| Fallbacks de imagen | Desactivar internet después de cargar → gradientes visibles |
| Mobile First responsive | Probar en viewport 375px, 428px, y desktop |
| Validación Zod funciona | Intentar crear producto sin nombre → mensaje de error |

---

## Cronograma Estimado

| Fase | Duración | Dependencia |
|---|---|---|
| Fase 1: Infraestructura Storage + RLS | ~30 min | Ninguna |
| Fase 2: Validaciones + API Routes | ~45 min | Fase 1 |
| Fase 3: UI Premium Vendor CRUD | ~90 min | Fase 2 |
| Fase 4: UI Estudiante con imágenes | ~60 min | Fase 2 |
| Fase 5: Seed + Verificación | ~30 min | Fases 3 y 4 |
| **Total estimado** | **~4.5 horas** | |

---

*Plan creado: 9-Mayo-2026 | Proyecto AERO | Universidad de La Sabana · Capstone 2026-1*
