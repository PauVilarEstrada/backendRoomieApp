import { Request, Response } from 'express'
import { prisma } from '../prisma/client'
import { AuthRequest } from '../middlewares/auth.middleware'
import { roommateProfileSchema, roomProviderProfileSchema } from './profile.validator'

export const createRoommateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = roommateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      return
    }

    const data = parsed.data

    if (req.user?.profileType !== 'busco') {
      res.status(403).json({ error: 'Este usuario no es del tipo "busco"' })
      return
    }

    const existingProfile = await prisma.roommateProfile.findUnique({ where: { userId: req.user.userId } })
    if (existingProfile) {
      res.status(409).json({ error: 'Ya tienes un perfil de buscador creado' })
      return
    }

    const profile = await prisma.roommateProfile.create({
      data: {
        userId: req.user.userId,
        description: data.description,
        preferredArea: data.preferredArea,
        moveInDate: new Date(data.moveInDate),
        stayDuration: data.stayDuration,
        genderPref: data.genderPref,
        allowsPets: data.allowsPets,
        profilePhotos: data.profilePhotos
      }
    })

    await prisma.ad.create({
      data: {
        type: 'busco',
        title: `Busco habitación en ${data.preferredArea}`,
        description: data.description,
        location: data.preferredArea,
        price: 0,
        expenses: 0,
        availableFrom: new Date(data.moveInDate),
        minStay: parseInt(data.stayDuration),
        maxStay: null,
        allowsAnimals: data.allowsPets,
        genderPref: data.genderPref,
        features: [],
        restrictions: [],
        images: data.profilePhotos,
        video: null,
        userId: req.user.userId
      }
    })

    res.status(201).json({ message: 'Perfil de buscador creado', profile })
  } catch (err) {
    console.error('[CREATE ROOMMATE PROFILE ERROR]', err)
    res.status(500).json({ error: 'Error al crear el perfil de buscador' })
  }
}

export const createRoomProviderProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = roomProviderProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      return
    }

    const data = parsed.data

    if (req.user?.profileType !== 'ofrezco') {
      res.status(403).json({ error: 'Este usuario no es del tipo "ofrezco"' })
      return
    }

    const existingProfile = await prisma.roomProviderProfile.findUnique({ where: { userId: req.user.userId } })
    if (existingProfile) {
      res.status(409).json({ error: 'Ya tienes un perfil de proveedor creado' })
      return
    }

    const profile = await prisma.roomProviderProfile.create({
      data: {
        userId: req.user.userId,
        spaceDesc: data.spaceDesc,
        rent: data.rent,
        expenses: data.expenses,
        area: data.area,
        availability: new Date(data.availability),
        minStay: data.minStay,
        maxStay: data.maxStay,
        allowsPets: data.allowsPets,
        features: data.features,
        restrictions: data.restrictions,
        genderPref: data.genderPref,
        roomPhotos: data.roomPhotos,
        profilePhotos: data.profilePhotos,
        roomVideo: data.roomVideo
      }
    })

    await prisma.ad.create({
      data: {
        type: 'ofrezco',
        title: `Habitación disponible en ${data.area}`,
        description: data.spaceDesc,
        location: data.area,
        price: data.rent,
        expenses: data.expenses,
        availableFrom: new Date(data.availability),
        minStay: data.minStay,
        maxStay: data.maxStay,
        allowsAnimals: data.allowsPets,
        genderPref: data.genderPref,
        features: data.features || [],
        restrictions: data.restrictions || [],
        images: data.roomPhotos,
        video: data.roomVideo || null,
        userId: req.user.userId
      }
    })

    res.status(201).json({ message: 'Perfil de proveedor creado', profile })
  } catch (err) {
    console.error('[CREATE PROVIDER PROFILE ERROR]', err)
    res.status(500).json({ error: 'Error al crear el perfil de proveedor' })
  }
}

export const updateRoommateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.profileType !== 'busco') {
      res.status(403).json({ error: 'No autorizado' })
      return
    }

    const updated = await prisma.roommateProfile.update({
      where: { userId: req.user.userId },
      data: req.body
    })

    res.status(200).json({ message: 'Perfil actualizado', updated })
  } catch (err) {
    console.error('[UPDATE ROOMMATE ERROR]', err)
    res.status(500).json({ error: 'Error al actualizar el perfil' })
  }
}

