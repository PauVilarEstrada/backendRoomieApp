// src/profile/profile.routes.ts
import { Router } from 'express'
import { verifyToken } from '../middlewares/auth.middleware'
import upload         from '../middlewares/upload.middleware'

import {
  createRoommateProfile,
  createRoomProviderProfile,
  updateRoommateProfile,
  updateRoomProviderProfile,
  deleteRoommateProfile,
  deleteRoomProviderProfile,
  getRoommateProfileById,
  getRoomProviderProfileById,
  updateMyAccount,
  deleteMyAccount
} from './profile.controller'

const router = Router()

// — Crear perfil de "busco"
router.post(
  '/roommate',
  verifyToken,
  createRoommateProfile
)

// — Crear perfil de "ofrezco"
router.post(
  '/provider',
  verifyToken,
  upload.fields([
    { name: 'roomPhotos',    maxCount: 10 },
    { name: 'profilePhotos', maxCount:  5 }
  ]),
  createRoomProviderProfile
)

// — Actualizar perfil de buscador
router.put(
  '/roommate',
  verifyToken,
  updateRoommateProfile
)

// — Eliminar perfil de buscador
router.delete(
  '/roommate',
  verifyToken,
  deleteRoommateProfile
)

// — Actualizar perfil de proveedor
router.put(
  '/provider',
  verifyToken,
  upload.fields([{ name: 'roomPhotos', maxCount: 10 }]),
  updateRoomProviderProfile
)

// — Eliminar perfil de proveedor
router.delete(
  '/provider',
  verifyToken,
  deleteRoomProviderProfile
)

// — Fetch perfil de buscador público
router.get(
  '/roommates/:id',
  getRoommateProfileById
)

// — Fetch perfil de proveedor público
router.get(
  '/providers/:id',
  getRoomProviderProfileById
)

// — Actualizar datos de mi cuenta (name, phone, etc.)
router.put(
  '/me',
  verifyToken,
  updateMyAccount
)

// — Eliminar mi cuenta
router.delete(
  '/me',
  verifyToken,
  deleteMyAccount
)

export default router
