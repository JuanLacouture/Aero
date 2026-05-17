'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ChevronRight, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type VendorRow = {
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

function formatSchedule(start: string | null, end: string | null) {
  if (!start || !end) return null
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
}

export default function VendorCardList({
  vendors,
  dimmed,
}: {
  vendors: VendorRow[]
  dimmed?: boolean
}) {
  // favMap: vendorId → favorites row id
  const [favMap, setFavMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('favorites')
        .select('id, vendor_id')
        .eq('student_id', user.id)
        .then(({ data }) => {
          if (!data) return
          setFavMap(new Map(data.map(f => [f.vendor_id as string, f.id as string])))
        })
    })
  }, [])

  async function toggleFav(e: React.MouseEvent, vendorId: string) {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existingId = favMap.get(vendorId)
    if (existingId) {
      setFavMap(prev => { const next = new Map(prev); next.delete(vendorId); return next })
      await supabase.from('favorites').delete().eq('id', existingId)
    } else {
      const { data, error } = await supabase
        .from('favorites')
        .insert({ student_id: user.id, vendor_id: vendorId })
        .select('id')
        .single()
      if (!error && data) {
        setFavMap(prev => new Map(prev).set(vendorId, data.id as string))
      }
    }
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', dimmed && 'opacity-60')}>
      {vendors.map(vendor => {
        const schedule = formatSchedule(vendor.schedule_start, vendor.schedule_end)
        const isFav = favMap.has(vendor.id)

        return (
          <Link key={vendor.id} href={`/student/vendor/${vendor.id}/menu`}>
            <div className="bg-white rounded-card shadow-sm overflow-hidden active:scale-[0.98] transition-transform cursor-pointer">
              <div className="h-36 bg-primary-light relative">
                {vendor.cover_image_url ? (
                  <img
                    src={vendor.cover_image_url}
                    alt={vendor.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                    <span className="text-4xl opacity-60">🍽️</span>
                  </div>
                )}
                <span
                  className={`absolute top-2 left-2 text-xs font-display font-semibold px-2 py-0.5 rounded-full ${
                    vendor.is_open ? 'bg-success text-white' : 'bg-gray-500/80 text-white'
                  }`}
                >
                  {vendor.is_open ? 'Abierto' : 'Cerrado'}
                </span>
                <button
                  onClick={e => toggleFav(e, vendor.id)}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow"
                >
                  <Heart
                    size={18}
                    className={isFav ? 'text-red-500 fill-red-500' : 'text-text-secondary'}
                  />
                </button>
              </div>
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-text-primary text-base leading-tight truncate">
                    {vendor.business_name}
                  </h3>
                  {vendor.description && (
                    <p className="text-text-secondary text-xs font-body mt-0.5 line-clamp-1">
                      {vendor.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-display font-semibold text-text-primary">
                        {vendor.rating_avg?.toFixed(1) ?? '—'}
                      </span>
                      {vendor.rating_count != null && (
                        <span className="text-xs text-text-secondary">({vendor.rating_count})</span>
                      )}
                    </div>
                    {schedule && (
                      <span className="text-xs text-text-secondary">{schedule}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-secondary mt-0.5 shrink-0" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
