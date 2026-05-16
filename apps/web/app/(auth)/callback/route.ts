import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (c: { name: string; value: string; options?: Record<string, unknown> }[]) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])) } }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[OAuth callback error]', error.message, error.status)
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${origin}/login?error=oauth_failed`)

    // Ensure profile exists — OAuth users have no trigger-based profile creation
    const { data: profile } = await supabase
      .from('profiles').select('id, role').eq('id', user.id).single()

    if (!profile) {
      const fullName = user.user_metadata?.full_name
        ?? user.user_metadata?.name
        ?? user.email?.split('@')[0]
        ?? 'Usuario'

      await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: 'student',
      })
      await supabase.from('students').insert({ id: user.id })

      return NextResponse.redirect(`${origin}/student/home`)
    }

    // Existing vendor
    if (profile.role === 'vendor') {
      const { data: existing } = await supabase
        .from('vendors').select('id').eq('id', user.id).single()

      if (!existing) {
        await supabase.from('vendors').insert({
          id: user.id,
          business_name: user.user_metadata?.business_name ?? 'Mi Negocio',
        })
      }

      return NextResponse.redirect(`${origin}/vendor/dashboard`)
    }

    return NextResponse.redirect(`${origin}/student/home`)
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
