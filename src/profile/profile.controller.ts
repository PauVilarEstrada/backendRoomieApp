import { Request, Response, RequestHandler } from 'express'
import { prisma } from '../prisma/client'
import { roommateProfileSchema, roomProviderProfileSchema } from './profile.validator'
import { bucket } from '../utils/storage'

export const createRoommateProfile: RequestHandler = async (req, res) => {
  try {
    // 1️⃣ Validar body con Zod
    const parsed = roommateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      return
    }
    const data = parsed.data

    // 2️⃣ Extraer userId y profileType del token
    const { userId, profileType } = (req as any).user
    if (profileType !== 'busco') {
      res.status(403).json({ error: 'Usuario no autorizado para “busco”' })
      return
    }

    // 3️⃣ Comprobar si ya existe perfil
    const existing = await prisma.roommateProfile.findUnique({
      where: { userId }
    })
    if (existing) {
      res.status(409).json({ error: 'Ya tienes un perfil de buscador creado' })
      return
    }

    // 4️⃣ Crear RoommateProfile
    const profile = await prisma.roommateProfile.create({
      data: {
        userId,
        description:   data.description,
        preferredArea: data.preferredArea,
        moveInDate:    new Date(data.moveInDate),
        stayDuration:  data.stayDuration,
        genderPref:    data.genderPref,
        allowsPets:    data.allowsPets,
        profilePhotos: data.profilePhotos
      }
    })

    // 5️⃣ Crear Ad asociado
    await prisma.ad.create({
      data: {
        type:          'busco',
        title:         `Busco habitación en ${data.preferredArea}`,
        description:   data.description,
        location:      data.preferredArea,
        price:         0,
        expenses:      0,
        availableFrom: new Date(data.moveInDate),
        minStay:       parseInt(data.stayDuration, 10),
        maxStay:       null,
        allowsAnimals: data.allowsPets,
        genderPref:    data.genderPref,
        features:      [],
        restrictions:  [],
        images:        data.profilePhotos,
        video:         null,
        userId
      }
    })

    // 6️⃣ Responder al cliente
    res.status(201).json({ message: 'Perfil de buscador creado', profile })
  } catch (err) {
    console.error('[CREATE ROOMMATE PROFILE ERROR]', err)
    res.status(500).json({ error: 'Error al crear el perfil de buscador' })
  }
}

