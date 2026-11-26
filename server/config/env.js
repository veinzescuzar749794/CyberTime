import 'dotenv/config';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be configured in production.');
}

const smtpPort = Number(process.env.SMTP_PORT) || 587;
export const config = {
  port: Number(process.env.PORT) || 8080,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.PGSSL === 'true',
  sessionSecret: process.env.SESSION_SECRET || 'local-development-secret-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  appOrigin: process.env.APP_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  smtp: {
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
  },
};
config.smtpConfigured = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.from);
