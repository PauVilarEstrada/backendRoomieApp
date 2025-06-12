"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationCode = generateVerificationCode;
function generateVerificationCode(length = 6) {
    const letters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
    const digits = '123456789';
    const charset = letters + digits;
    let code = '';
    for (let i = 0; i < length; i++) {
        code += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return code;
}
