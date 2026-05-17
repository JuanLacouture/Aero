# Aero Responsive Web Expansion — Plan B (Student Screens) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually polish 4 student-facing screens — Mis Pedidos (vendor thumbnail + CTA + empty state), Confirmación (Framer Motion animated checkmark + vendor name), Wallet (gradient balance card), and Perfil (merge Configuración section with push notification toggle + logout) — without touching any Supabase auth, payment, or mutation logic.

**Architecture:** Pure markup + Tailwind styling changes across 4 existing files, plus one new `ConfirmedClient.tsx` client component to house Framer Motion animations inside the async server component `confirmed/page.tsx`. The Mis Pedidos and Confirmación queries gain extra display-only `select` fields (vendor `cover_image_url`, vendor `business_name`); no writes or mutations change.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion (`framer-motion` already installed), Lucide React, Supabase SSR client (`@/lib/supabase/server`), Supabase browser client (`@/lib/supabase/client`), custom Tailwind tokens (`bg-primary`, `bg-background`, `text-text-primary`, `text-text-secondary`, `text-text-disabled`, `rounded-card`, `rounded-button`, `border-border`, `font-display`, `font-body`, `text-success`, `text-error`)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `apps/web/app/student/orders/page.tsx` | Add vendor thumbnail, CTA text, polish empty state |
| Modify | `apps/web/app/student/order/[id]/confirmed/page.tsx` | Fetch vendor name, render ConfirmedClient |
| Create | `apps/web/components/student/ConfirmedClient.tsx` | Framer Motion animated confirmation screen |
| Modify | `apps/web/app/student/wallet/page.tsx` | Gradient header, balance card border polish |
| Modify | `apps/web/app/student/profile/page.tsx` | Add Configuración card, remove standalone logout btn |

---

## Task 1: Mis Pedidos — vendor thumbnail, explicit CTA, polish empty state

**Files:**
- Modify: `apps/web/app/student/orders/page.tsx`

**Context:** The current page has a working two-tab order list. The `vendors` join only fetches `business_name`. This task adds `cover_image_url` to the join, adds a vendor thumbnail to each card, adds explicit CTA labels, and replaces the emoji empty state with an icon-based design.

- [ ] **Step 1: Read the current file**

```bash
# Confirm the current file path and content before editing
cat apps/web/app/student/orders/page.tsx
```

- [ ] **Step 2: Replace the entire file with the polished version**

