"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logout = exports.login = exports.verifyEmail = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("../prisma/client");
const auth_validator_1 = require("./auth.validator");
const mailer_1 = require("../utils/mailer");
const auth_validator_2 = require("./auth.validator");
const codeGenerator_1 = require("../utils/codeGenerator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const register = async (req, res) => {
    const parsed = auth_validator_1.registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { name, surname, prefix, phone, email, birthDate, gender, language, password } = parsed.data;
    // Comprobación automática de edad mínima
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }
    if (age < 16) {
        res.status(400).json({ error: 'Debes tener al menos 16 años para registrarte.' });
        return;
    }
    try {
        const existingUser = await client_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ error: 'El correo ya está registrado' });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const verificationCode = (0, codeGenerator_1.generateVerificationCode)(6);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await client_1.prisma.user.create({
            data: {
                name,
                surname,
                prefix,
                phone,
                email,
                birthDate: new Date(birthDate),
                gender,
                language,
                passwordHash,
                verificationCode,
                verificationExpiresAt: expiresAt
            }
        });
        await (0, mailer_1.sendVerificationEmail)(email, verificationCode);
        res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.' });
    }
    catch (err) {
        console.error('[REGISTER ERROR]', err);
        res.status(500).json({ error: 'Error interno al registrar usuario' });
    }
};
exports.register = register;
const verifyEmail = async (req, res) => {
    const parsed = auth_validator_2.verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { email, code } = parsed.data;
    try {
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.verificationCode !== code) {
            res.status(400).json({ error: 'Código incorrecto o usuario no encontrado' });
            return;
        }
        if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
            // Eliminar usuario no verificado
            await client_1.prisma.user.delete({ where: { email } });
            res.status(410).json({ error: 'El código ha expirado. Regístrate de nuevo.' });
            return;
        }
        await client_1.prisma.user.update({
            where: { email },
            data: {
                emailVerified: true,
                verificationCode: null
            }
        });
        res.status(200).json({ message: 'Correo verificado correctamente' });
    }
    catch (err) {
        console.error('[VERIFY EMAIL ERROR]', err);
        res.status(500).json({ error: 'Error al verificar correo' });
    }
};
exports.verifyEmail = verifyEmail;
const login = async (req, res) => {
    const parsed = auth_validator_1.loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { email, password } = parsed.data;
    try {
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        if (!user.emailVerified) {
            res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesión' });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Contraseña incorrecta' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, isAdmin: user.isAdmin, profileType: user.profileType }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res
            .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // solo HTTPS en producción
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
        })
            .status(200)
            .json({ message: 'Login exitoso' });
    }
    catch (err) {
        console.error('[LOGIN ERROR]', err);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};
exports.login = login;
const logout = async (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: 'El correo es obligatorio' });
        return;
    }
    try {
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await client_1.prisma.user.update({
            where: { email },
            data: {
                verificationCode: resetToken,
                verificationExpiresAt: expires
            }
        });
        await (0, mailer_1.sendPasswordResetEmail)(email, resetToken);
        res.status(200).json({ message: 'Correo de recuperación enviado' });
    }
    catch (err) {
        console.error('[FORGOT PASSWORD ERROR]', err);
        res.status(500).json({ error: 'Error al enviar recuperación' });
    }
};
exports.forgotPassword = forgotPassword;
// 2. Reset con código recibido
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
        res.status(400).json({ error: 'Faltan campos' });
        return;
    }
    try {
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.verificationCode !== code) {
            res.status(400).json({ error: 'Código inválido o usuario no encontrado' });
            return;
        }
        if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
            res.status(410).json({ error: 'El código ha expirado' });
            return;
        }
        const newHash = await bcrypt_1.default.hash(newPassword, 10);
        await client_1.prisma.user.update({
            where: { email },
            data: {
                passwordHash: newHash,
                verificationCode: null,
                verificationExpiresAt: null
            }
        });
        res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    }
    catch (err) {
        console.error('[RESET PASSWORD ERROR]', err);
        res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res) => {
    const parsed = auth_validator_2.changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    const { currentPassword, newPassword } = parsed.data;
    try {
        const user = await client_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        const passwordMatch = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!passwordMatch) {
            res.status(401).json({ error: 'La contraseña actual no es correcta' });
            return;
        }
        const newHash = await bcrypt_1.default.hash(newPassword, 10);
        await client_1.prisma.user.update({
            where: { id: req.user.userId },
            data: {
                passwordHash: newHash
            }
        });
        res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    }
    catch (err) {
        console.error('[CHANGE PASSWORD ERROR]', err);
        res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
};
exports.changePassword = changePassword;
