'use client'

import { useRef, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { compressImage } from '@/lib/utils/image-compression'

export interface ExistingImage {
  id: string
  image_url: string
  order_index: number
}

interface Props {
  existingImages: ExistingImage[]
  onFilesChange: (files: File[]) => void
  onDeleteExisting: (image: ExistingImage) => void
  maxTotal?: number
}

export function ImageUploader({ existingImages, onFilesChange, onDeleteExisting, maxTotal = 3 }: Props) {
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([])
  const [compressing, setCompressing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const remaining = maxTotal - existingImages.length - previews.length

  async function handleFiles(files: FileList) {
    const toProcess = Array.from(files).slice(0, remaining)
    if (!toProcess.length) return
    setCompressing(true)
    const compressed = await Promise.all(toProcess.map(compressImage))
    const newPreviews = compressed.map(f => ({ url: URL.createObjectURL(f), file: f }))
    const updated = [...previews, ...newPreviews]
    setPreviews(updated)
    onFilesChange(updated.map(p => p.file))
    setCompressing(false)
  }

  function removePreview(index: number) {
    const updated = previews.filter((_, i) => i !== index)
    URL.revokeObjectURL(previews[index].url)
    setPreviews(updated)
    onFilesChange(updated.map(p => p.file))
  }

  return (
    <div>
      <p className="text-xs text-text-secondary font-body mb-2">
        Fotos del plato{' '}
        <span className="text-text-disabled">({existingImages.length + previews.length}/{maxTotal})</span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {existingImages.map(img => (
          <div key={img.id} className="relative w-20 h-20">
            <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              onClick={() => onDeleteExisting(img)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error rounded-full flex items-center justify-center shadow-sm"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ))}

        {previews.map((p, i) => (
          <div key={i} className="relative w-20 h-20">
            <img src={p.url} alt="" className="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              onClick={() => removePreview(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error rounded-full flex items-center justify-center shadow-sm"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={compressing}
            className="w-20 h-20 border-2 border-dashed border-vendor/40 rounded-xl flex flex-col items-center justify-center gap-1 text-vendor/60 bg-vendor-background disabled:opacity-50"
          >
            {compressing ? (
              <div className="w-5 h-5 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={18} />
                <span className="text-[10px] font-body">Foto</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  )
}
