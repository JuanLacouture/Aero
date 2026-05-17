# UI/UX Overhaul — Aero App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every page visually — glassmorphism, colored shadows, Framer Motion micro-animations, Aero cursive logo, mini landing page, and consistent blue/orange dual-theme — without touching any backend logic.

**Architecture:** Pure visual layer — Tailwind config extensions + globals.css utilities + component-level Framer Motion animations. No new dependencies; Framer Motion, Tailwind, shadcn/ui, and Lucide are already installed. All logic, Supabase calls, and routing stay untouched.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3, Framer Motion 11, Lucide React, TypeScript

**Branch:** `la-cutir`

---

## File Change Map

| File | Type | What changes |
|------|------|-------------|
| `apps/web/tailwind.config.ts` | Modify | Add colored box shadows |
| `apps/web/app/globals.css` | Modify | Add shadow CSS vars + glass utility |
| `apps/web/public/logo-aero.png` | Create | Aero cursive logo (user places file) |
| `apps/web/app/page.tsx` | Rewrite | Full landing page |
| `apps/web/app/(auth)/login/page.tsx` | Modify | Logo swap, testimonial card, polish |
| `apps/web/app/(auth)/register/page.tsx` | Modify | Logo swap, animated role toggle, polish |
| `apps/web/components/shared/StudentTopNav.tsx` | Modify | Glass navbar, logo, active pill |
| `apps/web/components/shared/VendorTopNav.tsx` | Modify | Glass navbar, logo, active pill |
| `apps/web/components/shared/StudentBottomNav.tsx` | Modify | Blur bg, sliding dot, touch feedback |
| `apps/web/components/shared/VendorBottomNav.tsx` | Modify | Blur bg, sliding dot, touch feedback |
| `apps/web/components/shared/ActiveOrderBubble.tsx` | Modify | rounded-2xl, pulse ring, shadow |
| `apps/web/app/student/home/page.tsx` | Modify | Gradient header, search bar, section styles |
| `apps/web/components/student/VendorCardList.tsx` | Modify | Card redesign, hover animations, grid |
| `apps/web/app/vendor/dashboard/page.tsx` | Modify | Gradient header, stats cards, order cards |

---

## Task 1: Design System Foundation

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Extend tailwind.config.ts with colored shadows**

Replace the `plugins: []` block and add `boxShadow` to the theme extend:

```ts
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
          background: '#FFF8F5',
        },
        accent: '#00C9A7',
        warning: '#FF9500',
        error: '#FF3B30',
        success: '#34C759',
        surface: '#FFFFFF',
        background: '#F5F7FA',
        'text-primary': '#1C1C1E',
        'text-secondary': '#6E6E73',
        'text-disabled': '#AEAEB2',
        border: '#E5E5EA',
        overlay: 'rgba(0,0,0,0.4)',
        status: {
          available: '#34C759',
          busy: '#FF9500',
          unavailable: '#FF3B30',
          pending: '#FFD60A',
        },
      },
      fontFamily: {
        display: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        md: ['17px', { lineHeight: '24px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['24px', { lineHeight: '32px' }],
        '2xl': ['28px', { lineHeight: '36px' }],
        '3xl': ['34px', { lineHeight: '42px' }],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        blue: '0 4px 24px rgba(26, 107, 255, 0.18)',
        'blue-lg': '0 8px 40px rgba(26, 107, 255, 0.22)',
        orange: '0 4px 24px rgba(255, 107, 0, 0.18)',
        'orange-lg': '0 8px 40px rgba(255, 107, 0, 0.22)',
        card: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        nav: '0 -4px 24px rgba(0,0,0,0.06)',
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Add CSS vars and glass utility to globals.css**

Append after the existing `:root` block and before `.dark`:

```css
/* apps/web/app/globals.css — append these lines after the existing :root closing brace */

/* Colored shadows */
:root {
  --shadow-blue: 0 4px 24px rgba(26, 107, 255, 0.18);
  --shadow-orange: 0 4px 24px rgba(255, 107, 0, 0.18);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
}

/* Glass utility */
@layer utilities {
  .glass {
    @apply backdrop-blur-md bg-white/80 border border-white/20;
  }
  .glass-dark {
    @apply backdrop-blur-md bg-white/10 border border-white/20;
  }
}
```

- [ ] **Step 3: Verify no build errors**

```bash
cd apps/web && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/tailwind.config.ts apps/web/app/globals.css
git commit -m "feat(design): add colored shadows and glass utilities to design system"
```

---

## Task 2: Add Aero Logo Asset

**Files:**
- Create: `apps/web/public/logo-aero.png`

- [ ] **Step 1: Place the logo**

Copy the `logo-aero.png` file the user provided into `apps/web/public/logo-aero.png`.

The file should be the cursive "Aero" wordmark in blue gradient with a swoosh underline, on a transparent background (or white — either works).

- [ ] **Step 2: Verify asset is served**

Start dev server (`npm run dev` in `apps/web`) and open `http://localhost:3000/logo-aero.png` in the browser.
Expected: logo image appears.

- [ ] **Step 3: Commit**

```bash
git add apps/web/public/logo-aero.png
git commit -m "feat(assets): add Aero cursive logo"
```

---

## Task 3: Landing Page Redesign (`app/page.tsx`)

