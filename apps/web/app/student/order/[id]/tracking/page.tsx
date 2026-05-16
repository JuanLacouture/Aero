'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { ArrowLeft, MapPin, CheckCircle, Clock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

function getDeliveryCode(orderId: string): string {
  return String(parseInt(orderId.replace(/-/g, '').slice(0, 8), 16) % 10000).padStart(4, '0')
}

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

type Order = {
  id: string
  status: OrderStatus | null
  total_amount: number
  estimated_minutes: number | null
  created_at: string | null
  vendors: { business_name: string; location_lat: number | null; location_lng: number | null } | null
  delivery_points: { name: string; lat: number; lng: number } | null
  order_items: {
    quantity: number
    unit_price: number
    products: { name: string } | null
  }[]
}

const STATUS_STEPS: { key: OrderStatus; label: string; description: string }[] = [
  { key: 'pending', label: 'Recibido', description: 'Tu pedido fue enviado' },
  { key: 'confirmed', label: 'Confirmado', description: 'El vendedor lo aceptó' },
  { key: 'preparing', label: 'En preparación', description: 'Están preparando tu pedido' },
  { key: 'ready', label: 'Listo', description: 'Tu pedido está listo para recoger' },
  { key: 'delivered', label: 'Entregado', description: '¡Disfruta tu comida!' },
]

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending: 0, confirmed: 1, preparing: 2, ready: 3, delivered: 4, cancelled: -1,
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

