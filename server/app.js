import express from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/env.js';
import { pool } from './db/pool.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const PgStore = connectPg(session);
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());
app.use(session({
  store: new PgStore({ pool, createTableIfMissing: true }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: config.isProduction, maxAge: 8 * 60 * 60 * 1000 },
}));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use((error, _req, res, _next) => {
  console.error('Unhandled API error:', error);
  res.status(500).json({ error: 'Unexpected server error. Check the server logs for details.' });
});

if (config.isProduction) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  app.use(express.static(root));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'index.html')));
}
export default app;
