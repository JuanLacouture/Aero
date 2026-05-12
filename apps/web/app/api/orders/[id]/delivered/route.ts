import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, vendor_id, student_id, total_amount, payment_method, payment_status')
    .eq('id', id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  if (order.vendor_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (order.status !== 'ready') {
    return NextResponse.json(
      { error: `Transición inválida: ${order.status} → delivered` },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Safety net: if wallet payment wasn't processed at order creation, process now
  if (order.payment_method === 'wallet' && order.payment_status !== 'paid') {
    const { data: student } = await supabase
      .from('students')
      .select('wallet_balance')
      .eq('id', order.student_id)
      .single()

    if (student && student.wallet_balance >= order.total_amount) {
      const newBalance = student.wallet_balance - order.total_amount
      await supabase
        .from('students')
        .update({ wallet_balance: newBalance })
        .eq('id', order.student_id)

      await supabase.from('wallet_transactions').insert({
        student_id: order.student_id,
        type: 'purchase',
        amount: order.total_amount,
        balance_after: newBalance,
        reference: `ORDER-${id}`,
      })

      await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', id)
    }
  }

  return NextResponse.json({ ok: true, status: 'delivered' })
}
