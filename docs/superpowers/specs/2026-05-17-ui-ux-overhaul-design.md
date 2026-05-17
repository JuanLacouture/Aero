# UI/UX Overhaul — Aero App
**Date:** 2026-05-17  
**Approach:** Design System Upgrade (Option B) — glassmorphism, gradients, Framer Motion micro-animations, consistent blue/orange dual-theme, Aero cursive logo throughout.  
**Scope:** All pages — landing, auth, student flow, vendor flow. No backend changes.

---

## 1. Design System Base

### Shadows (colored, not flat grey)
```
--shadow-blue:  0 4px 24px rgba(26, 107, 255, 0.15)
--shadow-orange: 0 4px 24px rgba(255, 107, 0, 0.15)
--shadow-card:  0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)
```
Add to `tailwind.config.ts` as `boxShadow` extensions.

### Glassmorphism tokens
- Nav/cards: `backdrop-blur-md bg-white/80 border border-white/20`
- Dark panel cards: `bg-white/10 backdrop-blur border border-white/20`

### Gradients
- Student header: `from-[#1A6BFF] to-[#0D4ECC]`
- Vendor header: `from-[#FF6B00] to-[#CC5500]`

### Border radius upgrades
- Cards: `rounded-2xl` (16px)
- Buttons primary: `rounded-xl` (12px)
- Inputs: `rounded-xl` + `ring-2 ring-primary/20` on focus

### Typography
- No font changes — Plus Jakarta Sans (display), DM Sans (body), JetBrains Mono (IDs) already perfect
- Enforce `font-display font-extrabold` on all major headings (currently inconsistent)

### Framer Motion — global patterns
- Page transitions: `initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}`
- Card hover: `whileHover={{ scale:1.02 }}` + shadow upgrade via CSS transition
- Button press: `whileTap={{ scale:0.97 }}`
- Status badge pulse: `animate={{ scale:[1,1.05,1] }} transition={{ repeat:Infinity, duration:1.5 }}`
- Nav dot slide: `layoutId="activeTab"` on indicator

### Logo
- File: `/public/logo-aero.png` (cursive "Aero" blue gradient with swoosh)
- Sizes: navbar `h-7`, landing hero `h-14`, auth panels `h-10`
- On blue/orange backgrounds: `filter: brightness(0) invert(1)` (white version)
- Replaces all "A" square + "AERO" text instances

---

## 2. Landing Page (`/`)

### Navbar (top)
```
[Logo Aero h-7]  ←→  [Iniciar sesión (ghost)]  [Crear cuenta (primary pill)]
```
- Sticky, `bg-white/80 backdrop-blur-md border-b border-gray-100`
- On scroll past hero: adds `shadow-sm`

### Hero Section (2-col desktop, stack mobile)
**Left — Content:**
- Badge pill: `🎓 Universidad de La Sabana` — `bg-blue-50 text-primary rounded-full text-sm font-medium px-3 py-1`
- H1 (Plus Jakarta Sans 800, text-5xl desktop / text-3xl mobile): *"Tu comida universitaria, sin filas"*
- Subtext (DM Sans, text-lg, text-gray-600): *"Pide a los vendedores del campus, paga con tu saldo y recoge cuando esté listo."*
- CTA row: `[Crear cuenta gratis →]` (primary blue) + `[Ya tengo cuenta]` (ghost link)
- Stats row: `500+ estudiantes · 12 vendedores · ⭐ 4.8` — small pill chips

**Right — Visual:**
- Phone mockup CSS: `rounded-[2.5rem] border-8 border-gray-900 shadow-2xl`
- Inside: screenshot-style mock of student home (vendor cards)
- Background: SVG blob gradiente azul difuso + 2 floating badge animations (`"✓ Pedido listo"`, `"⭐ 4.9 Estrella"`)
- Framer: floating badges `animate={{ y: [0,-8,0] }} transition={{ repeat:Infinity, duration:3 }}`

**Animations (entrance):**
- Headline: stagger words with Framer Motion `variants`
- Stats: count-up animation on viewport enter (Framer `useInView`)

### Section 2 — Cómo funciona
- Background: `bg-gray-50`
- 3 steps horizontal (desktop) / vertical (mobile)
- Icon: large emoji or Lucide icon in colored circle
- Steps: `Elige tu vendedor → Paga con tu saldo → Recoge cuando esté listo`
- Scroll reveal: `initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}`

### Section 3 — Dos roles
- Side-by-side cards
- Student card: blue gradient, "Soy estudiante" CTA
- Vendor card: orange gradient, "Soy vendedor" CTA
- Each with 3 bullet features

### Footer
- `bg-gray-900 text-gray-400`
- Logo Aero white + `© 2026 Universidad de La Sabana — Capstone 2026-1`

