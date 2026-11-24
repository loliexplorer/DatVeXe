const nodemailer = require('nodemailer');
require('dotenv').config();

let cachedTransporter = null;
let isEthereal = false;

async function getTransporter() {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, isEthereal };
  }

  // Nếu có cấu hình SMTP thật trong .env (VD: Gmail App Password)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    isEthereal = false;
    return { transporter: cachedTransporter, isEthereal };
  }

  // Mặc định dùng Ethereal Email (tài khoản test miễn phí có link xem trước HTML)
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  isEthereal = true;
  console.log(`📧 [notification-service] Ethereal Test Mailer ready: ${testAccount.user}`);
  return { transporter: cachedTransporter, isEthereal };
}

async function sendEmail({ to, subject, html, text }) {
  try {
    const { transporter, isEthereal: usingEthereal } = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"EcoBus Ticket" <no-reply@ecobus.vn>',
      to,
      subject,
      text: text || subject,
      html
    });

    const previewUrl = usingEthereal ? nodemailer.getTestMessageUrl(info) : null;
    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      mode: usingEthereal ? 'ETHEREAL_PREVIEW' : 'REAL_SMTP'
    };
  } catch (error) {
    console.warn('⚠️ [notification-service] SMTP send warning (fallback to simulated log):', error.message);
    return {
      success: true,
      messageId: `SIM-${Date.now()}`,
      previewUrl: null,
      mode: 'SIMULATED_LOCAL',
      warning: error.message
    };
  }
}

module.exports = { sendEmail };
