import { Router } from 'express'
import { register, verifyEmail, login, logout, forgotPassword, resetPassword, changePassword  } from './auth.controller'
import { loginLimiter } from '../utils/rateLimiter'
import { verifyToken } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/verify', verifyEmail)
router.post('/login', loginLimiter, login)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', verifyToken, changePassword)

export default router
