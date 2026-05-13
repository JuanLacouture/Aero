import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isStudentRoute = path.startsWith('/student')
  const isVendorRoute = path.startsWith('/vendor')
  const isAuthPage = path === '/login' || path === '/register'

  if (!user && (isStudentRoute || isVendorRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    let role = user.user_metadata?.role as 'student' | 'vendor' | undefined

    if (!role) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      role = (prof?.role as 'student' | 'vendor') ?? 'student'
    }

    if (isAuthPage) {
      return NextResponse.redirect(new URL(role === 'vendor' ? '/vendor/dashboard' : '/student/home', request.url))
    }

    if (isStudentRoute && role === 'vendor') {
      return NextResponse.redirect(new URL('/vendor/dashboard', request.url))
    }

    if (isVendorRoute && role === 'student') {
      return NextResponse.redirect(new URL('/student/home', request.url))
    }
  }

  return supabaseResponse
}
