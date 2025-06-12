"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.loginSchema = exports.verifyEmailSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    surname: zod_1.z.string().min(1),
    prefix: zod_1.z.string().regex(/^\+\d{1,4}$/, 'Prefijo inválido (ej: +34)'),
    phone: zod_1.z.string().regex(/^\d{6,12}$/, 'Número de teléfono inválido'),
    email: zod_1.z.string().email(),
    birthDate: zod_1.z.string(), // ISO format
    gender: zod_1.z.enum([
        'Hombre',
        'Mujer',
        'No binario',
        'Otro',
        'No quiero decirlo'
    ]),
    language: zod_1.z.string().min(1),
    password: zod_1.z.string().min(6)
});
exports.verifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().min(5)
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6, 'La contraseña actual es obligatoria'),
    newPassword: zod_1.z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});
