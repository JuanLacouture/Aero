'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/utils/image-compression'
import { ArrowLeft, Bell, Camera, ChevronRight, LogOut, Wallet, CheckCircle } from 'lucide-react'

type StudentData = {
  university_id: string | null
  wallet_balance: number | null
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function StudentProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [student, setStudent] = useState<StudentData | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const [profileRes, studentRes] = await Promise.all([
        supabase.from('profiles').select('full_name, phone, avatar_url').eq('id', user.id).single(),
        supabase.from('students').select('university_id, wallet_balance').eq('id', user.id).single(),
      ])

      if (profileRes.data) {
        setFullName(profileRes.data.full_name)
        setPhone(profileRes.data.phone ?? '')
        setAvatarUrl(profileRes.data.avatar_url)
      }
      if (studentRes.data) {
        setStudent(studentRes.data)
        setUniversityId(studentRes.data.university_id ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const compressed = await compressImage(file)
      const path = `${user.id}/avatar.webp`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' })

      if (!error) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`
        setAvatarUrl(url)
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      }
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setSaveError('El nombre no puede estar vacío')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, studentRes] = await Promise.all([
      supabase.from('profiles').update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      }).eq('id', user.id),
      supabase.from('students').update({
        university_id: universityId.trim() || null,
      }).eq('id', user.id),
    ])

    setSaving(false)

    if (profileRes.error || studentRes.error) {
      setSaveError(profileRes.error?.message ?? studentRes.error?.message ?? 'Error al guardar')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header azul con avatar */}
      <div className="bg-primary px-4 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-1.5 rounded-full bg-white/15">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="font-display font-bold text-white text-xl">Mi Perfil</h1>
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative"
            disabled={uploadingAvatar}
          >
            <div className="w-20 h-20 rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-display font-bold text-2xl">{initials || '?'}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
              {uploadingAvatar ? (
                <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={12} className="text-primary" />
              )}
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <p className="text-white font-display font-bold text-lg mt-3">{fullName || '—'}</p>
          <p className="text-blue-200 text-sm font-body">{email}</p>
        </div>
      </div>

      {/* Formulario de edición */}
      <div className="mx-4 mt-4 bg-white rounded-card shadow-sm p-4">
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
              className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide block mb-1.5">
              Carné universitario
            </label>
            <input
              value={universityId}
              onChange={e => setUniversityId(e.target.value)}
              className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="p. ej. 200012345"
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
              className="w-full bg-background rounded-xl px-3 py-2.5 text-sm font-body text-text-primary outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="+57 300 000 0000"
            />
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 mt-4 text-success text-sm font-body">
            <CheckCircle size={16} />
            Cambios guardados
          </div>
        )}
        {saveError && (
          <p className="mt-3 text-error text-sm font-body">{saveError}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 bg-primary text-white rounded-button py-3.5 font-display font-semibold flex items-center justify-center disabled:opacity-60"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>

      {/* Saldo */}
      {student !== null && (
        <Link href="/student/wallet">
          <div className="mx-4 mt-3 bg-white rounded-card shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-secondary font-body">Saldo AERO</p>
              <p className="font-display font-bold text-text-primary">
                {fmt(student.wallet_balance ?? 0)}
              </p>
            </div>
            <ChevronRight size={18} className="text-text-secondary" aria-hidden="true" />
          </div>
        </Link>
      )}

      {/* Configuración */}
      <div className="mx-4 mt-3 bg-white rounded-card shadow-sm divide-y divide-border">
        <p className="px-4 pt-4 pb-2 text-xs font-display font-semibold text-text-secondary uppercase tracking-wide">
          Configuración
        </p>

        {/* Email de la cuenta */}
        <div className="px-4 py-3">
          <p className="text-xs font-display font-semibold text-text-secondary uppercase tracking-wide mb-0.5">
            Cuenta
          </p>
          <p className="text-sm font-body text-text-primary">{email}</p>
        </div>

        {/* Push notifications toggle */}
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bell size={17} className="text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-text-primary">Notificaciones</p>
              <p className="text-xs font-body text-text-secondary">Estado del pedido en tiempo real</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={notificationsEnabled}
            aria-label="Activar notificaciones push"
            onClick={() => setNotificationsEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notificationsEnabled ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Logout */}
        <div className="px-4 py-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 py-3.5 text-error"
          >
            <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
              <LogOut size={17} className="text-error" aria-hidden="true" />
            </div>
            <span className="text-sm font-display font-semibold">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}
