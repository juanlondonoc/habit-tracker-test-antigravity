import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@clerk/backend';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function authenticate(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload.sub; // user_id
  } catch (e) {
    console.error('Token verification failed', e);
    return null;
  }
}

async function getDB() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = neon(url);

  // Update table for multi-user state storage
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      user_id TEXT NOT NULL DEFAULT 'legacy_user',
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, key)
    )
  `;

  // Ensure the column exists if the table was created before the multi-user update
  await sql`ALTER TABLE app_state ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'legacy_user'`;
  
  // Safe drop and recreate of primary key to ensure (user_id, key) is the new PK
  try {
    await sql`ALTER TABLE app_state DROP CONSTRAINT app_state_pkey`;
    await sql`ALTER TABLE app_state ADD PRIMARY KEY (user_id, key)`;
  } catch (e) {
    // Constraint might not be named 'app_state_pkey' or it might already be updated
  }

  return sql;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = await authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing Clerk token' });
  }

  try {
    const sql = await getDB();

    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Missing key' });
      }

      const rows = await sql`SELECT value FROM app_state WHERE key = ${key} AND user_id = ${userId}`;
      if (rows.length === 0) {
        return res.status(200).json({ value: null });
      }
      return res.status(200).json({ value: rows[0].value });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!body.key || typeof body.value !== 'string') {
        return res.status(400).json({ error: 'Missing key or value' });
      }

      await sql`
        INSERT INTO app_state (user_id, key, value, updated_at)
        VALUES (${userId}, ${body.key}, ${body.value}, NOW())
        ON CONFLICT (user_id, key) DO UPDATE 
        SET value = EXCLUDED.value, updated_at = NOW()
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { key } = req.query;
      
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Missing key' });
      }

      await sql`DELETE FROM app_state WHERE key = ${key} AND user_id = ${userId}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[state API]', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
}
