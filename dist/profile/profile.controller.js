"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMyAccount = exports.updateMyAccount = exports.getRoomProviderProfileById = exports.getRoommateProfileById = exports.deleteRoomProviderProfile = exports.updateRoomProviderProfile = exports.deleteRoommateProfile = exports.updateRoommateProfile = exports.createRoomProviderProfile = exports.createRoommateProfile = void 0;
const client_1 = require("../prisma/client");
const profile_validator_1 = require("./profile.validator");
const createRoommateProfile = async (req, res) => {
    try {
        const parsed = profile_validator_1.roommateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.flatten().fieldErrors });
            return;
        }
        const data = parsed.data;
        if (req.user?.profileType !== 'busco') {
            res.status(403).json({ error: 'Este usuario no es del tipo "busco"' });
            return;
        }
        const existingProfile = await client_1.prisma.roommateProfile.findUnique({ where: { userId: req.user.userId } });
        if (existingProfile) {
            res.status(409).json({ error: 'Ya tienes un perfil de buscador creado' });
            return;
        }
        const profile = await client_1.prisma.roommateProfile.create({
            data: {
                userId: req.user.userId,
                description: data.description,
                preferredArea: data.preferredArea,
                moveInDate: new Date(data.moveInDate),
                stayDuration: data.stayDuration,
                genderPref: data.genderPref,
                allowsPets: data.allowsPets,
                profilePhotos: data.profilePhotos
            }
        });
        await client_1.prisma.ad.create({
            data: {
                type: 'busco',
                title: `Busco habitación en ${data.preferredArea}`,
                description: data.description,
                location: data.preferredArea,
                price: 0,
                expenses: 0,
                availableFrom: new Date(data.moveInDate),
                minStay: parseInt(data.stayDuration),
                maxStay: null,
                allowsAnimals: data.allowsPets,
                genderPref: data.genderPref,
                features: [],
                restrictions: [],
                images: data.profilePhotos,
                video: null,
                userId: req.user.userId
            }
        });
        res.status(201).json({ message: 'Perfil de buscador creado', profile });
    }
    catch (err) {
        console.error('[CREATE ROOMMATE PROFILE ERROR]', err);
        res.status(500).json({ error: 'Error al crear el perfil de buscador' });
    }
};
exports.createRoommateProfile = createRoommateProfile;
const createRoomProviderProfile = async (req, res) => {
    try {
        const parsed = profile_validator_1.roomProviderProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.flatten().fieldErrors });
            return;
        }
        const data = parsed.data;
        if (req.user?.profileType !== 'ofrezco') {
            res.status(403).json({ error: 'Este usuario no es del tipo "ofrezco"' });
            return;
        }
        const existingProfile = await client_1.prisma.roomProviderProfile.findUnique({ where: { userId: req.user.userId } });
        if (existingProfile) {
            res.status(409).json({ error: 'Ya tienes un perfil de proveedor creado' });
            return;
        }
        const profile = await client_1.prisma.roomProviderProfile.create({
            data: {
                userId: req.user.userId,
                spaceDesc: data.spaceDesc,
                rent: data.rent,
                expenses: data.expenses,
                area: data.area,
                availability: new Date(data.availability),
                minStay: data.minStay,
                maxStay: data.maxStay,
                allowsPets: data.allowsPets,
                features: data.features,
                restrictions: data.restrictions,
                genderPref: data.genderPref,
                roomPhotos: data.roomPhotos,
                profilePhotos: data.profilePhotos,
                roomVideo: data.roomVideo
            }
        });
        await client_1.prisma.ad.create({
            data: {
                type: 'ofrezco',
                title: `Habitación disponible en ${data.area}`,
                description: data.spaceDesc,
                location: data.area,
                price: data.rent,
                expenses: data.expenses,
                availableFrom: new Date(data.availability),
                minStay: data.minStay,
                maxStay: data.maxStay,
                allowsAnimals: data.allowsPets,
                genderPref: data.genderPref,
                features: data.features || [],
                restrictions: data.restrictions || [],
                images: data.roomPhotos,
                video: data.roomVideo || null,
                userId: req.user.userId
            }
        });
        res.status(201).json({ message: 'Perfil de proveedor creado', profile });
    }
    catch (err) {
        console.error('[CREATE PROVIDER PROFILE ERROR]', err);
        res.status(500).json({ error: 'Error al crear el perfil de proveedor' });
    }
};
exports.createRoomProviderProfile = createRoomProviderProfile;
const updateRoommateProfile = async (req, res) => {
    try {
        if (req.user?.profileType !== 'busco') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }
        const updated = await client_1.prisma.roommateProfile.update({
            where: { userId: req.user.userId },
            data: req.body
        });
        res.status(200).json({ message: 'Perfil actualizado', updated });
    }
    catch (err) {
        console.error('[UPDATE ROOMMATE ERROR]', err);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
};
exports.updateRoommateProfile = updateRoommateProfile;
const deleteRoommateProfile = async (req, res) => {
    try {
        if (req.user?.profileType !== 'busco' && !req.user?.isAdmin) {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }
        await client_1.prisma.ad.deleteMany({ where: { userId: req.user.userId, type: 'busco' } });
        await client_1.prisma.roommateProfile.delete({
            where: { userId: req.user.userId }
        });
        res.status(200).json({ message: 'Perfil eliminado correctamente' });
    }
    catch (err) {
        console.error('[DELETE ROOMMATE ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar el perfil' });
    }
};
exports.deleteRoommateProfile = deleteRoommateProfile;
const updateRoomProviderProfile = async (req, res) => {
    try {
        if (req.user?.profileType !== 'ofrezco') {
            res.status(403).json({ error: 'No autorizado para modificar este perfil' });
            return;
        }
        const updated = await client_1.prisma.roomProviderProfile.update({
            where: { userId: req.user.userId },
            data: req.body
        });
        res.status(200).json({ message: 'Perfil actualizado correctamente', updated });
    }
    catch (err) {
        console.error('[UPDATE PROVIDER ERROR]', err);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
};
exports.updateRoomProviderProfile = updateRoomProviderProfile;
const deleteRoomProviderProfile = async (req, res) => {
    try {
        if (req.user?.profileType !== 'ofrezco' && !req.user?.isAdmin) {
            res.status(403).json({ error: 'No autorizado para eliminar este perfil' });
            return;
        }
        // Opcional: eliminar anuncios del usuario si lo deseas
        await client_1.prisma.ad.deleteMany({
            where: { userId: req.user.userId }
        });
        await client_1.prisma.roomProviderProfile.delete({
            where: { userId: req.user.userId }
        });
        res.status(200).json({ message: 'Perfil eliminado correctamente' });
    }
    catch (err) {
        console.error('[DELETE PROVIDER ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar el perfil' });
    }
};
exports.deleteRoomProviderProfile = deleteRoomProviderProfile;
const getRoommateProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await client_1.prisma.roommateProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        gender: true,
                        email: true,
                        prefix: true,
                        phone: true,
                        birthDate: true
                    }
                }
            }
        });
        if (!profile) {
            res.status(404).json({ error: 'Perfil no encontrado' });
            return;
        }
        await client_1.prisma.roommateProfile.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
        res.status(200).json(profile);
    }
    catch (err) {
        console.error('[GET ROOMMATE PROFILE ERROR]', err);
        res.status(500).json({ error: 'Error al obtener el perfil de usuario' });
    }
};
exports.getRoommateProfileById = getRoommateProfileById;
const getRoomProviderProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await client_1.prisma.roomProviderProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        gender: true,
                        email: true,
                        prefix: true,
                        phone: true,
                        birthDate: true
                    }
                },
                ad: true
            }
        });
        if (!profile) {
            res.status(404).json({ error: 'Perfil no encontrado' });
            return;
        }
        await client_1.prisma.roomProviderProfile.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
        res.status(200).json(profile);
    }
    catch (err) {
        console.error('[GET PROVIDER PROFILE ERROR]', err);
        res.status(500).json({ error: 'Error al obtener el perfil del proveedor de piso' });
    }
};
exports.getRoomProviderProfileById = getRoomProviderProfileById;
const updateMyAccount = async (req, res) => {
    try {
        const { name, surname, email, prefix, phone, language, gender } = req.body;
        const updatedUser = await client_1.prisma.user.update({
            where: { id: req.user.userId },
            data: { name, surname, email, prefix, phone, language, gender }
        });
        res.status(200).json({ message: 'Tu cuenta ha sido actualizada', updatedUser });
    }
    catch (err) {
        console.error('[UPDATE MY ACCOUNT ERROR]', err);
        res.status(500).json({ error: 'Error al actualizar tu cuenta' });
    }
};
exports.updateMyAccount = updateMyAccount;
const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.userId;
        await client_1.prisma.ad.deleteMany({ where: { userId } });
        await client_1.prisma.roommateProfile.deleteMany({ where: { userId } });
        await client_1.prisma.roomProviderProfile.deleteMany({ where: { userId } });
        const deletedUser = await client_1.prisma.user.delete({ where: { id: userId } });
        res.clearCookie('token');
        res.status(200).json({ message: 'Tu cuenta ha sido eliminada', deletedUser });
    }
    catch (err) {
        console.error('[DELETE MY ACCOUNT ERROR]', err);
        res.status(500).json({ error: 'Error al eliminar tu cuenta' });
    }
};
exports.deleteMyAccount = deleteMyAccount;
