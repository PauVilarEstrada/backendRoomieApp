import { Server, Socket } from 'socket.io'
import { prisma } from '../prisma/client'
import jwt from 'jsonwebtoken'


interface AuthenticatedSocket extends Socket {
  userId?: string
}

export const registerChatHandlers = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      console.warn('[SOCKET] Token no proporcionado')
      return next(new Error('No autorizado'))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      ;(socket as AuthenticatedSocket).userId = decoded.userId
      next()
    } catch (err) {
      console.error('[SOCKET AUTH ERROR]', err)
      return next(new Error('Token no válido'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🟢 Usuario conectado (${socket.userId}): ${socket.id}`)

    socket.on('join-room', (matchId: string) => {
      socket.join(matchId)
      console.log(`🔗 Usuario ${socket.userId} se unió a sala: ${matchId}`)
    })

    socket.on('send-message', async (data) => {
      const { matchId, content } = data

      if (!socket.userId) {
        console.warn('[SOCKET] Usuario no autenticado')
        return
      }

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: {
          userAId: true,
          userBId: true
        }
      })

      if (!match || (match.userAId !== socket.userId && match.userBId !== socket.userId)) {
        console.warn('[SOCKET] Usuario no pertenece al match')
        return
      }

      const message = await prisma.chatMessage.create({
        data: {
          matchId,
          senderId: socket.userId,
          content
        }
      })

      io.to(matchId).emit('receive-message', message)
    })

    socket.on('disconnect', () => {
      console.log(`🔴 Usuario desconectado (${socket.userId}): ${socket.id}`)
    })
  })
}