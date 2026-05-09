'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Store, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const [role, setRole] = useState<'student' | 'vendor'>('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role, business_name: businessName } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('No se pudo crear la cuenta')
      setLoading(false)
      return
    }

    // If no session, email confirmation is required
    if (!data.session) {
      setError('Revisa tu correo y confirma tu cuenta para continuar.')
      setLoading(false)
      return
    }

    if (role === 'vendor') {
      const res = await fetch('/api/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: businessName }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Error al registrar vendedor')
        setLoading(false)
        return
      }

      window.location.href = '/vendor/dashboard'
    } else {
      window.location.href = '/student/home'
    }
  }

  async function handleOAuth(provider: 'google' | 'azure') {
    setOauthLoading(provider)
    setError('')
    const supabase = createClient()

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
        skipBrowserRedirect: true,
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
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className={cn('px-6 pt-16 pb-10 text-center', role === 'vendor' ? 'bg-vendor' : 'bg-primary')}>
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow">
          <span className={cn('text-2xl font-display font-extrabold', role === 'vendor' ? 'text-vendor' : 'text-primary')}>A</span>
        </div>
        <h1 className="text-white text-2xl font-display font-bold">Crear cuenta</h1>
        <p className={cn('text-sm font-body mt-1', role === 'vendor' ? 'text-orange-200' : 'text-blue-200')}>
          Únete a AERO hoy
        </p>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-background px-6 pt-6 pb-8 -mt-4 rounded-t-3xl">
        {/* Role toggle */}
        <div className="flex gap-2 mb-5 p-1 bg-white border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-semibold transition-all',
              role === 'student' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'
            )}
          >
            <GraduationCap size={16} />
            Estudiante
          </button>
          <button
            type="button"
            onClick={() => setRole('vendor')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-semibold transition-all',
              role === 'vendor' ? 'bg-vendor text-white shadow-sm' : 'text-text-secondary'
            )}
          >
            <Store size={16} />
            Vendedor
          </button>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Full name */}
          <div>
            <label className="text-text-secondary text-xs font-display font-semibold uppercase tracking-wider mb-1.5 block">
              Nombre completo
            </label>
            <div className="relative">
              <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                required
                autoComplete="name"
                className={cn(
                  'w-full pl-10 pr-4 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 transition-all',
                  role === 'vendor' ? 'focus:border-vendor focus:ring-vendor/20' : 'focus:border-primary focus:ring-primary/20'
                )}
              />
            </div>
          </div>

          {/* Business name (vendor only) */}
          {role === 'vendor' && (
            <div>
              <label className="text-text-secondary text-xs font-display font-semibold uppercase tracking-wider mb-1.5 block">
                Nombre del negocio
              </label>
              <div className="relative">
                <Store size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Ej: Cafetería El Sabor"
                  required={role === 'vendor'}
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-vendor focus:ring-2 focus:ring-vendor/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
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
                className={cn(
                  'w-full pl-10 pr-4 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 transition-all',
                  role === 'vendor' ? 'focus:border-vendor focus:ring-vendor/20' : 'focus:border-primary focus:ring-primary/20'
                )}
              />
            </div>
          </div>

          {/* Password */}
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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
                className={cn(
                  'w-full pl-10 pr-11 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 transition-all',
                  role === 'vendor' ? 'focus:border-vendor focus:ring-vendor/20' : 'focus:border-primary focus:ring-primary/20'
                )}
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
            className={cn(
              'w-full text-white rounded-button py-4 font-display font-bold text-base shadow-lg disabled:opacity-60 active:scale-[0.98] transition-all mt-1',
              role === 'vendor' ? 'bg-vendor' : 'bg-primary'
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creando cuenta...
              </span>
            ) : 'Crear cuenta'}
          </button>
        </form>

        {/* OAuth — only for students */}
        {role === 'student' && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-text-disabled text-xs font-body">o regístrate con</span>
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
          </>
        )}

        <p className="text-center text-text-secondary text-sm font-body mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
