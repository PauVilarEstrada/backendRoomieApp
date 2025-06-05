import express, { Request, Response } from 'express'
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
app.delete('/admin/delete-user/:id', verifyToken, isAdmin, async (req: AuthRequest, res: Response) => {
  const userIdToDelete = req.params.id

  try {
    const deletedUser = await prisma.user.delete({
      where: { id: userIdToDelete }
    })

    res.status(200).json({ message: 'Usuario eliminado', deletedUser })
  } catch (err) {
    console.error('[ADMIN DELETE ERROR]', err)
    res.status(500).json({ error: 'Error al eliminar el usuario' })
  }
})

// Otras rutas
app.use('/admin', adminRoutes)
app.use('/profile', profileRoutes)
app.use('/ads', adsRoutes)
app.use('/chat', chatRoutes) // ✅ Añadido

// Ruta pública simple
app.get('/', (_req, res) => {
  res.send('API de Encontrar Roomie funcionando ✅')
})

// Servidor HTTP + WebSockets
const PORT = process.env.PORT || 5000
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Handlers de chat
registerChatHandlers(io)

// Ejecutar cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  await cleanupUnverifiedUsers()
})

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