**Files:**
- Rewrite: `apps/web/app/page.tsx`

- [ ] **Step 1: Rewrite the landing page**

```tsx
// apps/web/app/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingBag, CreditCard, Package, Star, Users, Store } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/logo-aero.png" alt="Aero" width={80} height={32} className="h-8 w-auto" priority />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-display font-semibold text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-display font-bold bg-primary text-white rounded-xl px-4 py-2 hover:brightness-110 transition-all shadow-blue"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-primary/8 text-primary text-sm font-display font-semibold px-4 py-1.5 rounded-full">
                🎓 Universidad de La Sabana
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-gray-900 leading-[1.1] tracking-tight"
            >
              Tu comida universitaria,{' '}
              <span className="text-primary">sin filas</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-gray-500 font-body leading-relaxed max-w-md"
            >
              Pide a los vendedores del campus, paga con tu saldo y recoge cuando esté listo.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-display font-bold rounded-xl px-6 py-3.5 text-base shadow-blue hover:brightness-110 active:scale-[0.97] transition-all"
              >
                Crear cuenta gratis →
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-gray-600 font-display font-semibold rounded-xl px-6 py-3.5 text-base border border-gray-200 hover:bg-gray-50 active:scale-[0.97] transition-all"
              >
                Ya tengo cuenta
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 pt-2">
              {[
                { value: '500+', label: 'estudiantes' },
                { value: '12', label: 'vendedores' },
                { value: '4.8★', label: 'promedio' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <span className="text-sm font-display font-bold text-gray-900">{stat.value}</span>
                  <span className="text-sm text-gray-400 font-body">{stat.label}</span>
                  <span className="text-gray-200 ml-2">·</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex items-center justify-center relative"
          >
            {/* Blob background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-[3rem] blur-3xl scale-110" />

            {/* Phone */}
            <div className="relative w-64 bg-white rounded-[2.5rem] border-8 border-gray-900 shadow-2xl overflow-hidden">
              {/* Status bar */}
              <div className="bg-primary px-4 pt-3 pb-4">
                <p className="text-white/70 text-[10px] font-body">Buenos días, María 👋</p>
                <p className="text-white text-sm font-display font-bold mt-0.5">3 vendedores disponibles</p>
              </div>
              {/* Mock cards */}
              {['Café Campus', 'Arepas y Más', 'Sandwich Co.'].map((name, i) => (
                <div key={name} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    i === 0 ? 'bg-amber-100' : i === 1 ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {i === 0 ? '☕' : i === 1 ? '🫓' : '🥪'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-display font-semibold text-gray-900">{name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={9} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-gray-400">4.{8 - i}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                    Abierto
                  </span>
                </div>
              ))}
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute top-8 -right-4 bg-white rounded-2xl shadow-card px-3 py-2 flex items-center gap-2"
            >
              <span className="text-success text-sm">✓</span>
              <span className="text-xs font-display font-semibold text-gray-900">¡Pedido listo!</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-12 -left-6 bg-white rounded-2xl shadow-card px-3 py-2 flex items-center gap-1.5"
            >
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-display font-semibold text-gray-900">4.9 Estrella</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-extrabold text-gray-900">Cómo funciona</h2>
            <p className="text-gray-500 font-body mt-2">Tres pasos y ya tienes tu pedido</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Store, step: '01', title: 'Elige tu vendedor', desc: 'Explora los vendedores del campus y su menú del día', color: 'bg-blue-100 text-primary' },
              { icon: CreditCard, step: '02', title: 'Paga con tu saldo', desc: 'Usa tu billetera Aero para pagar de forma segura y rápida', color: 'bg-purple-100 text-purple-600' },
              { icon: Package, step: '03', title: 'Recoge cuando esté listo', desc: 'Te avisamos cuando tu pedido esté listo para recoger', color: 'bg-green-100 text-green-600' },
            ].map(({ icon: Icon, step, title, desc, color }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-card"
              >
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <span className="text-xs font-mono text-gray-400 font-semibold">{step}</span>
                <h3 className="text-base font-display font-bold text-gray-900 mt-1">{title}</h3>
                <p className="text-sm text-gray-500 font-body mt-1.5 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-8 text-white"
            >
              <Users size={28} className="mb-4 opacity-90" />
              <h3 className="text-xl font-display font-extrabold mb-2">Para estudiantes</h3>
              <ul className="text-blue-100 font-body text-sm space-y-2 mb-6">
                <li>✓ Explora vendedores del campus</li>
                <li>✓ Paga con billetera digital</li>
                <li>✓ Sigue tu pedido en tiempo real</li>
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-primary font-display font-bold rounded-xl px-5 py-2.5 text-sm hover:shadow-lg transition-all"
              >
                Soy estudiante →
              </Link>
            </motion.div>

            {/* Vendor */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-vendor to-vendor-dark rounded-2xl p-8 text-white"
            >
              <ShoppingBag size={28} className="mb-4 opacity-90" />
              <h3 className="text-xl font-display font-extrabold mb-2">Para vendedores</h3>
              <ul className="text-orange-100 font-body text-sm space-y-2 mb-6">
                <li>✓ Gestiona pedidos en tiempo real</li>
                <li>✓ Administra tu menú fácilmente</li>
                <li>✓ Reportes de ventas e ingresos</li>
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-vendor font-display font-bold rounded-xl px-5 py-2.5 text-sm hover:shadow-lg transition-all"
              >
                Soy vendedor →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Image src="/logo-aero.png" alt="Aero" width={72} height={28} className="h-7 w-auto brightness-0 invert opacity-80" />
          <p className="text-gray-500 text-sm font-body text-center">
            © 2026 Universidad de La Sabana · Capstone 2026-1
          </p>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

Run `npm run dev` in `apps/web`. Open `http://localhost:3000`.
Check:
- Navbar sticky glass effect
- Hero text + CTA buttons render
- Phone mockup visible on desktop (hidden on mobile)
- Floating badges animate
- "Cómo funciona" section visible on scroll
- Two role cards visible
- Footer with logo

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(landing): redesign splash as mini landing page with hero, how-it-works, and role cards"
```

---

## Task 4: Login Page Polish (`app/(auth)/login/page.tsx`)

**Files:**
- Modify: `apps/web/app/(auth)/login/page.tsx`

- [ ] **Step 1: Replace the "A" logo with Aero image on the left panel**

Find this block in `LoginPage` (around line 203):
```tsx
<div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
  <span className="text-primary text-4xl font-display font-extrabold">A</span>
