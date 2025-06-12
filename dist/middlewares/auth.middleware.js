"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: 'No autorizado. Token no encontrado.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};
exports.verifyToken = verifyToken;
const isAdmin = (req, res, next) => {
    if (req.user?.isAdmin) {
        next();
    }
    else {
        res.status(403).json({ error: 'Acceso denegado. No tienes permiso para realizar esta accion.' });
    }
};
exports.isAdmin = isAdmin;
