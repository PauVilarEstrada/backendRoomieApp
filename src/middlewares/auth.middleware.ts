import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AuthPayload {
  userId: string
  email: string
  isAdmin: boolean
  profileType: 'busco' | 'ofrezco'
}

export interface AuthRequest extends Request {
  user?: AuthPayload
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token

  if (!token) {
    res.status(401).json({ error: 'No autorizado. Token no encontrado.' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado.' })
  }
}

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.isAdmin) {
    next()
  } else {
    res.status(403).json({ error: 'Acceso denegado. No tienes permiso para realizar esta accion.' })
  }
}