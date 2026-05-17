'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      setError('No se pudo completar el inicio de sesión. Intenta con email y contraseña.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : authError.message
      )
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    window.location.href = profile?.role === 'vendor' ? '/vendor/dashboard' : '/student/home'
  }

  async function handleOAuth(provider: 'google' | 'azure') {
    setOauthLoading(provider)
    setError('')
    const supabase = createClient()

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/callback`,
        skipBrowserRedirect: true,
        ...(provider === 'azure' && { scopes: 'openid email profile' }),
      },
    })

    if (oauthError || !data?.url) {
      setError('Este proveedor no está habilitado. Usa email y contraseña.')
      setOauthLoading(null)
      return
    }

    window.location.href = data.url
  }

  return (
    <>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="text-text-secondary text-xs font-display font-semibold uppercase tracking-wider mb-1.5 block">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-text-secondary text-xs font-display font-semibold uppercase tracking-wider mb-1.5 block">
            Contraseña
          </label>
          <div className="relative">
            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-11 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3">
            <p className="text-error text-sm font-body">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-button py-4 font-display font-bold text-base shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all mt-1"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Entrando...
            </span>
          ) : 'Iniciar sesión'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-text-disabled text-xs font-body">o continúa con</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => handleOAuth('google')}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-button py-3.5 text-sm font-display font-semibold text-text-primary hover:bg-background active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
        >
          {oauthLoading === 'google' ? (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continuar con Google
        </button>
        <button
          onClick={() => handleOAuth('azure')}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-button py-3.5 text-sm font-display font-semibold text-text-primary hover:bg-background active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
        >
          {oauthLoading === 'azure' ? (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
          )}
          Microsoft (@unisabana)
        </button>
      </div>

      <p className="text-center text-text-secondary text-sm font-body mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-primary font-semibold">
          Regístrate
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel — desktop only */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-primary flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/3 left-[-40px] w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 text-center">
          <Image
            src="/logo-aero.jpg"
            alt="Aero"
            width={160}
            height={64}
            className="h-14 w-auto mx-auto mb-6 brightness-0 invert"
            priority
          />
          <p className="text-blue-200 text-lg font-body mt-3">Pide · Paga · Recoge</p>
          <p className="text-blue-300 text-sm font-body mt-4 max-w-xs mx-auto leading-relaxed">
            Tu comida favorita del campus, lista cuando la necesites
          </p>
          <p className="text-blue-300/50 text-xs font-body mt-16">
            Universidad de La Sabana · Capstone 2026-1
          </p>
          <div className="mt-12 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left max-w-xs mx-auto">
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FFD60A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <p className="text-white/90 text-sm font-body leading-relaxed italic">
              "Pedí mi almuerzo entre clases y estaba listo en 15 minutos"
            </p>
            <p className="text-blue-300 text-xs font-body mt-3 font-semibold">
              — María, Ingeniería Industrial
            </p>
          </div>
        </div>
      </div>

      {/* Right side — full on mobile, half on desktop */}
      <div className="flex-1 flex flex-col bg-background md:items-center md:justify-center">
        {/* Mobile header */}
        <div className="bg-primary px-6 pt-16 pb-10 text-center md:hidden">
          <Image
            src="/logo-aero.jpg"
            alt="Aero"
            width={100}
            height={40}
            className="h-10 w-auto mx-auto mb-4"
            priority
          />
          <h1 className="text-white text-2xl font-display font-bold">Bienvenido de nuevo</h1>
          <p className="text-blue-200 text-sm font-body mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Form area */}
        <div className="flex-1 bg-background px-6 pt-6 pb-8 -mt-4 rounded-t-3xl md:flex-none md:w-full md:max-w-md md:mt-0 md:rounded-none md:bg-transparent md:px-8 md:py-0">
          <div className="hidden md:block mb-8">
            <h1 className="text-text-primary text-2xl font-display font-bold">Bienvenido de nuevo</h1>
            <p className="text-text-secondary text-sm font-body mt-1">Inicia sesión para continuar</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
