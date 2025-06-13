import { z } from 'zod'

export const roommateProfileSchema = z.object({
  description: z.string().min(5),
  preferredArea: z.string().min(3),
  moveInDate: z.string().datetime(),
  stayDuration: z.string().min(1),
  genderPref: z.string().min(3),
  allowsPets: z.boolean(),
  profilePhotos: z.array(z.string().url()).min(1).max(8)
})

export const roomProviderProfileSchema = z.object({
  spaceDesc: z.string().min(5),
  rent: z.number().int().positive(),
  expenses: z.number().int().nonnegative(),
  area: z.string().min(3),
  availability: z.string().datetime(),
  minStay: z.number().int().min(1),
  maxStay: z.number().int().optional(),
  allowsPets: z.boolean(),
  features: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  genderPref: z.string().min(3),
  roomPhotos: z.array(z.string().url()).min(2),
  profilePhotos: z.array(z.string().url()).max(5).optional(),
  roomVideo: z.string().url().optional()
})
