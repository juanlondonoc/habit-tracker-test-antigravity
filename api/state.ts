import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function getDB() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = neon(url);

  // Create table for key-value state storage
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SECRET = process.env.TRANSACTIONS_SECRET;

  try {
    const sql = await getDB();

    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Missing key' });
      }

      const rows = await sql`SELECT value FROM app_state WHERE key = ${key}`;
      if (rows.length === 0) {
        return res.status(200).json({ value: null });
      }
      return res.status(200).json({ value: rows[0].value });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (SECRET && body.token !== SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!body.key || typeof body.value !== 'string') {
        return res.status(400).json({ error: 'Missing key or value' });
      }

      await sql`
        INSERT INTO app_state (key, value, updated_at)
        VALUES (${body.key}, ${body.value}, NOW())
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = NOW()
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { key, token } = req.query;
      
      if (SECRET && token !== SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Missing key' });
      }

      await sql`DELETE FROM app_state WHERE key = ${key}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[state API]', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
}
