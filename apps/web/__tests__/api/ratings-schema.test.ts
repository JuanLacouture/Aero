import { z } from 'zod'

// Schema extraído de api/ratings/route.ts
const schema = z.object({
  order_id: z.string().uuid(),
  hygiene: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  quality: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

const validPayload = {
  order_id: '550e8400-e29b-41d4-a716-446655440000',
  hygiene: 5,
  punctuality: 4,
  quality: 3,
}

describe('Schema de calificación de pedidos', () => {
  it('acepta un payload válido sin comentario', () => {
    const result = schema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('acepta un payload válido con comentario', () => {
    const result = schema.safeParse({ ...validPayload, comment: '¡Excelente servicio!' })
    expect(result.success).toBe(true)
  })

  it('rechaza order_id que no es UUID', () => {
    const result = schema.safeParse({ ...validPayload, order_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rechaza puntuación menor a 1', () => {
    expect(schema.safeParse({ ...validPayload, hygiene: 0 }).success).toBe(false)
    expect(schema.safeParse({ ...validPayload, punctuality: 0 }).success).toBe(false)
    expect(schema.safeParse({ ...validPayload, quality: 0 }).success).toBe(false)
  })

  it('rechaza puntuación mayor a 5', () => {
    expect(schema.safeParse({ ...validPayload, hygiene: 6 }).success).toBe(false)
    expect(schema.safeParse({ ...validPayload, punctuality: 6 }).success).toBe(false)
    expect(schema.safeParse({ ...validPayload, quality: 6 }).success).toBe(false)
  })

  it('rechaza puntuación decimal', () => {
    const result = schema.safeParse({ ...validPayload, hygiene: 4.5 })
    expect(result.success).toBe(false)
  })

  it('rechaza comentario mayor a 500 caracteres', () => {
    const result = schema.safeParse({ ...validPayload, comment: 'X'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('acepta comentario de exactamente 500 caracteres', () => {
    const result = schema.safeParse({ ...validPayload, comment: 'X'.repeat(500) })
    expect(result.success).toBe(true)
  })

  it('acepta puntuaciones en el rango válido (1–5)', () => {
    for (const score of [1, 2, 3, 4, 5]) {
      const result = schema.safeParse({ ...validPayload, hygiene: score, punctuality: score, quality: score })
      expect(result.success).toBe(true)
    }
  })

  it('rechaza si falta order_id', () => {
    const { order_id: _, ...rest } = validPayload
    const result = schema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rechaza si falta alguna puntuación', () => {
    const { hygiene: _, ...rest } = validPayload
    expect(schema.safeParse(rest).success).toBe(false)
  })
})
