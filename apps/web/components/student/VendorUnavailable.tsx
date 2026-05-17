'use client'

import Link from 'next/link'
import { Clock, ArrowLeft } from 'lucide-react'

type Props = {
  vendor: {
    business_name: string
    description: string | null
    cover_image_url: string | null
    schedule_start: string | null
    schedule_end: string | null
  }
}

export default function VendorUnavailable({ vendor }: Props) {
  const schedule = vendor.schedule_start && vendor.schedule_end
    ? `${vendor.schedule_start.slice(0, 5)} – ${vendor.schedule_end.slice(0, 5)}`
    : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cover with blur overlay */}
      <div className="relative h-56 overflow-hidden">
        {vendor.cover_image_url ? (
          <img
            src={vendor.cover_image_url}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover blur-sm scale-105 opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <Link
          href="/student/home"
          aria-label="Volver a inicio"
          className="absolute top-12 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow"
        >
          <ArrowLeft size={20} className="text-text-primary" aria-hidden="true" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center -mt-8">
        <div className="bg-white rounded-card shadow-sm w-full max-w-sm p-6">
          {/* Closed icon */}
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-gray-400" aria-hidden="true" />
          </div>

          <h1 className="text-xl font-display font-bold text-text-primary">
            {vendor.business_name}
          </h1>
          {vendor.description && (
            <p className="text-text-secondary font-body text-sm mt-1">
              {vendor.description}
            </p>
          )}

          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mt-4">
            <p className="text-orange-800 font-display font-semibold text-sm">
              Cerrado en este momento
            </p>
            {schedule && (
              <p className="text-orange-600 text-xs font-body mt-0.5">
                Horario: {schedule}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/student/home"
          className="mt-6 bg-primary text-white rounded-button px-8 py-3.5 font-display font-semibold"
        >
          Explorar otros negocios
        </Link>
      </div>
    </div>
  )
}
