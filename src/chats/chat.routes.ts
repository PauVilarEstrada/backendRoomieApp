import { Router } from 'express'
import { verifyToken } from '../middlewares/auth.middleware'
import {
  startChatFromAd,
  getMessagesByMatch,
  sendMessage,
  getUserMatchesWithLastMessage,
  checkIfMatchExists,
  deleteAllMessagesFromMatch,
  deleteSingleMessage,
  deleteMatch,
  getUnreadCounts
} from './chat.controller'
import { isMatchParticipant } from '../middlewares/match.middleware'

const router = Router()

// Crear o encontrar un Match a partir de un anuncio
router.post('/start/:adId', verifyToken, startChatFromAd)

// Obtener todos los matches activos del usuario con el último mensaje
router.get('/my-matches', verifyToken, getUserMatchesWithLastMessage)

// Comprobar si ya hay match entre dos usuarios (por ejemplo desde frontend al cargar el anuncio)
router.get('/exists/:userId', verifyToken, checkIfMatchExists)

// Obtener los mensajes de un match
router.get('/:matchId/messages', verifyToken, getMessagesByMatch)

// Enviar un nuevo mensaje
router.post('/:matchId/messages', verifyToken, sendMessage)

// ✅ Crear o encontrar un Match a partir de un anuncio
router.post('/start/:adId', verifyToken, startChatFromAd)

// ✅ Obtener todos los matches activos del usuario con el último mensaje
router.get('/my-matches', verifyToken, getUserMatchesWithLastMessage)

// ✅ Comprobar si ya hay match entre dos usuarios
router.get('/exists/:userId', verifyToken, checkIfMatchExists)

// ✅ Obtener los mensajes de un match
router.get('/:matchId/messages', verifyToken, getMessagesByMatch)

// ✅ Enviar un nuevo mensaje
router.post('/:matchId/messages', verifyToken, sendMessage)

// 🧹 Eliminar todos los mensajes de un match
router.delete('/:matchId/messages', verifyToken, deleteAllMessagesFromMatch)

// ❌ Eliminar un solo mensaje (si el remitente es el usuario autenticado)
router.delete('/message/:messageId', verifyToken, deleteSingleMessage)

// 🗑️ Eliminar todo el match (incluyendo mensajes)
router.delete('/match/:matchId', verifyToken, deleteMatch)

router.get('/unread-counts', verifyToken, getUnreadCounts)


router.get('/:matchId/messages', verifyToken, isMatchParticipant, getMessagesByMatch)
router.post('/:matchId/messages', verifyToken, isMatchParticipant, sendMessage)
router.delete('/:matchId/messages', verifyToken, isMatchParticipant, deleteAllMessagesFromMatch)
router.delete('/match/:matchId', verifyToken, isMatchParticipant, deleteMatch)


export default router