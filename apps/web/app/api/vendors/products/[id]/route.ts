import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateProductSchema } from '@/lib/validations/product'
import { productImagePath, removeProductImages } from '@/lib/utils/storage'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('vendor_id', user.id)
    .select('*, product_images(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: product } = await supabase
    .from('products')
    .select('vendor_id')
    .eq('id', params.id)
    .single()

  if (!product || product.vendor_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: images } = await supabase
    .from('product_images')
    .select('order_index')
    .eq('product_id', params.id)

  if (images?.length) {
    const paths = images.map(img => productImagePath(user.id, params.id, img.order_index ?? 0))
    await removeProductImages(supabase, paths)
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', params.id)
    .eq('vendor_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
