import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5,
  message: {
    error: 'Demasiados intentos de login. Intenta de nuevo en 10 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
})
