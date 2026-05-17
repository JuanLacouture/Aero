'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

type Props = {
  orderId: string
  shortId: string
  vendorName: string | null
}

export default function ConfirmedClient({ orderId, shortId, vendorName }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
        className="bg-success/10 rounded-full p-6 mb-6"
      >
        <CheckCircle size={72} className="text-success" strokeWidth={1.5} aria-hidden="true" />
      </motion.div>

      {/* Title + subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.38 }}
      >
        <h1 className="text-2xl font-display font-bold text-text-primary">¡Pedido confirmado!</h1>
        <p className="text-text-secondary font-body mt-2">
          {vendorName
            ? `Tu pedido en ${vendorName} fue procesado exitosamente`
            : 'El pago fue procesado exitosamente'}
        </p>
      </motion.div>

      {/* Order code card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.38 }}
        className="bg-white rounded-card shadow-sm px-6 py-5 mt-6 w-full max-w-xs"
      >
        <p className="text-text-secondary text-xs font-body uppercase tracking-wider mb-1">
          Código de pedido
        </p>
        <p className="font-mono font-bold text-text-primary text-xl tracking-widest">
          #CAP-{shortId}
        </p>
        {vendorName && (
          <p className="text-text-secondary text-sm font-body mt-2">{vendorName}</p>
        )}
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62, duration: 0.38 }}
        className="flex flex-col gap-3 w-full mt-8 max-w-xs"
      >
        <Link
          href={`/student/order/${orderId}/tracking`}
          className="w-full bg-primary text-white rounded-button py-3.5 font-display font-semibold text-center block"
        >
          Seguir mi pedido
        </Link>
        <Link
          href="/student/home"
          className="w-full border border-border text-text-primary rounded-button py-3.5 font-display font-semibold text-center block"
        >
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  )
}
