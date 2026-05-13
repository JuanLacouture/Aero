import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COL_OFFSET_MS = 5 * 60 * 60 * 1000 // Colombia = UTC-5

function getWeekBounds(offset = 0) {
  const now = new Date()
  const col = new Date(now.getTime() - COL_OFFSET_MS)
  const dow = col.getUTCDay()
  const daysToMon = (dow + 6) % 7

  const monCol = new Date(col)
  monCol.setUTCDate(col.getUTCDate() - daysToMon - offset * 7)
  monCol.setUTCHours(0, 0, 0, 0)

  const sunEndCol = new Date(monCol.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  return {
    week_start: monCol.toISOString().slice(0, 10),
    week_end: sunEndCol.toISOString().slice(0, 10),
    weekStartTs: new Date(monCol.getTime() + COL_OFFSET_MS).toISOString(),
    weekEndTs: new Date(sunEndCol.getTime() + COL_OFFSET_MS).toISOString(),
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'vendor') {
    return NextResponse.json({ error: 'Solo vendedores pueden generar reportes' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({})) as { week_offset?: number }
  const weekOffset = typeof body.week_offset === 'number' ? body.week_offset : 0

  const { week_start, week_end, weekStartTs, weekEndTs } = getWeekBounds(weekOffset)

  const admin = createAdminClient()

  const { data: orders, error: ordersErr } = await admin
    .from('orders')
    .select('id, total_amount, created_at')
    .eq('vendor_id', user.id)
    .eq('status', 'delivered')
    .gte('created_at', weekStartTs)
    .lte('created_at', weekEndTs)

  if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 })

  const orderList = orders ?? []
  const total_orders = orderList.length
  const total_revenue = orderList.reduce(
    (sum: number, o: { total_amount: number | null }) => sum + (o.total_amount ?? 0),
    0,
  )

  let top_product_id: string | null = null
  if (orderList.length > 0) {
    const { data: items } = await admin
      .from('order_items')
      .select('product_id, quantity')
      .in('order_id', orderList.map((o: { id: string }) => o.id))

    if (items && items.length > 0) {
      const counts: Record<string, number> = {}
      for (const item of items as { product_id: string; quantity: number }[]) {
        counts[item.product_id] = (counts[item.product_id] ?? 0) + item.quantity
      }
      top_product_id = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    }
  }

  const dailyMap: Record<string, { orders: number; revenue: number }> = {}
  for (const o of orderList as { id: string; total_amount: number | null; created_at: string }[]) {
    // Convert UTC timestamp to Colombia local date
    const colDate = new Date(new Date(o.created_at).getTime() - COL_OFFSET_MS)
      .toISOString()
      .slice(0, 10)
    if (!dailyMap[colDate]) dailyMap[colDate] = { orders: 0, revenue: 0 }
    dailyMap[colDate].orders++
    dailyMap[colDate].revenue += o.total_amount ?? 0
  }

  const report_data = {
    daily: dailyMap,
    avg_order_value: total_orders > 0 ? Math.round(total_revenue / total_orders) : 0,
  }

  const { data: report, error: upsertErr } = await admin
    .from('weekly_reports')
    .upsert(
      {
        vendor_id: user.id,
        week_start,
        week_end,
        total_orders,
        total_revenue,
        top_product_id,
        report_data,
        status: 'generated',
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'vendor_id,week_start' },
    )
    .select()
    .single()

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  return NextResponse.json({ success: true, report })
}
