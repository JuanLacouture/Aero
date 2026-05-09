'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { ProductCard, type Product } from '@/components/vendor/ProductCard'
import { ProductFormModal } from '@/components/vendor/ProductFormModal'

export default function VendorMenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  useEffect(() => {
    fetch('/api/vendors/products')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data) })
      .finally(() => setLoading(false))
  }, [])

  async function toggleAvailable(product: Product) {
    const res = await fetch(`/api/vendors/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !product.is_available }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    const res = await fetch(`/api/vendors/products/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  function handleSaved(product: Product) {
    setProducts(prev => {
      const exists = prev.find(p => p.id === product.id)
      return exists
        ? prev.map(p => p.id === product.id ? product : p)
        : [...prev, product]
    })
    closeForm()
  }

  function openEdit(product: Product) {
    setEditing(product)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-vendor border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const available = products.filter(p => p.is_available).length
  const categories = Array.from(new Set<string>(products.map(p => p.category ?? 'Sin categoría')))

  return (
    <div className="min-h-screen bg-vendor-background pb-28">
      <div className="bg-vendor px-4 pt-12 pb-5 shadow-sm">
        <h1 className="font-display font-bold text-white text-xl">Mi Menú</h1>
        <div className="flex gap-2 mt-2">
          <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-body">
            {products.length} total
          </span>
          <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-body">
            {available} disponibles
          </span>
        </div>
      </div>

      <div className="px-4 py-5">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="font-display font-semibold text-text-primary text-lg mb-1">Sin platos aún</p>
            <p className="text-text-secondary font-body text-sm">Agrega tu primer plato con el botón +</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat} className="mb-6">
            <h2 className="text-xs font-display font-bold text-text-secondary uppercase tracking-widest mb-2">
              {cat}
            </h2>
            <div className="flex flex-col gap-2">
              {products
                .filter(p => (p.category ?? 'Sin categoría') === cat)
                .map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={openEdit}
                    onDelete={deleteProduct}
                    onToggle={toggleAvailable}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setEditing(null); setShowForm(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-vendor rounded-full shadow-lg flex items-center justify-center z-30"
        aria-label="Agregar plato"
      >
        <Plus size={24} className="text-white" />
      </button>

      {showForm && (
        <ProductFormModal
          product={editing}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
