'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock, User, Store, GraduationCap, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { compressImage } from '@/lib/utils/image-compression'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [role, setRole] = useState<'student' | 'vendor'>('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

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

      if (coverFile) {
        try {
          const compressed = await compressImage(coverFile)
          const path = `${data.user.id}/cover.webp`
          const supabaseClient = createClient()
          const { error: uploadError } = await supabaseClient.storage
            .from('covers')
            .upload(path, compressed, { upsert: true, contentType: 'image/webp' })
          if (!uploadError) {
            const coverUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}?t=${Date.now()}`
            await supabaseClient
              .from('vendors')
              .update({ cover_image_url: coverUrl })
              .eq('id', data.user.id)
          }
        } catch {
          // Photo upload failure is non-fatal; vendor can add it from profile
        }
      }

      window.location.href = '/vendor/dashboard'
    } else {
      await supabase.from('students').insert({ id: data.user.id, wallet_balance: 0 })
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

  const isVendor = role === 'vendor'
  const accentColor = isVendor ? 'bg-vendor' : 'bg-primary'
  const focusRing = isVendor ? 'focus:border-vendor focus:ring-vendor/20' : 'focus:border-primary focus:ring-primary/20'

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel — desktop only */}
      <div className={cn(
        'hidden md:flex md:w-1/2 lg:w-2/5 flex-col items-center justify-center px-12 relative overflow-hidden transition-colors duration-300',
        isVendor ? 'bg-vendor' : 'bg-primary'
      )}>
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
          <p className={cn('text-lg font-body mt-3', isVendor ? 'text-orange-200' : 'text-blue-200')}>
            {isVendor ? 'Vende · Gestiona · Crece' : 'Pide · Paga · Recoge'}
          </p>
          <p className={cn('text-sm font-body mt-4 max-w-xs mx-auto leading-relaxed', isVendor ? 'text-orange-300' : 'text-blue-300')}>
            {isVendor
              ? 'Gestiona tu negocio y recibe pedidos en tiempo real'
              : 'Tu comida favorita del campus, lista cuando la necesites'}
          </p>
          <p className={cn('text-xs font-body mt-16 opacity-50', isVendor ? 'text-orange-300' : 'text-blue-300')}>
            Universidad de La Sabana · Capstone 2026-1
          </p>
          <div className="mt-12 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left max-w-xs mx-auto">
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FFD60A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <p className="text-white/90 text-sm font-body leading-relaxed italic">
              "Ya llevamos un semestre usando Aero — mis ventas subieron un 40%"
            </p>
            <p className="text-blue-300 text-xs font-body mt-3 font-semibold">
              — Carlos, Café Campus
            </p>
          </div>
        </div>
      </div>

      {/* Right side — full on mobile, half on desktop */}
      <div className="flex-1 flex flex-col bg-background md:items-center md:justify-center md:overflow-y-auto">
        {/* Mobile header */}
        <div className={cn('px-6 pt-16 pb-10 text-center md:hidden', isVendor ? 'bg-vendor' : 'bg-primary')}>
          <Image
            src="/logo-aero.jpg"
            alt="Aero"
            width={100}
            height={40}
            className="h-10 w-auto mx-auto mb-4"
            priority
          />
          <h1 className="text-white text-2xl font-display font-bold">Crear cuenta</h1>
          <p className={cn('text-sm font-body mt-1', isVendor ? 'text-orange-200' : 'text-blue-200')}>
            Únete a AERO hoy
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 bg-background px-6 pt-6 pb-8 -mt-4 rounded-t-3xl md:flex-none md:w-full md:max-w-md md:mt-0 md:rounded-none md:bg-transparent md:px-8 md:py-8">
          <div className="hidden md:block mb-6">
            <h1 className="text-text-primary text-2xl font-display font-bold">Crear cuenta</h1>
            <p className="text-text-secondary text-sm font-body mt-1">Únete a AERO hoy</p>
          </div>

          {/* Role toggle */}
          <div className="relative bg-gray-100 rounded-xl p-1 flex mb-4">
            <motion.div
              layoutId="rolePill"
              className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
              style={{ width: 'calc(50% - 4px)', left: role === 'student' ? '4px' : 'calc(50%)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`relative flex-1 py-2 text-sm font-display font-semibold rounded-lg transition-colors z-10 ${
                role === 'student' ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              Estudiante
            </button>
            <button
              type="button"
              onClick={() => setRole('vendor')}
              className={`relative flex-1 py-2 text-sm font-display font-semibold rounded-lg transition-colors z-10 ${
                role === 'vendor' ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              Vendedor
            </button>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
                    focusRing
                  )}
                />
              </div>
            </div>

            {isVendor && (
              <>
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
                      required={isVendor}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-vendor focus:ring-2 focus:ring-vendor/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-text-secondary text-xs font-display font-semibold uppercase tracking-wider mb-1.5 block">
                    Foto del restaurante <span className="normal-case font-normal">(opcional)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-vendor/40 rounded-xl overflow-hidden bg-vendor/5 active:scale-[0.98] transition-all"
                  >
                    {coverPreview ? (
                      <div className="relative h-32">
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-white text-xs font-display font-semibold flex items-center gap-1">
                            <Camera size={14} /> Cambiar foto
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 flex flex-col items-center justify-center gap-1.5">
                        <Camera size={24} className="text-vendor/60" />
                        <span className="text-vendor text-sm font-display font-semibold">Subir foto del restaurante</span>
                        <span className="text-text-secondary text-xs font-body">JPG, PNG o HEIC</span>
                      </div>
                    )}
                  </button>
                </div>
              </>
            )}

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
                    focusRing
                  )}
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
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={cn(
                    'w-full pl-10 pr-11 py-3.5 bg-white border border-border rounded-xl text-sm font-body text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 transition-all',
                    focusRing
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
                accentColor
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
    </div>
  )
}
