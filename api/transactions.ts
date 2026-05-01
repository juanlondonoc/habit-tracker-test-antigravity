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

  // Create table if it doesn't exist, and add user_id for multi-user support
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL DEFAULT 'legacy_user',
      amount      NUMERIC NOT NULL,
      merchant    TEXT NOT NULL,
      date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      currency    TEXT NOT NULL DEFAULT 'COP',
      category    TEXT NOT NULL DEFAULT 'Otros',
      note        TEXT DEFAULT '',
      source      TEXT NOT NULL DEFAULT 'manual',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Add user_id column if the table already existed before the multi-user update
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'legacy_user'`;

  return sql;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SECRET = process.env.TRANSACTIONS_SECRET;
  let userId = await authenticate(req);

  try {
    const sql = await getDB();

    // ── GET ────────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized: Invalid or missing Clerk token' });

      const rows = await sql`
        SELECT id, amount::float, merchant, date, currency, category, note, source
        FROM transactions
        WHERE user_id = ${userId}
        ORDER BY date DESC
        LIMIT 500
      `;
      return res.status(200).json(rows);
    }

    // ── POST ───────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Hybrid Auth: If no Clerk token, check if the request has the TRANSACTIONS_SECRET
      if (!userId) {
        if (SECRET && body.token === SECRET) {
          // Allowed via Secret (for Apple Pay shortcut). Require a user_id to be passed, or fallback.
          userId = body.user_id || 'legacy_user';
        } else {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }

      const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let amountStr = String(body.amount || '0');
      // More robust parsing: remove anything that isn't a digit, dot or comma
      amountStr = amountStr.replace(/[^\d.,]/g, '');
      // Handle Spanish/Colombian format: 470.000,00 -> 470000.00
      // If there's a comma and a dot, the dot is thousands and comma is decimal.
      if (amountStr.includes('.') && amountStr.includes(',')) {
        amountStr = amountStr.replace(/\./g, '').replace(',', '.');
      } else if (amountStr.includes(',')) {
        // If only comma, it might be decimal
        amountStr = amountStr.replace(',', '.');
      }
      
      const amount = parseFloat(amountStr) || 0;
      const merchant = body.merchant || 'Desconocido';
      const date = body.date ? new Date(body.date) : new Date();
      const currency = body.currency || 'COP';
      const category = body.category || 'Otros';
      const note = body.note || '';
      const source = body.source || 'apple_pay';

      await sql`
        INSERT INTO transactions (id, user_id, amount, merchant, date, currency, category, note, source)
        VALUES (${id}, ${userId}, ${amount}, ${merchant}, ${date}, ${currency}, ${category}, ${note}, ${source})
      `;

      const tx = { id, amount, merchant, date: date.toISOString(), currency, category, note, source };
      return res.status(201).json({ success: true, transaction: tx });
    }

    // ── PATCH / PUT (Edit) ─────────────────────────────────────────────────────
    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.id) return res.status(400).json({ error: 'Missing id' });

      await sql`
        UPDATE transactions 
        SET 
          merchant = ${body.merchant},
          category = ${body.category},
          amount = ${body.amount},
          note = ${body.note},
          date = ${new Date(body.date)}
        WHERE id = ${body.id} AND user_id = ${userId}
      `;
      return res.status(200).json({ success: true });
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized: Invalid or missing Clerk token' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.id) return res.status(400).json({ error: 'Missing id' });

      await sql`DELETE FROM transactions WHERE id = ${body.id} AND user_id = ${userId}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[transactions API]', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
}
