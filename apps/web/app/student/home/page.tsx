import { createClient } from '@/lib/supabase/server'
import VendorCardList from '@/components/student/VendorCardList'
import { Search } from 'lucide-react'

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
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark px-4 md:px-8 pt-8 pb-12 relative overflow-hidden">
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <p className="text-primary-light text-xs font-body mb-1 tracking-widest uppercase opacity-80">
            AERO · La Sabana
          </p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-white text-2xl md:text-3xl font-display font-extrabold">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-blue-200 text-sm font-body mt-1 flex items-center gap-2">
                {openVendors.length > 0 ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    {openVendors.length} vendedor{openVendors.length > 1 ? 'es' : ''} disponible{openVendors.length > 1 ? 's' : ''} ahora
                  </>
                ) : 'No hay vendedores activos en este momento'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar — overlaps header */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto -mt-5 relative z-10 mb-2">
        <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3">
          <Search size={18} className="text-gray-400 shrink-0" />
          <span className="text-gray-400 text-sm font-body">Buscar vendedores...</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-5 max-w-7xl mx-auto">
        {openVendors.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-extrabold text-gray-900">
                Abiertos ahora
              </h2>
              <span className="text-xs font-body text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {openVendors.length}
              </span>
            </div>
            <VendorCardList vendors={openVendors} />
          </>
        )}

        {closedVendors.length > 0 && (
          <div className={openVendors.length > 0 ? 'mt-8' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-extrabold text-gray-900">
                Próximamente
              </h2>
              <span className="text-xs font-body text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {closedVendors.length}
              </span>
            </div>
            <VendorCardList vendors={closedVendors} dimmed />
          </div>
        )}

        {vendors.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="font-display font-semibold text-gray-900 text-lg">Sin vendedores aún</p>
            <p className="text-gray-500 text-sm font-body mt-1">Pronto habrá opciones disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
