"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const sendVerificationEmail = async (to, code) => {
    const htmlContent = `
  <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: auto; color: #2D3748;">
    <p>Estimado/a ${to},</p>

    <p>Gracias por registrarte en <strong>BuscoRoomie</strong>. Para completar tu registro y activar tu cuenta, utiliza el siguiente código de verificación:</p>

    <div style="background-color: #F0F4F8; border-left: 4px solid #3182CE; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 18px;">Código de verificación:</p>
      <p style="font-size: 26px; font-weight: bold; color: #2B6CB0; margin: 4px 0 0;">${code}</p>
    </div>

    <p style="color: #C53030;"><strong>⚠️ Tienes 15 minutos para validar tu cuenta. Pasado ese tiempo, el código expirará y tu cuenta será eliminada automáticamente.</strong></p>

    <p>Si no has solicitado este registro, puedes ignorar este mensaje.</p>

    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;" />
    <p style="font-size: 12px; color: #718096;">Este es un mensaje automático. Por favor, no respondas directamente a este correo.</p>
  </div>
  `;
    const info = await transporter.sendMail({
        from: `"BuscoRoomie" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verificación de correo electrónico - BuscoRoomie',
        html: htmlContent
    });
    console.log(`📨 Correo de verificación enviado a ${to} con ID: ${info.messageId}`);
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (to, code) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(to)}&code=${code}`;
    const htmlContent = `
  <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: auto; color: #2D3748;">
    <p>Estimado/a ${to},</p>

    <p>Hemos recibido una solicitud para restablecer tu contraseña en <strong>BuscoRoomie</strong>. Si has sido tú, haz clic en el siguiente botón:</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" target="_blank" style="background-color: #2B6CB0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Restablecer contraseña
      </a>
    </div>

    <p style="color: #C53030;"><strong>⚠️ Este enlace caducará en 15 minutos.</strong></p>

    <p>Si no has solicitado este restablecimiento, ignora este mensaje.</p>

    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;" />
    <p style="font-size: 12px; color: #718096;">Este es un mensaje automático. Por favor, no respondas directamente a este correo.</p>
  </div>
  `;
    const info = await transporter.sendMail({
        from: `"BuscoRoomie" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Restablecimiento de contraseña - BuscoRoomie',
        html: htmlContent
    });
    console.log(`📨 Correo de recuperación enviado a ${to} con ID: ${info.messageId}`);
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
