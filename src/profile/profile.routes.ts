import { Router } from 'express'
import { createRoommateProfile, createRoomProviderProfile, 
    updateRoommateProfile, updateRoomProviderProfile, deleteRoomProviderProfile, 
    deleteRoommateProfile, getRoommateProfileById, getRoomProviderProfileById,
    updateMyAccount, deleteMyAccount } 
    from './profile.controller'
import { verifyToken } from '../middlewares/auth.middleware'

const router = Router()

router.post('/roommate', verifyToken, createRoommateProfile)
router.post('/provider', verifyToken, createRoomProviderProfile)

router.put('/roommate', verifyToken, updateRoommateProfile)
router.delete('/roommate', verifyToken, deleteRoommateProfile)

router.put('/provider', verifyToken, updateRoomProviderProfile)
router.delete('/provider', verifyToken, deleteRoomProviderProfile)

router.get('/roommates/:id', getRoommateProfileById)
router.get('/providers/:id', getRoomProviderProfileById)
router.put('/me', verifyToken, updateMyAccount)
router.delete('/me', verifyToken, deleteMyAccount)


export default router
