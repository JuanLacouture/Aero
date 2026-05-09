import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { order_id } = body

  if (!order_id) {
    return NextResponse.json({ error: 'order_id requerido' }, { status: 400 })
  }

  // Verify order belongs to student
  const { data: order } = await supabase
    .from('orders')
    .select('id, total_amount, payment_status, student_id')
    .eq('id', order_id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  if (order.student_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ ok: true, status: 'paid', already_paid: true })
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1200))

  // Insert payment record
  const { error: paymentError } = await supabase.from('payments').insert({
    order_id: order.id,
    student_id: user.id,
    amount: order.total_amount,
    method: 'wallet',
    status: 'paid',
    external_tx_id: `SIM-${Date.now()}`,
    log_data: { simulated: true, timestamp: new Date().toISOString() },
  })

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 })
  }

  // Mark order as paid
  await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', order.id)

  return NextResponse.json({ ok: true, status: 'paid' })
}
