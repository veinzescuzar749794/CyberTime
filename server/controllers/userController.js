import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { toPublicUser } from '../services/sessionService.js';

const roles = ['PATRON', 'CASHIER', 'ADMIN'];

export async function createAccount(req, res) {
  const { username, studentId, password, initialDeposit = 0, role = 'PATRON' } = req.body || {};
  const name = typeof username === 'string' ? username.trim() : '';
  const deposit = Number(initialDeposit);
  if (name.length < 3 || name.length > 40 || typeof password !== 'string' || password.length < 8 || password.length > 72 || !Number.isFinite(deposit) || deposit < 0 || !roles.includes(role)) {
    return res.status(400).json({ error: 'Provide a username (3–40 characters), password (8–72 characters), valid role, and non-negative initial deposit.' });
  }
  if (role === 'ADMIN' && req.session.user.role !== 'ADMIN') return res.status(403).json({ error: 'Only an admin can create another admin.' });
  if (role !== 'PATRON' && deposit !== 0) return res.status(400).json({ error: 'Staff accounts cannot receive a patron balance.' });

  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO users(username, student_id, password_hash, role, balance) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [name, studentId?.trim() || null, passwordHash, role, deposit],
    );
    const user = rows[0];
    if (deposit > 0) {
      await client.query(
        "INSERT INTO transactions(user_id, amount, payment_method, created_by) VALUES($1, $2, 'CASH', $3)",
        [user.id, deposit, req.session.user.id],
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'That username or Student ID is already registered.' });
    console.error('Staff account creation failed:', error);
    res.status(500).json({ error: 'Could not create account.' });
  } finally {
    client.release();
  }
}

export async function listAccounts(_req, res) {
  try {
    const { rows } = await pool.query('SELECT id, username, student_id, role, balance, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: rows.map(toPublicUser) });
  } catch (error) {
    console.error('Account listing failed:', error);
    res.status(500).json({ error: 'Could not load accounts.' });
  }
}

export async function recordCashTopUp(req, res) {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Enter a top-up amount greater than zero.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2 AND role = 'PATRON' RETURNING *",
      [amount, req.params.id],
    );
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patron account not found.' });
    }
    await client.query(
      "INSERT INTO transactions(user_id, amount, payment_method, created_by) VALUES($1, $2, 'CASH', $3)",
      [req.params.id, amount, req.session.user.id],
    );
    await client.query('COMMIT');
    res.json({ user: toPublicUser(result.rows[0]) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cash top-up failed:', error);
    res.status(500).json({ error: 'Top-up failed.' });
  } finally {
    client.release();
  }
}
