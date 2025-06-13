// src/middlewares/auth.middleware.ts
import { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthPayload {
  userId: string
  email: string
  isAdmin: boolean
  profileType: 'busco' | 'ofrezco'
}

// Esto amplía la definición interna de Express Request
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload
  }
}

/**
 * Verifica el JWT almacenado en la cookie 'token'.
 * Si es válido, inyecta el payload en `req.user` y llama a next().
 * Si no, responde con 401 y sale.
 */
export const verifyToken: RequestHandler = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ error: 'No autorizado. Token no encontrado.' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' })
    return
  }
}

/**
 * Comprueba que `req.user?.isAdmin === true`.
 * Debe ir siempre después de `verifyToken`.
 * Si no, responde con 403.
 */
export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.isAdmin) {
    next()
  } else {
    res
      .status(403)
      .json({
        error: 'Acceso denegado. No tienes permiso para realizar esta acción.'
      })
    return
  }
}
