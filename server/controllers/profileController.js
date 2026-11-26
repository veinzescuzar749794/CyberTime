import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { toPublicUser } from '../services/sessionService.js';

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function getProfile(req, res) {
  const { rows } = await pool.query(
    'SELECT id, username, student_id, email, full_name, role, balance, created_at FROM users WHERE id = $1',
    [req.session.user.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
  res.json({ profile: toPublicUser(rows[0]) });
}

export async function updateProfile(req, res) {
  const { username, studentId, email, fullName } = req.body || {};
  const name = typeof username === 'string' ? username.trim() : '';
  const student = typeof studentId === 'string' ? studentId.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const full = typeof fullName === 'string' ? fullName.trim() : '';
  if (name.length < 3 || name.length > 40 || !validEmail(normalizedEmail) || student.length > 40 || full.length > 100) {
    return res.status(400).json({ error: 'Check the username, email, Student ID, and name fields.' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET username=$1, student_id=$2, email=$3, full_name=$4 WHERE id=$5 RETURNING id, username, student_id, email, full_name, role, balance, created_at',
      [name, student || null, normalizedEmail, full || null, req.session.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
    const profile = toPublicUser(rows[0]);
    req.session.user = profile;
    req.session.save((error) => {
      if (error) return res.status(500).json({ error: 'Profile saved, but session refresh failed. Sign in again.' });
      res.json({ profile });
    });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That username, Student ID, or email is already used by another account.' });
    console.error('Profile update failed:', error);
    res.status(500).json({ error: 'Could not save profile.' });
  }
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72 || newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Enter your current password and matching new passwords between 8 and 72 characters.' });
  }
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.session.user.id]);
    if (!rows[0] || !await bcrypt.compare(currentPassword, rows[0].password_hash)) return res.status(400).json({ error: 'Your current password is incorrect.' });
    if (await bcrypt.compare(newPassword, rows[0].password_hash)) return res.status(400).json({ error: 'Choose a new password different from your current password.' });

    const hash = await bcrypt.hash(newPassword, 12);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.session.user.id]);
      await client.query('DELETE FROM password_reset_tokens WHERE user_id=$1', [req.session.user.id]);
      await client.query('DELETE FROM "session" WHERE sess->\'user\'->>\'id\'=$1', [String(req.session.user.id)]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    req.session.destroy((error) => {
      if (error) return res.status(500).json({ error: 'Password changed. Sign out and sign in again.' });
      res.clearCookie('connect.sid');
      res.json({ message: 'Password changed. Sign in again with your new password.' });
    });
  } catch (error) {
    console.error('Password change failed:', error);
    res.status(500).json({ error: 'Could not change password.' });
  }
}
