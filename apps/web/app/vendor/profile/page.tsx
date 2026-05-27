'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/utils/image-compression'
import { ArrowLeft, Camera, LogOut, Star, CheckCircle, ToggleLeft, ToggleRight, MessageSquare, ChevronRight } from 'lucide-react'
import { FeedbackModal } from '@/components/shared/FeedbackModal'
import { cn } from '@/lib/utils'

type VendorData = {
  business_name: string
  description: string | null
  cover_image_url: string | null
  schedule_start: string | null
  schedule_end: string | null
  rating_avg: number | null
  rating_count: number | null
  is_open: boolean | null
}

function toTimeInput(t: string | null): string {
  if (!t) return ''
  return t.slice(0, 5)
}

export default function VendorProfilePage() {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [vendor, setVendor] = useState<VendorData | null>(null)

  // Vendor form fields
  const [businessName, setBusinessName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleStart, setScheduleStart] = useState('06:00')
  const [scheduleEnd, setScheduleEnd] = useState('15:00')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [savingVendor, setSavingVendor] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [togglingOpen, setTogglingOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [savedVendor, setSavedVendor] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [vendorError, setVendorError] = useState('')
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const [profileRes, vendorRes] = await Promise.all([
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        supabase.from('vendors')
          .select('business_name, description, cover_image_url, schedule_start, schedule_end, rating_avg, rating_count, is_open')
          .eq('id', user.id)
          .single(),
      ])

      if (profileRes.data) {
        setFullName(profileRes.data.full_name)
        setPhone(profileRes.data.phone ?? '')
      }
      if (vendorRes.data) {
        const v = vendorRes.data
        setVendor(v)
        setBusinessName(v.business_name)
        setDescription(v.description ?? '')
        setScheduleStart(toTimeInput(v.schedule_start))
        setScheduleEnd(toTimeInput(v.schedule_end))
        setCoverUrl(v.cover_image_url)
        setIsOpen(v.is_open ?? false)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const compressed = await compressImage(file)
      const path = `${user.id}/cover.webp`

      const { error } = await supabase.storage
        .from('covers')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' })

      if (!error) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}?t=${Date.now()}`
        setCoverUrl(url)
        await supabase.from('vendors').update({ cover_image_url: url }).eq('id', user.id)
      }
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleToggleOpen() {
    setTogglingOpen(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const next = !isOpen
    await supabase.from('vendors').update({ is_open: next }).eq('id', user.id)
    setIsOpen(next)
    setTogglingOpen(false)
  }

  async function handleSaveVendor() {
    if (!businessName.trim()) {
      setVendorError('El nombre del negocio es requerido')
      return
    }
    setSavingVendor(true)
    setVendorError('')
    setSavedVendor(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('vendors').update({
      business_name: businessName.trim(),
      description: description.trim() || null,
      schedule_start: scheduleStart || null,
      schedule_end: scheduleEnd || null,
    }).eq('id', user.id)

    setSavingVendor(false)
    if (error) {
      setVendorError(error.message)
    } else {
      setSavedVendor(true)
      setTimeout(() => setSavedVendor(false), 3000)
    }
  }

  async function handleSaveProfile() {
    if (!fullName.trim()) {
      setProfileError('El nombre no puede estar vacío')
      return
    }
    setSavingProfile(true)
    setProfileError('')
    setSavedProfile(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    }).eq('id', user.id)

    setSavingProfile(false)
    if (error) {
      setProfileError(error.message)
    } else {
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 3000)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vendor-background">
        <div className="w-8 h-8 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-vendor-background pb-10">
      {/* Header naranja */}
      <div className="bg-vendor px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="p-1.5 rounded-full bg-white/15">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="font-display font-bold text-white text-xl">Mi Perfil</h1>
        </div>

        {/* Cover image */}
        <div className="relative rounded-2xl overflow-hidden h-32 bg-white/20 mb-4">
          {coverUrl ? (
            <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/50 font-body text-sm">Sin imagen de portada</span>
            </div>
          )}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-2 right-2 bg-black/40 text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-display font-semibold"
          >
            {uploadingCover ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={12} />
            )}
            Cambiar portada
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-display font-bold text-lg leading-tight">
              {businessName || '—'}
            </p>
            {vendor?.rating_avg != null && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={13} className="fill-vendor-accent text-vendor-accent" />
                <span className="text-white text-sm font-display font-semibold">
                  {vendor.rating_avg.toFixed(1)}
                </span>
                <span className="text-orange-200 text-xs font-body">
                  ({vendor.rating_count ?? 0} reseñas)
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleToggleOpen}
            disabled={togglingOpen}
            className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2"
          >
            {isOpen
              ? <ToggleRight size={22} className="text-white" />
              : <ToggleLeft size={22} className="text-white/60" />}
            <span className={cn('text-sm font-display font-semibold', isOpen ? 'text-white' : 'text-white/60')}>
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </button>
        </div>
      </div>

      {/* Formulario negocio */}
      <div className="mx-4 mt-4 bg-white rounded-card shadow-sm p-4">
        <h2 className="font-display font-bold text-text-primary text-base mb-4">
          Información del negocio
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Nombre del negocio *
            </label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-vendor/30"
              placeholder="Nombre de tu negocio"
            />
          </div>

          <div>
            <label className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-vendor/30 resize-none"
              placeholder="Describe tu negocio brevemente..."
              rows={2}
              maxLength={300}
            />
            <p className="text-right text-xs text-text-disabled mt-0.5">{description.length}/300</p>
          </div>

          <div>
            <label className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Horario de atención
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-secondary font-body mb-1">Apertura</p>
                <input
                  type="time"
                  value={scheduleStart}
                  onChange={e => setScheduleStart(e.target.value)}
                  className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-vendor/30"
                />
              </div>
              <div>
                <p className="text-xs text-text-secondary font-body mb-1">Cierre</p>
                <input
                  type="time"
                  value={scheduleEnd}
                  onChange={e => setScheduleEnd(e.target.value)}
                  className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-vendor/30"
                />
              </div>
            </div>
          </div>
        </div>

        {savedVendor && (
          <div className="flex items-center gap-2 mt-4 text-success text-sm font-body">
            <CheckCircle size={16} />
            Cambios guardados
          </div>
        )}
        {vendorError && (
          <p className="mt-3 text-error text-sm font-body">{vendorError}</p>
        )}

        <button
          onClick={handleSaveVendor}
          disabled={savingVendor}
          className="w-full mt-4 bg-vendor text-white rounded-button py-3.5 font-display font-semibold flex items-center justify-center disabled:opacity-60"
        >
          {savingVendor ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Guardar información del negocio'
          )}
        </button>
      </div>

      {/* Formulario perfil personal */}
      <div className="mx-4 mt-3 bg-white rounded-card shadow-sm p-4">
        <h2 className="font-display font-bold text-text-primary text-base mb-4">
          Información personal
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Nombre completo *
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-vendor/30"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Teléfono
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              type="tel"
              className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-vendor/30"
              placeholder="+57 300 000 0000"
            />
          </div>
        </div>

        {savedProfile && (
          <div className="flex items-center gap-2 mt-4 text-success text-sm font-body">
            <CheckCircle size={16} />
            Cambios guardados
          </div>
        )}
        {profileError && (
          <p className="mt-3 text-error text-sm font-body">{profileError}</p>
        )}

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="w-full mt-4 bg-vendor text-white rounded-button py-3.5 font-display font-semibold flex items-center justify-center disabled:opacity-60"
        >
          {savingProfile ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Guardar perfil personal'
          )}
        </button>
      </div>

      {/* Cuenta */}
      <div className="mx-4 mt-3 bg-white rounded-card shadow-sm px-4 py-3">
        <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-1">
          Cuenta
        </p>
        <p className="text-sm font-body text-text-primary">{email}</p>
      </div>

      {/* Feedback */}
      <div className="mx-4 mt-3 bg-white rounded-card shadow-sm px-4 py-1">
        <button
          onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 py-3.5 text-text-primary"
        >
          <div className="w-9 h-9 rounded-xl bg-vendor/10 flex items-center justify-center shrink-0">
            <MessageSquare size={17} className="text-vendor" aria-hidden="true" />
          </div>
          <span className="text-sm font-display font-semibold">Deja tu feedback</span>
          <ChevronRight size={16} className="text-text-secondary ml-auto" />
        </button>
      </div>

      {/* Cerrar sesión */}
      <div className="mx-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border border-error text-error rounded-button py-3.5 font-display font-semibold"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  )
}
