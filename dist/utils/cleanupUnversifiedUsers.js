"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupUnverifiedUsers = void 0;
const client_1 = require("../prisma/client");
const cleanupUnverifiedUsers = async () => {
    try {
        const result = await client_1.prisma.user.deleteMany({
            where: {
                emailVerified: false,
                verificationExpiresAt: {
                    lt: new Date()
                }
            }
        });
        if (result.count > 0) {
            console.log(`[CLEANUP CRON] ${result.count} usuarios no verificados eliminados`);
        }
    }
    catch (err) {
        console.error('[CLEANUP CRON ERROR]', err);
    }
};
exports.cleanupUnverifiedUsers = cleanupUnverifiedUsers;
