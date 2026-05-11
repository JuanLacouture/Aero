'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { ArrowLeft, MapPin, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type DeliveryPoint = {
  id: string
  name: string
  description: string | null
  lat: number
  lng: number
  is_illuminated: boolean | null
  security_level: 'high' | 'medium' | 'low' | null
}

const CAMPUS_CENTER = { lat: 4.8615, lng: -74.0317 }
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

const SECURITY_LABEL: Record<string, string> = {
  high: 'Alta seguridad',
  medium: 'Seguridad media',
  low: 'Seguridad básica',
}
const SECURITY_COLOR: Record<string, string> = {
  high: 'text-success',
  medium: 'text-warning',
  low: 'text-error',
}

export default function DeliveryMapPage() {
  const router = useRouter()
  const [points, setPoints] = useState<DeliveryPoint[]>([])
  const [selected, setSelected] = useState<DeliveryPoint | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('delivery_points')
      .select('id, name, description, lat, lng, is_illuminated, security_level')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setPoints(data as DeliveryPoint[])
        setLoading(false)
      })
  }, [])

  function toggleSelected(point: DeliveryPoint) {
    setSelected(prev => prev?.id === point.id ? null : point)
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
      <div className="bg-primary px-4 pt-12 pb-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-full bg-white/15">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
          <h1 className="font-display font-bold text-white text-lg leading-tight">
            Puntos de entrega
          </h1>
          <p className="text-blue-200 text-xs font-body">
            {points.length} puntos seguros en el campus
          </p>
        </div>
      </div>

      {/* Mapa */}
      <div className="h-72 w-full">
        {API_KEY ? (
          <APIProvider apiKey={API_KEY}>
            <Map
              defaultCenter={CAMPUS_CENTER}
              defaultZoom={17}
              gestureHandling="greedy"
              disableDefaultUI
              style={{ width: '100%', height: '100%' }}
            >
              {points.map(point => (
                <Marker
                  key={point.id}
                  position={{ lat: point.lat, lng: point.lng }}
                  title={point.name}
                  onClick={() => toggleSelected(point)}
                />
              ))}

              {selected && (
                <InfoWindow
                  position={{ lat: selected.lat, lng: selected.lng }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div style={{ maxWidth: 160, padding: '2px 0' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{selected.name}</p>
                    {selected.description && (
                      <p style={{ fontSize: 11, color: '#6E6E73', marginTop: 3, marginBottom: 0 }}>
                        {selected.description}
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full bg-primary/5 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <MapPin size={36} className="text-primary/40" />
            <p className="text-text-secondary font-body text-xs">
              Mapa no disponible — configura{' '}
              <span className="font-mono text-text-primary">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span>{' '}
              en .env.local para habilitarlo
            </p>
          </div>
        )}
      </div>

      {/* Lista de puntos */}
      <div className="px-4 py-4">
        <h2 className="font-display font-bold text-text-primary text-base mb-3">
          Puntos de recogida segura
        </h2>

        {points.length === 0 ? (
          <div className="text-center py-10">
            <MapPin size={36} className="text-text-disabled mx-auto mb-2" />
            <p className="text-text-secondary font-body text-sm">Sin puntos configurados</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {points.map(point => (
              <button
                key={point.id}
                onClick={() => toggleSelected(point)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-card text-left border transition-colors w-full',
                  selected?.id === point.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-white hover:border-primary/40',
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    selected?.id === point.id ? 'bg-primary' : 'bg-primary/10',
                  )}
                >
                  <MapPin
                    size={20}
                    className={selected?.id === point.id ? 'text-white' : 'text-primary'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-text-primary text-sm">
                    {point.name}
                  </p>
                  {point.description && (
                    <p className="text-text-secondary text-xs font-body line-clamp-1 mt-0.5">
                      {point.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {point.security_level && (
                      <div className="flex items-center gap-1">
                        <Shield
                          size={11}
                          className={SECURITY_COLOR[point.security_level]}
                        />
                        <span
                          className={cn(
                            'text-xs font-body',
                            SECURITY_COLOR[point.security_level],
                          )}
                        >
                          {SECURITY_LABEL[point.security_level]}
                        </span>
                      </div>
                    )}
                    {point.is_illuminated && (
                      <div className="flex items-center gap-1">
                        <Zap size={11} className="text-warning" />
                        <span className="text-xs font-body text-warning">Iluminado</span>
                      </div>
                    )}
                  </div>
                </div>

                {selected?.id === point.id && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Nota informativa */}
        <div className="mt-4 bg-primary/5 rounded-card px-4 py-3 flex gap-2">
          <Shield size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs font-body text-text-secondary leading-relaxed">
            Todos los puntos están en zonas iluminadas y de alta seguridad dentro del campus de la
            Universidad de La Sabana.
          </p>
        </div>
      </div>
    </div>
  )
}
