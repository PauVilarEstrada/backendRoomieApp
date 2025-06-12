"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicStats = exports.getStats = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = void 0;
const client_1 = require("../prisma/client");
const admin_validator_1 = require("./admin.validator");
const getAllUsers = async (_req, res) => {
    try {
        const users = await client_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                emailVerified: true,
                createdAt: true
            }
        });
        res.status(200).json({ users });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const user = await client_1.prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                isAdmin: true,
                emailVerified: true,
                createdAt: true
            }
        });
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.status(200).json({ user });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al buscar el usuario' });
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    const parsed = admin_validator_1.updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
    }
    try {
        const updatedUser = await client_1.prisma.user.update({
            where: { id: req.params.id },
            data: parsed.data
        });
        res.status(200).json({ message: 'Usuario actualizado', updatedUser });
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
    await client_1.prisma.adminLog.create({
        data: {
            adminId: req.user.userId,
            action: 'UPDATE_USER',
            targetId: req.params.id
        }
    });
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    const userIdToDelete = req.params.id;
    if (req.user?.userId === userIdToDelete) {
        res.status(400).json({ error: 'No puedes eliminar tu propio usuario desde esta ruta' });
        return;
    }
    try {
        const deletedUser = await client_1.prisma.ad.deleteMany({ where: { userId: userIdToDelete } });
        await client_1.prisma.roommateProfile.deleteMany({ where: { userId: userIdToDelete } });
        await client_1.prisma.roomProviderProfile.deleteMany({ where: { userId: userIdToDelete } });
        await client_1.prisma.user.delete({ where: { id: userIdToDelete } });
        res.status(200).json({ message: 'Usuario eliminado', deletedUser });
    }
    catch (err) {
        console.error('[ADMIN DELETE ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
    await client_1.prisma.adminLog.create({
        data: {
            adminId: req.user.userId,
            action: 'UPDATE_USER',
            targetId: req.params.id
        }
    });
};
exports.deleteUser = deleteUser;
const getStats = async (_req, res) => {
    try {
        const totalUsers = await client_1.prisma.user.count();
        const verifiedUsers = await client_1.prisma.user.count({ where: { emailVerified: true } });
        const admins = await client_1.prisma.user.count({ where: { isAdmin: true } });
        const totalListings = await client_1.prisma.ad.count();
        const totalRoommateProfiles = await client_1.prisma.roommateProfile.count();
        const totalRoomProviderProfiles = await client_1.prisma.roomProviderProfile.count();
        const totalChats = await client_1.prisma.match.count();
        const totalMessages = await client_1.prisma.chatMessage.count();
        const gainResult = await client_1.prisma.ad.aggregate({ _sum: { gain: true } });
        const totalGain = gainResult._sum.gain ?? 0;
        res.status(200).json({
            totalUsers,
            verifiedUsers,
            admins,
            totalListings,
            totalGain,
            totalRoommateProfiles,
            totalRoomProviderProfiles,
            totalChats,
            totalMessages
        });
    }
    catch (err) {
        console.error('[GET STATS ERROR]', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
exports.getStats = getStats;
const getPublicStats = async (_req, res) => {
    try {
        const totalUsers = await client_1.prisma.user.count();
        const totalAds = await client_1.prisma.ad.count();
        const totalRoommateProfiles = await client_1.prisma.roommateProfile.count();
        const totalRoomProviderProfiles = await client_1.prisma.roomProviderProfile.count();
        res.status(200).json({
            totalUsers,
            totalAds,
            totalRoommateProfiles,
            totalRoomProviderProfiles
        });
    }
    catch (err) {
        console.error('[GET PUBLIC STATS ERROR]', err);
        res.status(500).json({ error: 'Error al obtener estadísticas públicas' });
    }
};
exports.getPublicStats = getPublicStats;
