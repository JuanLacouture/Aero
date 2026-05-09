'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
type Order = {
  id: string
  status: OrderStatus | null
  total_amount: number
  created_at: string | null
  order_items: { quantity: number; products: { name: string } | null }[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700', ready: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-500', cancelled: 'bg-red-100 text-red-500',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'Preparando',
  ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
}
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready',
}
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Confirmar', confirmed: 'Preparando', preparing: 'Listo para recoger',
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function VendorOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'active' | 'done'>('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('orders')
        .select('id, status, total_amount, created_at, order_items ( quantity, products ( name ) )')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setOrders(data as unknown as Order[])
      setLoading(false)

      supabase.channel('vendor-orders-page')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `vendor_id=eq.${user.id}` },
          payload => setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${user.id}` },
          payload => setOrders(prev => [payload.new as Order, ...prev]))
        .subscribe()
    }
    load()
  }, [])

  async function updateStatus(orderId: string, status: OrderStatus) {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const ACTIVE = ['pending', 'confirmed', 'preparing', 'ready']
  const DONE = ['delivered', 'cancelled']
  const filtered = orders.filter(o => filter === 'active' ? ACTIVE.includes(o.status ?? '') : DONE.includes(o.status ?? ''))

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-vendor-background">
      <div className="bg-vendor px-4 pt-12 pb-4 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-full bg-white/15">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="font-display font-bold text-white text-xl">Panel de Pedidos</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-white border-b border-border">
        {(['active', 'done'] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={cn('flex-1 py-3 text-sm font-display font-semibold transition-colors',
              filter === tab ? 'text-vendor border-b-2 border-vendor' : 'text-text-secondary')}>
            {tab === 'active' ? 'Activos' : 'Finalizados'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary font-body">Sin pedidos {filter === 'active' ? 'activos' : 'finalizados'}</p>
          </div>
        ) : filtered.map(order => {
          const nextStatus = NEXT[order.status ?? 'pending']
          const items = order.order_items.map(i => `${i.products?.name ?? 'Plato'} ×${i.quantity}`).join(', ')
          return (
            <div key={order.id} className="bg-white rounded-card shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-text-secondary">#{order.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-sm font-body text-text-secondary mt-0.5 line-clamp-2">{items}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0', STATUS_COLORS[order.status ?? 'pending'])}>
                  {STATUS_LABELS[order.status ?? 'pending']}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="font-display font-bold text-text-primary">{fmt(order.total_amount)}</p>
                {nextStatus && (
                  <button onClick={() => updateStatus(order.id, nextStatus)}
                    className="bg-vendor text-white px-4 py-1.5 rounded-button text-sm font-display font-semibold">
                    {NEXT_LABEL[order.status ?? 'pending']}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