export const createRoomProviderProfile: RequestHandler = async (req, res) => {
  try {
    // 1️⃣ Extrae userId y profileType del token
    const { userId, profileType } = (req as any).user
    if (profileType !== 'ofrezco') {
      res.status(403).json({ error: 'Usuario no autorizado para “ofrezco”' })
      return
    }

    // 2️⃣ Multer ha llenado req.files con { roomPhotos?: File[], profilePhotos?: File[] }
    const files = req.files as Record<string, Express.Multer.File[]>
    const roomFiles    = files.roomPhotos    ?? []
    const profileFiles = files.profilePhotos ?? []

    // 3️⃣ Función auxiliar: sube un buffer y devuelve la URL pública
    const uploadToBucket = async (
      file: Express.Multer.File,
      folder: string
    ): Promise<string> => {
      const blob   = bucket.file(`${folder}/${Date.now()}_${file.originalname}`)
      const stream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
        predefinedAcl: 'publicRead'
      })
      await new Promise<void>((resolve, reject) => {
        stream.on('finish',  () => resolve())
        stream.on('error',   (e) => reject(e))
        stream.end(file.buffer)
      })
      return `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    }

    // 4️⃣ Sube todas las imágenes en paralelo
    const roomUrls    = await Promise.all(roomFiles   .map(f => uploadToBucket(f, 'roomPhotos')))
    const profileUrls = await Promise.all(profileFiles.map(f => uploadToBucket(f, 'profilePhotos')))

    // 5️⃣ Coerción de strings a números
    const rent     = parseInt(req.body.rent,     10)
    const expenses = parseInt(req.body.expenses, 10)
    const minStay  = parseInt(req.body.minStay,  10)
    const maxStay  = req.body.maxStay ? parseInt(req.body.maxStay, 10) : undefined

    // 6️⃣ Reconstruye el objeto para Zod, incluyendo las URLs
    const toValidate = {
      ...req.body,
      rent,
      expenses,
      minStay,
      maxStay,
      roomPhotos:    roomUrls,
      profilePhotos: profileUrls
    }
    const parsed = roomProviderProfileSchema.safeParse(toValidate)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors })
      return
    }
    const data = parsed.data

    // 7️⃣ Crea el RoomProviderProfile
    const profile = await prisma.roomProviderProfile.create({
      data: {
        userId,
        spaceDesc:     data.spaceDesc,
        rent:          data.rent,
        expenses:      data.expenses,
        area:          data.area,
        availability:  new Date(data.availability),
        minStay:       data.minStay,
        maxStay:       data.maxStay,
        allowsPets:    data.allowsPets,
        features:      data.features    || [],
        restrictions:  data.restrictions || [],
        genderPref:    data.genderPref,
        roomPhotos:    roomUrls,
        profilePhotos: profileUrls
      }
    })

    // 8️⃣ Crea el Ad asociado
    await prisma.ad.create({
      data: {
        type:          'ofrezco',
        title:         `Habitación en ${data.area}`,
        description:   data.spaceDesc,
        location:      data.area,
        price:         data.rent,
        expenses:      data.expenses,
        availableFrom: new Date(data.availability),
        minStay:       data.minStay,
        maxStay:       data.maxStay,
        allowsAnimals: data.allowsPets,
        genderPref:    data.genderPref,
        features:      data.features    || [],
        restrictions:  data.restrictions || [],
        images:        roomUrls,
        video:         null,
        userId
      }
    })

    // 9️⃣ Devuelve 201 con el perfil creado
    res.status(201).json({ message: 'Perfil de proveedor creado', profile })
  } catch (err: any) {
    console.error('[CREATE PROVIDER PROFILE ERROR]', err)
    res.status(500).json({ error: 'Error al crear el perfil de proveedor' })
  }
}

export const updateRoommateProfile: RequestHandler = async (req, res) => {
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

export const deleteRoommateProfile: RequestHandler = async (req, res) => {
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

export const updateRoomProviderProfile: RequestHandler = async (req, res) => {
  try {
    if (req.user?.profileType !== 'ofrezco') {
      res.status(403).json({ error: 'No autorizado para modificar este perfil' })
      return
    }

    // Si recibes nuevas fotos en update, sube igual
    const photos = req.files as Express.Multer.File[] | undefined

    let photoUrls: string[] | undefined = undefined

    if (photos && photos.length > 0) {
      photoUrls = []
      for (const file of photos) {
        const blob = bucket.file(`roomPhotos/${Date.now()}_${file.originalname}`)
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: file.mimetype,
          predefinedAcl: 'publicRead'
        })

        await new Promise((resolve, reject) => {
          blobStream.on('finish', resolve)
          blobStream.on('error', reject)
          blobStream.end(file.buffer)
        })

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        photoUrls.push(publicUrl)
      }
    }

    const dataToUpdate = {
      ...req.body,
      ...(photoUrls ? { roomPhotos: photoUrls } : {})
    }

    const updated = await prisma.roomProviderProfile.update({
      where: { userId: req.user.userId },
      data: dataToUpdate
    })

    res.status(200).json({ message: 'Perfil actualizado correctamente', updated })
  } catch (err) {
    console.error('[UPDATE PROVIDER ERROR]', err)
    res.status(500).json({ error: 'Error al actualizar el perfil' })
  }
}

export const deleteRoomProviderProfile: RequestHandler = async (req, res) => {
  try {
    if (req.user?.profileType !== 'ofrezco' && !req.user?.isAdmin) {
      res.status(403).json({ error: 'No autorizado para eliminar este perfil' })
      return
    }

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

export const getRoommateProfileById: RequestHandler = async (req, res) => {
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

export const getRoomProviderProfileById: RequestHandler = async (req, res) => {
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


export const updateMyAccount: RequestHandler = async (req, res) => {
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

export const deleteMyAccount: RequestHandler = async (req, res) => {
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
