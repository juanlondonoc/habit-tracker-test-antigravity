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

  // Create table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id          TEXT PRIMARY KEY,
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
  return sql;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SECRET = process.env.TRANSACTIONS_SECRET;

  try {
    const sql = await getDB();

    // ── GET ────────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, amount::float, merchant, date, currency, category, note, source
        FROM transactions
        ORDER BY date DESC
        LIMIT 500
      `;
      return res.status(200).json(rows);
    }

    // ── POST ───────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (SECRET && body.token !== SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let amountStr = String(body.amount || '0');
      // Handle Spanish/Colombian format: 470.000,00 -> 470000.00
      amountStr = amountStr.replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(amountStr) || 0;
      const merchant = body.merchant || 'Desconocido';
      const date = body.date ? new Date(body.date) : new Date();
      const currency = body.currency || 'COP';
      const category = body.category || 'Otros';
      const note = body.note || '';
      const source = body.source || 'apple_pay';

      await sql`
        INSERT INTO transactions (id, amount, merchant, date, currency, category, note, source)
        VALUES (${id}, ${amount}, ${merchant}, ${date}, ${currency}, ${category}, ${note}, ${source})
      `;

      const tx = { id, amount, merchant, date: date.toISOString(), currency, category, note, source };
      return res.status(201).json({ success: true, transaction: tx });
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (SECRET && body.token !== SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!body.id) return res.status(400).json({ error: 'Missing id' });

      await sql`DELETE FROM transactions WHERE id = ${body.id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[transactions API]', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
}
