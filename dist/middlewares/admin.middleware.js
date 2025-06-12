"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
    if (req.user?.isAdmin) {
        next();
    }
    else {
        res.status(403).json({ error: 'Acceso denegado. No tienes permisos de administrador.' });
    }
};
exports.isAdmin = isAdmin;
