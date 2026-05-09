'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/stores/cart'
import { ArrowLeft, Star, Plus, Minus, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

type Vendor = {
  id: string
  business_name: string
  description: string | null
  cover_image_url: string | null
  rating_avg: number | null
  rating_count: number | null
  is_open: boolean | null
  schedule_start: string | null
  schedule_end: string | null
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  is_available: boolean | null
  vendor_id: string
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function VendorMenuPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { addItem, items, count, total, vendor_id: cartVendor } = useCartStore()

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('vendors').select('*').eq('id', id).single(),
      supabase.from('products').select('*').eq('vendor_id', id).eq('is_available', true).order('category'),
    ]).then(([vRes, pRes]) => {
      if (vRes.data) setVendor(vRes.data)
      if (pRes.data) setProducts(pRes.data)
      setLoading(false)
    })
  }, [id])

  const cartCount = count()
  const cartTotal = total()
  const hasCart = cartVendor === id && items.length > 0
  const categories = [...new Set(products.map(p => p.category ?? 'Otros'))]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-text-secondary">Vendedor no encontrado</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Cover image */}
      <div className="relative h-52 bg-primary-light">
        {vendor.cover_image_url
          ? <img src={vendor.cover_image_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Vendor info */}
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-text-primary">{vendor.business_name}</h1>
            {vendor.description && <p className="text-text-secondary text-sm font-body mt-0.5 line-clamp-2">{vendor.description}</p>}
          </div>
          <span className={cn('text-xs font-semibold px-2 py-1 rounded-full shrink-0',
            vendor.is_open ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500')}>
            {vendor.is_open ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <div className="flex items-center gap-1">
            <Star size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="font-display font-semibold">{vendor.rating_avg?.toFixed(1) ?? '—'}</span>
            {vendor.rating_count != null && <span className="text-text-secondary">({vendor.rating_count})</span>}
          </div>
          {vendor.schedule_start && (
            <span className="text-text-secondary">{vendor.schedule_start.slice(0,5)} – {vendor.schedule_end?.slice(0,5)}</span>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="px-4 py-5 pb-32">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-text-secondary font-body">Sin productos disponibles</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat} className="mb-5">
            <h2 className="text-xs font-display font-bold text-text-secondary uppercase tracking-widest mb-2">{cat}</h2>
            <div className="flex flex-col gap-3">
              {products.filter(p => (p.category ?? 'Otros') === cat).map(product => {
                const qty = items.find(i => i.product_id === product.id)?.quantity ?? 0
                return (
                  <div key={product.id} className="bg-white rounded-card shadow-sm p-3 flex gap-3 active:scale-[0.98] transition-transform">
                    <button onClick={() => setSelectedProduct(product)} className="flex-1 text-left">
                      <h3 className="font-display font-semibold text-text-primary leading-tight">{product.name}</h3>
                      {product.description && <p className="text-text-secondary text-sm font-body mt-0.5 line-clamp-2">{product.description}</p>}
                      <p className="text-primary font-display font-bold mt-1.5">{fmt(product.price)}</p>
                    </button>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <div className="w-16 h-16 bg-background rounded-xl flex items-center justify-center text-2xl">🍽️</div>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1 mt-2">
                          <button onClick={() => useCartStore.getState().updateQuantity(product.id, qty - 1)}
                            className="w-6 h-6 rounded-full border border-primary flex items-center justify-center">
                            <Minus size={12} className="text-primary" />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{qty}</span>
                          <button onClick={() => addItem({ product_id: product.id, name: product.name, price: product.price, quantity: 1 }, id, vendor.business_name)}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Plus size={12} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem({ product_id: product.id, name: product.name, price: product.price, quantity: 1 }, id, vendor.business_name)}
                          className="mt-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow">
                          <Plus size={15} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart CTA */}
      {hasCart && (
        <div className="fixed bottom-20 inset-x-0 px-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => router.push('/student/order/new')}
            className="w-full bg-primary text-white rounded-button py-3.5 font-display font-semibold flex items-center justify-between px-5 shadow-xl"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold">{cartCount}</span>
            <span className="flex items-center gap-2"><ShoppingBag size={16} /> Ver pedido</span>
            <span>{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Product detail sheet */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-t-3xl p-5 pb-10 max-w-lg mx-auto w-full" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="h-44 bg-background rounded-2xl flex items-center justify-center text-6xl mb-4">🍽️</div>
            <h2 className="text-xl font-display font-bold text-text-primary">{selectedProduct.name}</h2>
            {selectedProduct.description && <p className="text-text-secondary font-body text-sm mt-1.5">{selectedProduct.description}</p>}
            <p className="text-primary font-display font-bold text-xl mt-2">{fmt(selectedProduct.price)}</p>
            {(() => {
              const qty = items.find(i => i.product_id === selectedProduct.id)?.quantity ?? 0
              return qty > 0 ? (
                <div className="flex items-center gap-3 mt-5">
                  <button onClick={() => useCartStore.getState().updateQuantity(selectedProduct.id, qty - 1)}
                    className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                    <Minus size={18} className="text-primary" />
                  </button>
                  <span className="text-xl font-bold w-6 text-center">{qty}</span>
                  <button onClick={() => addItem({ product_id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, quantity: 1 }, id, vendor.business_name)}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Plus size={18} className="text-white" />
                  </button>
                  <button onClick={() => { setSelectedProduct(null); router.push('/student/order/new') }}
                    className="flex-1 bg-primary text-white rounded-button py-2.5 font-display font-semibold flex items-center justify-center gap-2">
                    <ShoppingBag size={16} /> Ver pedido
                  </button>
                </div>
              ) : (
                <button onClick={() => { addItem({ product_id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, quantity: 1 }, id, vendor.business_name); setSelectedProduct(null) }}
                  className="w-full mt-5 bg-primary text-white rounded-button py-3.5 font-display font-semibold">
                  Agregar al pedido — {fmt(selectedProduct.price)}
                </button>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
