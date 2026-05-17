import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorUnavailable from '@/components/student/VendorUnavailable'

export default async function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, description, cover_image_url, is_open, schedule_start, schedule_end')
    .eq('id', id)
    .single()

  if (!vendor) notFound()

  if (vendor.is_open) {
    redirect(`/student/vendor/${id}/menu`)
  }

  return <VendorUnavailable vendor={vendor} />
}
