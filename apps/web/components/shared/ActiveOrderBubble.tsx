'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag } from 'lucide-react'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pedido pendiente',
  confirmed: 'Pedido confirmado',
  preparing: 'Preparando tu pedido',
  ready: '¡Tu pedido está listo!',
}

type ActiveOrder = { id: string; status: string }

export default function ActiveOrderBubble() {
  const [order, setOrder] = useState<ActiveOrder | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function fetchActive(userId: string) {
      const { data } = await supabase
        .from('orders')
        .select('id, status')
        .eq('student_id', userId)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) setOrder(data ?? null)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      await fetchActive(user.id)
      if (cancelled) return

      channel = supabase
        .channel(`active-order-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `student_id=eq.${user.id}`,
        }, () => fetchActive(user.id))
        .subscribe()
    }

    init()
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  if (!order) return null

  const isReady = order.status === 'ready'

  return (
    <Link
      href={`/student/order/${order.id}/tracking`}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 shadow-lg rounded-full px-4 py-2.5 whitespace-nowrap ${
        isReady ? 'bg-success' : 'bg-primary'
      } text-white`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
      </span>
      <ShoppingBag size={15} className="shrink-0" />
      <span className="text-sm font-display font-semibold">
        {STATUS_LABELS[order.status] ?? 'Pedido activo'}
      </span>
    </Link>
  )
}
