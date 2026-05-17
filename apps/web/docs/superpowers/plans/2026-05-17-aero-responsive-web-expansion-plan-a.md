# Aero Responsive Web Expansion — Plan A (Auth + Quick Wins)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Login polish, Register two-step flow, reposition ActiveOrderBubble, and build the Vendor page with an Unavailable state.

**Architecture:** Visual-only changes — all Supabase auth logic, API calls, and state management stay untouched. Stitch screens are desktop-only HTML used as visual reference only; we rewrite React/Tailwind components to match the aesthetic responsively.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Lucide React, Supabase SSR.

**Stitch Project:** `15647814465028622809` — fetch any screen HTML via MCP `mcp__stitch__get_screen` for visual reference.

---

## File Map

| Action | File |
|--------|------|
| Modify | `apps/web/app/(auth)/login/page.tsx` |
| Modify | `apps/web/app/(auth)/register/page.tsx` |
| Modify | `apps/web/components/shared/ActiveOrderBubble.tsx` |
| Replace | `apps/web/app/student/vendor/[id]/page.tsx` |
| Create | `apps/web/components/student/VendorUnavailable.tsx` |

---

## Task 1: Login — Visual Polish

**Stitch reference:** screen `fa73da3c11354c7fa9b7068ec360df9a` (Aero - Login)

**Files:**
- Modify: `apps/web/app/(auth)/login/page.tsx`

The current login already has a two-panel split. Improvements:
1. Desktop right panel: wrap form in a white card with shadow instead of transparent background
2. Left panel: upgrade testimonial card to a more polished design with better typography
3. Mobile: improve the brand panel readability with a gradient overlay effect

- [ ] **Step 1: Fetch the Stitch Login HTML for visual reference**

Use `mcp__stitch__get_screen` with `name: "projects/15647814465028622809/screens/fa73da3c11354c7fa9b7068ec360df9a"` to download the HTML. Review the layout, color usage, and card styling. You will NOT copy this HTML — use it only as a visual target.

- [ ] **Step 2: Update the desktop right-panel form wrapper**

In `apps/web/app/(auth)/login/page.tsx`, find the outer `<div className="flex-1 flex flex-col bg-background md:items-center md:justify-center">` and the inner form container. Replace the inner `div` with a white card on desktop:

```tsx
{/* Right side — full on mobile, half on desktop */}
<div className="flex-1 flex flex-col bg-background md:items-center md:justify-center">
  {/* Mobile header */}
  <div className="bg-primary px-6 pt-16 pb-10 text-center md:hidden">
    <p className="font-display font-extrabold italic text-white text-4xl tracking-tight mb-4">Aero</p>
    <h1 className="text-white text-2xl font-display font-bold">Bienvenido de nuevo</h1>
    <p className="text-blue-200 text-sm font-body mt-1">Inicia sesión para continuar</p>
  </div>

  {/* Form area */}
  <div className="flex-1 bg-background px-6 pt-6 pb-8 -mt-4 rounded-t-3xl md:flex-none md:w-full md:max-w-[420px] md:mt-0 md:rounded-2xl md:bg-white md:shadow-lg md:border md:border-border/60 md:px-10 md:py-10">
    <div className="hidden md:block mb-8">
      <h1 className="text-text-primary text-3xl font-display font-bold">Bienvenido de nuevo</h1>
      <p className="text-text-secondary text-sm font-body mt-1.5">Inicia sesión para continuar en Aero</p>
    </div>
    <Suspense>
      <LoginForm />
    </Suspense>
  </div>
</div>
```

- [ ] **Step 3: Upgrade the left panel testimonial card**

Replace the existing testimonial card block inside the left panel with:

```tsx
<div className="mt-10 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left max-w-xs mx-auto">
  <div className="flex items-center gap-2 mb-3">
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#FFD60A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ))}
    </div>
    <span className="text-yellow-300 text-xs font-body">4.9 · 200+ reseñas</span>
  </div>
  <p className="text-white/90 text-sm font-body leading-relaxed italic">
    "Pedí mi almuerzo entre clases y estaba listo en 15 minutos. Increíble."
  </p>
  <div className="flex items-center gap-2 mt-4">
    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
      <span className="text-white text-xs font-bold">M</span>
    </div>
    <p className="text-blue-200 text-xs font-body font-semibold">María · Ingeniería Industrial</p>
  </div>
</div>
```

- [ ] **Step 4: Verify in browser**