</div>
<h1 className="text-white text-4xl font-display font-extrabold tracking-tight">Aero</h1>
```

Replace with:
```tsx
<Image
  src="/logo-aero.png"
  alt="Aero"
  width={160}
  height={64}
  className="h-14 w-auto mx-auto mb-6 brightness-0 invert"
  priority
/>
```

Add `import Image from 'next/image'` at the top.

- [ ] **Step 2: Add testimonial card to left panel**

After the `<p className="text-blue-300/50 ...">` line (the footer text inside left panel), add:

```tsx
<div className="mt-12 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left max-w-xs mx-auto">
  <div className="flex gap-0.5 mb-3">
    {[1,2,3,4,5].map(i => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FFD60A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    ))}
  </div>
  <p className="text-white/90 text-sm font-body leading-relaxed italic">
    "Pedí mi almuerzo entre clases y estaba listo en 15 minutos"
  </p>
  <p className="text-blue-300 text-xs font-body mt-3 font-semibold">
    — María, Ingeniería Industrial
  </p>
</div>
```

- [ ] **Step 3: Replace mobile "A" logo with Aero image**

Find the mobile header block (around line 221):
```tsx
<div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow">
  <span className="text-primary text-2xl font-display font-extrabold">A</span>
</div>
```

Replace with:
```tsx
<Image
  src="/logo-aero.png"
  alt="Aero"
  width={100}
  height={40}
  className="h-10 w-auto mx-auto mb-4"
  priority
/>
```

- [ ] **Step 4: Verify visually**

Open `http://localhost:3000/login`.
Check:
- Desktop: logo cursivo white on left panel, testimonial card at bottom
- Mobile: logo in color on blue header
- Form inputs, error states, OAuth buttons unchanged and functional

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\(auth\)/login/page.tsx
git commit -m "feat(auth): swap logo and add testimonial card to login page"
```

---

## Task 5: Register Page Polish (`app/(auth)/register/page.tsx`)

**Files:**
- Modify: `apps/web/app/(auth)/register/page.tsx`

- [ ] **Step 1: Read the current register page**

Read `apps/web/app/(auth)/register/page.tsx` to identify:
1. Where the "A" logo appears (left panel + mobile header)
2. Where the role toggle (student/vendor) is rendered

- [ ] **Step 2: Swap "A" logos for Aero image**

Apply the same logo swap as Task 4:
- Left panel desktop: replace `<div w-24 ...><span>A</span></div>` + `<h1>Aero</h1>` with `<Image src="/logo-aero.png" ... className="h-14 w-auto mx-auto mb-6 brightness-0 invert" />`
- Mobile header: replace `<div w-16 ...><span>A</span></div>` with `<Image src="/logo-aero.png" ... className="h-10 w-auto mx-auto mb-4" />`
- Add `import Image from 'next/image'` at top

- [ ] **Step 3: Add animated role toggle**

Find the role selection UI (will look something like radio buttons or two buttons for "Estudiante" / "Vendedor"). Replace it with:

```tsx
// Add at top of file:
import { motion } from 'framer-motion'

// Replace the role toggle section with:
<div className="relative bg-gray-100 rounded-xl p-1 flex mb-4">
  <motion.div
    layoutId="rolePill"
    className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
    style={{ width: 'calc(50% - 4px)', left: role === 'student' ? '4px' : 'calc(50%)' }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
  />
  <button
    type="button"
    onClick={() => setRole('student')}
    className={`relative flex-1 py-2 text-sm font-display font-semibold rounded-lg transition-colors z-10 ${
      role === 'student' ? 'text-text-primary' : 'text-text-secondary'
    }`}
  >
    Estudiante
  </button>
  <button
    type="button"
    onClick={() => setRole('vendor')}
    className={`relative flex-1 py-2 text-sm font-display font-semibold rounded-lg transition-colors z-10 ${
      role === 'vendor' ? 'text-text-primary' : 'text-text-secondary'
    }`}
  >
    Vendedor
  </button>
</div>
```

Note: The exact variable name for the role state may differ — read the file first (Step 1) and match the existing variable name.

- [ ] **Step 4: Add testimonial card to left panel (same as login)**

After the university footer text in the left panel, add:
```tsx
<div className="mt-12 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left max-w-xs mx-auto">
  <div className="flex gap-0.5 mb-3">
    {[1,2,3,4,5].map(i => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FFD60A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    ))}
  </div>
  <p className="text-white/90 text-sm font-body leading-relaxed italic">
    "Ya llevamos un semestre usando Aero — mis ventas subieron un 40%"
  </p>
  <p className="text-blue-300 text-xs font-body mt-3 font-semibold">
    — Carlos, Café Campus
  </p>
