import { createClient } from '@/lib/supabase/server'
import VendorCardList from '@/components/student/VendorCardList'

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
      </div>

      {/* Content */}
      <div className="px-4 py-5">
        {openVendors.length > 0 && (
          <>
            <h2 className="text-base font-display font-bold text-text-primary mb-3">
              Vendedores activos ahora
            </h2>
            <VendorCardList vendors={openVendors} />
          </>
        )}

        {closedVendors.length > 0 && (
          <div className={openVendors.length > 0 ? 'mt-6' : ''}>
            <h2 className="text-base font-display font-bold text-text-primary mb-3">
              Próximamente disponibles
            </h2>
            <VendorCardList vendors={closedVendors} dimmed />
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
