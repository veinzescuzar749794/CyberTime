import 'dotenv/config';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be configured in production.');
}

export const config = {
  port: Number(process.env.PORT) || 8080,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.PGSSL === 'true',
  sessionSecret: process.env.SESSION_SECRET || 'local-development-secret-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};