</div>
```

- [ ] **Step 5: Verify visually**

Open `http://localhost:3000/register`.
Check:
- Logo cursivo on left panel and mobile header
- Role toggle slides smoothly between Estudiante / Vendedor
- Form fields, image upload, OAuth still work

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/\(auth\)/register/page.tsx
git commit -m "feat(auth): swap logo, animated role toggle, and testimonial on register page"
```

---

## Task 6: Student Top Nav (`components/shared/StudentTopNav.tsx`)

**Files:**
- Modify: `apps/web/components/shared/StudentTopNav.tsx`

- [ ] **Step 1: Upgrade to glass nav with Aero logo and centered links**

```tsx
// apps/web/components/shared/StudentTopNav.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Heart, ClipboardList, Wallet, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/student/home', icon: Home, label: 'Inicio' },
  { href: '/student/favorites', icon: Heart, label: 'Favoritos' },
  { href: '/student/orders', icon: ClipboardList, label: 'Mis pedidos' },
  { href: '/student/wallet', icon: Wallet, label: 'Cartera' },
  { href: '/student/profile', icon: User, label: 'Perfil' },
]

export default function StudentTopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-6 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Logo */}
      <Link href="/student/home" className="shrink-0 mr-10">
        <Image src="/logo-aero.png" alt="Aero" width={80} height={32} className="h-7 w-auto" />
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-display font-semibold transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify visually**

Open `http://localhost:3000/student/home` at ≥768px width.
Check:
- Logo cursivo left
- Nav links with pill background on active
- Glass blur effect on scroll

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shared/StudentTopNav.tsx
git commit -m "feat(nav): glass student top nav with Aero logo and active pill"
```

---

## Task 7: Vendor Top Nav (`components/shared/VendorTopNav.tsx`)

**Files:**
- Modify: `apps/web/components/shared/VendorTopNav.tsx`

- [ ] **Step 1: Upgrade to glass nav — orange theme**

```tsx
// apps/web/components/shared/VendorTopNav.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/vendor/orders', icon: ClipboardList, label: 'Pedidos' },
  { href: '/vendor/menu', icon: UtensilsCrossed, label: 'Menú' },
  { href: '/vendor/reports', icon: BarChart2, label: 'Reportes' },
  { href: '/vendor/profile', icon: User, label: 'Perfil' },
]

export default function VendorTopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-6 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Logo + badge */}
      <Link href="/vendor/dashboard" className="shrink-0 mr-10 flex items-center gap-3">
        <Image src="/logo-aero.png" alt="Aero" width={80} height={32} className="h-7 w-auto" />
        <span className="text-vendor text-xs font-body font-semibold bg-vendor/10 px-2.5 py-1 rounded-full">
          Vendedor
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-display font-semibold transition-all duration-200',
                active
                  ? 'bg-vendor/10 text-vendor'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify visually**

Open `http://localhost:3000/vendor/dashboard` at ≥768px.
Check:
- Logo cursivo + "Vendedor" orange badge
- Active link has orange pill background
- Glass blur identical to student nav

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shared/VendorTopNav.tsx
git commit -m "feat(nav): glass vendor top nav with Aero logo and orange active pill"
```

---

## Task 8: Student Bottom Nav (`components/shared/StudentBottomNav.tsx`)

**Files:**
- Modify: `apps/web/components/shared/StudentBottomNav.tsx`

- [ ] **Step 1: Add blur background, sliding dot, touch feedback**

```tsx
// apps/web/components/shared/StudentBottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, ClipboardList, Wallet, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/student/home', icon: Home, label: 'Inicio' },
  { href: '/student/favorites', icon: Heart, label: 'Favoritos' },
  { href: '/student/orders', icon: ClipboardList, label: 'Pedidos' },
  { href: '/student/wallet', icon: Wallet, label: 'Cartera' },
  { href: '/student/profile', icon: User, label: 'Perfil' },
]

export default function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-nav pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative"
            >
              <motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(active ? 'text-primary' : 'text-gray-400')}
                />
              </motion.div>
              <span className={cn(
                'text-xs font-body',
                active ? 'font-semibold text-primary' : 'font-normal text-gray-400'
              )}>
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="studentNavDot"
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify on mobile viewport (375px)**