Run `cd apps/web && npm run dev` and open `http://localhost:3000/login`. Check:
- Mobile (375px): header + rounded card form, no left panel
- Desktop (1280px): two-panel, right panel shows white card with shadow, form centered

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/(auth)/login/page.tsx
git commit -m "feat: polish login page — white card on desktop, upgraded testimonial"
```

---

## Task 2: Register — Two-Step Flow

**Stitch reference:** screen `7c1c8fd5edd845a3950a8adbaf90d2e6` (Aero - Registration)

**Files:**
- Modify: `apps/web/app/(auth)/register/page.tsx`

Replace the inline role toggle (at top of form) with a Step 1 / Step 2 system:
- **Step 1:** Two large role-selection cards (full page, no form)
- **Step 2:** Registration form with a back button and step indicator

All existing auth logic (`handleRegister`, `handleOAuth`, `handleCoverChange`) stays unchanged. Only the rendering layer changes.

- [ ] **Step 1: Add step state and step-1 role cards**

In `apps/web/app/(auth)/register/page.tsx`, after the existing state declarations, add `const [step, setStep] = useState<1 | 2>(1)`.

Then insert a conditional before the main `return`: if `step === 1`, render the role selection screen:

```tsx
if (step === 1) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-primary flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 text-center">
          <p className="font-display font-extrabold italic text-white text-5xl tracking-tight mb-4">Aero</p>
          <p className="text-blue-200 text-lg font-body">Pide · Paga · Recoge</p>
          <p className="text-blue-300 text-sm font-body mt-3 max-w-xs mx-auto leading-relaxed">
            Únete a la plataforma de comida del campus universitario
          </p>
          <p className="text-blue-300/50 text-xs font-body mt-16">Universidad de La Sabana · Capstone 2026-1</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col bg-background md:items-center md:justify-center">
        {/* Mobile header */}
        <div className="bg-primary px-6 pt-16 pb-10 text-center md:hidden">
          <p className="font-display font-extrabold italic text-white text-4xl tracking-tight mb-4">Aero</p>
          <h1 className="text-white text-2xl font-display font-bold">Crear cuenta</h1>
          <p className="text-blue-200 text-sm font-body mt-1">¿Cómo quieres usar Aero?</p>
        </div>

        <div className="flex-1 bg-background px-6 pt-6 pb-8 -mt-4 rounded-t-3xl md:flex-none md:w-full md:max-w-md md:mt-0 md:rounded-none md:bg-transparent md:px-8 md:py-8">
          <div className="hidden md:block mb-8">
            <h1 className="text-text-primary text-3xl font-display font-bold">Crear cuenta</h1>
            <p className="text-text-secondary text-sm font-body mt-1.5">¿Cómo quieres usar Aero?</p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {/* Student card */}
            <button
              onClick={() => { setRole('student'); setStep(2) }}
              className="w-full text-left bg-white border-2 border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-md active:scale-[0.98] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <GraduationCap size={24} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-text-primary text-base">Soy estudiante</p>
                  <p className="text-text-secondary text-sm font-body mt-0.5">Busca y pide comida de los negocios del campus</p>
                </div>
                <span className="text-text-disabled text-xl mt-1">›</span>
              </div>
            </button>

            {/* Vendor card */}
            <button
              onClick={() => { setRole('vendor'); setStep(2) }}
              className="w-full text-left bg-white border-2 border-border rounded-2xl p-5 hover:border-vendor/50 hover:shadow-md active:scale-[0.98] transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-vendor/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-vendor/15 transition-colors">
                  <Store size={24} className="text-vendor" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-text-primary text-base">Soy vendedor</p>
                  <p className="text-text-secondary text-sm font-body mt-0.5">Gestiona tu negocio y recibe pedidos en tiempo real</p>
                </div>
                <span className="text-text-disabled text-xl mt-1">›</span>
              </div>
            </button>
          </div>

          <p className="text-center text-text-secondary text-sm font-body mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary font-semibold">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add step indicator and back button to step 2 (form view)**

At the top of the existing form area (inside the `md:w-full md:max-w-md` container), before the `h1`, insert a step indicator + back button. Replace the existing `<div className="hidden md:block mb-6">` block with:

```tsx
{/* Step indicator */}
<div className="flex items-center gap-2 mb-6">
  <button
    type="button"
    onClick={() => setStep(1)}
    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
  >
    <ArrowLeft size={16} className="text-text-secondary" />
  </button>
  <div className="flex gap-1.5 mx-auto">
    <div className="w-6 h-1.5 rounded-full bg-gray-200" />
    <div className={cn('w-6 h-1.5 rounded-full', isVendor ? 'bg-vendor' : 'bg-primary')} />
  </div>
</div>

<div className="mb-5">
  <h1 className="text-text-primary text-2xl font-display font-bold">
    {isVendor ? 'Datos de tu negocio' : 'Tus datos'}
  </h1>
  <p className="text-text-secondary text-sm font-body mt-1">
    {isVendor ? 'Crea tu perfil de vendedor en Aero' : 'Completa tu perfil de estudiante'}
  </p>
</div>
```

