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
  return neon(url);
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
      console.log('[API POST] Body received:', JSON.stringify(body));

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
      let amountStr = String(body.amount || '0').trim();
      let merchant = body.merchant || 'Desconocido';
      let source = body.source || 'apple_pay';
      let date = body.date ? new Date(body.date) : new Date();
      let currency = body.currency || 'COP';
      let category = body.category || 'Otros';
      let note = body.note || '';

      // ── SMS Parsing (Bancolombia) ──────────────────────────────────────────
      if (body.text) {
        const text = body.text;
        console.log('[API POST] Parsing SMS:', text);
        
        // Patterns
        const pPagaste = /Pagaste \$([\d.,]+) a (.*?) desde/i;
        const pRetiraste = /Retiraste \$([\d.,]+) en (.*?) de/i;
        const pTransferiste = /transferiste \$([\d.,]+) a (.*?) desde/i;
        const pQR = /pagaste \$([\d.,]+) por codigo QR .*? a (.*?) el/i;
        const pNomina = /pago de Nomina de (.*?) por \$([\d.,]+)/i;
        const pRecibiste = /recibiste una transferencia de (.*?) por \$([\d.,]+)/i;

        let match;
        if ((match = text.match(pPagaste)) || (match = text.match(pRetiraste)) || (match = text.match(pTransferiste)) || (match = text.match(pQR))) {
          amountStr = match[1];
          merchant = match[2].trim();
          source = 'sms_bank';
        } else if ((match = text.match(pNomina))) {
          merchant = match[1].trim();
          amountStr = match[2];
          source = 'sms_income';
          category = 'Otros'; // Or "Ingresos" if we add it
        } else if ((match = text.match(pRecibiste))) {
          merchant = match[1].trim();
          amountStr = match[2];
          source = 'sms_income';
        }
      }

      // ── Amount Parsing ─────────────────────────────────────────────────────
      // Remove currency symbols and spaces
      amountStr = amountStr.replace(/[^\d.,-]/g, '');
      const lastDot = amountStr.lastIndexOf('.');
      const lastComma = amountStr.lastIndexOf(',');
      if (lastComma > lastDot) {
        amountStr = amountStr.replace(/\./g, '').replace(',', '.');
      } else if (lastDot > lastComma) {
        const parts = amountStr.split('.');
        if (parts.length === 2 && parts[1].length === 3 && !amountStr.includes(',')) {
          amountStr = amountStr.replace('.', '');
        } else {
          amountStr = amountStr.replace(/,/g, '');
        }
      } else if (lastComma !== -1) {
        const parts = amountStr.split(',');
        if (parts.length === 2 && parts[1].length === 3) {
          amountStr = amountStr.replace(',', '');
        } else {
          amountStr = amountStr.replace(',', '.');
        }
      }
      const amount = parseFloat(amountStr) || 0;

      // ── Deduplication Logic (5-minute window) ──────────────────────────────
      // If amount is the same and within 5 mins, skip.
      const fiveMinsAgo = new Date(date.getTime() - 5 * 60 * 1000);
      const fiveMinsAfter = new Date(date.getTime() + 5 * 60 * 1000);

      const existing = await sql`
        SELECT id FROM transactions 
        WHERE user_id = ${userId} 
        AND amount = ${amount} 
        AND date >= ${fiveMinsAgo} 
        AND date <= ${fiveMinsAfter}
        LIMIT 1
      `;

      if (existing.length > 0) {
        console.log('[API POST] Duplicate detected, skipping:', id);
        return res.status(200).json({ success: true, message: 'Duplicate skipped', id: existing[0].id });
      }

      console.log('[API POST] Saving transaction:', merchant, amount, source);

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
