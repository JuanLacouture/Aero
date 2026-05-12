'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/stores/cart'
import {
  ArrowLeft, MapPin, Clock, Minus, Plus,
  Smartphone, QrCode, Wallet, CheckCircle, Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

type DeliveryPoint = { id: string; name: string; description: string | null; security_level: string | null }
type TimeSlot = { id: string; slot_start: string; slot_end: string; delivery_point_id: string; current_count: number | null; max_capacity: number | null }
type Step = 'cart' | 'timeslot' | 'payment' | 'receipt'

const PAYMENT_METHODS = [
  { id: 'wallet',    label: 'Mi Saldo AERO',  icon: Wallet,     description: 'Débito automático del saldo' },
  { id: 'qr',       label: 'Código QR',       icon: QrCode,     description: 'Escanea con tu app bancaria' },
  { id: 'nequi',    label: 'Nequi',           icon: Smartphone, description: 'Paga con tu celular Nequi' },
  { id: 'daviplata',label: 'Daviplata',        icon: Smartphone, description: 'Paga con Daviplata' },
]

type CartItem = { product_id: string; name: string; price: number; quantity: number }

export default function NewOrderPage() {
  const router = useRouter()
  const { items, vendor_id, vendor_name, total, updateQuantity, clear } = useCartStore()

  const [step, setStep]                   = useState<Step>('cart')
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([])
  const [slots, setSlots]                 = useState<TimeSlot[]>([])
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot]   = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet')
  const [phone, setPhone]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [orderId, setOrderId]             = useState<string | null>(null)
  const [orderTime, setOrderTime]         = useState('')
  const [orderTotal, setOrderTotal]       = useState(0)
  const [snapshot, setSnapshot]           = useState<CartItem[]>([])
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  const refCode = useRef(`AERO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`)

  const currentTotal = total()
  const selectedPointData = deliveryPoints.find(d => d.id === selectedPoint)
  const selectedSlotData  = slots.find(s => s.id === selectedSlot)

  useEffect(() => {
    if (items.length === 0 && step !== 'receipt') router.replace('/student/home')
  }, [items, step, router])

  useEffect(() => {
    if (step !== 'timeslot') return
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/timeslots?date=${today}`)
      .then(r => r.json())
      .then(data => {
        const s: TimeSlot[] = data.slots ?? []
        setSlots(s)
        if (s.length > 0 && !selectedPoint) setSelectedPoint(s[0].delivery_point_id)
      })
    const supabase = createClient()
    supabase.from('delivery_points').select('id, name, description, security_level').eq('is_active', true)
      .then(({ data }) => setDeliveryPoints(data ?? []))
  }, [step])

  useEffect(() => {
    if (step !== 'payment') return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('students').select('wallet_balance').eq('id', user.id).single()
        .then(({ data }) => setWalletBalance(data?.wallet_balance ?? 0))
    })
  }, [step])

  const filteredSlots = slots.filter(s => s.delivery_point_id === selectedPoint)
  const grouped = filteredSlots.reduce<Record<string, TimeSlot[]>>((acc, s) => {
    const h = s.slot_start.slice(0, 2)
    acc[h] = [...(acc[h] ?? []), s]
    return acc
  }, {})

  async function submitOrder() {
    if (!selectedSlot || !selectedPoint || !vendor_id) return
    if ((paymentMethod === 'nequi' || paymentMethod === 'daviplata') && phone.replace(/\D/g, '').length < 10) {
      setError('Ingresa un número de celular válido (10 dígitos)')
      return
    }
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
          payment_method: paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al crear pedido'); setLoading(false); return }

      // Snapshot before clearing
      setSnapshot([...items])
      setOrderTotal(currentTotal)
      setOrderId(data.order_id)
      setOrderTime(new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }))
      clear()
      setStep('receipt')
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  if (items.length === 0 && step !== 'receipt') return null

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header (hidden on receipt) ── */}
      {step !== 'receipt' && (
        <div className="bg-white sticky top-0 z-10 px-4 pt-12 pb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => step === 'cart' ? router.back() : setStep(step === 'payment' ? 'timeslot' : 'cart')}
              className="p-1.5 rounded-full hover:bg-background"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="font-display font-bold text-text-primary text-lg leading-tight">
                {step === 'cart' ? 'Tu pedido' : step === 'timeslot' ? 'Elige franja de recogida' : 'Método de pago'}
              </h1>
              {vendor_name && <p className="text-text-secondary text-xs font-body">{vendor_name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            {(['cart', 'timeslot', 'payment'] as Step[]).map((s, i) => (
              <div key={s} className={cn('h-1 flex-1 rounded-full transition-colors',
                step === s || (step === 'timeslot' && i === 0) || (step === 'payment' && i <= 1)
                  ? 'bg-primary' : 'bg-gray-200')} />
            ))}
          </div>
        </div>
      )}

      {/* ── CART ── */}
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
          <div className="bg-white rounded-card shadow-sm p-4 mt-3">
            <div className="flex justify-between text-sm font-body text-text-secondary">
              <span>Subtotal</span><span>{fmt(currentTotal)}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-text-primary text-base mt-2 pt-2 border-t border-border">
              <span>Total</span><span>{fmt(currentTotal)}</span>
            </div>
          </div>
          <button onClick={() => setStep('timeslot')}
            className="w-full mt-4 bg-primary text-white rounded-button py-3.5 font-display font-semibold">
            Elegir franja horaria
          </button>
        </div>
      )}

      {/* ── TIMESLOT ── */}
      {step === 'timeslot' && (
        <div className="px-4 py-4">
          <h2 className="text-sm font-display font-bold text-text-secondary uppercase tracking-wider mb-2">Punto de entrega</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
            {deliveryPoints.map(dp => (
              <button key={dp.id} onClick={() => { setSelectedPoint(dp.id); setSelectedSlot(null) }}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-body whitespace-nowrap transition-colors shrink-0',
                  selectedPoint === dp.id ? 'bg-primary text-white border-primary' : 'bg-white text-text-primary border-border')}>
                <MapPin size={13} />{dp.name}
              </button>
            ))}
          </div>
          <h2 className="text-sm font-display font-bold text-text-secondary uppercase tracking-wider mb-2">Franjas disponibles</h2>
          {Object.keys(grouped).length === 0 ? (
            <div className="bg-white rounded-card p-6 text-center">
              <Clock size={32} className="text-text-disabled mx-auto mb-2" />
              <p className="text-text-secondary font-body text-sm">Sin franjas disponibles para hoy</p>
            </div>
          ) : Object.entries(grouped).sort().map(([hour, hourSlots]) => (
            <div key={hour} className="mb-3">
              <p className="text-xs text-text-secondary font-body mb-1.5">{hour}:00</p>
              <div className="flex flex-wrap gap-2">
                {hourSlots.map(slot => {
                  const full = ((slot.current_count ?? 0) / (slot.max_capacity ?? 10)) >= 0.3
                  return (
                    <button key={slot.id} disabled={full} onClick={() => setSelectedSlot(slot.id)}
                      className={cn('px-3 py-2 rounded-xl border text-sm font-body transition-colors',
                        full ? 'bg-gray-100 text-text-disabled border-transparent cursor-not-allowed' :
                        selectedSlot === slot.id ? 'bg-primary text-white border-primary' : 'bg-white text-text-primary border-border')}>
                      {slot.slot_start.slice(0, 5)} – {slot.slot_end.slice(0, 5)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <button disabled={!selectedSlot} onClick={() => setStep('payment')}
            className={cn('w-full mt-6 rounded-button py-3.5 font-display font-semibold transition-colors',
              selectedSlot ? 'bg-primary text-white' : 'bg-gray-200 text-text-disabled cursor-not-allowed')}>
            {selectedSlot
              ? `Confirmar ${slots.find(s => s.id === selectedSlot)?.slot_start.slice(0, 5)} – ${slots.find(s => s.id === selectedSlot)?.slot_end.slice(0, 5)}`
              : 'Selecciona una franja'}
          </button>
        </div>
      )}

      {/* ── PAYMENT ── */}
      {step === 'payment' && (
        <div className="px-4 py-4">
          {/* Summary */}
          <div className="bg-white rounded-card shadow-sm p-4 mb-4">
            <h2 className="font-display font-bold text-text-primary text-sm mb-3">Resumen del pedido</h2>
            {items.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm font-body text-text-secondary mb-1">
                <span>{item.name} × {item.quantity}</span>
                <span>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-display font-bold text-text-primary text-base mt-2 pt-2 border-t border-border">
              <span>Total</span><span>{fmt(currentTotal)}</span>
            </div>
          </div>

          {/* Method selector */}
          <h2 className="text-sm font-display font-bold text-text-secondary uppercase tracking-wider mb-2">Método de pago</h2>
          <div className="flex flex-col gap-2 mb-4">
            {PAYMENT_METHODS.map(pm => {
              const Icon = pm.icon
              return (
                <button key={pm.id} onClick={() => { setPaymentMethod(pm.id); setPhone(''); setError('') }}
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

          {/* Wallet form */}
          {paymentMethod === 'wallet' && (
            <div className="bg-white rounded-card border border-primary/30 p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={18} className="text-primary" />
                <p className="font-display font-semibold text-text-primary text-sm">Saldo AERO</p>
              </div>
              {walletBalance === null ? (
                <div className="flex justify-center py-2">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-text-secondary text-sm font-body">Saldo disponible</p>
                    <p className={cn('font-display font-bold', walletBalance >= currentTotal ? 'text-accent' : 'text-error')}>
                      {fmt(walletBalance)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-text-secondary text-sm font-body">A descontar</p>
                    <p className="font-display font-bold text-error">- {fmt(currentTotal)}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <p className="text-text-secondary text-sm font-body">Saldo restante</p>
                    <p className={cn('font-display font-bold', walletBalance - currentTotal >= 0 ? 'text-text-primary' : 'text-error')}>
                      {fmt(walletBalance - currentTotal)}
                    </p>
                  </div>
                  {walletBalance < currentTotal && (
                    <p className="text-error text-xs font-body mt-2 text-center">
                      Saldo insuficiente — recarga tu cartera antes de pagar
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* QR form */}
          {paymentMethod === 'qr' && (
            <div className="bg-white rounded-card border border-border p-4 mb-4 text-center">
              <p className="font-display font-semibold text-text-primary text-sm mb-3">
                Escanea con tu app bancaria
              </p>
              <div className="w-44 h-44 mx-auto bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center mb-3">
                <svg viewBox="0 0 100 100" className="w-36 h-36">
                  {/* Top-left finder */}
                  <rect x="10" y="10" width="28" height="28" fill="none" stroke="#111" strokeWidth="3"/>
                  <rect x="16" y="16" width="16" height="16" fill="#111"/>
                  {/* Top-right finder */}
                  <rect x="62" y="10" width="28" height="28" fill="none" stroke="#111" strokeWidth="3"/>
                  <rect x="68" y="16" width="16" height="16" fill="#111"/>
                  {/* Bottom-left finder */}
                  <rect x="10" y="62" width="28" height="28" fill="none" stroke="#111" strokeWidth="3"/>
                  <rect x="16" y="68" width="16" height="16" fill="#111"/>
                  {/* Data modules (static pattern) */}
                  <rect x="42" y="10" width="4" height="4" fill="#111"/>
                  <rect x="50" y="10" width="4" height="4" fill="#111"/>
                  <rect x="42" y="18" width="4" height="4" fill="#111"/>
                  <rect x="56" y="18" width="4" height="4" fill="#111"/>
                  <rect x="10" y="42" width="4" height="4" fill="#111"/>
                  <rect x="18" y="42" width="4" height="4" fill="#111"/>
                  <rect x="26" y="50" width="4" height="4" fill="#111"/>
                  <rect x="42" y="42" width="4" height="4" fill="#111"/>
                  <rect x="50" y="50" width="4" height="4" fill="#111"/>
                  <rect x="58" y="42" width="4" height="4" fill="#111"/>
                  <rect x="66" y="50" width="4" height="4" fill="#111"/>
                  <rect x="74" y="42" width="4" height="4" fill="#111"/>
                  <rect x="82" y="50" width="4" height="4" fill="#111"/>
                  <rect x="42" y="58" width="4" height="4" fill="#111"/>
                  <rect x="58" y="58" width="4" height="4" fill="#111"/>
                  <rect x="66" y="66" width="4" height="4" fill="#111"/>
                  <rect x="74" y="58" width="4" height="4" fill="#111"/>
                  <rect x="82" y="66" width="4" height="4" fill="#111"/>
                  <rect x="50" y="74" width="4" height="4" fill="#111"/>
                  <rect x="66" y="74" width="4" height="4" fill="#111"/>
                  <rect x="82" y="74" width="4" height="4" fill="#111"/>
                  <rect x="42" y="82" width="4" height="4" fill="#111"/>
                  <rect x="58" y="82" width="4" height="4" fill="#111"/>
                  <rect x="74" y="82" width="4" height="4" fill="#111"/>
                </svg>
              </div>
              <p className="text-text-secondary text-xs font-body">
                Referencia: <span className="font-mono font-bold text-text-primary">{refCode.current}</span>
              </p>
              <p className="text-primary font-display font-bold text-xl mt-1">{fmt(currentTotal)}</p>
            </div>
          )}

          {/* Nequi / Daviplata form */}
          {(paymentMethod === 'nequi' || paymentMethod === 'daviplata') && (
            <div className="bg-white rounded-card border border-border p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                  paymentMethod === 'nequi' ? 'bg-purple-100' : 'bg-red-100')}>
                  <Smartphone size={16} className={paymentMethod === 'nequi' ? 'text-purple-600' : 'text-red-600'} />
                </div>
                <p className="font-display font-semibold text-text-primary text-sm">
                  Pagar con {paymentMethod === 'nequi' ? 'Nequi' : 'Daviplata'}
                </p>
              </div>
              <p className="text-text-secondary text-xs font-body mb-3">
                Ingresa el número registrado en {paymentMethod === 'nequi' ? 'Nequi' : 'Daviplata'}
              </p>
              <label className="text-text-secondary text-xs font-display font-semibold uppercase tracking-wider block mb-1.5">
                Número de celular
              </label>
              <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-3 bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="text-text-secondary text-sm font-mono">+57</span>
                <div className="w-px h-4 bg-border" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="3XX XXX XXXX"
                  className="flex-1 bg-transparent text-sm font-mono text-text-primary placeholder:text-text-disabled outline-none"
                />
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-text-secondary text-xs font-body">Monto a pagar</p>
                <p className={cn('font-display font-bold text-xl mt-0.5',
                  paymentMethod === 'nequi' ? 'text-purple-600' : 'text-red-600')}>
                  {fmt(currentTotal)}
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-error text-sm font-body mt-2 text-center">{error}</p>}

          <button onClick={submitOrder} disabled={loading}
            className="w-full mt-3 bg-primary text-white rounded-button py-3.5 font-display font-semibold disabled:opacity-60">
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Procesando pago...
                </span>
              : `Pagar ${fmt(currentTotal)}`}
          </button>
        </div>
      )}

      {/* ── RECEIPT ── */}
      {step === 'receipt' && orderId && (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Success header */}
          <div className="bg-success px-6 pt-16 pb-10 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={36} className="text-white" />
            </div>
            <h1 className="text-white font-display font-bold text-2xl">¡Pago exitoso!</h1>
            <p className="text-white/80 text-sm font-body mt-1">Tu pedido ha sido confirmado</p>
          </div>

          {/* Receipt card */}
          <div className="px-4 -mt-5 pb-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

              {/* Receipt header */}
              <div className="px-5 pt-5 pb-4 border-b border-dashed border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={15} className="text-text-secondary" />
                  <p className="font-display font-bold text-text-primary text-sm">Recibo de compra</p>
                </div>
                <p className="font-mono text-xs text-text-secondary bg-background px-2 py-0.5 rounded-lg">
                  #{orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Order meta */}
              <div className="px-5 py-4 border-b border-dashed border-border space-y-2">
                <Row label="Vendedor"          value={vendor_name ?? '—'} />
                <Row label="Fecha y hora"       value={orderTime} />
                <Row label="Franja de recogida" value={selectedSlotData
                  ? `${selectedSlotData.slot_start.slice(0, 5)} – ${selectedSlotData.slot_end.slice(0, 5)}`
                  : '—'} />
                <Row label="Punto de entrega"   value={selectedPointData?.name ?? '—'} />
              </div>

              {/* Items */}
              <div className="px-5 py-4 border-b border-dashed border-border">
                <p className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider mb-2">Ítems</p>
                {snapshot.map(item => (
                  <div key={item.product_id} className="flex justify-between text-sm font-body text-text-secondary mb-1">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Payment */}
              <div className="px-5 py-4 border-b border-dashed border-border space-y-2">
                <Row label="Método de pago"
                  value={PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? paymentMethod} />
                {(paymentMethod === 'nequi' || paymentMethod === 'daviplata') && phone && (
                  <Row label="Celular" value={`+57 ${phone}`} />
                )}
                <Row label="Estado" value="Pagado ✓" valueClass="text-success font-bold" />
              </div>

              {/* Total */}
              <div className="px-5 py-5 flex items-center justify-between">
                <p className="font-display font-bold text-text-primary text-base">Total pagado</p>
                <p className="font-display font-bold text-primary text-2xl">{fmt(orderTotal)}</p>
              </div>
            </div>

            <button onClick={() => router.push(`/student/order/${orderId}/tracking`)}
              className="w-full mt-4 bg-primary text-white rounded-button py-3.5 font-display font-semibold">
              Ver estado del pedido
            </button>
            <button onClick={() => router.push('/student/home')}
              className="w-full mt-2 bg-white border border-border text-text-primary rounded-button py-3.5 font-display font-semibold">
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-xs font-body text-text-secondary">{label}</p>
      <p className={cn('text-xs font-semibold text-text-primary text-right max-w-[55%]', valueClass)}>{value}</p>
    </div>
  )
}
