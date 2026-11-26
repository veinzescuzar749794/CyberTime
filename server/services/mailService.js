import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const transporter = config.smtpConfigured ? nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
}) : null;

export async function sendPasswordResetEmail(email, resetUrl) {
  if (!transporter) throw new Error('SMTP is not configured');
  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Reset your CyberTime password',
    text: `We received a request to reset your CyberTime password. This link expires in 30 minutes and can only be used once:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>We received a request to reset your CyberTime password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>`,
  });
}
