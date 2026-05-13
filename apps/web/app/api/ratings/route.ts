import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  order_id: z.string().uuid(),
  hygiene: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  quality: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
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

  const { order_id, hygiene, punctuality, quality, comment } = parsed.data

  const { data: order } = await supabase
    .from('orders')
    .select('id, student_id, vendor_id, status')
    .eq('id', order_id)
    .single()

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (order.student_id !== user.id) return NextResponse.json({ error: 'No autorizado: el pedido no pertenece a tu cuenta. Si cambiaste de sesión, vuelve a iniciar sesión.' }, { status: 403 })
  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'El pedido debe estar entregado para calificar' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('order_id', order_id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Este pedido ya fue calificado' }, { status: 409 })

  const { data, error } = await supabase
    .from('ratings')
    .insert({
      order_id,
      student_id: user.id,
      vendor_id: order.vendor_id,
      hygiene,
      punctuality,
      quality,
      comment: comment ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
