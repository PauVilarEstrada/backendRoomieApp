"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMatch = exports.deleteSingleMessage = exports.deleteAllMessagesFromMatch = exports.startChatFromAd = exports.sendMessage = exports.getUnreadCounts = exports.getMessagesByMatch = exports.checkIfMatchExists = exports.getUserMatchesWithLastMessage = exports.getChatMessages = void 0;
const client_1 = require("../prisma/client");
const chat_validator_1 = require("./chat.validator");
const getChatMessages = async (req, res) => {
    try {
        const matchId = req.params.matchId;
        // Verificación básica (más seguridad en futuro con ownership)
        const messages = await client_1.prisma.chatMessage.findMany({
            where: { matchId },
            orderBy: { sentAt: 'asc' }
        });
        res.status(200).json(messages);
    }
    catch (err) {
        console.error('[GET CHAT MESSAGES ERROR]', err);
        res.status(500).json({ error: 'Error al obtener mensajes del chat' });
    }
};
exports.getChatMessages = getChatMessages;
const getUserMatchesWithLastMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const matches = await client_1.prisma.match.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            },
            include: {
                messages: {
                    orderBy: { sentAt: 'desc' },
                    take: 1
                },
                userA: true,
                userB: true
            }
        });
        const formatted = matches.map((match) => {
            const otherUser = match.userAId === userId ? match.userB : match.userA;
            return {
                matchId: match.id,
                lastMessage: match.messages[0] || null,
                otherUser: {
                    id: otherUser.id,
                    name: otherUser.name,
                    gender: otherUser.gender
                }
            };
        });
        res.status(200).json(formatted);
    }
    catch (err) {
        console.error('[GET MATCHES ERROR]', err);
        res.status(500).json({ error: 'Error al obtener matches' });
    }
};
exports.getUserMatchesWithLastMessage = getUserMatchesWithLastMessage;
const checkIfMatchExists = async (req, res) => {
    try {
        const fromUserId = req.user.userId;
        const toUserId = req.params.userId;
        const match = await client_1.prisma.match.findFirst({
            where: {
                OR: [
                    { userAId: fromUserId, userBId: toUserId },
                    { userAId: toUserId, userBId: fromUserId }
                ]
            }
        });
        res.status(200).json({ exists: !!match, matchId: match?.id || null });
    }
    catch (err) {
        console.error('[CHECK MATCH ERROR]', err);
        res.status(500).json({ error: 'Error al verificar el match' });
    }
};
exports.checkIfMatchExists = checkIfMatchExists;
const getMessagesByMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const userId = req.user.userId;
        const match = await client_1.prisma.match.findUnique({ where: { id: matchId } });
        if (!match || (match.userAId !== userId && match.userBId !== userId)) {
            res.status(403).json({ error: 'No autorizado para ver este chat' });
            return;
        }
        const messages = await client_1.prisma.chatMessage.findMany({
            where: { matchId },
            orderBy: { sentAt: 'asc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });
        // ✅ Marcar como leídos los mensajes que no sean del usuario
        await client_1.prisma.chatMessage.updateMany({
            where: {
                matchId,
                read: false,
                senderId: { not: userId }
            },
            data: { read: true }
        });
        res.status(200).json(messages);
    }
    catch (err) {
        console.error('[GET MESSAGES ERROR]', err);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};
exports.getMessagesByMatch = getMessagesByMatch;
// ✅ Obtener número de mensajes no leídos por match
const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const unreadCounts = await client_1.prisma.chatMessage.groupBy({
            by: ['matchId'],
            where: {
                read: false,
                senderId: { not: userId },
                match: {
                    OR: [
                        { userAId: userId },
                        { userBId: userId }
                    ]
                }
            },
            _count: true
        });
        res.status(200).json(unreadCounts);
    }
    catch (err) {
        console.error('[UNREAD COUNT ERROR]', err);
        res.status(500).json({ error: 'Error al obtener recuento de no leídos' });
    }
};
exports.getUnreadCounts = getUnreadCounts;
const sendMessage = async (req, res) => {
    const parsed = chat_validator_1.sendMessageSchema.safeParse({
        ...req.body,
        matchId: req.params.matchId,
        senderId: req.user.userId
    });
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { matchId, content, imageUrl } = parsed.data;
    const senderId = req.user.userId;
    try {
        const match = await client_1.prisma.match.findUnique({ where: { id: matchId } });
        if (!match || (match.userAId !== senderId && match.userBId !== senderId)) {
            res.status(403).json({ error: 'No autorizado para enviar mensaje a este chat' });
            return;
        }
        if (!content && !imageUrl) {
            res.status(400).json({ error: 'Mensaje vacío: se requiere texto o imagen' });
            return;
        }
        const messageData = {
            matchId,
            senderId
        };
        if (content)
            messageData.content = content;
        if (imageUrl)
            messageData.imageUrl = imageUrl;
        const message = await client_1.prisma.chatMessage.create({ data: messageData });
        res.status(201).json(message);
    }
    catch (err) {
        console.error('[SEND MESSAGE ERROR]', err);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};
exports.sendMessage = sendMessage;
const startChatFromAd = async (req, res) => {
    try {
        const { adId } = req.params;
        const fromUserId = req.user.userId;
        const ad = await client_1.prisma.ad.findUnique({
            where: { id: adId },
            include: { user: true }
        });
        if (!ad) {
            res.status(404).json({ error: 'Anuncio no encontrado' });
            return;
        }
        const toUserId = ad.userId;
        if (toUserId === fromUserId) {
            res.status(400).json({ error: 'No puedes chatear contigo mismo' });
            return;
        }
        // Evita duplicados garantizando orden
        const [userA, userB] = fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];
        let match = await client_1.prisma.match.findFirst({
            where: { userAId: userA, userBId: userB }
        });
        if (!match) {
            match = await client_1.prisma.match.create({
                data: { userAId: userA, userBId: userB }
            });
        }
        res.status(200).json({ matchId: match.id });
    }
    catch (err) {
        console.error('[START CHAT ERROR]', err);
        res.status(500).json({ error: 'Error al iniciar el chat' });
    }
};
exports.startChatFromAd = startChatFromAd;
// Eliminar todos los mensajes de un match (sólo si el usuario forma parte del match)
const deleteAllMessagesFromMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.userId;
        const match = await client_1.prisma.match.findUnique({
            where: { id: matchId }
        });
        if (!match || (match.userAId !== userId && match.userBId !== userId)) {
            res.status(403).json({ error: 'No tienes permiso para eliminar estos mensajes' });
            return;
        }
        await client_1.prisma.chatMessage.deleteMany({ where: { matchId } });
        res.status(200).json({ message: 'Mensajes eliminados correctamente' });
    }
    catch (err) {
        console.error('[DELETE MESSAGES ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar mensajes' });
    }
};
exports.deleteAllMessagesFromMatch = deleteAllMessagesFromMatch;
// Eliminar un único mensaje (solo si el remitente es el usuario autenticado)
const deleteSingleMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;
        const message = await client_1.prisma.chatMessage.findUnique({
            where: { id: messageId }
        });
        if (!message || message.senderId !== userId) {
            res.status(403).json({ error: 'No tienes permiso para eliminar este mensaje' });
            return;
        }
        await client_1.prisma.chatMessage.delete({ where: { id: messageId } });
        res.status(200).json({ message: 'Mensaje eliminado correctamente' });
    }
    catch (err) {
        console.error('[DELETE SINGLE MESSAGE ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar mensaje' });
    }
};
exports.deleteSingleMessage = deleteSingleMessage;
// Eliminar match completo (y sus mensajes), sólo si el usuario forma parte del match
const deleteMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.userId;
        const match = await client_1.prisma.match.findUnique({ where: { id: matchId } });
        if (!match || (match.userAId !== userId && match.userBId !== userId)) {
            res.status(403).json({ error: 'No tienes permiso para eliminar este chat' });
            return;
        }
        await client_1.prisma.chatMessage.deleteMany({ where: { matchId } });
        await client_1.prisma.match.delete({ where: { id: matchId } });
        res.status(200).json({ message: 'Chat eliminado completamente' });
    }
    catch (err) {
        console.error('[DELETE MATCH ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar el chat' });
    }
};
exports.deleteMatch = deleteMatch;