function MapContent({
  vendorPos,
  deliveryPos,
}: {
  vendorPos: { lat: number; lng: number } | null
  deliveryPos: { lat: number; lng: number }
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    if (vendorPos) {
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(vendorPos)
      bounds.extend(deliveryPos)
      map.fitBounds(bounds, 60)
    } else {
      map.setCenter(deliveryPos)
      map.setZoom(17)
    }
  }, [map, vendorPos, deliveryPos])

  return (
    <>
      {vendorPos && (
        <Marker position={vendorPos} title="Vendedor" label={{ text: '🍽', fontSize: '18px' }} />
      )}
      <Marker position={deliveryPos} title="Punto de entrega" label={{ text: '📍', fontSize: '18px' }} />
    </>
  )
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('orders')
      .select(`
        id, status, total_amount, estimated_minutes, created_at,
        vendors ( business_name, location_lat, location_lng ),
        delivery_points ( name, lat, lng ),
        order_items ( quantity, unit_price, products ( name ) )
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data as unknown as Order)
        setLoading(false)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`,
      }, payload => {
        setOrder(prev => prev ? { ...prev, status: payload.new.status, estimated_minutes: payload.new.estimated_minutes } : prev)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-text-secondary">Pedido no encontrado</p>
    </div>
  )

  const currentStep = STATUS_INDEX[order.status ?? 'pending']
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white sticky top-0 z-10 px-4 pt-12 pb-3 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-background">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display font-bold text-text-primary text-lg">Estado del pedido</h1>
      </div>

      {/* ETA */}
      {!isCancelled && !isDelivered && (
        <div className="mx-4 mt-4 bg-primary rounded-card p-5 text-center text-white">
          <p className="text-primary-light text-sm font-body">Tiempo estimado</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Clock size={28} />
            <span className="text-4xl font-display font-bold">{order.estimated_minutes ?? 15}</span>
            <span className="text-lg font-body">min</span>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="mx-4 mt-4 bg-success/10 rounded-card p-5 text-center">
          <CheckCircle size={40} className="text-success mx-auto mb-1" />
          <p className="font-display font-bold text-success text-lg">¡Pedido entregado!</p>
        </div>
      )}

      {/* Status timeline */}
      <div className="mx-4 mt-4 bg-white rounded-card shadow-sm p-4">
        <h2 className="font-display font-bold text-text-primary text-sm mb-4">Estado del pedido</h2>
        {STATUS_STEPS.map((step, idx) => {
          const done = currentStep >= idx
          const active = currentStep === idx
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  done ? 'bg-primary' : 'bg-gray-100')}>
                  {done ? <CheckCircle size={16} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={cn('w-0.5 flex-1 my-1', done ? 'bg-primary' : 'bg-gray-100')} style={{ minHeight: 20 }} />
                )}
              </div>
              <div className="pb-4 flex-1">
                <p className={cn('font-display font-semibold text-sm', done ? 'text-text-primary' : 'text-text-disabled')}>
                  {step.label}
                  {active && !isDelivered && <span className="ml-2 text-xs text-primary font-body">← ahora</span>}
                </p>
                <p className="text-text-secondary text-xs font-body">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 4-digit delivery code — show while order is active */}
      {!isDelivered && !isCancelled && (
        <div className="mx-4 mt-3 bg-white rounded-card shadow-sm p-4 flex flex-col items-center gap-3">
          <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide self-start">
            Código de entrega
          </p>
          <div className="flex gap-3">
            {getDeliveryCode(id).split('').map((digit, i) => (
              <div key={i} className="w-14 h-16 bg-primary/5 border-2 border-primary/20 rounded-xl flex items-center justify-center">
                <span className="text-4xl font-mono font-bold text-primary">{digit}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-body text-text-secondary text-center">
            Muestra este código al vendedor cuando llegues al punto de recogida
          </p>
        </div>
      )}

      {/* Order details */}
      <div className="mx-4 mt-3 bg-white rounded-card shadow-sm p-4">
        <h2 className="font-display font-bold text-text-primary text-sm mb-3">Detalle del pedido</h2>
        {order.vendors && <p className="text-text-secondary text-sm font-body">{order.vendors.business_name}</p>}
        {order.order_items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm font-body text-text-secondary mt-1">
            <span>{item.products?.name} × {item.quantity}</span>
            <span>{fmt(item.unit_price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between font-display font-bold text-text-primary text-base mt-2 pt-2 border-t border-border">
          <span>Total</span><span>{fmt(order.total_amount)}</span>
        </div>
      </div>

      {/* Delivery point + map */}
      {order.delivery_points && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="mx-4 mt-3 bg-white rounded-card shadow-sm overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <MapPin size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary font-body">
                {order.status === 'ready' ? 'Ve a recoger tu pedido en' : 'Punto de recogida'}
              </p>
              <p className="font-display font-semibold text-text-primary text-sm">{order.delivery_points.name}</p>
              {order.vendors?.location_lat && (
                <p className="text-xs text-text-secondary font-body mt-0.5">
                  Preparándose en {order.vendors.business_name}
                </p>
              )}
            </div>
            <Link href="/student/map" className="text-xs text-primary font-display font-semibold">
              Ver mapa →
            </Link>
          </div>
          <div className="h-52 w-full">
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
              <Map
                defaultCenter={{ lat: order.delivery_points.lat, lng: order.delivery_points.lng }}
                defaultZoom={17}
                gestureHandling="greedy"
                disableDefaultUI
                style={{ width: '100%', height: '100%' }}
              >
                <MapContent
                  vendorPos={
                    order.vendors?.location_lat && order.vendors?.location_lng
                      ? { lat: order.vendors.location_lat, lng: order.vendors.location_lng }
                      : null
                  }
                  deliveryPos={{ lat: order.delivery_points.lat, lng: order.delivery_points.lng }}
                />
              </Map>
            </APIProvider>
          </div>
        </div>
      )}

      {/* CTA calificar — solo cuando entregado */}
      {isDelivered && (
        <div className="mx-4 mt-4 mb-6">
          <Link
            href={`/student/order/${id}/rate`}
            className="w-full bg-primary text-white rounded-button py-3.5 font-display font-semibold text-center flex items-center justify-center gap-2"
          >
            <Star size={18} className="fill-white" />
            Calificar pedido
          </Link>
        </div>
      )}
    </div>
  )
}
