# Aero Responsive Web Expansion — Design Spec
**Date:** 2026-05-17  
**Approach:** B — Stitch layouts as visual reference, rewrite styling/layout while keeping all backend logic intact.

---

## Scope

Redesign all student-facing and vendor-facing screens using Stitch desktop mockups as visual reference. All Supabase auth, Realtime subscriptions, API routes, Zustand cart, and payment logic remain untouched. Only React component markup and Tailwind styling change.

### Out of scope
- Password recovery flow (deferred)
- Vendor profile/settings redesign (deferred)
- Landing page / Welcome screen (current is fine)
- Map screen (Google Maps complexity)

---

## Tech Constraints
- Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Mobile-first (375px base). Stitch mockups are desktop-only (2560px) — adapt to responsive.
- Existing color tokens: student blue `#1A6BFF`, vendor orange `#FF6B00`
- Fonts already loaded: Plus Jakarta Sans, DM Sans

---

## Section 1 — Auth Screens

### Login (`/app/(auth)/login/page.tsx`)
- **Layout:** Two-panel split on desktop (md+). Left panel: dark blue gradient background, Aero logo centered, tagline. Right panel: login form.
- **Mobile:** Single column, form only (left panel hidden).
- **Form:** Email input, password input, "Iniciar sesión" primary button, divider "o continúa con", Google button, Microsoft button, "¿No tienes cuenta? Regístrate" link.
- **Logic:** Zero changes — same Supabase signInWithPassword + OAuth handlers.

### Registro (`/app/(auth)/register/page.tsx`)
- **Layout:** Same two-panel split.
- **Step 1:** Role selection — two large clickable cards: Estudiante (icon + description) / Vendedor (icon + description). Visual progress bar shows Step 1 of 2.
- **Step 2:** Form fields by role. Student: nombre, email, contraseña. Vendor: nombre, email, contraseña, nombre del negocio. Progress bar shows Step 2 of 2.
- **Mobile:** Single column, no left panel.
- **Logic:** Zero changes — same role assignment + Supabase signUp handlers.

---

## Section 2 — Student Screens (Full Rewrite)

### Mis Pedidos (`/app/student/orders/page.tsx`)
- **Layout:** Full-page list with two tabs: "Activos" / "Historial".
- **Card design (Stitch reference):** Each order card shows vendor name + cover, order status badge (color-coded), items summary, total price, date, CTA button ("Ver seguimiento" / "Repetir pedido").
- **Empty state:** "No Orders" screen — illustration + "Aún no tienes pedidos" + "Explorar vendedores" button → `/student/home`.
- **Logic:** Same Supabase query, same status filtering.

### Confirmación (`/app/student/order/[id]/confirmed/page.tsx`)
- **Layout:** Centered success screen. Large checkmark animation (Framer Motion), order number, vendor name, estimated time, "Ver seguimiento" and "Ir al inicio" buttons.
- **Logic:** Zero changes.

### Wallet (`/app/student/wallet/page.tsx`)
- **Layout:** Balance card at top (large number, gradient bg), "Recargar" button. Below: transaction history list with icons (+ green for top-up, - red for purchase), amount, description, date.
- **Logic:** Zero changes.

### Perfil + Settings (`/app/student/profile/page.tsx`)
- **Merge Settings into Profile.** Single page with two sections:
  - **Perfil:** avatar (initials or photo), nombre, email, universidad ID, phone — editable.
  - **Configuración:** push notification toggle, logout button, (future: theme, language).
- **Design:** Card-based sections, clean whitespace, consistent with Stitch Settings mockup.
- **Logic:** Same Supabase profile update + auth signOut.

### Vendor Unavailable
- **Trigger:** When a student navigates to `/student/vendor/[id]` and `vendor.is_open === false`.
- **Implementation:** Conditional render inside the vendor page (not a separate route). Replace page content with: vendor cover image (blurred), vendor name, "Este negocio está cerrado en este momento" message, schedule info (schedule_start → schedule_end), "Volver a explorar" button → `/student/home`.
- **Logic:** `is_open` already fetched server-side — just add conditional branch.

---

## Section 3 — Order Flow (Visual Polish)

### Checkout / Cart (`/app/student/order/new/page.tsx`)
- Polish: sticky bottom total bar, cleaner item cards with quantity controls, vendor header with cover image.

### Payment (`/app/student/order/payment/page.tsx`)
- Polish: payment method cards with icons (Nequi green, Daviplata red, wallet blue, card gray), selected state with border highlight.

### Timeslot (`/app/student/order/timeslot/page.tsx`)
- Polish: time slot grid layout, selected slot with filled pill style.

### Order Tracking (`/app/student/order/[id]/tracking/page.tsx`)
- Polish: vertical stepper progress (pending → confirmed → preparing → ready → delivered), each step with icon + label + timestamp.

### Order Detail (`/app/student/order/[id]` — via orders list)
- Polish: item breakdown table, totals section, vendor info row, status timeline.

---

## Section 4 — Vendor Screens (Visual Polish)

### Seller Dashboard (`/app/vendor/dashboard/page.tsx`)
- Polish: order cards with status columns or vertical list, cleaner status transition buttons, order count badge in header.

### Order Management (`/app/vendor/orders/page.tsx` + `/[id]/page.tsx`)
- Polish: filterable list, detail view with item breakdown and customer info.

### Reports & Analytics (`/app/vendor/reports/page.tsx`)
- Polish: stat cards at top (total sales, order count, avg ticket), bar chart for daily/weekly, top products list.

### Vendor Menu (Doña Carmenza reference) (`/student/vendor/[id]/page.tsx`)
- Polish: hero cover image with gradient overlay, vendor name + rating + schedule in overlay, product grid with card design matching Bandeja Paisa detail mockup.

### Product Detail (Bandeja Paisa reference)
- Polish: when student taps a product → bottom sheet or modal with large image, name, description, price, quantity selector, "Agregar al pedido" button.

---

## Section 5 — ActiveOrderBubble

**Current:** Floating pill at bottom of screen (conflicts with bottom nav on mobile).  
**New position:** Fixed top-right corner on desktop. On mobile: fixed below the top nav (top: 60px, right: 16px) so it doesn't overlap the bottom nav.  
**Visual:** Same pill design but repositioned. Add subtle drop shadow.  
**File:** `/components/shared/ActiveOrderBubble.tsx` — only position CSS changes.

---

## Implementation Order (Priority Batches)

| Batch | Screens | Rationale |
|-------|---------|-----------|
| 1 | Login, Registro | User said these are clearly better in Stitch |
| 2 | ActiveOrderBubble reposition | Quick win, fixes bad UX |
| 3 | Vendor Unavailable | New feature, self-contained |
| 4 | Mis Pedidos + No Orders, Confirmación | High student impact |
| 5 | Wallet, Perfil + Settings | Medium impact |
| 6 | Order flow polish (Checkout, Payment, Timeslot, Tracking, Detail) | Complex flow |
| 7 | Vendor screens polish (Dashboard, Orders, Reports, Menu) | Vendor-side |

---

## Stitch Project Reference
- **Project ID:** `15647814465028622809`
- All screen HTML available via Stitch MCP (`mcp__stitch__get_screen`)
- Visual reference only — do not copy HTML directly (desktop-only, not responsive)
