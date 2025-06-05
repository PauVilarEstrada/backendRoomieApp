import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth.middleware'
import { prisma } from '../prisma/client'

export const isMatchParticipant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const matchId = req.params.matchId
  const userId = req.user?.userId

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      res.status(404).json({ error: 'Match no encontrado' })
      return
    }

    if (match.userAId !== userId && match.userBId !== userId && !req.user?.isAdmin) {
      res.status(403).json({ error: 'No tienes permiso para acceder a este chat' })
      return
    }

    next()
  } catch (err) {
    console.error('[MATCH OWNERSHIP ERROR]', err)
    res.status(500).json({ error: 'Error de autorización del match' })
  }
}
