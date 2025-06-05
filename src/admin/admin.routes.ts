import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats,
  getPublicStats
} from './admin.controller'
import { verifyToken } from '../middlewares/auth.middleware'
import { isAdmin } from '../middlewares/admin.middleware'

const router = Router()

router.use(verifyToken, isAdmin)

router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.get('/stats', getStats)
router.get('/public-stats', getPublicStats)

export default router
