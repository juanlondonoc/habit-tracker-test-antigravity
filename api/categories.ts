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
    return null;
  }
}

async function getDB() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = neon(url);

  // Table for custom transaction categories
  await sql`
    CREATE TABLE IF NOT EXISTS tx_categories (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT '#3b82f6',
      icon        TEXT NOT NULL DEFAULT 'MoreHorizontal',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let userId = await authenticate(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sql = await getDB();

    // ── GET (List categories) ──────────────────────────────────────────────────
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, name, color, icon
        FROM tx_categories
        WHERE user_id = ${userId}
        ORDER BY name ASC
      `;
      return res.status(200).json(rows);
    }

    // ── POST (Create category) ─────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.name) return res.status(400).json({ error: 'Missing name' });

      const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { name, color, icon } = body;

      await sql`
        INSERT INTO tx_categories (id, user_id, name, color, icon)
        VALUES (${id}, ${userId}, ${name}, ${color || '#3b82f6'}, ${icon || 'MoreHorizontal'})
      `;

      return res.status(201).json({ id, name, color, icon });
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      await sql`DELETE FROM tx_categories WHERE id = ${id} AND user_id = ${userId}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[categories API]', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
}
