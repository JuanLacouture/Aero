'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wallet, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Transaction = {
  id: string
  type: 'topup' | 'purchase' | 'refund'
  amount: number
  balance_after: number
  reference: string | null
  created_at: string | null
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000]
const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function WalletPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [topping, setTopping] = useState(false)
  const [success, setSuccess] = useState(false)
  const [topupError, setTopupError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [studentRes, txRes] = await Promise.all([
        supabase.from('students').select('wallet_balance').eq('id', user.id).single(),
        supabase.from('wallet_transactions')
          .select('id, type, amount, balance_after, reference, created_at')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
      ])

      if (studentRes.data) setBalance(studentRes.data.wallet_balance ?? 0)
      if (txRes.data) setTransactions(txRes.data as Transaction[])
      setLoading(false)
    }
    load()
  }, [])

  const parsedCustom = parseInt(custom.replace(/\D/g, ''), 10)
  const amount = selected ?? (custom && !isNaN(parsedCustom) ? parsedCustom : 0)

  async function handleTopup() {
    if (!amount || amount < 1000) return
    setTopping(true)
    setTopupError('')
    setSuccess(false)

    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })

    setTopping(false)

    if (res.ok) {
      const data = (await res.json()) as { new_balance: number; transaction: Transaction }
      setBalance(data.new_balance)
      setTransactions(prev => [data.transaction, ...prev])
      setSelected(null)
      setCustom('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const json = (await res.json()) as { error: string }
      setTopupError(json.error ?? 'Error al recargar')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header azul con saldo */}
      <div className="bg-primary px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="p-1.5 rounded-full bg-white/15">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="font-display font-bold text-white text-xl">Mi Saldo AERO</h1>
        </div>

        <div className="bg-white/15 rounded-2xl px-5 py-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wallet size={18} className="text-primary-light" />
            <span className="text-primary-light text-sm font-body">Saldo disponible</span>
          </div>
          <p className="text-white font-mono font-bold text-4xl">{fmt(balance)}</p>
          <p className="text-blue-200 text-xs font-body mt-1">Saldo simulado AERO</p>
        </div>
      </div>

      {/* Sección de recarga */}
      <div className="mx-4 mt-4 bg-white rounded-card shadow-sm p-4">
        <h2 className="font-display font-bold text-text-primary text-base mb-3">Recargar saldo</h2>

        {/* Montos rápidos */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => { setSelected(a === selected ? null : a); setCustom('') }}
              className={cn(
                'py-2 rounded-xl text-sm font-display font-semibold border transition-colors',
                selected === a
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-text-secondary border-border hover:border-primary/50',
              )}
            >
              {fmt(a)}
            </button>
          ))}
        </div>

        {/* Monto personalizado */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-body text-sm">$</span>
          <input
            type="number"
            placeholder="Otro monto (mín. $1.000)"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(null) }}
            className="w-full bg-background rounded-xl pl-7 pr-4 py-2.5 text-sm font-body text-text-primary placeholder:text-text-disabled outline-none focus:ring-2 focus:ring-primary/30"
            min={1000}
            max={500000}
          />
        </div>

        {success && (
          <p className="text-success text-sm font-body text-center mb-3 font-semibold">
            ✓ ¡Recarga exitosa!
          </p>
        )}
        {topupError && (
          <p className="text-error text-sm font-body text-center mb-3">{topupError}</p>
        )}

        <button
          onClick={handleTopup}
          disabled={!amount || amount < 1000 || topping}
          className="w-full bg-primary text-white rounded-button py-3.5 font-display font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {topping ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus size={18} />
              {amount >= 1000 ? `Recargar ${fmt(amount)}` : 'Recargar saldo'}
            </>
          )}
        </button>
      </div>

      {/* Historial */}
      {transactions.length > 0 ? (
        <div className="mx-4 mt-4 bg-white rounded-card shadow-sm p-4">
          <h2 className="font-display font-bold text-text-primary text-base mb-1">Historial</h2>
          <div className="flex flex-col divide-y divide-border">
            {transactions.map(tx => {
              const isPositive = tx.type === 'topup' || tx.type === 'refund'
              const date = tx.created_at
                ? new Date(tx.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                : ''
              const label =
                tx.type === 'topup' ? 'Recarga' : tx.type === 'refund' ? 'Reembolso' : 'Compra'

              return (
                <div key={tx.id} className="flex items-center gap-3 py-3">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    isPositive ? 'bg-success/10' : 'bg-error/10',
                  )}>
                    {isPositive
                      ? <ArrowUpCircle size={18} className="text-success" />
                      : <ArrowDownCircle size={18} className="text-error" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-text-primary text-sm">{label}</p>
                    {tx.reference && (
                      <p className="font-body text-text-secondary text-xs truncate">{tx.reference}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      'font-mono font-bold text-sm',
                      isPositive ? 'text-success' : 'text-text-primary',
                    )}>
                      {isPositive ? '+' : '-'}{fmt(tx.amount)}
                    </p>
                    <p className="text-text-disabled text-xs">{date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <Wallet size={40} className="text-text-disabled mx-auto mb-3" />
          <p className="text-text-secondary font-body text-sm">Sin movimientos aún</p>
        </div>
      )}
    </div>
  )
}
