'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Star, CheckCircle } from 'lucide-react'

type Order = {
  id: string
  status: string | null
  total_amount: number
  vendor_id: string
  vendors: { business_name: string } | null
  order_items: { quantity: number; products: { name: string } | null }[]
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="font-body text-text-primary text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
            <Star
              size={26}
              className={n <= value ? 'fill-primary text-primary' : 'fill-gray-100 text-gray-200'}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function RateOrderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadyRated, setAlreadyRated] = useState(false)

  const [hygiene, setHygiene] = useState(5)
  const [punctuality, setPunctuality] = useState(5)
  const [quality, setQuality] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select(`
          id, status, total_amount, vendor_id,
          vendors ( business_name ),
          order_items ( quantity, products ( name ) )
        `)
        .eq('id', id)
        .single()

      if (data) setOrder(data as unknown as Order)

      const { data: existing } = await supabase
        .from('ratings')
        .select('id')
        .eq('order_id', id)
        .maybeSingle()

      if (existing) setAlreadyRated(true)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: id,
        hygiene,
        punctuality,
        quality,
        comment: comment.trim() || undefined,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
    } else {
      const json = await res.json() as { error: string }
      setError(json.error ?? 'Error al enviar calificación')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="bg-success/10 rounded-full p-6 mb-6">
          <CheckCircle size={64} className="text-success" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary">¡Gracias por tu calificación!</h1>
        <p className="text-text-secondary font-body mt-2">Tu opinión ayuda a mejorar el servicio</p>
        <button
          onClick={() => router.push('/student/home')}
          className="mt-8 w-full max-w-xs bg-primary text-white rounded-button py-3.5 font-display font-semibold"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  if (alreadyRated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <CheckCircle size={48} className="text-primary mb-4" />
        <h2 className="font-display font-bold text-text-primary text-lg">Ya calificaste este pedido</h2>
        <button
          onClick={() => router.push('/student/home')}
          className="mt-6 bg-primary text-white rounded-button px-6 py-3 font-display font-semibold"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  if (!order || order.status !== 'delivered') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary font-body">Este pedido aún no puede ser calificado</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary font-semibold font-display"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="bg-white sticky top-0 z-10 px-4 pt-12 pb-3 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-background">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display font-bold text-text-primary text-lg">Calificar pedido</h1>
      </div>

      {/* Resumen del pedido */}
      <div className="mx-4 mt-4 bg-white rounded-card shadow-sm p-4">
        <p className="font-display font-bold text-text-primary text-base">
          {order.vendors?.business_name}
        </p>
        <p className="text-text-secondary font-body text-sm mt-0.5 line-clamp-2">
          {order.order_items.map(i => `${i.products?.name ?? 'Plato'} ×${i.quantity}`).join(', ')}
        </p>
        <p className="font-mono font-bold text-text-primary text-sm mt-1">{fmt(order.total_amount)}</p>
      </div>

      {/* Estrellas */}
      <div className="mx-4 mt-4 bg-white rounded-card shadow-sm px-4 divide-y divide-border">
        <StarRow label="Higiene" value={hygiene} onChange={setHygiene} />
        <StarRow label="Puntualidad" value={punctuality} onChange={setPunctuality} />
        <StarRow label="Calidad" value={quality} onChange={setQuality} />
      </div>

      {/* Comentario */}
      <div className="mx-4 mt-4 bg-white rounded-card shadow-sm p-4">
        <label className="text-sm font-display font-semibold text-text-primary block mb-2">
          Comentario{' '}
          <span className="text-text-disabled font-body font-normal">(opcional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="¿Cómo fue tu experiencia?"
          className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary placeholder:text-text-disabled resize-none outline-none focus:ring-2 focus:ring-primary/30"
          rows={3}
          maxLength={500}
        />
        <p className="text-right text-xs text-text-disabled mt-1">{comment.length}/500</p>
      </div>

      {error && (
        <p className="mx-4 mt-3 text-sm text-error font-body text-center">{error}</p>
      )}

      <div className="mx-4 mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-primary text-white rounded-button py-3.5 font-display font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Enviar calificación'
          )}
        </button>
      </div>
    </div>
  )
}
