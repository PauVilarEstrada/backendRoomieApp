"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdOwner = void 0;
const client_1 = require("../prisma/client");
const isAdOwner = async (req, res, next) => {
    const adId = req.params.id;
    try {
        const ad = await client_1.prisma.ad.findUnique({ where: { id: adId } });
        if (!ad) {
            res.status(404).json({ error: 'Anuncio no encontrado' });
            return;
        }
        // Solo el dueño o admin
        if (ad.userId !== req.user?.userId && !req.user?.isAdmin) {
            res.status(403).json({ error: 'No tienes permiso para modificar o eliminar este anuncio' });
            return;
        }
        next();
    }
    catch (err) {
        res.status(500).json({ error: 'Error de autorización del anuncio' });
    }
};
exports.isAdOwner = isAdOwner;
