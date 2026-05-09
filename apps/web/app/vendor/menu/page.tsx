'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  is_available: boolean | null
}

type ProductForm = {
  name: string
  description: string
  price: string
  category: string
}

const EMPTY_FORM: ProductForm = { name: '', description: '', price: '', category: '' }
const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function VendorMenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setVendorId(user.id)
      supabase.from('products').select('*').eq('vendor_id', user.id).order('category').order('name')
        .then(({ data }) => { if (data) setProducts(data); setLoading(false) })
    })
  }, [])

  async function saveProduct() {
    if (!vendorId || !form.name || !form.price) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      category: form.category.trim() || null,
      vendor_id: vendorId,
    }

    if (editingId) {
      const { data, error: err } = await supabase.from('products').update(payload).eq('id', editingId).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      setProducts(prev => prev.map(p => p.id === editingId ? data : p))
    } else {
      const { data, error: err } = await supabase.from('products').insert({ ...payload, is_available: true }).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      setProducts(prev => [...prev, data])
    }

    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
  }

  async function toggleAvailable(product: Product) {
    const supabase = createClient()
    await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p))
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  function startEdit(product: Product) {
    setForm({ name: product.name, description: product.description ?? '', price: String(product.price), category: product.category ?? '' })
    setEditingId(product.id)
    setShowForm(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const categories = [...new Set(products.map(p => p.category ?? 'Sin categoría'))]

  return (
    <div className="min-h-screen bg-vendor-background">
      {/* Header */}
      <div className="bg-vendor px-4 pt-12 pb-4 shadow-sm">
        <h1 className="font-display font-bold text-white text-xl">Mi Menú del Día</h1>
        <p className="text-orange-200 text-sm font-body">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Add button */}
      <div className="px-4 py-4">
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}
          className="w-full border-2 border-dashed border-vendor/40 rounded-card py-3.5 flex items-center justify-center gap-2 text-vendor font-display font-semibold bg-white/50"
        >
          <Plus size={20} />
          Agregar nuevo plato
        </button>
      </div>

      {/* Products by category */}
      <div className="px-4 pb-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-text-secondary font-body">Sin productos aún</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat} className="mb-5">
            <h2 className="text-xs font-display font-bold text-text-secondary uppercase tracking-widest mb-2">{cat}</h2>
            <div className="flex flex-col gap-2">
              {products.filter(p => (p.category ?? 'Sin categoría') === cat).map(product => (
                <div key={product.id} className={cn('bg-white rounded-card shadow-sm p-3 flex gap-3', !product.is_available && 'opacity-60')}>
                  <div className="w-14 h-14 bg-background rounded-xl flex items-center justify-center text-2xl shrink-0">🍽️</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-text-primary text-sm truncate">{product.name}</p>
                    {product.description && <p className="text-text-secondary text-xs font-body line-clamp-1">{product.description}</p>}
                    <p className="text-vendor font-display font-bold text-sm mt-0.5">{fmt(product.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => toggleAvailable(product)}>
                      {product.is_available
                        ? <ToggleRight size={22} className="text-success" />
                        : <ToggleLeft size={22} className="text-text-disabled" />}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(product)} className="p-1.5 rounded-lg bg-background">
                        <Pencil size={14} className="text-text-secondary" />
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="p-1.5 rounded-lg bg-background">
                        <Trash2 size={14} className="text-error" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl p-5 pb-10 max-w-lg mx-auto w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-text-primary text-lg">
                {editingId ? 'Editar plato' : 'Nuevo plato'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full bg-background">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del plato *"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor resize-none" />
              <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="Precio *"
                type="number" min="0"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor" />
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Categoría (ej: Platos fuertes)"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-body focus:outline-none focus:border-vendor" />
            </div>

            {error && <p className="text-error text-sm font-body mt-2">{error}</p>}

            <button onClick={saveProduct} disabled={saving || !form.name || !form.price}
              className="w-full mt-4 bg-vendor text-white rounded-button py-3.5 font-display font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? '...' : <><Check size={18} /> {editingId ? 'Guardar cambios' : 'Agregar plato'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
