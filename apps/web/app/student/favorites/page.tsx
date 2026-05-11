'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Heart, Star, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type FavoriteVendor = {
  fav_id: string
  id: string
  business_name: string
  description: string | null
  cover_image_url: string | null
  rating_avg: number | null
  rating_count: number | null
  is_open: boolean | null
  schedule_start: string | null
  schedule_end: string | null
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteVendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('favorites')
        .select(`
          id,
          vendors (
            id, business_name, description, cover_image_url,
            rating_avg, rating_count, is_open, schedule_start, schedule_end
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        const mapped = (data as unknown as {
          id: string
          vendors: Omit<FavoriteVendor, 'fav_id'> | null
        }[])
          .filter(f => f.vendors !== null)
          .map(f => ({ fav_id: f.id, ...f.vendors! }))
        setFavorites(mapped)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function removeFav(favId: string) {
    const supabase = createClient()
    await supabase.from('favorites').delete().eq('id', favId)
    setFavorites(prev => prev.filter(f => f.fav_id !== favId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-4 pt-12 pb-5">
        <p className="text-primary-light text-xs font-body uppercase tracking-wide mb-0.5">AERO · La Sabana</p>
        <h1 className="text-white text-xl font-display font-bold">Mis Favoritos</h1>
        <p className="text-blue-200 text-sm font-body mt-0.5">
          {favorites.length > 0
            ? `${favorites.length} vendedor${favorites.length !== 1 ? 'es' : ''} guardado${favorites.length !== 1 ? 's' : ''}`
            : 'Aún no tienes favoritos'}
        </p>
      </div>

      <div className="px-4 py-5">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 rounded-full p-5 mb-4">
              <Heart size={40} className="text-primary" />
            </div>
            <p className="font-display font-bold text-text-primary text-lg">Sin favoritos aún</p>
            <p className="text-text-secondary text-sm font-body mt-1 max-w-xs">
              Toca el corazón en el menú de un vendedor para guardarlo aquí
            </p>
            <Link
              href="/student/home"
              className="mt-6 bg-primary text-white rounded-button px-6 py-3 font-display font-semibold"
            >
              Explorar vendedores
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {favorites.map(v => (
              <FavoriteCard key={v.fav_id} vendor={v} onRemove={() => removeFav(v.fav_id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FavoriteCard({
  vendor,
  onRemove,
}: {
  vendor: FavoriteVendor
  onRemove: () => void
}) {
  const schedule =
    vendor.schedule_start && vendor.schedule_end
      ? `${vendor.schedule_start.slice(0, 5)} – ${vendor.schedule_end.slice(0, 5)}`
      : null

  return (
    <div className="bg-white rounded-card shadow-sm overflow-hidden">
      <Link href={`/student/vendor/${vendor.id}/menu`}>
        <div className="h-28 bg-primary-light relative">
          {vendor.cover_image_url ? (
            <img
              src={vendor.cover_image_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
              <span className="text-3xl opacity-50">🍽️</span>
            </div>
          )}
          <span
            className={cn(
              'absolute top-2 right-2 text-xs font-display font-semibold px-2 py-0.5 rounded-full',
              vendor.is_open ? 'bg-success text-white' : 'bg-gray-500/80 text-white',
            )}
          >
            {vendor.is_open ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
      </Link>

      <div className="p-3 flex items-center gap-2">
        <Link href={`/student/vendor/${vendor.id}/menu`} className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-text-primary text-base leading-tight truncate">
            {vendor.business_name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-display font-semibold text-text-primary">
                {vendor.rating_avg?.toFixed(1) ?? '—'}
              </span>
              {vendor.rating_count != null && (
                <span className="text-xs text-text-secondary">({vendor.rating_count})</span>
              )}
            </div>
            {schedule && <span className="text-xs text-text-secondary">{schedule}</span>}
          </div>
        </Link>

        <button
          onClick={onRemove}
          className="p-2 rounded-full hover:bg-error/10 transition-colors shrink-0"
          aria-label="Quitar de favoritos"
        >
          <Heart size={20} className="fill-error text-error" />
        </button>

        <Link href={`/student/vendor/${vendor.id}/menu`} className="shrink-0">
          <ChevronRight size={18} className="text-text-secondary" />
        </Link>
      </div>
    </div>
  )
}
