import { isIP } from 'node:net';
import { pool } from '../db/pool.js';

export async function listStations(_req, res) {
  const { rows } = await pool.query(`
    SELECT c.pc_id, c.pc_name, c.ip_address,
      CASE WHEN s.session_id IS NULL THEN c.status
           WHEN GREATEST(0, s.remaining_sec - FLOOR(EXTRACT(EPOCH FROM (now() - s.started_at)))::int) > 0 THEN 'IN_USE'
           ELSE 'LOCKED' END AS status,
      s.session_id,
      GREATEST(0, s.remaining_sec - FLOOR(EXTRACT(EPOCH FROM (now() - s.started_at)))::int) AS remaining_seconds,
      u.username AS patron_username, u.balance AS patron_balance
    FROM computers c
    LEFT JOIN sessions s ON s.pc_id = c.pc_id AND s.status = 'ACTIVE'
    LEFT JOIN users u ON u.id = s.user_id
    ORDER BY c.pc_name
  `);
  res.json({ stations: rows.map((row) => ({
    pcId: row.pc_id,
    pcName: row.pc_name,
    ipAddress: row.ip_address,
    status: row.status,
    sessionId: row.session_id,
    remainingSeconds: row.remaining_seconds === null ? null : Number(row.remaining_seconds),
    patronUsername: row.patron_username,
    patronBalance: row.patron_balance === null ? null : Number(row.patron_balance),
  })) });
}

export async function addStation(req, res) {
  const pcName = typeof req.body?.pcName === 'string' ? req.body.pcName.trim() : '';
  const ipAddress = typeof req.body?.ipAddress === 'string' ? req.body.ipAddress.trim() : '';
  if (!pcName || pcName.length > 60 || ipAddress.length > 45 || (ipAddress && !isIP(ipAddress))) {
    return res.status(400).json({ error: 'Enter a PC name (up to 60 characters) and an optional valid IP address.' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO computers(pc_name, ip_address, status) VALUES($1,$2,\'AVAILABLE\') RETURNING pc_id,pc_name,ip_address,status',
      [pcName, ipAddress || null],
    );
    const station = rows[0];
    res.status(201).json({ station: { pcId:station.pc_id, pcName:station.pc_name, ipAddress:station.ip_address, status:station.status, sessionId:null, remainingSeconds:null, patronUsername:null, patronBalance:null } });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'A PC with that name is already registered.' });
    console.error('PC registration failed:', error);
    res.status(500).json({ error: 'Could not register this PC.' });
  }
}

export async function cashTopUpByStation(req, res) {
  const amount = Number(req.body?.amount);
  const pcId = Number(req.params.pcId);
  if (!Number.isSafeInteger(pcId) || pcId < 1) return res.status(400).json({ error: 'Choose a valid PC station.' });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return res.status(400).json({ error: 'Enter a cash top-up greater than zero and no more than PHP 100,000.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      "SELECT s.session_id, s.user_id FROM sessions s WHERE s.pc_id=$1 AND s.status='ACTIVE' FOR UPDATE",
      [pcId],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This PC has no active patron session to top up.' });
    }
    const session = rows[0];
    const updated = await client.query('UPDATE users SET balance=balance+$1 WHERE id=$2 RETURNING id,username,balance', [amount,session.user_id]);
    if (!updated.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'The patron account for this session was not found.' });
    }
    await client.query(
      "INSERT INTO transactions(user_id,amount,payment_method,created_by,pc_id) VALUES($1,$2,'CASH',$3,$4)",
      [session.user_id,amount,req.session.user.id,pcId],
    );
    await client.query('COMMIT');
    res.json({ message:`Cash top-up recorded for ${updated.rows[0].username}.`, balance:Number(updated.rows[0].balance) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Station cash top-up failed:', error);
    res.status(500).json({ error: 'Could not record this cash top-up.' });
  } finally {
    client.release();
  }
}
