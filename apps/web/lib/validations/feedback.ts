import { z } from 'zod'

export const feedbackSchema = z.object({
  subject: z.string().trim().min(1, 'Título requerido').max(255),
  message: z.string().trim().min(1, 'Cuéntanos más').max(2000),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>
