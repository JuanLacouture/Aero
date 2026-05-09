import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(255),
  description: z.string().max(500).optional(),
  price: z.number().positive('Debe ser mayor a 0'),
  category: z.string().max(100).optional(),
  stock_limit: z.number().int().positive().optional(),
  is_available: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
