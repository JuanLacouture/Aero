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
    <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Cargando pedidos">
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
          const vendorInitial = (order.vendors?.business_name || 'V')[0].toUpperCase()

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
                    <button
                      type="button"
                      aria-label="Calificar pedido"
                      onClick={e => { e.stopPropagation(); router.push(`/student/order/${order.id}/rate`) }}
                      className="flex items-center gap-1 text-xs font-display font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full"
                    >
                      <Star size={12} aria-hidden="true" /> Calificar
                    </button>
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
