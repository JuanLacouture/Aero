import { createClient } from '@/lib/supabase/server'
import ConfirmedClient from '@/components/student/ConfirmedClient'

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const shortId = id.slice(0, 8).toUpperCase()

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('id, vendors ( business_name )')
    .eq('id', id)
    .maybeSingle()

  // @ts-expect-error vendors relation is properly typed at runtime
  const vendorName =
    (order?.vendors as { business_name: string } | null)?.business_name ?? null

  return <ConfirmedClient orderId={id} shortId={shortId} vendorName={vendorName} />
}
