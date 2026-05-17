'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pedido pendiente',
  confirmed: 'Pedido confirmado',
  preparing: 'Preparando tu pedido',
  ready: '¡Tu pedido está listo!',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-primary',
  preparing: 'bg-orange-500',
  ready: 'bg-success',
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `student_id=eq.${user.id}` }, () => fetchActive(user.id))
        .subscribe()
    }

    init()
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  if (!order) return null

  const bgColor = STATUS_COLORS[order.status] ?? 'bg-primary'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.9 }}
      className="fixed top-[68px] right-4 md:top-[76px] md:right-6 z-40"
    >
      <Link
        href={`/student/order/${order.id}/tracking`}
        className={`flex items-center gap-2.5 shadow-blue rounded-2xl px-5 py-3 whitespace-nowrap drop-shadow-md ${bgColor} text-white`}
      >
        {/* Pulse ring */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60"
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <ShoppingBag size={15} className="shrink-0" />
        <span className="text-sm font-display font-semibold">
          {STATUS_LABELS[order.status] ?? 'Pedido activo'}
        </span>
      </Link>
    </motion.div>
  )
}
