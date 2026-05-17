'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, ShoppingBag, TrendingUp } from 'lucide-react'
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
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

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

      if (cancelled) return

      if (profileRes.data) setProfile(profileRes.data)
      if (vendorRes.data) setVendor(vendorRes.data)
      if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[])
      setLoading(false)

      channel = supabase.channel(`vendor-dashboard-${user.id}`)
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

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
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
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-vendor to-vendor-dark px-4 md:px-8 pt-8 pb-6 relative overflow-hidden">
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

      {/* Content */}
      <div className="px-4 md:px-8 py-5 max-w-7xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={ShoppingBag} value={String(todayOrders)} label="Pedidos hoy" color="bg-orange-100 text-vendor" />
          <StatCard icon={TrendingUp} value={fmt(todayRevenue)} label="Ingresos" color="bg-green-100 text-success" />
          <StatCard icon={Star} value={vendor?.rating_avg?.toFixed(1) ?? '—'} label="Calificación" color="bg-yellow-100 text-yellow-600" />
        </div>

        {/* Orders section */}
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
}

function StatCard({ icon: Icon, value, label, color }: {
  icon: React.ElementType
  value: string
  label: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-display font-extrabold text-gray-900 leading-none truncate">{value}</p>
        <p className="text-xs font-body text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

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