---

## 3. Auth Pages (Login & Register)

### Shared layout (unchanged structure, visual upgrades)

**Left panel (desktop, blue bg):**
- Logo: `logo-aero.png` white version `h-10` — replaces "A" square
- Headline + subtext: keep existing copy
- Add testimonial card bottom-left:
  ```
  bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4
  "Pedí mi almuerzo entre clases y estaba listo en 15 minutos"
  — María, Ingeniería Industrial ⭐⭐⭐⭐⭐
  ```

**Right panel (form):**
- Logo color version `h-8` at top on mobile only
- Input upgrades: `rounded-xl` + float label pattern + focus `ring-2 ring-primary/20`
- Error state: red border + `AlertCircle` icon inline right
- Password toggle: already exists, keep it

**OAuth buttons:**
- Add real Google SVG logo (inline) + Microsoft SVG logo (inline)
- Style: `border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm`
- Text: `"Continuar con Google"` / `"Continuar con Microsoft"`

**Submit button:**
- `rounded-xl` + Framer Motion loading spinner on submit
- Hover: `filter brightness(1.08)` + `shadow-blue`

**Register — role toggle:**
- Replace radio buttons with animated pill switcher
- `bg-gray-100 rounded-xl p-1` container
- Active pill: `bg-white rounded-lg shadow-sm` with Framer `layoutId` slide

---

## 4. Navigation

### Top Nav — both roles (desktop, `md:flex hidden`)
```
[Logo Aero h-7]  ←→  [Nav links — centered]  ←→  [Avatar + name + badge]
```
- Container: `bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50`
- Active link: pill `bg-primary/10 text-primary font-semibold rounded-full px-4 py-1.5`
- Inactive link: `text-gray-500 hover:text-gray-900 transition-colors`
- Avatar: user photo + `ring-2 ring-primary/20 rounded-full`
- Vendor badge: small orange pill `"Vendedor"` next to name

### Bottom Nav — both roles (mobile, `md:hidden`)
- Container: `bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe`
- Active icon: `scale(1.1)` + label visible + colored dot below (Framer `layoutId="navDot"` slide)
- Inactive icon: `text-gray-400`, label hidden
- Touch feedback: `whileTap={{ scale:0.9 }}`

### Active Order Bubble
- `rounded-2xl shadow-blue` (student) / `shadow-orange` (vendor)
- Pulse ring: `animate={{ scale:[1,1.12,1], opacity:[1,0.6,1] }} transition={{ repeat:Infinity }}`
- Status badge: colored pill inside bubble

---

## 5. Student Home (`/student/home`)

### Header
- Full-width gradient `from-[#1A6BFF] to-[#0D4ECC]`
- Dot pattern overlay: CSS `radial-gradient` subtle
- Greeting: `"Buenos días, [Nombre] 👋"` — Plus Jakarta Sans 700, text-2xl, white
- Subtitle: `"[N] vendedores abiertos ahora"` — white/70 + animated green dot
- User avatar top-right: `ring-2 ring-white/30`
- Bottom: wave clip-path or `pb-8` with overlap setup

### Search Bar
- Overlaps header: `mt-[-1.25rem] mx-4`
- `bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3`
- Search icon (gray) + placeholder `"Buscar vendedores..."` + optional filter button

### Vendor Cards (`VendorCardList`)
**Card structure:**
```
[Cover image — h-36 object-cover rounded-t-2xl]
[Body — rounded-b-2xl bg-white p-4]
  [Name font-display font-600]  [Status badge pill]
  [Rating ⭐ X.X]  [~15 min ⏱]
  [Favorite heart — absolute top-right on image]
```
- Card: `rounded-2xl shadow-card overflow-hidden`
- Framer hover: `whileHover={{ scale:1.02, boxShadow: "var(--shadow-blue)" }}`
- Favorite: `bg-white/80 backdrop-blur rounded-full p-1.5 absolute top-3 right-3`
- Skeleton loader: pulse animation while fetching

