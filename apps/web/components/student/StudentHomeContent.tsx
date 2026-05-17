'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import VendorCardList, { type VendorRow } from './VendorCardList'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'todos', label: 'Todos', emoji: '🍽️' },
  { id: 'almuerzo', label: 'Almuerzo', emoji: '🍱' },
  { id: 'desayuno', label: 'Desayuno', emoji: '☕' },
  { id: 'snacks', label: 'Snacks', emoji: '🥨' },
  { id: 'saludable', label: 'Saludable', emoji: '🥗' },
  { id: 'postres', label: 'Postres', emoji: '🍰' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🧃' },
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  almuerzo: ['almuerzo', 'almuerzos', 'comida', 'plato', 'bandeja', 'típic', 'tipic', 'corriente'],
  desayuno: ['desayuno', 'desayunos', 'arepa', 'arepas', 'empanada', 'breakfast', 'calentado'],
  snacks: ['snack', 'snacks', 'papas', 'sandwich', 'sándwich', 'perro', 'hot dog', 'dedito'],
  saludable: ['saludable', 'fit', 'bowl', 'bowls', 'ensalada', 'vegano', 'natural', 'light'],
  postres: ['postre', 'postres', 'torta', 'helado', 'dulce', 'cake', 'brownies'],
  bebidas: ['café', 'cafe', 'bebida', 'bebidas', 'jugo', 'jugos', 'coffee', 'drink'],
}

function matchesCategory(vendor: VendorRow, category: string): boolean {
  if (category === 'todos') return true
  const text = `${vendor.business_name} ${vendor.description ?? ''}`.toLowerCase()
  return (CATEGORY_KEYWORDS[category] ?? []).some(kw => text.includes(kw))
}

export default function StudentHomeContent({ vendors }: { vendors: VendorRow[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('todos')

  const filtered = vendors.filter(v => {
    const matchCat = matchesCategory(v, category)
    const matchSearch = !search.trim() ||
      `${v.business_name} ${v.description ?? ''}`.toLowerCase().includes(search.toLowerCase().trim())
    return matchCat && matchSearch
  })

  const openFiltered = filtered.filter(v => v.is_open)
  const closedFiltered = filtered.filter(v => !v.is_open)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-primary/5 px-4 pt-10 pb-14 md:pt-14 md:pb-16">
        <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-30px] w-72 h-72 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10 text-center">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-gray-900 mb-5">
            ¿Qué te provoca hoy?
          </h1>
          <div className="relative bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center gap-3 px-4 py-3.5">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Busca restaurantes, platos o tipos de comida..."
              className="flex-1 text-sm font-body text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="bg-white border-b border-gray-100 sticky top-0 md:top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-display font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
                category === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors */}
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-display font-semibold text-gray-900 text-lg">Sin resultados</p>
            <p className="text-gray-500 text-sm font-body mt-1">
              Intenta con otro término o categoría
            </p>
            <button
              onClick={() => { setSearch(''); setCategory('todos') }}
              className="mt-4 text-primary text-sm font-display font-semibold"
            >
              Ver todos los vendedores
            </button>
          </div>
        ) : (
          <>
            {openFiltered.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-extrabold text-gray-900">
                    {category === 'todos' ? 'Populares en Campus' : CATEGORIES.find(c => c.id === category)?.label}
                  </h2>
                  <span className="text-xs font-body text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {openFiltered.length} abiertos
                  </span>
                </div>
                <VendorCardList vendors={openFiltered} />
              </div>
            )}

            {closedFiltered.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-extrabold text-gray-900">
                    Próximamente
                  </h2>
                  <span className="text-xs font-body text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {closedFiltered.length}
                  </span>
                </div>
                <VendorCardList vendors={closedFiltered} dimmed />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
