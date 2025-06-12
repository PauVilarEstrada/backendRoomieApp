"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListingSchema = void 0;
const zod_1 = require("zod");
exports.createListingSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    location: zod_1.z.string(),
    price: zod_1.z.number().int(),
    expenses: zod_1.z.number().int(),
    availableFrom: zod_1.z.string().datetime(),
    minStay: zod_1.z.number().int(),
    maxStay: zod_1.z.number().int().nullable().optional(),
    allowsAnimals: zod_1.z.boolean(),
    genderPref: zod_1.z.string(),
    features: zod_1.z.array(zod_1.z.string()),
    restrictions: zod_1.z.array(zod_1.z.string()),
    images: zod_1.z.array(zod_1.z.string().url()),
    video: zod_1.z.string().url().nullable().optional()
});
