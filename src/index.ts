import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cron from 'node-cron'

import { prisma } from './prisma/client'
import { verifyToken, isAdmin, AuthRequest } from './middlewares/auth.middleware'

import authRoutes from './auth/auth.routes'
import adminRoutes from './admin/admin.routes'
import profileRoutes from './profile/profile.routes'
import adsRoutes from './ads/ads.routes'
import chatRoutes from './chats/chat.routes'
import { registerChatHandlers } from './chats/chat.gateway'
import { cleanupUnverifiedUsers } from './utils/cleanupUnversifiedUsers'

dotenv.config()

const app = express()

// Middlewares globales
app.use(cors())
app.use(express.json())
app.use(cookieParser())

// Rutas de autenticación
app.use('/auth', authRoutes)

// Ruta protegida de ejemplo (/me)
app.get('/me', verifyToken, (req: AuthRequest, res: Response) => {
  res.status(200).json({
    message: 'Ruta privada accedida correctamente',
    user: req.user
  })
})

// Ruta protegida solo para admins
app.delete(
  '/admin/delete-user/:id',
  verifyToken,
  isAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const deletedUser = await prisma.user.delete({
        where: { id: req.params.id }
      })
      res.status(200).json({ message: 'Usuario eliminado', deletedUser })
    } catch (err) {
      console.error('[ADMIN DELETE ERROR]', err)
      res.status(500).json({ error: 'Error al eliminar el usuario' })
    }
  }
)

// Otras rutas
app.use('/admin', adminRoutes)
app.use('/profile', profileRoutes)
app.use('/ads', adsRoutes)
app.use('/chat', chatRoutes)

// Ruta pública simple
app.get('/', (_req, res) => {
  res.send('API de Encontrar Roomie funcionando ✅')
})

// Health check (GET /healthz)
// Esta función tiene exactamente 3 params (req, res, next),
// devuelve void y no un Promise directamente, para que encaje
// con el tipo RequestHandler de Express sin confundir a TS.
app.get(
  '/healthz',
  (req: Request, res: Response, next: NextFunction) => {
    prisma
      .$queryRaw`SELECT 1`
      .then(() => {
        res.status(200).send('OK')
      })
      .catch((e) => {
        console.error('DB CONNECT ERROR', e)
        res.status(500).send('DB FAIL')
      })
  }
)

// Servidor HTTP + WebSockets
const PORT = process.env.PORT || 8080
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Handlers de chat
registerChatHandlers(io)

// Ejecutar cada 15 minutos la limpieza de usuarios no verificados
cron.schedule('*/15 * * * *', async () => {
  await cleanupUnverifiedUsers()
})

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
