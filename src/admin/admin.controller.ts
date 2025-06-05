import { Request, Response } from 'express'
import { prisma } from '../prisma/client'
import { AuthRequest } from '../middlewares/auth.middleware'
import { updateUserSchema } from './admin.validator'
import { z } from 'zod'

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true
      }
    })
    res.status(200).json({ users })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los usuarios' })
  }
}

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true
      }
    })

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    res.status(200).json({ user })
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar el usuario' })
  }
}

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateUserSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed.data
    })

    res.status(200).json({ message: 'Usuario actualizado', updatedUser })
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el usuario' })
  }

  await prisma.adminLog.create({
  data: {
    adminId: req.user!.userId,
    action: 'UPDATE_USER',
    targetId: req.params.id
  }
})
}

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const userIdToDelete = req.params.id

  if (req.user?.userId === userIdToDelete) {
    res.status(400).json({ error: 'No puedes eliminar tu propio usuario desde esta ruta' })
    return
  }

  try {
    const deletedUser = await prisma.ad.deleteMany({ where: { userId: userIdToDelete } })
await prisma.roommateProfile.deleteMany({ where: { userId: userIdToDelete } })
await prisma.roomProviderProfile.deleteMany({ where: { userId: userIdToDelete } })
await prisma.user.delete({ where: { id: userIdToDelete } })

    res.status(200).json({ message: 'Usuario eliminado', deletedUser })
  } catch (err) {
    console.error('[ADMIN DELETE ERROR]', err)
    res.status(500).json({ error: 'Error al eliminar el usuario' })
  }

  await prisma.adminLog.create({
  data: {
    adminId: req.user!.userId,
    action: 'UPDATE_USER',
    targetId: req.params.id
  }
})

}

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count()
    const verifiedUsers = await prisma.user.count({ where: { emailVerified: true } })
    const admins = await prisma.user.count({ where: { isAdmin: true } })
    const totalListings = await prisma.ad.count()
    const totalRoommateProfiles = await prisma.roommateProfile.count()
    const totalRoomProviderProfiles = await prisma.roomProviderProfile.count()
    const totalChats = await prisma.match.count()
    const totalMessages = await prisma.chatMessage.count()

    const gainResult = await prisma.ad.aggregate({ _sum: { gain: true } })
    const totalGain = gainResult._sum.gain ?? 0

    res.status(200).json({
      totalUsers,
      verifiedUsers,
      admins,
      totalListings,
      totalGain,
      totalRoommateProfiles,
      totalRoomProviderProfiles,
      totalChats,
      totalMessages
    })
  } catch (err) {
    console.error('[GET STATS ERROR]', err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

export const getPublicStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count()
    const totalAds = await prisma.ad.count()
    const totalRoommateProfiles = await prisma.roommateProfile.count()
    const totalRoomProviderProfiles = await prisma.roomProviderProfile.count()

    res.status(200).json({
      totalUsers,
      totalAds,
      totalRoommateProfiles,
      totalRoomProviderProfiles
    })
  } catch (err) {
    console.error('[GET PUBLIC STATS ERROR]', err)
    res.status(500).json({ error: 'Error al obtener estadísticas públicas' })
  }
}