Resize browser to 375px wide. Check:
- Nav visible at bottom with glass blur
- Active icon blue, inactive gray
- Blue dot slides between tabs on navigation

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shared/StudentBottomNav.tsx
git commit -m "feat(nav): blur background, sliding dot indicator on student bottom nav"
```

---

## Task 9: Vendor Bottom Nav (`components/shared/VendorBottomNav.tsx`)

**Files:**
- Modify: `apps/web/components/shared/VendorBottomNav.tsx`

- [ ] **Step 1: Read current VendorBottomNav**

Read `apps/web/components/shared/VendorBottomNav.tsx` to confirm its structure mirrors StudentBottomNav.

- [ ] **Step 2: Apply same pattern as Task 8 with orange theme**

Replace the entire file content:

```tsx
// apps/web/components/shared/VendorBottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart2, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/vendor/orders', icon: ClipboardList, label: 'Pedidos' },
  { href: '/vendor/menu', icon: UtensilsCrossed, label: 'Menú' },
  { href: '/vendor/reports', icon: BarChart2, label: 'Reportes' },
  { href: '/vendor/profile', icon: User, label: 'Perfil' },
]

export default function VendorBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-nav pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative"
            >
              <motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(active ? 'text-vendor' : 'text-gray-400')}
                />
              </motion.div>
              <span className={cn(
                'text-xs font-body',
                active ? 'font-semibold text-vendor' : 'font-normal text-gray-400'
              )}>
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="vendorNavDot"
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-vendor rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Verify on mobile viewport**

Open `/vendor/dashboard` at 375px. Check: orange active color, dot slides, blur background.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/shared/VendorBottomNav.tsx
git commit -m "feat(nav): blur background and sliding dot on vendor bottom nav"
```

---

## Task 10: Active Order Bubble (`components/shared/ActiveOrderBubble.tsx`)

**Files:**
- Modify: `apps/web/components/shared/ActiveOrderBubble.tsx`

- [ ] **Step 1: Upgrade to rounded-2xl with pulse ring and shadow**

```tsx
// apps/web/components/shared/ActiveOrderBubble.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pedido pendiente',
  confirmed: 'Pedido confirmado',
  preparing: 'Preparando tu pedido',
  ready: '¡Tu pedido está listo!',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-primary',
  preparing: 'bg-orange-500',
  ready: 'bg-success',
}

type ActiveOrder = { id: string; status: string }