Also add `ArrowLeft` to the imports at the top: `import { Eye, EyeOff, Mail, Lock, User, Store, GraduationCap, Camera, ArrowLeft } from 'lucide-react'`

And add the mobile header for step 2:

```tsx
{/* Mobile header */}
<div className={cn('px-6 pt-16 pb-10 text-center md:hidden', isVendor ? 'bg-vendor' : 'bg-primary')}>
  <button
    onClick={() => setStep(1)}
    className="absolute top-14 left-4 p-2 rounded-full bg-white/15"
  >
    <ArrowLeft size={18} className="text-white" />
  </button>
  <p className="font-display font-extrabold italic text-white text-4xl tracking-tight mb-4">Aero</p>
  <h1 className="text-white text-2xl font-display font-bold">Crear cuenta</h1>
  <p className={cn('text-sm font-body mt-1', isVendor ? 'text-orange-200' : 'text-blue-200')}>
    {isVendor ? 'Paso 2: Tu negocio' : 'Paso 2: Tus datos'}
  </p>
</div>
```

Note: the outer wrapper for step 2 needs `relative` class for the absolute back button on mobile: change `<div className="px-6 pt-16 pb-10 text-center md:hidden"` to `<div className="relative px-6 pt-16 pb-10 text-center md:hidden"`.

- [ ] **Step 3: Remove the old role toggle from the form**

Delete the existing `<div className="relative bg-gray-100 rounded-xl p-1 flex mb-4">` role toggle block entirely — role is now selected in Step 1.

- [ ] **Step 4: Verify flow in browser**

Open `http://localhost:3000/register`:
- Mobile + Desktop: See role selection cards on Step 1
- Click "Soy estudiante" → advances to Step 2 with student form, progress dots show step 2 filled blue
- Click "Soy vendedor" → advances to Step 2 with vendor form, progress dots show step 2 filled orange
- Back button on Step 2 returns to Step 1
- Submit form → same behavior as before (Supabase signUp + redirect)

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/(auth)/register/page.tsx
git commit -m "feat: register two-step flow — role selection cards + form with progress indicator"
```

---

## Task 3: ActiveOrderBubble — Reposition to Top-Right

**Files:**
- Modify: `apps/web/components/shared/ActiveOrderBubble.tsx`

Current: `fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2` (bottom-center, conflicts with bottom nav on mobile)
New: `fixed top-[68px] right-4 md:top-4 md:right-6` (top-right, below the top nav on mobile)

- [ ] **Step 1: Update the motion.div className**

In `apps/web/components/shared/ActiveOrderBubble.tsx`, replace the `motion.div` props:

```tsx
<motion.div
  initial={{ opacity: 0, y: -12, scale: 0.9 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -12, scale: 0.9 }}
  className="fixed top-[68px] right-4 md:top-4 md:right-6 z-40"
>
```

(Changed: `bottom-20 md:bottom-6 left-1/2 -translate-x-1/2` → `top-[68px] right-4 md:top-4 md:right-6`; animation direction inverted from `y: 16` to `y: -12`)

- [ ] **Step 2: Verify in browser**

Open any student page at `http://localhost:3000/student/home` (or test with an active order). The bubble should appear at the top right, below the top nav on mobile (at ~68px from top), and at top-right corner on desktop. It must NOT overlap the bottom nav.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shared/ActiveOrderBubble.tsx
git commit -m "fix: move ActiveOrderBubble to top-right — no longer overlaps bottom nav"
```

---

## Task 4: Vendor Page + Unavailable State

**Stitch references:**
- Unavailable screen: `5bdcd75eeebf44f7999a1d48737c7f60` (Aero - Unavailable)
- Menu screen: `09ccbc636b6049339fb07169eb0c8d51` (Doña Carmenza - Menu) — already implemented in `/menu/page.tsx`

**Files:**
- Replace: `apps/web/app/student/vendor/[id]/page.tsx` (currently an empty placeholder)
- Create: `apps/web/components/student/VendorUnavailable.tsx`

Current `[id]/page.tsx` returns just `<h1>VendorProfile</h1>`. The real menu is at `/student/vendor/[id]/menu/page.tsx`. The new `[id]/page.tsx` will:
- Fetch vendor server-side
- If `is_open === true` → redirect to `/student/vendor/[id]/menu`
- If `is_open === false` → render the VendorUnavailable component

- [ ] **Step 1: Fetch the Stitch Unavailable screen for reference**

Use `mcp__stitch__get_screen` with `name: "projects/15647814465028622809/screens/5bdcd75eeebf44f7999a1d48737c7f60"`. Note the visual layout: blurred vendor cover, vendor name, closed message, schedule info, CTA button.

- [ ] **Step 2: Create the VendorUnavailable component**

Create `apps/web/components/student/VendorUnavailable.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { Clock, ArrowLeft } from 'lucide-react'

