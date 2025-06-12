"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomProviderProfileSchema = exports.roommateProfileSchema = void 0;
const zod_1 = require("zod");
exports.roommateProfileSchema = zod_1.z.object({
    description: zod_1.z.string().min(5),
    preferredArea: zod_1.z.string().min(3),
    moveInDate: zod_1.z.string().datetime(),
    stayDuration: zod_1.z.string().min(1),
    genderPref: zod_1.z.string().min(3),
    allowsPets: zod_1.z.boolean(),
    profilePhotos: zod_1.z.array(zod_1.z.string().url()).min(1).max(8)
});
exports.roomProviderProfileSchema = zod_1.z.object({
    spaceDesc: zod_1.z.string().min(5),
    rent: zod_1.z.number().int().positive(),
    expenses: zod_1.z.number().int().nonnegative(),
    area: zod_1.z.string().min(3),
    availability: zod_1.z.string().datetime(),
    minStay: zod_1.z.number().int().min(1),
    maxStay: zod_1.z.number().int().optional(),
    allowsPets: zod_1.z.boolean(),
    features: zod_1.z.array(zod_1.z.string()).optional(),
    restrictions: zod_1.z.array(zod_1.z.string()).optional(),
    genderPref: zod_1.z.string().min(3),
    roomPhotos: zod_1.z.array(zod_1.z.string().url()).min(2).max(15),
    profilePhotos: zod_1.z.array(zod_1.z.string().url()).max(5).optional(),
    roomVideo: zod_1.z.string().url().optional()
});
