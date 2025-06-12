"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const chat_controller_1 = require("./chat.controller");
const match_middleware_1 = require("../middlewares/match.middleware");
const router = (0, express_1.Router)();
// Crear o encontrar un Match a partir de un anuncio
router.post('/start/:adId', auth_middleware_1.verifyToken, chat_controller_1.startChatFromAd);
// Obtener todos los matches activos del usuario con el último mensaje
router.get('/my-matches', auth_middleware_1.verifyToken, chat_controller_1.getUserMatchesWithLastMessage);
// Comprobar si ya hay match entre dos usuarios (por ejemplo desde frontend al cargar el anuncio)
router.get('/exists/:userId', auth_middleware_1.verifyToken, chat_controller_1.checkIfMatchExists);
// Obtener los mensajes de un match
router.get('/:matchId/messages', auth_middleware_1.verifyToken, chat_controller_1.getMessagesByMatch);
// Enviar un nuevo mensaje
router.post('/:matchId/messages', auth_middleware_1.verifyToken, chat_controller_1.sendMessage);
// ✅ Crear o encontrar un Match a partir de un anuncio
router.post('/start/:adId', auth_middleware_1.verifyToken, chat_controller_1.startChatFromAd);
// ✅ Obtener todos los matches activos del usuario con el último mensaje
router.get('/my-matches', auth_middleware_1.verifyToken, chat_controller_1.getUserMatchesWithLastMessage);
// ✅ Comprobar si ya hay match entre dos usuarios
router.get('/exists/:userId', auth_middleware_1.verifyToken, chat_controller_1.checkIfMatchExists);
// ✅ Obtener los mensajes de un match
router.get('/:matchId/messages', auth_middleware_1.verifyToken, chat_controller_1.getMessagesByMatch);
// ✅ Enviar un nuevo mensaje
router.post('/:matchId/messages', auth_middleware_1.verifyToken, chat_controller_1.sendMessage);
// 🧹 Eliminar todos los mensajes de un match
router.delete('/:matchId/messages', auth_middleware_1.verifyToken, chat_controller_1.deleteAllMessagesFromMatch);
// ❌ Eliminar un solo mensaje (si el remitente es el usuario autenticado)
router.delete('/message/:messageId', auth_middleware_1.verifyToken, chat_controller_1.deleteSingleMessage);
// 🗑️ Eliminar todo el match (incluyendo mensajes)
router.delete('/match/:matchId', auth_middleware_1.verifyToken, chat_controller_1.deleteMatch);
router.get('/unread-counts', auth_middleware_1.verifyToken, chat_controller_1.getUnreadCounts);
router.get('/:matchId/messages', auth_middleware_1.verifyToken, match_middleware_1.isMatchParticipant, chat_controller_1.getMessagesByMatch);
router.post('/:matchId/messages', auth_middleware_1.verifyToken, match_middleware_1.isMatchParticipant, chat_controller_1.sendMessage);
router.delete('/:matchId/messages', auth_middleware_1.verifyToken, match_middleware_1.isMatchParticipant, chat_controller_1.deleteAllMessagesFromMatch);
router.delete('/match/:matchId', auth_middleware_1.verifyToken, match_middleware_1.isMatchParticipant, chat_controller_1.deleteMatch);
exports.default = router;
