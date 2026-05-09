'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { ImageUploader, type ExistingImage } from './ImageUploader'
import type { Product } from './ProductCard'

interface Props {
  product?: Product | null
  onClose: () => void
  onSaved: (product: Product) => void
}

type FormErrors = { name?: string; price?: string; general?: string }

const CATEGORIES = ['Desayunos', 'Platos fuertes', 'Almuerzos', 'Bebidas', 'Snacks', 'Postres']

export function ProductFormModal({ product, onClose, onSaved }: Props) {
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [stockLimit, setStockLimit] = useState(product?.stock_limit ? String(product.stock_limit) : '')
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    (product?.product_images ?? [])
      .filter(img => img.order_index != null)
      .map(img => ({ id: img.id, image_url: img.image_url, order_index: img.order_index as number }))
      .sort((a, b) => a.order_index - b.order_index)
  )
  const [deletedImages, setDeletedImages] = useState<Array<{ id: string; order_index: number }>>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!name.trim() || name.trim().length < 2) errs.name = 'Mínimo 2 caracteres'
    const p = parseFloat(price)
    if (!price || isNaN(p) || p <= 0) errs.price = 'Debe ser mayor a 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleDeleteExisting(image: ExistingImage) {
    setExistingImages(prev => prev.filter(i => i.id !== image.id))
    setDeletedImages(prev => [...prev, { id: image.id, order_index: image.order_index }])
  }

  async function save() {
    if (!validate()) return
    setSaving(true)
    setErrors({})

    try {
      const body = {
        name: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        price: parseFloat(price),
        ...(category.trim() && { category: category.trim() }),
        ...(stockLimit && { stock_limit: parseInt(stockLimit) }),
      }

      let saved: Product

      if (isEdit) {
        await Promise.all(
          deletedImages.map(img =>
            fetch(`/api/vendors/products/${product.id}/images?imageId=${img.id}&index=${img.order_index}`, {
              method: 'DELETE',
            })
          )
        )

        const res = await fetch(`/api/vendors/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(typeof err.error === 'string' ? err.error : 'Error al actualizar')
        }
        saved = await res.json()
      } else {
        const res = await fetch('/api/vendors/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(typeof err.error === 'string' ? err.error : 'Error al crear')
        }
        saved = await res.json()
      }

      for (const file of newFiles) {
        const fd = new FormData()
        fd.append('file', file)
        const imgRes = await fetch(`/api/vendors/products/${saved.id}/images`, {
          method: 'POST',
          body: fd,
        })
        if (imgRes.ok) {
          const imgData = await imgRes.json()
          saved = { ...saved, product_images: [...(saved.product_images ?? []), imgData] }
        }
      }

      onSaved(saved)
    } catch (e) {
      setErrors({ general: e instanceof Error ? e.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="bg-white rounded-t-3xl p-5 pb-10 max-w-lg mx-auto w-full max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-text-primary text-lg">
            {isEdit ? 'Editar plato' : 'Nuevo plato'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-background">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <ImageUploader
            existingImages={existingImages}
            onFilesChange={setNewFiles}
            onDeleteExisting={handleDeleteExisting}
            maxTotal={3}
          />

          <div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del plato *"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor"
            />
            {errors.name && <p className="text-error text-xs mt-1 font-body">{errors.name}</p>}
          </div>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor resize-none"
          />

          <div>
            <input
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Precio (COP) *"
              type="number"
              min="0"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor"
            />
            {errors.price && <p className="text-error text-xs mt-1 font-body">{errors.price}</p>}
          </div>

          <div>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Categoría (ej: Platos fuertes)"
              list="product-categories"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor"
            />
            <datalist id="product-categories">
              {CATEGORIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <input
            value={stockLimit}
            onChange={e => setStockLimit(e.target.value)}
            placeholder="Stock límite (opcional)"
            type="number"
            min="1"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor"
          />
        </div>

        {errors.general && (
          <p className="text-error text-sm font-body mt-3">{errors.general}</p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-5 bg-vendor text-white rounded-button py-3.5 font-display font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Check size={18} /> {isEdit ? 'Guardar cambios' : 'Agregar plato'}</>
          )}
        </button>
      </motion.div>
    </div>
  )
}
