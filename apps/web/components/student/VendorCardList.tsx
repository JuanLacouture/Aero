'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Clock, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
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

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-card animate-pulse">
      <div className="h-36 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function VendorCardList({
  vendors,
  dimmed,
}: {
  vendors: VendorRow[]
  dimmed?: boolean
}) {
  const [favMap, setFavMap] = useState<Map<string, string>>(new Map())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoaded(true); return }
      supabase
        .from('favorites')
        .select('id, vendor_id')
        .eq('student_id', user.id)
        .then(({ data }) => {
          if (data) setFavMap(new Map(data.map(f => [f.vendor_id as string, f.id as string])))
          setLoaded(true)
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

  if (!loaded) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', dimmed && 'opacity-60')}>
      {vendors.map((vendor, i) => {
        const schedule = formatSchedule(vendor.schedule_start, vendor.schedule_end)
        const isFav = favMap.has(vendor.id)

        return (
          <motion.div
            key={vendor.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={!dimmed ? { scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' } : {}}
          >
            <Link href={`/student/vendor/${vendor.id}/menu`}>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer transition-shadow">
                {/* Cover image */}
                <div className="h-36 bg-primary-light relative">
                  {vendor.cover_image_url ? (
                    <img
                      src={vendor.cover_image_url}
                      alt={vendor.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <span className="text-4xl opacity-50">🍽️</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={cn(
                    'absolute top-2.5 left-2.5 text-xs font-display font-semibold px-2.5 py-1 rounded-full',
                    vendor.is_open
                      ? 'bg-success text-white'
                      : 'bg-gray-900/60 text-white backdrop-blur-sm'
                  )}>
                    {vendor.is_open ? 'Abierto' : 'Cerrado'}
                  </span>

                  {/* Favorite button */}
                  <motion.button
                    onClick={e => toggleFav(e, vendor.id)}
                    whileTap={{ scale: 0.85 }}
                    className="absolute top-2.5 right-2.5 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm"
                  >
                    <Heart
                      size={16}
                      className={isFav ? 'text-red-500 fill-red-500' : 'text-gray-500'}
                    />
                  </motion.button>
                </div>

                {/* Card body */}
                <div className="p-3.5">
                  <h3 className="font-display font-bold text-gray-900 text-sm leading-tight truncate">
                    {vendor.business_name}
                  </h3>
                  {vendor.description && (
                    <p className="text-gray-400 text-xs font-body mt-0.5 line-clamp-1">
                      {vendor.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2.5 mt-2">
                    <div className="flex items-center gap-0.5">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-display font-semibold text-gray-900">
                        {vendor.rating_avg?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    {schedule && (
                      <div className="flex items-center gap-0.5">
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-xs text-gray-400 font-body">{schedule}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
