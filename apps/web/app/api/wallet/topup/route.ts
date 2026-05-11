import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().int().min(1000, 'Mínimo $1.000').max(500000, 'Máximo $500.000'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { amount } = parsed.data

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('wallet_balance')
    .eq('id', user.id)
    .single()

  if (studentError || !student) {
    return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
  }

  const newBalance = (student.wallet_balance ?? 0) + amount

  const { error: updateError } = await supabase
    .from('students')
    .update({ wallet_balance: newBalance })
    .eq('id', user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  const { data: transaction, error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      student_id: user.id,
      type: 'topup' as const,
      amount,
      balance_after: newBalance,
      reference: `AERO-TOPUP-${Date.now()}`,
    })
    .select()
    .single()

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  return NextResponse.json({ new_balance: newBalance, transaction })
}