Write the following complete file to `apps/web/app/student/orders/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Package, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

type Order = {
  id: string
  status: OrderStatus | null
  total_amount: number
  payment_method: string | null
  created_at: string | null
  vendors: { business_name: string; cover_image_url: string | null } | null
  order_items: { quantity: number; unit_price: number; products: { name: string } | null }[]
  ratings: { id: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-500',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']
const DONE_STATUSES = ['delivered', 'cancelled']

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

export default function StudentOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'done'>('active')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      supabase
        .from('orders')
        .select(`
          id, status, total_amount, payment_method, created_at,
          vendors ( business_name, cover_image_url ),
          order_items ( quantity, unit_price, products ( name ) ),
          ratings ( id )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data }) => {
          setOrders((data ?? []) as unknown as Order[])
          setLoading(false)
        })
    })
  }, [router])

  const filtered = orders.filter(o =>
    filter === 'active'
      ? ACTIVE_STATUSES.includes(o.status ?? '')
      : DONE_STATUSES.includes(o.status ?? '')
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 pt-12 pb-4 shadow-sm flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-full bg-white/15"
          aria-label="Volver"
        >
          <ArrowLeft size={20} className="text-white" aria-hidden="true" />
        </button>
        <h1 className="font-display font-bold text-white text-xl">Mis Pedidos</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-border">
        {(['active', 'done'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'flex-1 py-3 text-sm font-display font-semibold transition-colors',
              filter === tab ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'
            )}
          >
            {tab === 'active' ? 'Activos' : 'Anteriores'}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center text-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Package size={36} className="text-primary/40" aria-hidden="true" />
            </div>
            <p className="font-display font-bold text-text-primary text-lg">
              {filter === 'active' ? 'Sin pedidos activos' : 'Sin pedidos anteriores'}
            </p>
            <p className="text-text-secondary text-sm font-body mt-1 max-w-xs">
              {filter === 'active'
                ? 'Cuando hagas tu primer pedido aparecerá aquí'
                : 'Tus pedidos entregados aparecerán aquí'}
            </p>
            {filter === 'active' && (
              <button
                onClick={() => router.push('/student/home')}
                className="mt-5 bg-primary text-white px-6 py-2.5 rounded-button font-display font-semibold text-sm"
              >
                Explorar vendedores
              </button>
            )}
          </div>
        ) : filtered.map(order => {
          const items = order.order_items
            .map(i => `${i.products?.name ?? 'Plato'} ×${i.quantity}`)
            .join(', ')
          const hasRating = (order.ratings ?? []).length > 0
          const canRate = order.status === 'delivered' && !hasRating
          const isActive = ACTIVE_STATUSES.includes(order.status ?? '')
          const vendorInitial = (order.vendors?.business_name ?? 'V')[0].toUpperCase()

          return (
            <button
              key={order.id}
              onClick={() => router.push(`/student/order/${order.id}/tracking`)}
              className="bg-white rounded-card shadow-sm p-4 text-left w-full active:scale-[0.99] transition-transform"
            >
              {/* Card header: thumbnail + name + status badge */}
              <div className="flex items-start gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 shrink-0 flex items-center justify-center">
                  {order.vendors?.cover_image_url ? (
                    <img
                      src={order.vendors.cover_image_url}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary font-display font-bold text-lg" aria-hidden="true">
                      {vendorInitial}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-semibold text-text-primary text-sm truncate">
                      {order.vendors?.business_name ?? 'Vendedor'}
                    </p>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                      STATUS_COLORS[order.status ?? 'pending']
                    )}>
                      {STATUS_LABELS[order.status ?? 'pending']}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-text-disabled mt-0.5">
                    #CAP-{order.id.slice(0, 8).toUpperCase()}
                    {order.created_at && ` · ${fmtDate(order.created_at)}`}
                  </p>
                </div>
              </div>

              {/* Items summary */}
              <p className="text-text-secondary text-xs font-body line-clamp-1 mb-3 pl-[60px]">
                {items}
              </p>

              {/* Footer: total + CTA */}
              <div className="flex items-center justify-between pl-[60px]">
                <p className="font-display font-bold text-text-primary">{fmt(order.total_amount)}</p>
                <div className="flex items-center gap-2">
                  {canRate && (
                    <span
                      onClick={e => { e.stopPropagation(); router.push(`/student/order/${order.id}/rate`) }}
                      className="flex items-center gap-1 text-xs font-display font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full"
                    >
                      <Star size={12} aria-hidden="true" /> Calificar
                    </span>
                  )}
                  <span className="text-xs font-display font-semibold text-primary">
                    {isActive ? 'Ver seguimiento →' : 'Ver pedido →'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify the page builds without TypeScript errors**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "orders/page"
```

Expected: no output (no errors in orders/page). Pre-existing errors elsewhere are expected and can be ignored — check `next.config.mjs` has `ignoreBuildErrors: true`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/student/orders/page.tsx
git commit -m "feat: orders page — vendor thumbnail, explicit CTA, icon empty state"
```

---

## Task 2: Confirmación — Framer Motion animated checkmark + vendor name

**Files:**
- Create: `apps/web/components/student/ConfirmedClient.tsx`
- Modify: `apps/web/app/student/order/[id]/confirmed/page.tsx`

**Context:** The current `confirmed/page.tsx` is a static async server component (no animation, no vendor name). This task extracts the presentation to a `'use client'` component for Framer Motion, and adds a server-side query to fetch the vendor name. The server component passes `orderId`, `shortId`, and `vendorName` as props to the client component.

- [ ] **Step 1: Create `apps/web/components/student/ConfirmedClient.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

type Props = {
  orderId: string
  shortId: string
  vendorName: string | null
}

export default function ConfirmedClient({ orderId, shortId, vendorName }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
        className="bg-success/10 rounded-full p-6 mb-6"
      >
        <CheckCircle size={72} className="text-success" strokeWidth={1.5} aria-hidden="true" />
      </motion.div>

      {/* Title + subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.38 }}
      >
        <h1 className="text-2xl font-display font-bold text-text-primary">¡Pedido confirmado!</h1>
        <p className="text-text-secondary font-body mt-2">
          {vendorName
            ? `Tu pedido en ${vendorName} fue procesado exitosamente`
            : 'El pago fue procesado exitosamente'}
        </p>
      </motion.div>

      {/* Order code card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.38 }}
        className="bg-white rounded-card shadow-sm px-6 py-5 mt-6 w-full max-w-xs"
      >
        <p className="text-text-secondary text-xs font-body uppercase tracking-wider mb-1">
          Código de pedido
        </p>
        <p className="font-mono font-bold text-text-primary text-xl tracking-widest">
          #CAP-{shortId}
        </p>
        {vendorName && (
          <p className="text-text-secondary text-sm font-body mt-2">{vendorName}</p>
        )}
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62, duration: 0.38 }}
        className="flex flex-col gap-3 w-full mt-8 max-w-xs"
      >
        <Link
          href={`/student/order/${orderId}/tracking`}
          className="w-full bg-primary text-white rounded-button py-3.5 font-display font-semibold text-center block"
        >
          Seguir mi pedido
        </Link>
        <Link
          href="/student/home"
          className="w-full border border-border text-text-primary rounded-button py-3.5 font-display font-semibold text-center block"
        >
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Replace `apps/web/app/student/order/[id]/confirmed/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import ConfirmedClient from '@/components/student/ConfirmedClient'

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const shortId = id.slice(0, 8).toUpperCase()

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, vendors ( business_name )')
    .eq('id', id)
    .maybeSingle()

  const vendorName =
    (order?.vendors as { business_name: string } | null)?.business_name ?? null

  return <ConfirmedClient orderId={id} shortId={shortId} vendorName={vendorName} />
}
```

- [ ] **Step 3: Verify no TypeScript errors in these two files**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "confirmed|ConfirmedClient"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/student/ConfirmedClient.tsx \
        apps/web/app/student/order/[id]/confirmed/page.tsx
git commit -m "feat: confirmed page — framer motion animation, vendor name"
```

---

## Task 3: Wallet — gradient header + balance card border polish

**Files:**
- Modify: `apps/web/app/student/wallet/page.tsx`

**Context:** The wallet page is already well-structured. This task adds visual polish: a blue gradient to the header (instead of flat `bg-primary`), a subtle white border on the balance card, and section header label spacing improvement. All logic (topup, transactions, balance) is unchanged.

- [ ] **Step 1: Read the current file**

```bash
cat apps/web/app/student/wallet/page.tsx
```

- [ ] **Step 2: Apply the gradient and border polish**

Make these three targeted edits to `apps/web/app/student/wallet/page.tsx`:

**Edit 1** — Header background: change `bg-primary` to gradient.

Find:
```tsx
      <div className="bg-primary px-4 pt-12 pb-6">
```
Replace with:
```tsx
      <div className="bg-gradient-to-br from-[#1A6BFF] to-[#0046CC] px-4 pt-12 pb-6">
```

**Edit 2** — Balance card: add subtle border.

Find:
```tsx
        <div className="bg-white/15 rounded-2xl px-5 py-5 text-center">
```
Replace with:
```tsx
        <div className="bg-white/15 border border-white/20 rounded-2xl px-5 py-5 text-center">
```

**Edit 3** — Historial section: tighten header margin.

Find:
```tsx
          <h2 className="font-display font-bold text-text-primary text-base mb-1">Historial</h2>
```
Replace with:
```tsx
          <h2 className="font-display font-bold text-text-primary text-base mb-3">Historial</h2>
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "wallet/page"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/student/wallet/page.tsx
git commit -m "feat: wallet — gradient header, balance card border polish"
```

---

## Task 4: Perfil + Settings merge — Configuración section with push notification toggle

**Files:**
- Modify: `apps/web/app/student/profile/page.tsx`

**Context:** The current profile page has a standalone logout `<button>` at the very bottom. The design spec merges a "Configuración" settings section into the profile page — a card containing a push notification toggle and the logout action. After this task the standalone logout button is removed and replaced by the card section.

Note: the notification toggle is UI-only state (`useState`) — no backend subscription is implemented in this task.

- [ ] **Step 1: Read the current file**

```bash
cat apps/web/app/student/profile/page.tsx
```

- [ ] **Step 2: Add `Bell` to lucide-react imports**

Find:
```tsx
import { ArrowLeft, Camera, LogOut, Wallet, CheckCircle } from 'lucide-react'
```
Replace with:
```tsx
import { ArrowLeft, Bell, Camera, ChevronRight, LogOut, Wallet, CheckCircle } from 'lucide-react'
```

- [ ] **Step 3: Add `notificationsEnabled` state after the existing state declarations**

Find:
```tsx
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
```
Replace with:
```tsx
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
```

- [ ] **Step 4: Replace the wallet link `›` character with `ChevronRight`**

Find:
```tsx
            <span className="text-text-secondary font-body text-lg">›</span>
```
Replace with:
```tsx
            <ChevronRight size={18} className="text-text-secondary" aria-hidden="true" />
```

- [ ] **Step 5: Replace the standalone logout section with a full Configuración card**

Find (the existing standalone logout block at the bottom):
```tsx
      {/* Email de la cuenta */}
      <div className="mx-4 mt-3 bg-white rounded-card shadow-sm px-4 py-3">
        <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-1">
          Cuenta
        </p>
        <p className="text-sm font-body text-text-primary">{email}</p>
      </div>

      {/* Cerrar sesión */}
      <div className="mx-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border border-error text-error rounded-button py-3.5 font-display font-semibold"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
```
Replace with:
```tsx
      {/* Configuración */}
      <div className="mx-4 mt-3 bg-white rounded-card shadow-sm divide-y divide-border">
        <p className="px-4 pt-4 pb-2 text-xs font-display font-semibold text-text-secondary uppercase tracking-wide">
          Configuración
        </p>

        {/* Email de la cuenta */}
        <div className="px-4 py-3">
          <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
            Cuenta
          </p>
          <p className="text-sm font-body text-text-primary">{email}</p>
        </div>

        {/* Push notifications toggle */}
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bell size={17} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-text-primary">Notificaciones</p>
              <p className="text-xs font-body text-text-secondary">Estado del pedido en tiempo real</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={notificationsEnabled}
            aria-label="Activar notificaciones push"
            onClick={() => setNotificationsEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notificationsEnabled ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Logout */}
        <div className="px-4 py-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3.5 text-error"
          >
            <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
              <LogOut size={17} className="text-error" aria-hidden="true" />
            </div>
            <span className="text-sm font-display font-semibold">Cerrar sesión</span>
          </button>
        </div>
      </div>
```

- [ ] **Step 6: Verify no TypeScript errors**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep "profile/page"
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/student/profile/page.tsx
git commit -m "feat: profile — configuración section with notifications toggle and logout"
```

---

## Self-Review Checklist (run before handing off)

- [ ] Task 1 covers spec: vendor cover image ✓, status badge ✓, items summary ✓, total ✓, date ✓, CTA button ✓, empty state illustration + text + "Explorar vendedores" ✓
- [ ] Task 2 covers spec: large checkmark animation (Framer Motion) ✓, order number ✓, vendor name ✓, "Ver seguimiento" + "Ir al inicio" buttons ✓
- [ ] Task 3 covers spec: gradient bg balance card ✓, Recargar button (unchanged, already present) ✓, transaction history (unchanged, already present) ✓
- [ ] Task 4 covers spec: avatar + nombre + email + universityId + phone editable ✓, push notification toggle ✓, logout button ✓, card-based sections ✓
- [ ] No placeholder text, "TBD", or "TODO" in any task
- [ ] All type names consistent across tasks (`Order.vendors.cover_image_url`, `Props` in ConfirmedClient)
- [ ] `framer-motion` import style consistent with existing usage in codebase: `import { motion } from 'framer-motion'`
