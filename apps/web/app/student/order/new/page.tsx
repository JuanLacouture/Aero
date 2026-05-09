'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/stores/cart'
import { ArrowLeft, MapPin, Clock, Minus, Plus, Smartphone, QrCode, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

type DeliveryPoint = { id: string; name: string; description: string | null; security_level: string | null }
type TimeSlot = { id: string; slot_start: string; slot_end: string; delivery_point_id: string; current_count: number | null; max_capacity: number | null }

type Step = 'cart' | 'timeslot' | 'payment'

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Mi Saldo (simulado)', icon: Wallet, description: 'Pago automático' },
  { id: 'qr', label: 'Código QR', icon: QrCode, description: 'Escanea con tu banco' },
  { id: 'nequi', label: 'Nequi', icon: Smartphone, description: 'Paga con Nequi' },
  { id: 'daviplata', label: 'Daviplata', icon: Smartphone, description: 'Paga con Daviplata' },
]

export default function NewOrderPage() {
  const router = useRouter()
  const { items, vendor_id, vendor_name, total, updateQuantity, clear } = useCartStore()

  const [step, setStep] = useState<Step>('cart')
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const orderTotal = total()

  useEffect(() => {
    if (items.length === 0) router.replace('/student/home')
  }, [items, router])

  useEffect(() => {
    if (step !== 'timeslot') return
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/timeslots?date=${today}`)
      .then(r => r.json())
      .then(data => {
        const slotsData: TimeSlot[] = data.slots ?? []
        setSlots(slotsData)
        if (slotsData.length > 0 && !selectedPoint) {
          setSelectedPoint(slotsData[0].delivery_point_id)
        }
      })
    const supabase = createClient()
    supabase.from('delivery_points').select('id, name, description, security_level').eq('is_active', true)
      .then(({ data }) => setDeliveryPoints(data ?? []))
  }, [step])

  const filteredSlots = slots.filter(s => s.delivery_point_id === selectedPoint)
  const grouped = filteredSlots.reduce<Record<string, TimeSlot[]>>((acc, s) => {
    const hour = s.slot_start.slice(0, 2)
    acc[hour] = [...(acc[hour] ?? []), s]
    return acc
  }, {})

  async function submitOrder() {
    if (!selectedSlot || !selectedPoint || !vendor_id) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id,
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          delivery_point_id: selectedPoint,
          time_slot_id: selectedSlot,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear pedido'); setLoading(false); return }
      clear()
      router.push(`/student/order/${data.order_id}/confirmed`)
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 pt-12 pb-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 'cart' ? router.back() : setStep(step === 'payment' ? 'timeslot' : 'cart')}
            className="p-1.5 rounded-full hover:bg-background">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="font-display font-bold text-text-primary text-lg leading-tight">
              {step === 'cart' ? 'Tu pedido' : step === 'timeslot' ? 'Elige franja de recogida' : 'Método de pago'}
            </h1>
            {vendor_name && <p className="text-text-secondary text-xs font-body">{vendor_name}</p>}
          </div>
        </div>
        {/* Steps indicator */}
        <div className="flex items-center gap-1 mt-3">
          {(['cart', 'timeslot', 'payment'] as Step[]).map((s, i) => (
            <div key={s} className={cn('h-1 flex-1 rounded-full transition-colors',
              step === s || (step === 'timeslot' && i === 0) || (step === 'payment' && i <= 1)
                ? 'bg-primary' : 'bg-gray-200')} />
          ))}
        </div>
      </div>

      {/* STEP: CART */}
      {step === 'cart' && (
        <div className="px-4 py-4">
          <div className="bg-white rounded-card shadow-sm divide-y divide-border">
            {items.map(item => (
              <div key={item.product_id} className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-xl">🍽️</div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-text-primary text-sm truncate">{item.name}</p>
                  <p className="text-primary font-display font-bold text-sm">{fmt(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center">
                    <Minus size={13} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Plus size={13} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-card shadow-sm p-4 mt-3">
            <div className="flex justify-between text-sm font-body text-text-secondary">
              <span>Subtotal</span><span>{fmt(orderTotal)}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-text-primary text-base mt-2 pt-2 border-t border-border">
              <span>Total</span><span>{fmt(orderTotal)}</span>
            </div>
          </div>

          <button onClick={() => setStep('timeslot')}
            className="w-full mt-4 bg-primary text-white rounded-button py-3.5 font-display font-semibold">
            Elegir franja horaria
          </button>
        </div>
      )}

      {/* STEP: TIMESLOT */}
      {step === 'timeslot' && (
        <div className="px-4 py-4">
          {/* Delivery points */}
          <h2 className="text-sm font-display font-bold text-text-secondary uppercase tracking-wider mb-2">Punto de entrega</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
            {deliveryPoints.map(dp => (
              <button key={dp.id} onClick={() => { setSelectedPoint(dp.id); setSelectedSlot(null) }}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-body whitespace-nowrap transition-colors shrink-0',
                  selectedPoint === dp.id ? 'bg-primary text-white border-primary' : 'bg-white text-text-primary border-border')}>
                <MapPin size={13} />
                {dp.name}
              </button>
            ))}
          </div>

          {/* Time slots */}
          <h2 className="text-sm font-display font-bold text-text-secondary uppercase tracking-wider mb-2">Franjas disponibles</h2>
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-card p-6 text-center">
              <Clock size={32} className="text-text-disabled mx-auto mb-2" />
              <p className="text-text-secondary font-body text-sm">Sin franjas disponibles para hoy</p>
            </div>
          ) : (
            Object.entries(grouped).sort().map(([hour, hourSlots]) => (
              <div key={hour} className="mb-3">
                <p className="text-xs text-text-secondary font-body mb-1.5">{hour}:00</p>
                <div className="flex flex-wrap gap-2">
                  {hourSlots.map(slot => {
                    const pct = ((slot.current_count ?? 0) / (slot.max_capacity ?? 10)) * 100
                    const full = pct >= 30
                    return (
                      <button key={slot.id} disabled={full} onClick={() => setSelectedSlot(slot.id)}
                        className={cn('px-3 py-2 rounded-xl border text-sm font-body transition-colors',
                          full ? 'bg-gray-100 text-text-disabled border-transparent cursor-not-allowed' :
                          selectedSlot === slot.id ? 'bg-primary text-white border-primary' : 'bg-white text-text-primary border-border')}>
                        {slot.slot_start.slice(0,5)} – {slot.slot_end.slice(0,5)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          <button disabled={!selectedSlot} onClick={() => setStep('payment')}
            className={cn('w-full mt-6 rounded-button py-3.5 font-display font-semibold transition-colors',
              selectedSlot ? 'bg-primary text-white' : 'bg-gray-200 text-text-disabled cursor-not-allowed')}>
            {selectedSlot
              ? `Confirmar ${slots.find(s => s.id === selectedSlot)?.slot_start.slice(0,5)} – ${slots.find(s => s.id === selectedSlot)?.slot_end.slice(0,5)}`
              : 'Selecciona una franja'}
          </button>
        </div>
      )}

      {/* STEP: PAYMENT */}
      {step === 'payment' && (
        <div className="px-4 py-4">
          {/* Order summary */}
          <div className="bg-white rounded-card shadow-sm p-4 mb-4">
            <h2 className="font-display font-bold text-text-primary text-sm mb-3">Resumen del pedido</h2>
            {items.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm font-body text-text-secondary mb-1">
                <span>{item.name} × {item.quantity}</span>
                <span>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-display font-bold text-text-primary text-base mt-2 pt-2 border-t border-border">
              <span>Total</span><span>{fmt(orderTotal)}</span>
            </div>
          </div>

          {/* Payment methods */}
          <h2 className="text-sm font-display font-bold text-text-secondary uppercase tracking-wider mb-2">Método de pago</h2>
          <div className="flex flex-col gap-2">
            {PAYMENT_METHODS.map(pm => {
              const Icon = pm.icon
              return (
                <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                  className={cn('flex items-center gap-3 p-3.5 rounded-card border transition-colors bg-white text-left',
                    paymentMethod === pm.id ? 'border-primary bg-primary/5' : 'border-border')}>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                    paymentMethod === pm.id ? 'bg-primary/10' : 'bg-background')}>
                    <Icon size={20} className={paymentMethod === pm.id ? 'text-primary' : 'text-text-secondary'} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('font-display font-semibold text-sm', paymentMethod === pm.id ? 'text-primary' : 'text-text-primary')}>{pm.label}</p>
                    <p className="text-text-secondary text-xs font-body">{pm.description}</p>
                  </div>
                  <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    paymentMethod === pm.id ? 'border-primary' : 'border-border')}>
                    {paymentMethod === pm.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </button>
              )
            })}
          </div>

          {error && <p className="text-error text-sm font-body mt-3 text-center">{error}</p>}

          <button onClick={submitOrder} disabled={loading}
            className="w-full mt-5 bg-primary text-white rounded-button py-3.5 font-display font-semibold disabled:opacity-60">
            {loading ? 'Procesando...' : `Pagar ${fmt(orderTotal)}`}
          </button>
        </div>
      )}
    </div>
  )
}
