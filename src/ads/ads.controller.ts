import { Request, Response } from 'express'
import { prisma } from '../prisma/client'
import { AuthRequest } from '../middlewares/auth.middleware'
import { createListingSchema } from './ads.validator'
import { geocodeAddress } from '../utils/geocode'

export const getAllAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, location, genderPref, page = 1, limit = 10 } = req.query

    const filters: any = {}
    if (type) filters.type = type
    if (location) filters.location = { contains: location as string, mode: 'insensitive' }
    if (genderPref) filters.genderPref = genderPref

    const ads = await prisma.ad.findMany({
      where: filters,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            gender: true,
            profileType: true,
          }
        }
      }
    })

    res.json(ads)
  } catch (err) {
    console.error('[GET ADS ERROR]', err)
    res.status(500).json({ error: 'Error al obtener los anuncios' })
  }
}

export const getSwipeAds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' })
      return
    }

    const userProfileType = req.user.profileType
    const userId = req.user.userId

    const oppositeType = userProfileType === 'busco' ? 'ofrezco' : 'busco'

    const ads = await prisma.ad.findMany({
      where: {
        type: oppositeType,
        userId: { not: userId } // que no se vean sus propios anuncios
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    })

    res.json(ads)
  } catch (err) {
    console.error('[GET SWIPE ADS ERROR]', err)
    res.status(500).json({ error: 'Error al obtener anuncios tipo Tinder' })
  }
}

export const swipeAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' })
      return
    }

    const adId = req.params.adId
    const fromUserId = req.user.userId

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { user: true }
    })

    if (!ad) {
      res.status(404).json({ error: 'Anuncio no encontrado' })
      return
    }

    const toUserId = ad.userId

    if (fromUserId === toUserId) {
      res.status(400).json({ error: 'No puedes hacer swipe a tu propio anuncio' })
      return
    }

    // 1. Evitar duplicados: ¿ya se había hecho like antes?
    const alreadySwiped = await prisma.swipe.findFirst({
      where: {
        fromUserId,
        toUserId
      }
    })

    if (alreadySwiped) {
      res.status(409).json({ error: 'Ya has hecho like a este usuario' })
      return
    }

    // 2. Registrar el like
    await prisma.swipe.create({
      data: {
        fromUserId,
        toUserId,
        adId
      }
    })

    // 3. Comprobar si hay match mutuo
    const existingReverseSwipe = await prisma.swipe.findFirst({
      where: {
        fromUserId: toUserId,
        toUserId: fromUserId
      }
    })

    let matchCreated = false

    if (existingReverseSwipe) {
      // 4. Evitar duplicar el match si ya existe
      const existingMatch = await prisma.match.findFirst({
        where: {
          OR: [
            { userAId: fromUserId, userBId: toUserId },
            { userAId: toUserId, userBId: fromUserId }
          ]
        }
      })

      if (!existingMatch) {
        await prisma.match.create({
          data: {
            userAId: fromUserId,
            userBId: toUserId
          }
        })
        matchCreated = true
      }
    }

    res.status(201).json({
      message: 'Like registrado correctamente',
      match: matchCreated
    })
  } catch (err) {
    console.error('[SWIPE AD ERROR]', err)
    res.status(500).json({ error: 'Error al registrar el like' })
  }
}

export const getMyMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' })
      return
    }

    const userId = req.user.userId

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            profileType: true,
            gender: true
          }
        },
        userB: {
          select: {
            id: true,
            name: true,
            profileType: true,
            gender: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatear para que el frontend reciba solo "la otra persona"
    const formatted = matches.map(match => {
      const otherUser = match.userA.id === userId ? match.userB : match.userA
      return {
        matchId: match.id,
        withUser: otherUser,
        matchedAt: match.createdAt
      }
    })

    res.status(200).json(formatted)
  } catch (err) {
    console.error('[GET MATCHES ERROR]', err)
    res.status(500).json({ error: 'Error al obtener los matches' })
  }
}

export const createListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createListingSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      return
    }

    const data = parsed.data

    // Geocodificar la dirección (campo `location`)
    const coords = await geocodeAddress(data.location)

    const ad = await prisma.ad.create({
      data: {
        ...data,
        type: req.user!.profileType,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        userId: req.user!.userId
      }
    })

    res.status(201).json({ message: 'Anuncio creado correctamente', ad })
  } catch (err) {
    console.error('[CREATE LISTING ERROR]', err)
    res.status(500).json({ error: 'Error al crear el anuncio' })
  }
}

export const getMapMarkers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ads = await prisma.ad.findMany({
      where: {
        type: 'ofrezco',
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        title: true,
        location: true,
        latitude: true,
        longitude: true,
        images: true,
        price: true,
        userId: true
      }
    })

    res.status(200).json(ads)
  } catch (err) {
    console.error('[GET MAP MARKERS ERROR]', err)
    res.status(500).json({ error: 'Error al obtener puntos para el mapa' })
  }
}

export const getAdById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Incrementar vistas
    await prisma.ad.update({
      where: { id },
      data: {
        views: { increment: 1 }
      }
    })

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            gender: true,
            profileType: true,
            email: true,
            phone: true,
            prefix: true
          }
        }
      }
    })

    if (!ad) {
      res.status(404).json({ error: 'Anuncio no encontrado' })
      return
    }

    res.status(200).json(ad)
  } catch (err) {
    console.error('[GET AD BY ID ERROR]', err)
    res.status(500).json({ error: 'Error al obtener el anuncio' })
  }
}

export const registerAdClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    await prisma.ad.update({
      where: { id },
      data: {
        clicks: { increment: 1 }
      }
    })
    res.status(200).json({ message: 'Click registrado' })
  } catch (err) {
    console.error('[REGISTER CLICK ERROR]', err)
    res.status(500).json({ error: 'Error al registrar click' })
  }
}