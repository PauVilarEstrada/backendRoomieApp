import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.isAdmin) {
    next()
  } else {
    res.status(403).json({ error: 'Acceso denegado. No tienes permisos de administrador.' })
  }
}