export const deleteRoommateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.profileType !== 'busco' && !req.user?.isAdmin) {
      res.status(403).json({ error: 'No autorizado' })
      return
    }

    await prisma.ad.deleteMany({ where: { userId: req.user.userId, type: 'busco' } })

    await prisma.roommateProfile.delete({
      where: { userId: req.user.userId }
    })

    res.status(200).json({ message: 'Perfil eliminado correctamente' })
  } catch (err) {
    console.error('[DELETE ROOMMATE ERROR]', err)
    res.status(500).json({ error: 'Error al eliminar el perfil' })
  }
}

export const updateRoomProviderProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.profileType !== 'ofrezco') {
      res.status(403).json({ error: 'No autorizado para modificar este perfil' })
      return
    }

    const updated = await prisma.roomProviderProfile.update({
      where: { userId: req.user.userId },
      data: req.body
    })

    res.status(200).json({ message: 'Perfil actualizado correctamente', updated })
  } catch (err) {
    console.error('[UPDATE PROVIDER ERROR]', err)
    res.status(500).json({ error: 'Error al actualizar el perfil' })
  }
}

export const deleteRoomProviderProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.profileType !== 'ofrezco' && !req.user?.isAdmin) {
      res.status(403).json({ error: 'No autorizado para eliminar este perfil' })
      return
    }

    // Opcional: eliminar anuncios del usuario si lo deseas
    await prisma.ad.deleteMany({
      where: { userId: req.user.userId }
    })

    await prisma.roomProviderProfile.delete({
      where: { userId: req.user.userId }
    })

    res.status(200).json({ message: 'Perfil eliminado correctamente' })
  } catch (err) {
    console.error('[DELETE PROVIDER ERROR]', err)
    res.status(500).json({ error: 'Error al eliminar el perfil' })
  }
}

export const getRoommateProfileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const profile = await prisma.roommateProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            gender: true,
            email: true,
            prefix: true,
            phone: true,
            birthDate: true
          }
        }
      }
    })

    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' })
      return
    }

    await prisma.roommateProfile.update({
      where: { id },
      data: { views: { increment: 1 } }
    })

    res.status(200).json(profile)
  } catch (err) {
    console.error('[GET ROOMMATE PROFILE ERROR]', err)
    res.status(500).json({ error: 'Error al obtener el perfil de usuario' })
  }
}

export const getRoomProviderProfileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const profile = await prisma.roomProviderProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            gender: true,
            email: true,
            prefix: true,
            phone: true,
            birthDate: true
          }
        },
        ad: true
      }
    })

    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' })
      return
    }

    await prisma.roomProviderProfile.update({
      where: { id },
      data: { views: { increment: 1 } }
    })

    res.status(200).json(profile)
  } catch (err) {
    console.error('[GET PROVIDER PROFILE ERROR]', err)
    res.status(500).json({ error: 'Error al obtener el perfil del proveedor de piso' })
  }
}


export const updateMyAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, surname, email, prefix, phone, language, gender } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name, surname, email, prefix, phone, language, gender }
    })

    res.status(200).json({ message: 'Tu cuenta ha sido actualizada', updatedUser })
  } catch (err) {
    console.error('[UPDATE MY ACCOUNT ERROR]', err)
    res.status(500).json({ error: 'Error al actualizar tu cuenta' })
  }
}

export const deleteMyAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    await prisma.ad.deleteMany({ where: { userId } })
    await prisma.roommateProfile.deleteMany({ where: { userId } })
    await prisma.roomProviderProfile.deleteMany({ where: { userId } })

    const deletedUser = await prisma.user.delete({ where: { id: userId } })

    res.clearCookie('token')
    res.status(200).json({ message: 'Tu cuenta ha sido eliminada', deletedUser })
  } catch (err) {
    console.error('[DELETE MY ACCOUNT ERROR]', err)
    res.status(500).json({ error: 'Error al eliminar tu cuenta' })
  }
}
