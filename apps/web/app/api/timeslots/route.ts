import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Parámetro date requerido (YYYY-MM-DD)' }, { status: 400 })
  }

  // Generate slots for this date if they don't exist yet
  await supabase.rpc('generate_day_slots', { target_date: date })

  // Return slots with < 30% capacity used
  const { data: slots, error } = await supabase
    .from('time_slots')
    .select(`
      id,
      slot_start,
      slot_end,
      date,
      max_capacity,
      current_count,
      delivery_point_id,
      delivery_points ( id, name, description, security_level )
    `)
    .eq('date', date)
    .order('slot_start')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const available = (slots ?? []).filter(
    s => (s.current_count ?? 0) / (s.max_capacity ?? 10) < 0.3
  )

  return NextResponse.json({ slots: available })
}
