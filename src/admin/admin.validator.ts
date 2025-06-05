import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  isAdmin: z.boolean(),
  emailVerified: z.boolean()
})
