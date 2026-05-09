import { create } from 'zustand'

export interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image_url?: string | null
}

interface CartStore {
  items: CartItem[]
  vendor_id: string | null
  vendor_name: string | null
  addItem: (item: CartItem, vendor_id: string, vendor_name: string) => void
  updateQuantity: (product_id: string, quantity: number) => void
  removeItem: (product_id: string) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  vendor_id: null,
  vendor_name: null,

  addItem: (item, vendor_id, vendor_name) => {
    const { items, vendor_id: currentVendor } = get()
    // Clear cart if switching vendors
    if (currentVendor && currentVendor !== vendor_id) {
      set({ items: [{ ...item, quantity: 1 }], vendor_id, vendor_name })
      return
    }
    const existing = items.find(i => i.product_id === item.product_id)
    if (existing) {
      set({ items: items.map(i => i.product_id === item.product_id ? { ...i, quantity: i.quantity + 1 } : i), vendor_id, vendor_name })
    } else {
      set({ items: [...items, { ...item, quantity: 1 }], vendor_id, vendor_name })
    }
  },

  updateQuantity: (product_id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(product_id)
      return
    }
    set(s => ({ items: s.items.map(i => i.product_id === product_id ? { ...i, quantity } : i) }))
  },

  removeItem: (product_id) =>
    set(s => ({ items: s.items.filter(i => i.product_id !== product_id) })),

  clear: () => set({ items: [], vendor_id: null, vendor_name: null }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