type Props = {
  vendor: {
    business_name: string
    description: string | null
    cover_image_url: string | null
    schedule_start: string | null
    schedule_end: string | null
  }
}

export default function VendorUnavailable({ vendor }: Props) {
  const schedule = vendor.schedule_start && vendor.schedule_end
    ? `${vendor.schedule_start.slice(0, 5)} – ${vendor.schedule_end.slice(0, 5)}`
    : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cover with blur overlay */}
      <div className="relative h-56 overflow-hidden">
        {vendor.cover_image_url ? (
          <img
            src={vendor.cover_image_url}
            alt={vendor.business_name}
            className="w-full h-full object-cover blur-sm scale-105 opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <Link
          href="/student/home"
          className="absolute top-12 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow"
        >
          <ArrowLeft size={20} className="text-text-primary" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center -mt-8">
        <div className="bg-white rounded-card shadow-sm w-full max-w-sm p-6">
          {/* Closed icon */}
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-gray-400" />
          </div>

          <h1 className="text-xl font-display font-bold text-text-primary">
            {vendor.business_name}
          </h1>
          <p className="text-text-secondary font-body text-sm mt-1">
            {vendor.description}
          </p>

          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mt-4">
            <p className="text-orange-800 font-display font-semibold text-sm">
              Cerrado en este momento
            </p>
            {schedule && (
              <p className="text-orange-600 text-xs font-body mt-0.5">
                Horario: {schedule}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/student/home"
          className="mt-6 bg-primary text-white rounded-button px-8 py-3.5 font-display font-semibold"
        >
          Explorar otros negocios
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace the vendor page with a server component**

Overwrite `apps/web/app/student/vendor/[id]/page.tsx` with:

```tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorUnavailable from '@/components/student/VendorUnavailable'

export default async function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, description, cover_image_url, is_open, schedule_start, schedule_end')
    .eq('id', id)
    .single()

  if (!vendor) notFound()

  if (vendor.is_open) {
    redirect(`/student/vendor/${id}/menu`)
  }

  return <VendorUnavailable vendor={vendor} />
}
```

- [ ] **Step 4: Verify in browser**

Test two scenarios:
1. Navigate to a vendor with `is_open = true` → should immediately redirect to `/student/vendor/[id]/menu`
2. Temporarily set a vendor's `is_open = false` in Supabase → navigate to that vendor → should see the Unavailable screen with the blurred cover, business name, schedule, and "Explorar otros negocios" button

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/student/vendor/[id]/page.tsx apps/web/components/student/VendorUnavailable.tsx
git commit -m "feat: vendor page — redirect open vendors to menu, show unavailable screen for closed vendors"
```

---

## Self-Review

**Spec coverage:**
- ✅ Login visual polish (Task 1)
- ✅ Register two-step flow with progress indicator (Task 2)
- ✅ ActiveOrderBubble top-right reposition (Task 3)
- ✅ Vendor Unavailable screen + redirect for open vendors (Task 4)
- ⏭ Mis Pedidos, Confirmación, Wallet, Perfil — covered in Plan B
- ⏭ Order flow, Vendor screens — covered in Plan C

**Placeholder scan:** No TBDs, no TODOs.

**Type consistency:**
- `VendorUnavailable` props type uses `vendor.is_open` for the redirect check in the server component — the prop shape passed to the component does NOT include `is_open` (not needed client-side). ✅
- `createClient` from `@/lib/supabase/server` used in server component. ✅
- `ArrowLeft` imported in register page. ✅

---

## Next Plans

- **Plan B** — Student screens rewrite: Mis Pedidos + empty state, Confirmación polish, Wallet polish, Perfil + Settings merge
- **Plan C** — Order flow + Vendor screens: Checkout, Payment, Timeslot, Tracking, Seller Dashboard, Reports, Order Management
