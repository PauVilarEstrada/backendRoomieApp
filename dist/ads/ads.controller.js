"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdClick = exports.getAdById = exports.getMapMarkers = exports.createListing = exports.getMyMatches = exports.swipeAd = exports.getSwipeAds = exports.getAllAds = void 0;
const client_1 = require("../prisma/client");
const ads_validator_1 = require("./ads.validator");
const geocode_1 = require("../utils/geocode");
const getAllAds = async (req, res) => {
    try {
        const { type, location, genderPref, page = 1, limit = 10 } = req.query;
        const filters = {};
        if (type)
            filters.type = type;
        if (location)
            filters.location = { contains: location, mode: 'insensitive' };
        if (genderPref)
            filters.genderPref = genderPref;
        const ads = await client_1.prisma.ad.findMany({
            where: filters,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        gender: true,
                        profileType: true,
                    }
                }
            }
        });
        res.json(ads);
    }
    catch (err) {
        console.error('[GET ADS ERROR]', err);
        res.status(500).json({ error: 'Error al obtener los anuncios' });
    }
};
exports.getAllAds = getAllAds;
const getSwipeAds = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }
        const userProfileType = req.user.profileType;
        const userId = req.user.userId;
        const oppositeType = userProfileType === 'busco' ? 'ofrezco' : 'busco';
        const ads = await client_1.prisma.ad.findMany({
            where: {
                type: oppositeType,
                userId: { not: userId } // que no se vean sus propios anuncios
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });
        res.json(ads);
    }
    catch (err) {
        console.error('[GET SWIPE ADS ERROR]', err);
        res.status(500).json({ error: 'Error al obtener anuncios tipo Tinder' });
    }
};
exports.getSwipeAds = getSwipeAds;
const swipeAd = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const adId = req.params.adId;
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
        if (fromUserId === toUserId) {
            res.status(400).json({ error: 'No puedes hacer swipe a tu propio anuncio' });
            return;
        }
        // 1. Evitar duplicados: ¿ya se había hecho like antes?
        const alreadySwiped = await client_1.prisma.swipe.findFirst({
            where: {
                fromUserId,
                toUserId
            }
        });
        if (alreadySwiped) {
            res.status(409).json({ error: 'Ya has hecho like a este usuario' });
            return;
        }
        // 2. Registrar el like
        await client_1.prisma.swipe.create({
            data: {
                fromUserId,
                toUserId,
                adId
            }
        });
        // 3. Comprobar si hay match mutuo
        const existingReverseSwipe = await client_1.prisma.swipe.findFirst({
            where: {
                fromUserId: toUserId,
                toUserId: fromUserId
            }
        });
        let matchCreated = false;
        if (existingReverseSwipe) {
            // 4. Evitar duplicar el match si ya existe
            const existingMatch = await client_1.prisma.match.findFirst({
                where: {
                    OR: [
                        { userAId: fromUserId, userBId: toUserId },
                        { userAId: toUserId, userBId: fromUserId }
                    ]
                }
            });
            if (!existingMatch) {
                await client_1.prisma.match.create({
                    data: {
                        userAId: fromUserId,
                        userBId: toUserId
                    }
                });
                matchCreated = true;
            }
        }
        res.status(201).json({
            message: 'Like registrado correctamente',
            match: matchCreated
        });
    }
    catch (err) {
        console.error('[SWIPE AD ERROR]', err);
        res.status(500).json({ error: 'Error al registrar el like' });
    }
};
exports.swipeAd = swipeAd;
const getMyMatches = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }
        const userId = req.user.userId;
        const matches = await client_1.prisma.match.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            },
            include: {
                userA: {
                    select: {
                        id: true,
                        name: true,
                        profileType: true,
                        gender: true
                    }
                },
                userB: {
                    select: {
                        id: true,
                        name: true,
                        profileType: true,
                        gender: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Formatear para que el frontend reciba solo "la otra persona"
        const formatted = matches.map((match) => {
            const otherUser = match.userA.id === userId ? match.userB : match.userA;
            return {
                matchId: match.id,
                withUser: otherUser,
                matchedAt: match.createdAt
            };
        });
        res.status(200).json(formatted);
    }
    catch (err) {
        console.error('[GET MATCHES ERROR]', err);
        res.status(500).json({ error: 'Error al obtener los matches' });
    }
};
exports.getMyMatches = getMyMatches;
const createListing = async (req, res) => {
    try {
        const parsed = ads_validator_1.createListingSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.flatten().fieldErrors });
            return;
        }
        const data = parsed.data;
        // Geocodificar la dirección (campo `location`)
        const coords = await (0, geocode_1.geocodeAddress)(data.location);
        const ad = await client_1.prisma.ad.create({
            data: {
                ...data,
                type: req.user.profileType,
                latitude: coords?.lat ?? null,
                longitude: coords?.lng ?? null,
                userId: req.user.userId
            }
        });
        res.status(201).json({ message: 'Anuncio creado correctamente', ad });
    }
    catch (err) {
        console.error('[CREATE LISTING ERROR]', err);
        res.status(500).json({ error: 'Error al crear el anuncio' });
    }
};
exports.createListing = createListing;
const getMapMarkers = async (_req, res) => {
    try {
        const ads = await client_1.prisma.ad.findMany({
            where: {
                type: 'ofrezco',
                latitude: { not: null },
                longitude: { not: null }
            },
            select: {
                id: true,
                title: true,
                location: true,
                latitude: true,
                longitude: true,
                images: true,
                price: true,
                userId: true
            }
        });
        res.status(200).json(ads);
    }
    catch (err) {
        console.error('[GET MAP MARKERS ERROR]', err);
        res.status(500).json({ error: 'Error al obtener puntos para el mapa' });
    }
};
exports.getMapMarkers = getMapMarkers;
const getAdById = async (req, res) => {
    try {
        const { id } = req.params;
        // Incrementar vistas
        await client_1.prisma.ad.update({
            where: { id },
            data: {
                views: { increment: 1 }
            }
        });
        const ad = await client_1.prisma.ad.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        gender: true,
                        profileType: true,
                        email: true,
                        phone: true,
                        prefix: true
                    }
                }
            }
        });
        if (!ad) {
            res.status(404).json({ error: 'Anuncio no encontrado' });
            return;
        }
        res.status(200).json(ad);
    }
    catch (err) {
        console.error('[GET AD BY ID ERROR]', err);
        res.status(500).json({ error: 'Error al obtener el anuncio' });
    }
};
exports.getAdById = getAdById;
const registerAdClick = async (req, res) => {
    try {
        const { id } = req.params;
        await client_1.prisma.ad.update({
            where: { id },
            data: {
                clicks: { increment: 1 }
            }
        });
        res.status(200).json({ message: 'Click registrado' });
    }
    catch (err) {
        console.error('[REGISTER CLICK ERROR]', err);
        res.status(500).json({ error: 'Error al registrar click' });
    }
};
exports.registerAdClick = registerAdClick;