export default function ActiveOrderBubble() {
  const [order, setOrder] = useState<ActiveOrder | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function fetchActive(userId: string) {
      const { data } = await supabase
        .from('orders')
        .select('id, status')
        .eq('student_id', userId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) setOrder(data ?? null)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      await fetchActive(user.id)
      if (cancelled) return
      channel = supabase
        .channel(`active-order-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `student_id=eq.${user.id}` }, () => fetchActive(user.id))
        .subscribe()
    }

    init()
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  if (!order) return null

  const bgColor = STATUS_COLORS[order.status] ?? 'bg-primary'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.9 }}
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <Link
        href={`/student/order/${order.id}/tracking`}
        className={`flex items-center gap-2.5 shadow-blue rounded-2xl px-5 py-3 whitespace-nowrap ${bgColor} text-white`}
      >
        {/* Pulse ring */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60"
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <ShoppingBag size={15} className="shrink-0" />
        <span className="text-sm font-display font-semibold">
          {STATUS_LABELS[order.status] ?? 'Pedido activo'}
        </span>
      </Link>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify**

With an active order in the DB, open `/student/home`. Check: bubble appears with pulse ring, color matches status, rounded-2xl shape.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shared/ActiveOrderBubble.tsx
git commit -m "feat(ui): upgrade active order bubble with Framer entrance and pulse ring"
```

---

## Task 11: Student Home Page (`app/student/home/page.tsx`)

**Files:**
- Modify: `apps/web/app/student/home/page.tsx`

- [ ] **Step 1: Add gradient header with search bar overlap**

```tsx
// apps/web/app/student/home/page.tsx
import { createClient } from '@/lib/supabase/server'
import VendorCardList from '@/components/student/VendorCardList'
import { Search } from 'lucide-react'

export default async function StudentHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, vendorsRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase.from('vendors')
      .select('id, business_name, description, cover_image_url, rating_avg, rating_count, is_open, schedule_start, schedule_end')
      .order('is_open', { ascending: false })
      .order('rating_avg', { ascending: false }),
  ])

  const firstName = profileRes.data?.full_name?.split(' ')[0] ?? 'estudiante'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const vendors = vendorsRes.data ?? []
  const openVendors = vendors.filter(v => v.is_open)
  const closedVendors = vendors.filter(v => !v.is_open)

  return (
    <div className="min-h-screen">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark px-4 md:px-8 pt-8 pb-12 relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-primary-light text-xs font-body mb-1 tracking-widest uppercase opacity-80">
            AERO · La Sabana
          </p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-white text-2xl md:text-3xl font-display font-extrabold">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-blue-200 text-sm font-body mt-1 flex items-center gap-2">
                {openVendors.length > 0 ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    {openVendors.length} vendedor{openVendors.length > 1 ? 'es' : ''} disponible{openVendors.length > 1 ? 's' : ''} ahora
                  </>
                ) : 'No hay vendedores activos en este momento'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar — overlaps header */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto -mt-5 relative z-10 mb-2">
        <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3">
          <Search size={18} className="text-gray-400 shrink-0" />
          <span className="text-gray-400 text-sm font-body">Buscar vendedores...</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-5 max-w-7xl mx-auto">
        {openVendors.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-extrabold text-gray-900">
                Abiertos ahora
              </h2>
              <span className="text-xs font-body text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {openVendors.length}
              </span>
            </div>
            <VendorCardList vendors={openVendors} />
          </>
        )}

        {closedVendors.length > 0 && (
          <div className={openVendors.length > 0 ? 'mt-8' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-extrabold text-gray-900">
                Próximamente
              </h2>
              <span className="text-xs font-body text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {closedVendors.length}
              </span>
            </div>
            <VendorCardList vendors={closedVendors} dimmed />
          </div>
        )}

        {vendors.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="font-display font-semibold text-gray-900 text-lg">Sin vendedores aún</p>
            <p className="text-gray-500 text-sm font-body mt-1">Pronto habrá opciones disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

Open `/student/home`. Check:
- Gradient header with dot pattern
- Animated green dot next to "N vendedores disponibles"
- Search bar overlaps header with negative margin
- Section titles larger and bolder
- Count chips next to section titles

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/student/home/page.tsx
git commit -m "feat(student): gradient header, dot pattern, search bar overlap, section redesign"
```

---

## Task 12: Vendor Card List (`components/student/VendorCardList.tsx`)

**Files:**
- Modify: `apps/web/components/student/VendorCardList.tsx`

- [ ] **Step 1: Redesign cards with hover animation and better grid**

```tsx
// apps/web/components/student/VendorCardList.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Clock, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type VendorRow = {
  id: string
  business_name: string
  description: string | null
  cover_image_url: string | null
  rating_avg: number | null
  rating_count: number | null
  is_open: boolean | null
  schedule_start: string | null
  schedule_end: string | null
}

function formatSchedule(start: string | null, end: string | null) {
  if (!start || !end) return null
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-card animate-pulse">
      <div className="h-36 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function VendorCardList({
  vendors,
  dimmed,
}: {
  vendors: VendorRow[]
  dimmed?: boolean
}) {
  const [favMap, setFavMap] = useState<Map<string, string>>(new Map())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoaded(true); return }
      supabase
        .from('favorites')
        .select('id, vendor_id')
        .eq('student_id', user.id)
        .then(({ data }) => {
          if (data) setFavMap(new Map(data.map(f => [f.vendor_id as string, f.id as string])))
          setLoaded(true)
        })
    })
  }, [])

  async function toggleFav(e: React.MouseEvent, vendorId: string) {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existingId = favMap.get(vendorId)
    if (existingId) {
      setFavMap(prev => { const next = new Map(prev); next.delete(vendorId); return next })
      await supabase.from('favorites').delete().eq('id', existingId)
    } else {
      const { data, error } = await supabase
        .from('favorites')
        .insert({ student_id: user.id, vendor_id: vendorId })
        .select('id')
        .single()
      if (!error && data) {
        setFavMap(prev => new Map(prev).set(vendorId, data.id as string))
      }
    }
  }

  if (!loaded) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', dimmed && 'opacity-60')}>
      {vendors.map((vendor, i) => {
        const schedule = formatSchedule(vendor.schedule_start, vendor.schedule_end)
        const isFav = favMap.has(vendor.id)

        return (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={!dimmed ? { scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } : {}}
          >
            <Link href={`/student/vendor/${vendor.id}/menu`}>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer transition-shadow">
                {/* Cover image */}
                <div className="h-36 bg-primary-light relative">
                  {vendor.cover_image_url ? (
                    <img
                      src={vendor.cover_image_url}
                      alt={vendor.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-4xl opacity-50">🍽️</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={cn(
                    'absolute top-2.5 left-2.5 text-xs font-display font-semibold px-2.5 py-1 rounded-full',
                    vendor.is_open
                      ? 'bg-success text-white'
                      : 'bg-gray-900/60 text-white backdrop-blur-sm'
                  )}>
                    {vendor.is_open ? 'Abierto' : 'Cerrado'}
                  </span>

                  {/* Favorite button */}
                  <motion.button
                    onClick={e => toggleFav(e, vendor.id)}
                    whileTap={{ scale: 0.85 }}
                    className="absolute top-2.5 right-2.5 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm"
                  >
                    <Heart
                      size={16}
                      className={isFav ? 'text-red-500 fill-red-500' : 'text-gray-500'}
                    />
                  </motion.button>
                </div>

                {/* Card body */}
                <div className="p-3.5">
                  <h3 className="font-display font-bold text-gray-900 text-sm leading-tight truncate">
                    {vendor.business_name}
                  </h3>
                  {vendor.description && (
                    <p className="text-gray-400 text-xs font-body mt-0.5 line-clamp-1">
                      {vendor.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2.5 mt-2">
                    <div className="flex items-center gap-0.5">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-display font-semibold text-gray-900">
                        {vendor.rating_avg?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    {schedule && (
                      <div className="flex items-center gap-0.5">
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-xs text-gray-400 font-body">{schedule}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

Open `/student/home`. Check:
- Cards are `rounded-2xl` with proper shadow
- Cover image fills top of card
- Status badge top-left, heart top-right
- Hover lifts card slightly
- Skeleton shows while favs load
- 2 cols mobile, 3 cols md, 4 cols lg

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/student/VendorCardList.tsx
git commit -m "feat(student): redesign vendor cards with hover animation, skeleton loader, and grid upgrade"
```

---

## Task 13: Vendor Dashboard (`app/vendor/dashboard/page.tsx`)

**Files:**
- Modify: `apps/web/app/vendor/dashboard/page.tsx`

- [ ] **Step 1: Upgrade header to gradient with stats inline**

Find the `<div className="bg-vendor ...">` header block and replace:

```tsx
{/* Header */}
<div className="bg-gradient-to-br from-vendor to-vendor-dark px-4 md:px-8 pt-8 pb-6 relative overflow-hidden">
  {/* Dot pattern */}
  <div
    className="absolute inset-0 opacity-[0.07] pointer-events-none"
    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
  />
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-orange-200 text-xs font-body uppercase tracking-widest opacity-80">AERO Vendedor</p>
        <h1 className="text-white text-2xl md:text-3xl font-display font-extrabold mt-0.5">
          Hola, {firstName} 👋
        </h1>
      </div>
      {/* Open toggle */}
      <button
        onClick={toggleOpen}
        disabled={togglingOpen}
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all font-display font-semibold text-sm',
          vendor?.is_open
            ? 'bg-white text-vendor shadow-sm'
            : 'bg-white/20 text-white/70'
        )}
      >
        <span className={cn(
          'w-2.5 h-2.5 rounded-full',
          vendor?.is_open ? 'bg-success' : 'bg-white/40'
        )} />
        {vendor?.is_open ? 'Abierto' : 'Cerrado'}
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Upgrade StatCard component to standalone white cards**

Replace the `StatCard` function:

```tsx
function StatCard({ icon: Icon, value, label, color }: {
  icon: React.ElementType
  value: string
  label: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-display font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="text-xs font-body text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}
```

Update the stat cards render in the dashboard (replace the existing `<div className="grid grid-cols-3 ...">` inline stat cards):

```tsx
{/* Stats row — below header */}
<div className="px-4 md:px-8 py-4 max-w-7xl mx-auto">
  <div className="grid grid-cols-3 gap-3 mb-6">
    <StatCard icon={ShoppingBag} value={String(todayOrders)} label="Pedidos hoy" color="bg-orange-100 text-vendor" />
    <StatCard icon={TrendingUp} value={fmt(todayRevenue)} label="Ingresos" color="bg-green-100 text-success" />
    <StatCard icon={Star} value={vendor?.rating_avg?.toFixed(1) ?? '—'} label="Calificación" color="bg-yellow-100 text-yellow-600" />
  </div>
  {/* ... rest of orders section */}
</div>
```

- [ ] **Step 3: Upgrade OrderCard component**

Replace the `OrderCard` function:

```tsx
function OrderCard({ order, onStatusChange }: {
  order: Order
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const [updating, setUpdating] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: 'confirmed', confirmed: 'preparing', preparing: 'ready',
  }
  const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
    pending: 'Confirmar pedido', confirmed: 'Iniciar preparación', preparing: 'Marcar como listo',
  }
  const NEXT_COLORS: Partial<Record<OrderStatus, string>> = {
    pending: 'bg-yellow-500 hover:bg-yellow-600',
    confirmed: 'bg-blue-500 hover:bg-blue-600',
    preparing: 'bg-vendor hover:bg-vendor-dark',
  }
  const LEFT_BORDER: Record<string, string> = {
    pending: 'border-yellow-400',
    confirmed: 'border-blue-400',
    preparing: 'border-orange-400',
    ready: 'border-green-400',
  }

  const nextStatus = NEXT[order.status ?? 'pending']
  const createdAt = order.created_at ? new Date(order.created_at) : null

  useEffect(() => {
    if (!createdAt) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - createdAt.getTime()) / 60000))
    }, 30000)
    setElapsed(Math.floor((Date.now() - createdAt.getTime()) / 60000))
    return () => clearInterval(interval)
  }, [order.created_at])

  async function advance() {
    if (!nextStatus) return
    setUpdating(true)
    const res = await fetch(`/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (res.ok) onStatusChange(order.id, nextStatus)
    setUpdating(false)
  }

  const itemsSummary = order.order_items
    .map(i => `${i.products?.name ?? 'Plato'} ×${i.quantity}`)
    .join(', ')

  const customerName = order.students?.profiles?.full_name?.split(' ')[0] ?? 'Cliente'

  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-card border-l-4 p-4',
      LEFT_BORDER[order.status ?? 'pending'] ?? 'border-gray-200'
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <p className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="font-display font-semibold text-gray-900 text-sm mt-0.5">{customerName}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('text-xs font-display font-semibold px-2.5 py-0.5 rounded-full', STATUS_COLORS[order.status ?? 'pending'])}>
            {STATUS_LABELS[order.status ?? 'pending']}
          </span>
          <span className={cn('text-xs font-mono', elapsed > 15 ? 'text-red-500 font-bold' : 'text-gray-400')}>
            {elapsed}min
          </span>
        </div>
      </div>

      {/* Items */}
      <p className="text-gray-500 text-xs font-body line-clamp-2 mb-3">{itemsSummary}</p>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-extrabold text-gray-900">{fmt(order.total_amount)}</p>
        {nextStatus && (
          <button
            onClick={advance}
            disabled={updating}
            className={cn(
              'text-white px-3 py-1.5 rounded-xl text-xs font-display font-bold disabled:opacity-60 transition-all flex-1 max-w-[140px]',
              NEXT_COLORS[order.status ?? 'pending'] ?? 'bg-gray-500'
            )}
          >
            {updating ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                ...
              </span>
            ) : NEXT_LABEL[order.status ?? 'pending']}
          </button>
        )}
        {order.status === 'ready' && (
          <span className="text-success text-xs font-display font-bold flex items-center gap-1">
            ✓ Listo para recoger
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Move stats grid below header**

The existing stats grid is inside the orange header. Move it out: the header should only contain the greeting + toggle. The `StatCard` grid goes in the content section below. Restructure the render return:

```tsx
return (
  <div className="min-h-screen bg-vendor-background">
    {/* Gradient header — greeting + toggle only */}
    <div className="bg-gradient-to-br from-vendor to-vendor-dark px-4 md:px-8 pt-8 pb-6 relative overflow-hidden">
      {/* ... dot pattern + greeting + toggle (from Step 1) */}
    </div>

    {/* Content */}
    <div className="px-4 md:px-8 py-5 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={ShoppingBag} value={String(todayOrders)} label="Pedidos hoy" color="bg-orange-100 text-vendor" />
        <StatCard icon={TrendingUp} value={fmt(todayRevenue)} label="Ingresos" color="bg-green-100 text-success" />
        <StatCard icon={Star} value={vendor?.rating_avg?.toFixed(1) ?? '—'} label="Calificación" color="bg-yellow-100 text-yellow-600" />
      </div>

      {/* Orders */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-extrabold text-gray-900 text-lg">Pedidos activos</h2>
        <Link href="/vendor/orders" className="text-vendor text-sm font-display font-semibold">Ver todos →</Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag size={28} className="text-gray-300" />
          </div>
          <p className="font-display font-semibold text-gray-900">Sin pedidos activos</p>
          <p className="text-gray-400 text-sm font-body mt-1">Los nuevos pedidos aparecerán aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={(id, status) => {
              setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
            }} />
          ))}
        </div>
      )}
    </div>
  </div>
)
```

- [ ] **Step 5: Add missing imports**

Ensure the file has: `import { cn } from '@/lib/utils'` and all Lucide icons used (`ShoppingBag`, `TrendingUp`, `Star`, `ToggleLeft`, `ToggleRight`). `ToggleLeft`/`ToggleRight` are no longer used — remove them and update the toggle button to use the CSS dot approach from Step 1.

- [ ] **Step 6: Verify visually**

Open `/vendor/dashboard`. Check:
- Orange gradient header with dot pattern
- Clean toggle button (white when open, semi-transparent when closed)
- Stat cards below header with colored icons
- Order cards with left border color, customer name, elapsed timer (red if >15min)
- Action button full-width with correct color per status

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/vendor/dashboard/page.tsx
git commit -m "feat(vendor): gradient dashboard, white stat cards, upgraded order cards with timer"
```

