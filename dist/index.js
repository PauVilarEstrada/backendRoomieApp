"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("./prisma/client");
const auth_middleware_1 = require("./middlewares/auth.middleware");
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const admin_routes_1 = __importDefault(require("./admin/admin.routes"));
const profile_routes_1 = __importDefault(require("./profile/profile.routes"));
const ads_routes_1 = __importDefault(require("./ads/ads.routes"));
const chat_routes_1 = __importDefault(require("./chats/chat.routes"));
const chat_gateway_1 = require("./chats/chat.gateway");
const cleanupUnversifiedUsers_1 = require("./utils/cleanupUnversifiedUsers");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Rutas de autenticación
app.use('/auth', auth_routes_1.default);
// Ruta protegida de ejemplo (/me)
app.get('/me', auth_middleware_1.verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Ruta privada accedida correctamente',
        user: req.user
    });
});
// Ruta protegida solo para admins
app.delete('/admin/delete-user/:id', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, async (req, res) => {
    const userIdToDelete = req.params.id;
    try {
        const deletedUser = await client_1.prisma.user.delete({
            where: { id: userIdToDelete }
        });
        res.status(200).json({ message: 'Usuario eliminado', deletedUser });
    }
    catch (err) {
        console.error('[ADMIN DELETE ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});
// Otras rutas
app.use('/admin', admin_routes_1.default);
app.use('/profile', profile_routes_1.default);
app.use('/ads', ads_routes_1.default);
app.use('/chat', chat_routes_1.default); // ✅ Añadido
// Ruta pública simple
app.get('/', (_req, res) => {
    res.send('API de Encontrar Roomie funcionando ✅');
});
// Servidor HTTP + WebSockets
const PORT = process.env.PORT || 8080;
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
// Handlers de chat
(0, chat_gateway_1.registerChatHandlers)(io);
// Ejecutar cada 15 minutos
node_cron_1.default.schedule('*/15 * * * *', async () => {
    await (0, cleanupUnversifiedUsers_1.cleanupUnverifiedUsers)();
});
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
