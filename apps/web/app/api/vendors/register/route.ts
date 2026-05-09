import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { business_name } = body

  if (!business_name?.trim()) {
    return NextResponse.json({ error: 'business_name requerido' }, { status: 400 })
  }

  // Update profile role to vendor
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'vendor' })
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Remove student row created by trigger
  await supabase.from('students').delete().eq('id', user.id)

  // Create vendor row
  const { error: vendorError } = await supabase
    .from('vendors')
    .insert({ id: user.id, business_name: business_name.trim() })

  if (vendorError) {
    return NextResponse.json({ error: vendorError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
