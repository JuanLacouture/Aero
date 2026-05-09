'use client'

import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProductImage {
  id: string
  image_url: string
  order_index: number | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  is_available: boolean | null
  stock_limit: number | null
  product_images: ProductImage[]
}

interface Props {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onToggle: (product: Product) => void
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export function ProductCard({ product, onEdit, onDelete, onToggle }: Props) {
  const thumbnail = [...product.product_images]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))[0]

  return (
    <div className={cn('bg-white rounded-card shadow-sm p-3 flex gap-3 transition-opacity', !product.is_available && 'opacity-60')}>
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-background">
        {thumbnail ? (
          <img src={thumbnail.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vendor/10 to-vendor/25">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-text-primary text-sm truncate">{product.name}</p>
        {product.description && (
          <p className="text-text-secondary text-xs font-body line-clamp-1 mt-0.5">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-vendor font-display font-bold text-sm">{fmt(product.price)}</p>
          {product.stock_limit != null && (
            <span className="text-xs text-text-secondary font-body">· stock {product.stock_limit}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <button onClick={() => onToggle(product)} aria-label="Cambiar disponibilidad">
          {product.is_available
            ? <ToggleRight size={22} className="text-success" />
            : <ToggleLeft size={22} className="text-text-disabled" />}
        </button>
        <div className="flex gap-1">
          <button onClick={() => onEdit(product)} className="p-1.5 rounded-lg bg-background" aria-label="Editar">
            <Pencil size={14} className="text-text-secondary" />
          </button>
          <button onClick={() => onDelete(product.id)} className="p-1.5 rounded-lg bg-background" aria-label="Eliminar">
            <Trash2 size={14} className="text-error" />
          </button>
        </div>
      </div>
    </div>
  )
}
