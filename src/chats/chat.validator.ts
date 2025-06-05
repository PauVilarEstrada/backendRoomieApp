import { z } from 'zod'

export const sendMessageSchema = z.object({
  matchId: z.string().min(1),
  senderId: z.string().min(1),
  content: z.string().min(1).max(250).optional(),
  imageUrl: z.string().url().optional()
})