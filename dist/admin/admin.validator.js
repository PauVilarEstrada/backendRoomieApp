"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    surname: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    isAdmin: zod_1.z.boolean(),
    emailVerified: zod_1.z.boolean()
});
