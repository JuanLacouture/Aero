import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface OrderItem {
  product_id: string
  quantity: number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verify user is a student
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') {
    return NextResponse.json({ error: 'Solo estudiantes pueden crear pedidos' }, { status: 403 })
  }

  const body = await request.json()
  const { vendor_id, items, delivery_point_id, time_slot_id, notes } = body

  if (!vendor_id || !items?.length || !delivery_point_id || !time_slot_id) {
    return NextResponse.json(
      { error: 'vendor_id, items, delivery_point_id y time_slot_id son requeridos' },
      { status: 400 }
    )
  }

  // Verify slot capacity < 30%
  const { data: slot } = await supabase
    .from('time_slots')
    .select('id, max_capacity, current_count')
    .eq('id', time_slot_id)
    .single()

  if (!slot) {
    return NextResponse.json({ error: 'Franja horaria no encontrada' }, { status: 404 })
  }

  const occupancy = (slot.current_count ?? 0) / (slot.max_capacity ?? 10)
  if (occupancy >= 0.3) {
    return NextResponse.json({ error: 'Franja horaria al máximo de capacidad' }, { status: 409 })
  }

  // Fetch product prices and validate they belong to this vendor
  const productIds = (items as OrderItem[]).map(i => i.product_id)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, price, is_available, vendor_id')
    .in('id', productIds)

  if (productsError || !products?.length) {
    return NextResponse.json({ error: 'Productos no encontrados' }, { status: 404 })
  }

  const invalidProduct = products.find(p => p.vendor_id !== vendor_id || !p.is_available)
  if (invalidProduct) {
    return NextResponse.json({ error: 'Uno o más productos no están disponibles' }, { status: 400 })
  }

  // Calculate total
  const priceMap = Object.fromEntries(products.map(p => [p.id, p.price]))
  const orderItems = (items as OrderItem[]).map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: priceMap[item.product_id],
  }))
  const total = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      student_id: user.id,
      vendor_id,
      time_slot_id,
      delivery_point_id,
      total_amount: total,
      payment_method: 'wallet',
      payment_status: 'pending',
      status: 'pending',
      notes: notes ?? null,
      estimated_minutes: 15,
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Error creando pedido' }, { status: 500 })
  }

  // Insert order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map(i => ({ ...i, order_id: order.id })))

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Increment slot count
  await supabase
    .from('time_slots')
    .update({ current_count: (slot.current_count ?? 0) + 1 })
    .eq('id', time_slot_id)

  // Simulate payment: insert payment record + mark order as paid
  await supabase.from('payments').insert({
    order_id: order.id,
    student_id: user.id,
    amount: total,
    method: 'wallet',
    status: 'paid',
    external_tx_id: `SIM-${Date.now()}`,
    log_data: { simulated: true, timestamp: new Date().toISOString() },
  })

  await supabase
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', order.id)

  return NextResponse.json({ order_id: order.id }, { status: 201 })
}
