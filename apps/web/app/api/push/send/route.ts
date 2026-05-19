import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

export async function POST(request: NextRequest) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:aero@unisabana.edu.co',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY ?? ''
  )
  const body = await request.json()
  const { user_id, title, body: msgBody, url } = body

  if (!user_id || !title || !msgBody) {
    return NextResponse.json({ error: 'user_id, title y body son requeridos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('fcm_token')
    .eq('id', user_id)
    .single()

  if (!profile?.fcm_token) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    const subscription = JSON.parse(profile.fcm_token)
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body: msgBody, url })
    )
  } catch {
    // Expired or invalid subscription — clear it silently
    await supabase
      .from('profiles')
      .update({ fcm_token: null })
      .eq('id', user_id)
  }

  return NextResponse.json({ ok: true })
}
