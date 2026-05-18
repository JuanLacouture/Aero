import { useCartStore, CartItem } from '@/lib/stores/cart'

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  product_id: 'prod-1',
  name: 'Empanada de pollo',
  price: 3500,
  quantity: 1,
  ...overrides,
})

beforeEach(() => {
  useCartStore.getState().clear()
})

describe('addItem', () => {
  it('agrega un producto nuevo al carrito vacío', () => {
    useCartStore.getState().addItem(makeItem(), 'vendor-1', 'Cafetería A')

    const { items, vendor_id, vendor_name } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].product_id).toBe('prod-1')
    expect(items[0].quantity).toBe(1)
    expect(vendor_id).toBe('vendor-1')
    expect(vendor_name).toBe('Cafetería A')
  })

  it('incrementa la cantidad si el producto ya existe', () => {
    const store = useCartStore.getState()
    store.addItem(makeItem(), 'vendor-1', 'Cafetería A')
    store.addItem(makeItem(), 'vendor-1', 'Cafetería A')

    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })

  it('limpia el carrito al cambiar de vendor', () => {
    const store = useCartStore.getState()
    store.addItem(makeItem({ product_id: 'prod-1' }), 'vendor-1', 'Cafetería A')
    store.addItem(makeItem({ product_id: 'prod-2', name: 'Arepa' }), 'vendor-2', 'Cafetería B')

    const { items, vendor_id } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].product_id).toBe('prod-2')
    expect(vendor_id).toBe('vendor-2')
  })

  it('agrega múltiples productos distintos del mismo vendor', () => {
    const store = useCartStore.getState()
    store.addItem(makeItem({ product_id: 'prod-1' }), 'vendor-1', 'Cafetería A')
    store.addItem(makeItem({ product_id: 'prod-2', name: 'Arepa' }), 'vendor-1', 'Cafetería A')

    expect(useCartStore.getState().items).toHaveLength(2)
  })
})

describe('updateQuantity', () => {
  it('actualiza la cantidad de un producto', () => {
    useCartStore.getState().addItem(makeItem(), 'vendor-1', 'Cafetería A')
    useCartStore.getState().updateQuantity('prod-1', 5)

    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('elimina el producto si la cantidad es 0', () => {
    useCartStore.getState().addItem(makeItem(), 'vendor-1', 'Cafetería A')
    useCartStore.getState().updateQuantity('prod-1', 0)

    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('elimina el producto si la cantidad es negativa', () => {
    useCartStore.getState().addItem(makeItem(), 'vendor-1', 'Cafetería A')
    useCartStore.getState().updateQuantity('prod-1', -1)

    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('removeItem', () => {
  it('elimina un producto del carrito', () => {
    const store = useCartStore.getState()
    store.addItem(makeItem({ product_id: 'prod-1' }), 'vendor-1', 'Cafetería A')
    store.addItem(makeItem({ product_id: 'prod-2', name: 'Arepa' }), 'vendor-1', 'Cafetería A')
    store.removeItem('prod-1')

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].product_id).toBe('prod-2')
  })
})

describe('total', () => {
  it('calcula el total correctamente', () => {
    const store = useCartStore.getState()
    store.addItem(makeItem({ product_id: 'prod-1', price: 3500 }), 'vendor-1', 'Cafetería A')
    store.addItem(makeItem({ product_id: 'prod-2', price: 2000, name: 'Arepa' }), 'vendor-1', 'Cafetería A')
    // prod-1 qty=1 → 3500, prod-2 qty=1 → 2000
    expect(useCartStore.getState().total()).toBe(5500)
  })

  it('incluye la cantidad en el cálculo', () => {
    useCartStore.getState().addItem(makeItem({ price: 3500 }), 'vendor-1', 'Cafetería A')
    useCartStore.getState().addItem(makeItem({ price: 3500 }), 'vendor-1', 'Cafetería A') // qty → 2
    expect(useCartStore.getState().total()).toBe(7000)
  })

  it('retorna 0 con carrito vacío', () => {
    expect(useCartStore.getState().total()).toBe(0)
  })
})

describe('count', () => {
  it('cuenta las unidades totales', () => {
    const store = useCartStore.getState()
    store.addItem(makeItem({ product_id: 'prod-1' }), 'vendor-1', 'Cafetería A')
    store.addItem(makeItem({ product_id: 'prod-1' }), 'vendor-1', 'Cafetería A') // qty → 2
    store.addItem(makeItem({ product_id: 'prod-2', name: 'Arepa' }), 'vendor-1', 'Cafetería A')
    expect(useCartStore.getState().count()).toBe(3)
  })

  it('retorna 0 con carrito vacío', () => {
    expect(useCartStore.getState().count()).toBe(0)
  })
})

describe('clear', () => {
  it('vacía el carrito y resetea vendor', () => {
    useCartStore.getState().addItem(makeItem(), 'vendor-1', 'Cafetería A')
    useCartStore.getState().clear()

    const { items, vendor_id, vendor_name } = useCartStore.getState()
    expect(items).toHaveLength(0)
    expect(vendor_id).toBeNull()
    expect(vendor_name).toBeNull()
  })
})
