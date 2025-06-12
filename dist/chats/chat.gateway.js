"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = void 0;
const client_1 = require("../prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const registerChatHandlers = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.warn('[SOCKET] Token no proporcionado');
            return next(new Error('No autorizado'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        }
        catch (err) {
            console.error('[SOCKET AUTH ERROR]', err);
            return next(new Error('Token no válido'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`🟢 Usuario conectado (${socket.userId}): ${socket.id}`);
        socket.on('join-room', (matchId) => {
            socket.join(matchId);
            console.log(`🔗 Usuario ${socket.userId} se unió a sala: ${matchId}`);
        });
        socket.on('send-message', async (data) => {
            const { matchId, content } = data;
            if (!socket.userId) {
                console.warn('[SOCKET] Usuario no autenticado');
                return;
            }
            const match = await client_1.prisma.match.findUnique({
                where: { id: matchId },
                select: {
                    userAId: true,
                    userBId: true
                }
            });
            if (!match || (match.userAId !== socket.userId && match.userBId !== socket.userId)) {
                console.warn('[SOCKET] Usuario no pertenece al match');
                return;
            }
            const message = await client_1.prisma.chatMessage.create({
                data: {
                    matchId,
                    senderId: socket.userId,
                    content
                }
            });
            io.to(matchId).emit('receive-message', message);
        });
        socket.on('disconnect', () => {
            console.log(`🔴 Usuario desconectado (${socket.userId}): ${socket.id}`);
        });
    });
};
exports.registerChatHandlers = registerChatHandlers;
