import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Star, ChevronRight } from 'lucide-react'

function formatSchedule(start: string | null, end: string | null) {
  if (!start || !end) return null
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
}

export default async function StudentHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, vendorsRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase.from('vendors')
      .select('id, business_name, description, cover_image_url, rating_avg, rating_count, is_open, schedule_start, schedule_end')
      .order('is_open', { ascending: false })
      .order('rating_avg', { ascending: false }),
  ])

  const firstName = profileRes.data?.full_name?.split(' ')[0] ?? 'estudiante'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const vendors = vendorsRes.data ?? []
  const openVendors = vendors.filter(v => v.is_open)
  const closedVendors = vendors.filter(v => !v.is_open)

  return (
    <div className="min-h-screen">
      {/* Blue header */}
      <div className="bg-primary px-4 pt-12 pb-6">
        <p className="text-primary-light text-xs font-body mb-0.5 tracking-wide uppercase">AERO · La Sabana</p>
        <h1 className="text-white text-xl font-display font-bold">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-blue-200 text-sm font-body mt-0.5">
          {openVendors.length > 0
            ? `${openVendors.length} vendedor${openVendors.length > 1 ? 'es' : ''} disponible${openVendors.length > 1 ? 's' : ''} ahora`
            : 'No hay vendedores activos en este momento'}
        </p>
        <div className="mt-4 flex items-center bg-white rounded-xl px-3 py-2.5 gap-2">
          <Search size={17} className="text-text-secondary shrink-0" />
          <span className="text-text-secondary text-sm font-body">Buscar vendedor o plato...</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5">
        {openVendors.length > 0 && (
          <>
            <h2 className="text-base font-display font-bold text-text-primary mb-3">
              Vendedores activos ahora
            </h2>
            <div className="flex flex-col gap-3">
              {openVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
            </div>
          </>
        )}

        {closedVendors.length > 0 && (
          <div className={openVendors.length > 0 ? 'mt-6' : ''}>
            <h2 className="text-base font-display font-bold text-text-primary mb-3">
              Próximamente disponibles
            </h2>
            <div className="flex flex-col gap-3 opacity-60 pointer-events-none">
              {closedVendors.map(v => <VendorCard key={v.id} vendor={v} />)}
            </div>
          </div>
        )}

        {vendors.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="font-display font-semibold text-text-primary text-lg">Sin vendedores aún</p>
            <p className="text-text-secondary text-sm font-body mt-1">Pronto habrá opciones disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}

type VendorRow = {
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

function VendorCard({ vendor }: { vendor: VendorRow }) {
  const schedule = formatSchedule(vendor.schedule_start, vendor.schedule_end)

  return (
    <Link href={`/student/vendor/${vendor.id}/menu`}>
      <div className="bg-white rounded-card shadow-sm overflow-hidden active:scale-[0.98] transition-transform cursor-pointer">
        <div className="h-36 bg-primary-light relative">
          {vendor.cover_image_url ? (
            <img src={vendor.cover_image_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
          )}
          <span className={`absolute top-2 right-2 text-xs font-display font-semibold px-2 py-0.5 rounded-full ${
            vendor.is_open ? 'bg-success text-white' : 'bg-gray-500/80 text-white'
          }`}>
            {vendor.is_open ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
        <div className="p-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-text-primary text-base leading-tight truncate">
              {vendor.business_name}
            </h3>
            {vendor.description && (
              <p className="text-text-secondary text-xs font-body mt-0.5 line-clamp-1">{vendor.description}</p>
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
              {schedule && <span className="text-xs text-text-secondary">{schedule}</span>}
            </div>
          </div>
          <ChevronRight size={18} className="text-text-secondary mt-0.5 shrink-0" />
        </div>
      </div>
    </Link>
  )
}
