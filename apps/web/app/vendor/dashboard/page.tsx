'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, ShoppingBag, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

type Order = {
  id: string
  status: OrderStatus | null
  total_amount: number
  created_at: string | null
  payment_status: string | null
  order_items: { quantity: number; products: { name: string } | null }[]
  students: { profiles: { full_name: string } | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-500',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function VendorDashboardPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null)
  const [vendor, setVendor] = useState<{ id: string; rating_avg: number | null; is_open: boolean | null } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingOpen, setTogglingOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, vendorRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('vendors').select('id, rating_avg, is_open').eq('id', user.id).single(),
        supabase.from('orders')
          .select(`
            id, status, total_amount, created_at, payment_status,
            order_items ( quantity, products ( name ) ),
            students ( profiles ( full_name ) )
          `)
          .eq('vendor_id', user.id)
          .not('status', 'in', '("delivered","cancelled")')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (vendorRes.data) setVendor(vendorRes.data)
      if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[])
      setLoading(false)

      // Realtime: new orders
      supabase.channel('vendor-orders')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'orders',
          filter: `vendor_id=eq.${user.id}`,
        }, payload => {
          setOrders(prev => [payload.new as Order, ...prev])
        })
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'orders',
          filter: `vendor_id=eq.${user.id}`,
        }, payload => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        })
        .subscribe()
    }

    load()
  }, [])

  async function toggleOpen() {
    if (!vendor) return
    setTogglingOpen(true)
    const supabase = createClient()
    await supabase.from('vendors').update({ is_open: !vendor.is_open }).eq('id', vendor.id)
    setVendor(v => v ? { ...v, is_open: !v.is_open } : v)
    setTogglingOpen(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] ?? 'vendedor'
  const todayOrders = orders.length
  const todayRevenue = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-vendor-background">
      {/* Header */}
      <div className="bg-vendor px-4 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-200 text-xs font-body uppercase tracking-wide">AERO Vendedor</p>
            <h1 className="text-white text-xl font-display font-bold mt-0.5">
              Hola, {firstName} 👋
            </h1>
          </div>
          {/* Open toggle */}
          <button onClick={toggleOpen} disabled={togglingOpen}
            className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
            {vendor?.is_open
              ? <ToggleRight size={22} className="text-white" />
              : <ToggleLeft size={22} className="text-white/60" />}
            <span className={cn('text-sm font-display font-semibold', vendor?.is_open ? 'text-white' : 'text-white/60')}>
              {vendor?.is_open ? 'Abierto' : 'Cerrado'}
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatCard icon={ShoppingBag} value={String(todayOrders)} label="Pedidos hoy" />
          <StatCard icon={TrendingUp} value={fmt(todayRevenue)} label="Ingresos" small />
          <StatCard icon={Star} value={vendor?.rating_avg?.toFixed(1) ?? '—'} label="Calificación" />
        </div>
      </div>

      {/* Orders */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-text-primary text-base">Pedidos activos</h2>
          <Link href="/vendor/orders" className="text-vendor text-sm font-body">Ver todos</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-card shadow-sm p-8 text-center">
            <ShoppingBag size={36} className="text-text-disabled mx-auto mb-2" />
            <p className="text-text-secondary font-body text-sm">Sin pedidos activos</p>
            <p className="text-text-disabled text-xs font-body mt-1">Los nuevos pedidos aparecerán aquí</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
}

function StatCard({ icon: Icon, value, label, small }: { icon: React.ElementType; value: string; label: string; small?: boolean }) {
  return (
    <div className="bg-white/15 rounded-xl px-3 py-3 text-center">
      <Icon size={16} className="text-white/70 mx-auto mb-1" />
      <p className={cn('text-white font-display font-bold leading-tight', small ? 'text-sm' : 'text-lg')}>{value}</p>
      <p className="text-white/70 text-xs font-body">{label}</p>
    </div>
  )
}

function OrderCard({ order, onStatusChange }: {
  order: Order
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const [updating, setUpdating] = useState(false)
  const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: 'confirmed', confirmed: 'preparing', preparing: 'ready',
  }
  const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
    pending: 'Confirmar', confirmed: 'Preparando', preparing: 'Listo',
  }
  const nextStatus = NEXT[order.status ?? 'pending']

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

  return (
    <div className="bg-white rounded-card shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-mono text-xs text-text-secondary">#{order.id.slice(0,8).toUpperCase()}</p>
          <p className="font-body text-sm text-text-secondary mt-0.5 line-clamp-1">{itemsSummary}</p>
        </div>
        <span className={cn('text-xs font-display font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[order.status ?? 'pending'])}>
          {STATUS_LABELS[order.status ?? 'pending']}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-text-primary">{fmt(order.total_amount)}</p>
        {nextStatus && (
          <button onClick={advance} disabled={updating}
            className="bg-vendor text-white px-4 py-1.5 rounded-button text-sm font-display font-semibold disabled:opacity-60">
            {updating ? '...' : NEXT_LABEL[order.status ?? 'pending']}
          </button>
        )}
      </div>
    </div>
  )
}
