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
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.user_metadata?.role === 'vendor') {
        const { data: existing } = await supabase
          .from('vendors').select('id').eq('id', user.id).single()

        if (!existing) {
          await supabase.from('profiles').update({ role: 'vendor' }).eq('id', user.id)
          await supabase.from('students').delete().eq('id', user.id)
          await supabase.from('vendors').insert({
            id: user.id,
            business_name: user.user_metadata.business_name ?? 'Mi Negocio',
          })
        }

        return NextResponse.redirect(`${origin}/vendor/dashboard`)
      }

      return NextResponse.redirect(`${origin}/student/home`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
