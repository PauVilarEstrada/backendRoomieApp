import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../prisma/client'
import { registerSchema, loginSchema } from './auth.validator'
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer'
import { verifyEmailSchema, changePasswordSchema } from './auth.validator'
import { generateVerificationCode } from '../utils/codeGenerator'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { AuthRequest } from '../middlewares/auth.middleware'


export const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  const { name, surname, prefix, phone, email, birthDate, gender, language, password } = parsed.data

  // Comprobación automática de edad mínima
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  const dayDiff = today.getDate() - birth.getDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--
  }

  if (age < 16) {
    res.status(400).json({ error: 'Debes tener al menos 16 años para registrarte.' })
    return
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      res.status(409).json({ error: 'El correo ya está registrado' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = generateVerificationCode(6)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.create({
      data: {
        name,
        surname,
        prefix,
        phone,
        email,
        birthDate: new Date(birthDate),
        gender,
        language,
        passwordHash,
        verificationCode,
        verificationExpiresAt: expiresAt
      }
    })

    await sendVerificationEmail(email, verificationCode)

    res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.' })
  } catch (err) {
    console.error('[REGISTER ERROR]', err)
    res.status(500).json({ error: 'Error interno al registrar usuario' })
  }
}

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const parsed = verifyEmailSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  const { email, code } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.verificationCode !== code) {
      res.status(400).json({ error: 'Código incorrecto o usuario no encontrado' })
      return
    }
    
    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
  // Eliminar usuario no verificado
  await prisma.user.delete({ where: { email } })
  res.status(410).json({ error: 'El código ha expirado. Regístrate de nuevo.' })
  return
}

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null
      }
    })

    res.status(200).json({ message: 'Correo verificado correctamente' })
  } catch (err) {
    console.error('[VERIFY EMAIL ERROR]', err)
    res.status(500).json({ error: 'Error al verificar correo' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  const { email, password } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesión' })
      return
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      res.status(401).json({ error: 'Contraseña incorrecta' })
      return
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin, profileType: user.profileType },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res
  .cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // solo HTTPS en producción
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  })
  .status(200)
  .json({ message: 'Login exitoso' })
  } catch (err) {
    console.error('[LOGIN ERROR]', err)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
}

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })

  res.status(200).json({ message: 'Sesión cerrada correctamente' })
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ error: 'El correo es obligatorio' })
    return
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: resetToken,
        verificationExpiresAt: expires
      }
    })

    await sendPasswordResetEmail(email, resetToken)

    res.status(200).json({ message: 'Correo de recuperación enviado' })
  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]', err)
    res.status(500).json({ error: 'Error al enviar recuperación' })
  }
}

// 2. Reset con código recibido
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, code, newPassword } = req.body
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: 'Faltan campos' })
    return
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.verificationCode !== code) {
      res.status(400).json({ error: 'Código inválido o usuario no encontrado' })
      return
    }

    if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
      res.status(410).json({ error: 'El código ha expirado' })
      return
    }

    const newHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: newHash,
        verificationCode: null,
        verificationExpiresAt: null
      }
    })

    res.status(200).json({ message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    console.error('[RESET PASSWORD ERROR]', err)
    res.status(500).json({ error: 'Error al actualizar contraseña' })
  }
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordMatch) {
      res.status(401).json({ error: 'La contraseña actual no es correcta' })
      return
    }

    const newHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        passwordHash: newHash
      }
    })

    res.status(200).json({ message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    console.error('[CHANGE PASSWORD ERROR]', err)
    res.status(500).json({ error: 'Error al cambiar la contraseña' })
  }
}