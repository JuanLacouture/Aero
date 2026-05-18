import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard, Product } from '@/components/vendor/ProductCard'

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Empanada de pollo',
  description: 'Deliciosa empanada',
  price: 3500,
  category: 'snacks',
  is_available: true,
  stock_limit: null,
  product_images: [],
  ...overrides,
})

describe('ProductCard', () => {
  it('muestra el nombre del producto', () => {
    render(<ProductCard product={makeProduct()} onEdit={jest.fn()} onDelete={jest.fn()} onToggle={jest.fn()} />)
    expect(screen.getByText('Empanada de pollo')).toBeInTheDocument()
  })

  it('muestra el precio formateado', () => {
    render(<ProductCard product={makeProduct()} onEdit={jest.fn()} onDelete={jest.fn()} onToggle={jest.fn()} />)
    expect(screen.getByText('$3.500')).toBeInTheDocument()
  })

  it('muestra la descripción', () => {
    render(<ProductCard product={makeProduct()} onEdit={jest.fn()} onDelete={jest.fn()} onToggle={jest.fn()} />)
    expect(screen.getByText('Deliciosa empanada')).toBeInTheDocument()
  })

  it('muestra el stock cuando está definido', () => {
    render(<ProductCard product={makeProduct({ stock_limit: 10 })} onEdit={jest.fn()} onDelete={jest.fn()} onToggle={jest.fn()} />)
    expect(screen.getByText('· stock 10')).toBeInTheDocument()
  })

  it('llama onEdit al hacer clic en editar', () => {
    const onEdit = jest.fn()
    const product = makeProduct()
    render(<ProductCard product={product} onEdit={onEdit} onDelete={jest.fn()} onToggle={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(product)
  })

  it('llama onDelete al hacer clic en eliminar', () => {
    const onDelete = jest.fn()
    render(<ProductCard product={makeProduct()} onEdit={jest.fn()} onDelete={onDelete} onToggle={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Eliminar'))
    expect(onDelete).toHaveBeenCalledWith('prod-1')
  })

  it('llama onToggle al hacer clic en disponibilidad', () => {
    const onToggle = jest.fn()
    const product = makeProduct()
    render(<ProductCard product={product} onEdit={jest.fn()} onDelete={jest.fn()} onToggle={onToggle} />)
    fireEvent.click(screen.getByLabelText('Cambiar disponibilidad'))
    expect(onToggle).toHaveBeenCalledWith(product)
  })

  it('aplica opacidad cuando el producto no está disponible', () => {
    const { container } = render(
      <ProductCard product={makeProduct({ is_available: false })} onEdit={jest.fn()} onDelete={jest.fn()} onToggle={jest.fn()} />
    )
    expect(container.firstChild).toHaveClass('opacity-60')
  })
})