### Sections
- `"Abiertos ahora"` — Plus Jakarta Sans 700, text-xl + vendedor count chip
- `"Próximamente"` — same style, cards with `opacity-60 pointer-events-none`
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`

---

## 6. Vendor Dashboard (`/vendor/dashboard`)

### Header
- Gradient `from-[#FF6B00] to-[#CC5500]` full width
- Business name: Plus Jakarta Sans 700 text-2xl white
- Toggle Abierto/Cerrado: animated pill switch in header (white bg, green/gray)
- Stats chips: `bg-white/20 rounded-full px-3 py-1 text-white text-sm`
  - `"12 pedidos hoy"` · `"$85,000"` · `"⭐ 4.8"`

### Stats Cards Row (3 cards)
- `bg-white rounded-2xl shadow-card p-5`
- Icon: large Lucide icon in colored circle (`bg-orange-50 text-orange-500 p-3 rounded-xl`)
- Number: Plus Jakarta Sans 800 text-3xl
- Label: DM Sans text-sm text-gray-500
- Framer entrance: stagger `delay: index * 0.1`

### Active Orders Grid
**Order card:**
```
[Header: #ID (JetBrains Mono)  |  [Status badge]  |  [Timer]]
─────────────────────────────────────────────────────────────
[Customer name · Item summary (truncated)]
─────────────────────────────────────────────────────────────
[Action button — full width, color matches status]
```
- Card: `bg-white rounded-2xl shadow-card border-l-4 border-[statusColor]`
- Status badges:
  - Pendiente: `bg-yellow-100 text-yellow-700` + Framer pulse
  - Confirmado: `bg-blue-100 text-blue-700`
  - Preparando: `bg-orange-100 text-orange-700` + spinning icon
  - Listo: `bg-green-100 text-green-700` + check animation
- Timer: turns red + bold when > 15min
- Action button: `rounded-xl font-semibold` — label/color per status

### Empty State
- Centered illustration (CSS circles) + `"Sin órdenes activas"` + subtitle
- Framer: gentle float animation on illustration

### Responsive
- Mobile: full-width stack
- Desktop: `grid-cols-2 xl:grid-cols-3 gap-4`

---

## 7. Remaining Pages (same system applied)

### Student — Vendor Detail (`/student/vendor/[id]/menu`)
- Hero cover image full-bleed top, vendor info overlay (glassmorphism card)
- Menu items: `rounded-2xl` cards, image left + name/price right
- Add to cart button: `rounded-xl` orange/blue, quantity stepper

### Student — Orders History (`/student/orders`)
- Timeline-style list, each order a `rounded-2xl` card
- Status badge + date + items summary + reorder CTA

### Student — Wallet (`/student/wallet`)
- Balance displayed in large typography, colored background pill
- Transaction history as clean list

### Student — Profile (`/student/profile`)
- Avatar large with edit overlay, sections as `rounded-2xl` cards

### Vendor — Orders (`/vendor/orders`)
- Filterable list by status, same order card component as dashboard
- Tabs for filtering: Todas / Pendientes / Completadas / Canceladas

### Vendor — Menu (`/vendor/menu`)
- Product grid `rounded-2xl` cards with image, name, price, toggle activo
- FAB (floating action button) for "Agregar producto"

### Vendor — Reports (`/vendor/reports`)
- Stats cards + simple charts (existing or recharts if available)
- Date range picker

### Vendor — Profile (`/vendor/profile`)
- Business cover photo full-bleed, glassmorphism overlay for info
- Sections as cards

---

## 8. Implementation Notes

- **No backend changes** — all changes are purely visual/CSS/animation
- **No new dependencies** — Framer Motion, Tailwind, shadcn/ui, Lucide all already installed
- **Logo**: save `logo-aero.png` to `/public/` (user provides PNG)
- **Branch**: `la-cutir` (already created by user)
- **Test each page**: run `npm run dev`, verify responsive at 375px, 768px, 1280px
- **Accessibility**: maintain existing focus states, only enhance visually

---

## 9. File-by-File Change Map

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add colored shadows, extend boxShadow |
| `app/globals.css` | Add shadow CSS vars, glassmorphism utilities |
| `public/logo-aero.png` | Add logo file |
| `app/page.tsx` | Full redesign — landing page |
| `app/(auth)/login/page.tsx` | Logo, inputs, OAuth logos, testimonial card |
| `app/(auth)/register/page.tsx` | Logo, inputs, role toggle pill, OAuth logos |
| `app/student/layout.tsx` | Minor — padding/spacing fixes |
| `app/student/home/page.tsx` | Header gradient, search overlap, section headings |
| `components/student/VendorCardList.tsx` | Card redesign, hover animations, skeleton |
| `components/shared/StudentTopNav.tsx` | Glass nav, active pill, avatar |
| `components/shared/VendorTopNav.tsx` | Glass nav, active pill, vendor badge |
| `components/shared/StudentBottomNav.tsx` | Blur bg, sliding dot, touch feedback |
| `components/shared/VendorBottomNav.tsx` | Same as student bottom nav |
| `components/shared/ActiveOrderBubble.tsx` | rounded-2xl, pulse ring, shadow |
| `app/vendor/layout.tsx` | Minor — bg consistency |
| `app/vendor/dashboard/page.tsx` | Header gradient, stats cards, order cards |
| Remaining student/vendor pages | Apply system: rounded-2xl, shadows, gradients |