---

## Task 14: Final Responsive Verification

**Files:** None (verification only)

- [ ] **Step 1: Test mobile (375px) — student flow**

Open Chrome DevTools, set to 375px width. Navigate:
- `/` → landing scrolls correctly, no horizontal overflow
- `/login` → stacked layout, form fits
- `/register` → role toggle works
- `/student/home` → 2-col grid, search bar overlaps header, bottom nav visible
- Active order bubble doesn't overlap bottom nav

- [ ] **Step 2: Test tablet (768px) — student flow**

Set to 768px:
- `/student/home` → 3-col grid, top nav appears, bottom nav hidden
- Gradient header looks proportional

- [ ] **Step 3: Test desktop (1280px) — vendor flow**

Set to 1280px:
- `/vendor/dashboard` → 3-col order grid, stat cards in row of 3, top nav with glass effect
- No layout overflow

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final responsive verification pass — UI/UX overhaul complete"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Design system tokens (Task 1)
- ✅ Logo asset (Task 2)
- ✅ Landing page — hero, how-it-works, roles, footer (Task 3)
- ✅ Login — logo, testimonial card, OAuth logos already in code (Task 4)
- ✅ Register — logo, animated role toggle, testimonial (Task 5)
- ✅ Student TopNav — glass, logo, active pill (Task 6)
- ✅ Vendor TopNav — glass, logo, orange pill, badge (Task 7)
- ✅ Student BottomNav — blur, sliding dot, touch feedback (Task 8)
- ✅ Vendor BottomNav — blur, sliding dot, orange (Task 9)
- ✅ Active Order Bubble — rounded-2xl, pulse ring, Framer entrance (Task 10)
- ✅ Student Home — gradient header, dot pattern, search bar, section titles (Task 11)
- ✅ VendorCardList — 2xl radius, hover scale, skeleton, Clock icon (Task 12)
- ✅ Vendor Dashboard — gradient header, white stat cards, order card upgrade, elapsed timer (Task 13)
- ✅ Responsive verification (Task 14)

**Note on remaining pages** (student/vendor detail, orders, wallet, profile, menu, reports): The design system tokens and component patterns established in Tasks 1-13 apply to these pages. They can be upgraded in a follow-up pass using the same patterns: `rounded-2xl shadow-card` for cards, gradient headers where applicable, `font-display font-extrabold` for section titles.
