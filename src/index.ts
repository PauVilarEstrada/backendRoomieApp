import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cron from 'node-cron'

import { prisma } from './prisma/client'
import { verifyToken, isAdmin } from './middlewares/auth.middleware'

import authRoutes from './auth/auth.routes'
import adminRoutes from './admin/admin.routes'
import profileRoutes from './profile/profile.routes'
import adsRoutes from './ads/ads.routes'
import chatRoutes from './chats/chat.routes'
import { registerChatHandlers } from './chats/chat.gateway'
import { cleanupUnverifiedUsers } from './utils/cleanupUnversifiedUsers'

dotenv.config()

const app = express()

// 1) Logger mínimo de todas las peticiones
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// 2) Health check rápido antes que nada
app.get(
  '/healthz',
  (req: Request, res: Response, next: NextFunction) => {
    prisma
      .$queryRaw`SELECT 1`
      .then(() => res.status(200).send('OK'))
      .catch((e) => {
        console.error('DB CONNECT ERROR', e)
        res.status(500).send('DB FAIL')
      })
  }
)

// Middlewares globales
app.use(cors())
app.use(express.json())
app.use(cookieParser())

// Rutas de autenticación
app.use('/auth', authRoutes)

// Ruta protegida de ejemplo (/me)
app.get('/me', verifyToken, (req, res) => {
  const  userId  = req.user!.userId
  res.json({ message: 'Hola', userId })
})


// Ruta protegida solo para admins
app.delete(
  '/admin/delete-user/:id',
  verifyToken,
  isAdmin,
  async (req, res) => {
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

// Resto de rutas de tu API
app.use('/admin', adminRoutes)
app.use('/profile', profileRoutes)
app.use('/ads', adsRoutes)
app.use('/chat', chatRoutes)

// Ruta raíz
app.get('/', (_req, res) => {
  res.send('API de Encontrar Roomie funcionando ✅')
})

// Servidor HTTP + WebSockets
const PORT = Number(process.env.PORT) || 8080
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

// Registro de handlers de chat
registerChatHandlers(io)

// Cron job: limpieza de usuarios no verificados cada 15 minutos
cron.schedule('*/50 * * * *', async () => {
  await cleanupUnverifiedUsers()
})

// Arranque
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
