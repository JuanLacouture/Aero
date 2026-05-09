import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadProductImage, productImagePath, removeProductImages } from '@/lib/utils/storage'

export async function POST(
  request: Request,
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

  const { data: existingImages } = await supabase
    .from('product_images')
    .select('order_index')
    .eq('product_id', params.id)
    .order('order_index')

  if (existingImages && existingImages.length >= 3) {
    return NextResponse.json({ error: 'Máximo 3 imágenes por producto' }, { status: 400 })
  }

  const usedIndices = new Set(existingImages?.map(i => i.order_index ?? 0) ?? [])
  let nextIndex = 0
  while (usedIndices.has(nextIndex)) nextIndex++

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  let imageUrl: string
  try {
    imageUrl = await uploadProductImage(supabase, file, user.id, params.id, nextIndex)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: params.id, image_url: imageUrl, order_index: nextIndex })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(
  request: Request,
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

  const { searchParams } = new URL(request.url)
  const orderIndex = parseInt(searchParams.get('index') ?? '0')
  const imageId = searchParams.get('imageId')

  const storagePath = productImagePath(user.id, params.id, orderIndex)
  await removeProductImages(supabase, [storagePath])

  let query = supabase.from('product_images').delete().eq('product_id', params.id)
  if (imageId) {
    query = query.eq('id', imageId) as typeof query
  } else {
    query = query.eq('order_index', orderIndex) as typeof query
  }
  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
