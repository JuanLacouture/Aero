interface WithStorage {
  storage: {
    from(bucket: string): {
      upload(path: string, data: Blob, options?: { upsert?: boolean; contentType?: string }): Promise<{ error: { message: string } | null }>
      remove(paths: string[]): Promise<{ error: { message: string } | null }>
    }
  }
}

const BUCKET = 'product-images'

export function productImagePath(vendorId: string, productId: string, index: number): string {
  return `${vendorId}/${productId}/${index}.webp`
}

export function getProductImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

export async function uploadProductImage(
  supabase: WithStorage,
  file: Blob,
  vendorId: string,
  productId: string,
  index: number
): Promise<string> {
  const path = productImagePath(vendorId, productId, index)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: (file as File).type || 'image/webp' })
  if (error) throw new Error(error.message)
  return getProductImageUrl(path)
}

export async function removeProductImages(
  supabase: WithStorage,
  paths: string[]
): Promise<void> {
  if (!paths.length) return
  await supabase.storage.from(BUCKET).remove(paths)
}
