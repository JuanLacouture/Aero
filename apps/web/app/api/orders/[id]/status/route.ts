import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['delivered'],
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { status: newStatus } = body

  if (!newStatus) {
    return NextResponse.json({ error: 'status requerido' }, { status: 400 })
  }

  // Fetch order, verify vendor ownership
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, vendor_id, student_id')
    .eq('id', id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  if (order.vendor_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const currentStatus = order.status ?? 'pending'
  const allowed = VALID_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Transición inválida: ${currentStatus} → ${newStatus}` },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Fire-and-forget push notification to student when order is ready
  if (newStatus === 'ready' && order.student_id) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    fetch(`${appUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: order.student_id,
        title: '¡Tu pedido está listo! 🎉',
        body: 'Ya puedes recoger tu pedido en el punto de entrega.',
        url: `/student/order/${id}/tracking`,
      }),
    }).catch(() => {/* non-blocking */})
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
