import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth.middleware'
import { prisma } from '../prisma/client'

export const isAdOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const adId = req.params.id

  try {
    const ad = await prisma.ad.findUnique({ where: { id: adId } })

    if (!ad) {
      res.status(404).json({ error: 'Anuncio no encontrado' })
      return
    }

    // Solo el dueño o admin
    if (ad.userId !== req.user?.userId && !req.user?.isAdmin) {
      res.status(403).json({ error: 'No tienes permiso para modificar o eliminar este anuncio' })
      return
    }

    next()
  } catch (err) {
    res.status(500).json({ error: 'Error de autorización del anuncio' })
  }
}
