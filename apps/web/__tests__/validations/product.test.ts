import { createProductSchema, updateProductSchema } from '@/lib/validations/product'

describe('createProductSchema', () => {
  const valid = {
    name: 'Empanada de pollo',
    price: 3500,
  }

  it('acepta un producto válido con campos mínimos', () => {
    const result = createProductSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('acepta todos los campos opcionales', () => {
    const result = createProductSchema.safeParse({
      ...valid,
      description: 'Deliciosa empanada',
      category: 'snacks',
      stock_limit: 10,
      is_available: true,
    })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre vacío', () => {
    const result = createProductSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rechaza nombre con un solo carácter', () => {
    const result = createProductSchema.safeParse({ ...valid, name: 'A' })
    expect(result.success).toBe(false)
  })

  it('rechaza nombre mayor a 255 caracteres', () => {
    const result = createProductSchema.safeParse({ ...valid, name: 'A'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('rechaza precio cero', () => {
    const result = createProductSchema.safeParse({ ...valid, price: 0 })
    expect(result.success).toBe(false)
  })

  it('rechaza precio negativo', () => {
    const result = createProductSchema.safeParse({ ...valid, price: -100 })
    expect(result.success).toBe(false)
  })

  it('rechaza descripción mayor a 500 caracteres', () => {
    const result = createProductSchema.safeParse({ ...valid, description: 'X'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('rechaza stock_limit con valor decimal', () => {
    const result = createProductSchema.safeParse({ ...valid, stock_limit: 1.5 })
    expect(result.success).toBe(false)
  })

  it('rechaza stock_limit negativo', () => {
    const result = createProductSchema.safeParse({ ...valid, stock_limit: -1 })
    expect(result.success).toBe(false)
  })

  it('rechaza sin campo name', () => {
    const result = createProductSchema.safeParse({ price: 3500 })
    expect(result.success).toBe(false)
  })

  it('rechaza sin campo price', () => {
    const result = createProductSchema.safeParse({ name: 'Empanada' })
    expect(result.success).toBe(false)
  })
})

describe('updateProductSchema', () => {
  it('acepta objeto vacío (todos los campos son opcionales)', () => {
    const result = updateProductSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('acepta solo el campo price', () => {
    const result = updateProductSchema.safeParse({ price: 5000 })
    expect(result.success).toBe(true)
  })

  it('acepta solo el campo is_available', () => {
    const result = updateProductSchema.safeParse({ is_available: false })
    expect(result.success).toBe(true)
  })

  it('sigue rechazando price negativo', () => {
    const result = updateProductSchema.safeParse({ price: -1 })
    expect(result.success).toBe(false)
  })

  it('sigue rechazando nombre de 1 carácter', () => {
    const result = updateProductSchema.safeParse({ name: 'X' })
    expect(result.success).toBe(false)
  })
})
