import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  prefix: z.string().regex(/^\+\d{1,4}$/, 'Prefijo inválido (ej: +34)'),
  phone: z.string().regex(/^\d{6,12}$/, 'Número de teléfono inválido'),
  email: z.string().email(),
  birthDate: z.string(), // ISO format
  gender: z.enum([
  'Hombre',
  'Mujer',
  'No binario',
  'Otro',
  'No quiero decirlo'
  ]),
  language: z.string().min(1),
  profileType: z.enum(['busco','ofrezco'],),
  password: z.string().min(6),
   repeatPassword: z.string()
  })
  .refine(data => data.password === data.repeatPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['repeatPassword']
  })


export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().min(5)
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'La contraseña actual es obligatoria'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
})
