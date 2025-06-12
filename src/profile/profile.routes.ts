import { Router } from 'express'
import {
  createRoommateProfile,
  createRoomProviderProfile,
  updateRoommateProfile,
  updateRoomProviderProfile,
  deleteRoomProviderProfile,
  deleteRoommateProfile,
  getRoommateProfileById,
  getRoomProviderProfileById,
  updateMyAccount,
  deleteMyAccount
} from './profile.controller'
import { verifyToken } from '../middlewares/auth.middleware'
import upload from '../middlewares/upload.middleware' // multer

const router = Router()

// Aquí indicamos que en provider aceptamos array máximo 15 fotos con nombre 'roomPhotos'
router.post('/roommate', verifyToken, createRoommateProfile)
router.post('/provider', verifyToken, upload.array('roomPhotos', 15), createRoomProviderProfile)

router.put('/roommate', verifyToken, updateRoommateProfile)
router.delete('/roommate', verifyToken, deleteRoommateProfile)

router.put('/provider', verifyToken, upload.array('roomPhotos', 15), updateRoomProviderProfile)
router.delete('/provider', verifyToken, deleteRoomProviderProfile)

router.get('/roommates/:id', getRoommateProfileById)
router.get('/providers/:id', getRoomProviderProfileById)
router.put('/me', verifyToken, updateMyAccount)
router.delete('/me', verifyToken, deleteMyAccount)

export default router
