'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, X, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

function getDeliveryCode(orderId: string): string {
  return String(parseInt(orderId.replace(/-/g, '').slice(0, 8), 16) % 10000).padStart(4, '0')
}

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
type Order = {
  id: string
  status: OrderStatus | null
  total_amount: number
  created_at: string | null
  order_items: { quantity: number; products: { name: string } | null }[]
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
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'ready',
}
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Confirmar', confirmed: 'Preparando', preparing: 'Listo para recoger',
}

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed']

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function VendorOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'active' | 'done'>('active')
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [scanningOrderId, setScanningOrderId] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [delivering, setDelivering] = useState(false)
  const [deliverToast, setDeliverToast] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data } = await supabase.from('orders')
        .select('id, status, total_amount, created_at, order_items ( quantity, products ( name ) )')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!cancelled && data) setOrders(data as unknown as Order[])
      if (!cancelled) setLoading(false)

      if (cancelled) return
      channel = supabase.channel(`vendor-orders-${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `vendor_id=eq.${user.id}` },
          payload => setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${user.id}` },
          payload => setOrders(prev => [payload.new as Order, ...prev]))
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  async function updateStatus(orderId: string, status: OrderStatus) {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    const res = await fetch(`/api/orders/${cancelTarget}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === cancelTarget ? { ...o, status: 'cancelled' } : o))
    }
    setCancelTarget(null)
    setCancelling(false)
  }

  async function deliverOrder(orderId: string) {
    setDelivering(true)
    const res = await fetch(`/api/orders/${orderId}/delivered`, { method: 'PUT' })
    setDelivering(false)
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
      showToast('✓ Pedido entregado')
    } else {
      showToast('Error al marcar como entregado')
    }
  }

  function showToast(msg: string) {
    setDeliverToast(msg)
    setTimeout(() => setDeliverToast(null), 3000)
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
          const canCancel = CANCELLABLE.includes(order.status as OrderStatus)
          const items = order.order_items.map(i => `${i.products?.name ?? 'Plato'} ×${i.quantity}`).join(', ')
          return (
            <div key={order.id} className="bg-white rounded-card shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-text-secondary">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm font-body text-text-secondary mt-0.5 line-clamp-2">{items}</p>
                </div>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0', STATUS_COLORS[order.status ?? 'pending'])}>
                  {STATUS_LABELS[order.status ?? 'pending']}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <p className="font-display font-bold text-text-primary">{fmt(order.total_amount)}</p>
                <div className="flex items-center gap-2">
                  {canCancel && (
                    <button
                      onClick={() => setCancelTarget(order.id)}
                      className="flex items-center gap-1 border border-red-300 text-red-500 px-3 py-1.5 rounded-button text-sm font-display font-semibold"
                    >
                      <X size={13} /> Cancelar
                    </button>
                  )}
                  {nextStatus && (
                    <button onClick={() => updateStatus(order.id, nextStatus)}
                      className="bg-vendor text-white px-4 py-1.5 rounded-button text-sm font-display font-semibold">
                      {NEXT_LABEL[order.status ?? 'pending']}
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => { setScanningOrderId(order.id); setCodeInput(''); setCodeError('') }}
                      disabled={delivering}
                      className="flex items-center gap-1.5 bg-success text-white px-4 py-1.5 rounded-button text-sm font-display font-semibold disabled:opacity-60"
                    >
                      <Truck size={14} /> Entregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4-digit delivery code modal */}
      {scanningOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={18} className="text-success" />
              <h2 className="font-display font-bold text-text-primary text-lg">Confirmar entrega</h2>
            </div>
            <p className="text-text-secondary font-body text-sm mb-4">
              Pide al estudiante que muestre su código de entrega e ingrésalo aquí.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setCodeError('') }}
              className="w-full text-center text-4xl font-mono font-bold tracking-[0.4em] border-2 border-border rounded-xl py-4 bg-background focus:border-success focus:ring-2 focus:ring-success/20 outline-none transition-all"
            />
            {codeError && (
              <p className="text-error text-xs font-body text-center mt-2">{codeError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setScanningOrderId(null)}
                disabled={delivering}
                className="flex-1 border border-border text-text-primary py-3 rounded-button font-display font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!scanningOrderId) return
                  if (codeInput === getDeliveryCode(scanningOrderId)) {
                    const id = scanningOrderId
                    setScanningOrderId(null)
                    deliverOrder(id)
                  } else {
                    setCodeError('Código incorrecto. Pide al estudiante que muestre su pantalla.')
                  }
                }}
                disabled={codeInput.length !== 4 || delivering}
                className="flex-1 bg-success text-white py-3 rounded-button font-display font-semibold text-sm disabled:opacity-60"
              >
                {delivering ? 'Entregando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {deliverToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-display font-semibold px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap">
          {deliverToast}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="font-display font-bold text-text-primary text-lg mb-2">¿Cancelar pedido?</h2>
            <p className="text-text-secondary font-body text-sm mb-6">
              Esta acción no se puede deshacer. El pedido quedará cancelado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 border border-border text-text-primary py-3 rounded-button font-display font-semibold text-sm"
              >
                Mantener
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 bg-red-500 text-white py-3 rounded-button font-display font-semibold text-sm disabled:opacity-60"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
