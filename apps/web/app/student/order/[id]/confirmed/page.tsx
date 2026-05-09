import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default async function OrderConfirmedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shortId = id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-success/10 rounded-full p-6 mb-6">
        <CheckCircle size={64} className="text-success" strokeWidth={1.5} />
      </div>

      <h1 className="text-2xl font-display font-bold text-text-primary">¡Pedido confirmado!</h1>
      <p className="text-text-secondary font-body mt-2">El pago fue procesado exitosamente</p>

      <div className="bg-white rounded-card shadow-sm px-6 py-4 mt-6 w-full max-w-xs">
        <p className="text-text-secondary text-xs font-body uppercase tracking-wider mb-1">Código de pedido</p>
        <p className="font-mono font-bold text-text-primary text-lg tracking-widest">#CAP-{shortId}</p>
      </div>

      <div className="flex flex-col gap-3 w-full mt-8">
        <Link href={`/student/order/${id}/tracking`}
          className="w-full bg-primary text-white rounded-button py-3.5 font-display font-semibold text-center block">
          Seguir mi pedido
        </Link>
        <Link href="/student/home"
          className="w-full border border-border text-text-primary rounded-button py-3.5 font-display font-semibold text-center block">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
