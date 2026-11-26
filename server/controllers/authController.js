import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { config } from '../config/env.js';
import { sendPasswordResetEmail } from '../services/mailService.js';
import { toPublicUser, regenerateLoginSession } from '../services/sessionService.js';

const resetTokenHash = (token) => createHash('sha256').update(token).digest('hex');
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function register(req, res) {
  const { username, studentId, password, email } = req.body || {};
  const name = typeof username === 'string' ? username.trim() : '';
  const student = typeof studentId === 'string' ? studentId.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (name.length < 3 || name.length > 40 || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 || !validEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a username (3–40 characters), valid email address, and password (8–72 characters).' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users(username, student_id, email, password_hash, role, balance) VALUES($1, $2, $3, $4, 'PATRON', 0) RETURNING *",
      [name, student || null, normalizedEmail, passwordHash],
    );
    regenerateLoginSession(req, toPublicUser(rows[0]), res, 201);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That username, Student ID, or email address is already registered.' });
    console.error('Patron registration failed:', error);
    res.status(500).json({ error: 'Could not create your account. Check the database connection and try again.' });
  }
}

export async function login(req, res) {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ error: 'Enter your username or student ID and password.' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE lower(username) = lower($1) OR lower(student_id) = lower($1) LIMIT 1',
      [identifier.trim()],
    );
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Invalid username/student ID or password.' });
    regenerateLoginSession(req, toPublicUser(user), res);
  } catch (error) {
    console.error('Sign-in failed:', error);
    res.status(500).json({ error: 'Could not sign in. Check the database connection and try again.' });
  }
}

export async function requestPasswordReset(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!config.smtpConfigured) return res.status(503).json({ error: 'Password recovery email is not configured. Please contact cafe staff.' });

  try {
    const { rows } = await pool.query('SELECT id, email FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
    if (rows[0]) {
      const token = randomBytes(32).toString('base64url');
      const tokenHash = resetTokenHash(token);
      await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [rows[0].id]);
      await pool.query(
        "INSERT INTO password_reset_tokens(user_id, token_hash, expires_at) VALUES($1, $2, now() + interval '30 minutes')",
        [rows[0].id, tokenHash],
      );
      const resetUrl = new URL('/', config.appOrigin);
      resetUrl.searchParams.set('reset_token', token);
      try {
        await sendPasswordResetEmail(rows[0].email, resetUrl.toString());
      } catch (mailError) {
        await pool.query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [tokenHash]);
        throw mailError;
      }
    }
    // Same response for known and unknown addresses prevents account discovery.
    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request failed:', error);
    res.status(503).json({ error: 'Could not send a reset email right now. Please try again later.' });
  }
}

export async function resetPassword(req, res) {
  const { token, password, confirmPassword } = req.body || {};
  if (typeof token !== 'string' || token.length < 32) return res.status(400).json({ error: 'This reset link is invalid or expired. Request a new one.' });
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 || password !== confirmPassword) {
    return res.status(400).json({ error: 'Enter matching passwords between 8 and 72 characters.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tokenHash = resetTokenHash(token);
    const result = await client.query(
      'SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE',
      [tokenHash],
    );
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This reset link is invalid, expired, or already used. Request a new one.' });
    }
    const reset = result.rows[0];
    const passwordHash = await bcrypt.hash(password, 12);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, reset.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [reset.id]);
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND id <> $2', [reset.user_id, reset.id]);
    await client.query('DELETE FROM "session" WHERE sess->\'user\'->>\'id\' = $1', [String(reset.user_id)]);
    await client.query('COMMIT');
    res.json({ message: 'Password reset successfully. Sign in with your new password.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Password reset failed:', error);
    res.status(500).json({ error: 'Could not reset password. Please request a new link.' });
  } finally {
    client.release();
  }
}

export function currentUser(req, res) {
  res.json({ user: req.session.user });
}

export function logout(req, res) {
  req.session.destroy((error) => {
    if (error) return res.status(500).json({ error: 'Could not sign out.' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
}
