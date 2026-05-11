import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getWeekBounds(offset = 0): { week_start: string; week_end: string } {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7) - offset * 7)
  monday.setUTCHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { week_start: fmt(monday), week_end: fmt(sunday) }
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Allow triggering a specific vendor via POST body, or run for all vendors
  let targetVendorId: string | null = null
  let weekOffset = 1 // default: last completed week
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      targetVendorId = body.vendor_id ?? null
      weekOffset = typeof body.week_offset === 'number' ? body.week_offset : 1
    } catch { /* no body */ }
  }

  const { week_start, week_end } = getWeekBounds(weekOffset)
  const weekStartTs = `${week_start}T00:00:00.000Z`
  const weekEndTs = `${week_end}T23:59:59.999Z`

  // Get vendors to process
  let vendorIds: string[] = []
  if (targetVendorId) {
    vendorIds = [targetVendorId]
  } else {
    const { data: vendors } = await supabase.from('vendors').select('id')
    vendorIds = (vendors ?? []).map((v: { id: string }) => v.id)
  }

  const results: { vendor_id: string; status: string }[] = []

  for (const vendor_id of vendorIds) {
    try {
      // Fetch all delivered orders for this vendor in the week
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .eq('vendor_id', vendor_id)
        .eq('status', 'delivered')
        .gte('created_at', weekStartTs)
        .lte('created_at', weekEndTs)

      if (ordersErr) throw ordersErr

      const orderList = orders ?? []
      const total_orders = orderList.length
      const total_revenue = orderList.reduce(
        (sum: number, o: { total_amount: number | null }) => sum + (o.total_amount ?? 0),
        0,
      )

      // Find top product by quantity sold
      let top_product_id: string | null = null
      if (orderList.length > 0) {
        const orderIds = orderList.map((o: { id: string }) => o.id)
        const { data: items } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .in('order_id', orderIds)

        if (items && items.length > 0) {
          const counts: Record<string, number> = {}
          for (const item of items as { product_id: string; quantity: number }[]) {
            counts[item.product_id] = (counts[item.product_id] ?? 0) + item.quantity
          }
          top_product_id = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
        }
      }

      // Daily breakdown for report_data
      const dailyMap: Record<string, { orders: number; revenue: number }> = {}
      for (const o of orderList as { id: string; total_amount: number | null; created_at: string }[]) {
        const day = o.created_at.slice(0, 10)
        if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0 }
        dailyMap[day].orders++
        dailyMap[day].revenue += o.total_amount ?? 0
      }

      const report_data = {
        daily: dailyMap,
        avg_order_value: total_orders > 0 ? Math.round(total_revenue / total_orders) : 0,
      }

      // Upsert into weekly_reports (unique on vendor_id + week_start)
      const { error: upsertErr } = await supabase
        .from('weekly_reports')
        .upsert({
          vendor_id,
          week_start,
          week_end,
          total_orders,
          total_revenue,
          top_product_id,
          report_data,
          status: 'generated',
          generated_at: new Date().toISOString(),
        }, { onConflict: 'vendor_id,week_start' })

      if (upsertErr) throw upsertErr
      results.push({ vendor_id, status: 'generated' })
    } catch (err) {
      // Mark failed and continue
      await supabase.from('weekly_reports').upsert({
        vendor_id,
        week_start,
        week_end,
        status: 'failed',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'vendor_id,week_start' })
      results.push({ vendor_id, status: 'failed' })
    }
  }

  return new Response(
    JSON.stringify({ week_start, week_end, results }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
