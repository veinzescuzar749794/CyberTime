import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { toPublicUser, regenerateLoginSession } from '../services/sessionService.js';

export async function register(req, res) {
  const { username, studentId, password } = req.body || {};
  const name = typeof username === 'string' ? username.trim() : '';
  const student = typeof studentId === 'string' ? studentId.trim() : '';
  if (name.length < 3 || name.length > 40 || typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Use a username between 3 and 40 characters and a password between 8 and 72 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users(username, student_id, password_hash, role, balance) VALUES($1, $2, $3, 'PATRON', 0) RETURNING *",
      [name, student || null, passwordHash],
    );
    regenerateLoginSession(req, toPublicUser(rows[0]), res, 201);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That username or Student ID is already registered.' });
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
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username/student ID or password.' });
    }
    regenerateLoginSession(req, toPublicUser(user), res);
  } catch (error) {
    console.error('Sign-in failed:', error);
    res.status(500).json({ error: 'Could not sign in. Check the database connection and try again.' });
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
