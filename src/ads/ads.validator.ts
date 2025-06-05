import { z } from 'zod'

export const createListingSchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  price: z.number().int(),
  expenses: z.number().int(),
  availableFrom: z.string().datetime(),
  minStay: z.number().int(),
  maxStay: z.number().int().nullable().optional(),
  allowsAnimals: z.boolean(),
  genderPref: z.string(),
  features: z.array(z.string()),
  restrictions: z.array(z.string()),
  images: z.array(z.string().url()),
  video: z.string().url().nullable().optional()
})