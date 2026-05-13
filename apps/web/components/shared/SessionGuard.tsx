'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SessionGuard({ role }: { role: 'student' | 'vendor' }) {
  const router = useRouter()

  useEffect(() => {
    // Disabled in dev so you can test both roles in the same browser
    if (process.env.NODE_ENV === 'development') return

    const supabase = createClient()

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const actualRole = profile?.role ?? user.user_metadata?.role
      if (actualRole && actualRole !== role) {
        router.replace(actualRole === 'vendor' ? '/vendor/dashboard' : '/student/home')
      }
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        check()
      }
    })

    return () => subscription.unsubscribe()
  }, [role, router])

  return null
}
