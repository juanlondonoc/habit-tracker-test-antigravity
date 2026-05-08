// Build trigger: 2026-05-08T10:58:15
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
          userId = body.user_id || 'legacy_user';
          console.log('[API POST] Auth successful via Token for user:', userId);
        } else {
          console.warn('[API POST] Unauthorized: Secret token mismatch or missing');
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }

      const ENABLE_APPLE_PAY = false; 
      const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      let merchant = body.merchant || 'Desconocido';
      let source = body.source || 'apple_pay';
      let date = body.date ? new Date(body.date) : new Date();
      let currency = body.currency || 'COP';
      let category = body.category || 'Otros';
      let note = body.note || '';

      let amountStrFromSMS: string | null = null;
      let smsMatched = false;

      // ── SMS Parsing (Bancolombia) ──────────────────────────────────────────
      if (body.text) {
        const rawText = body.text;
        const text = rawText.replace(/\s+/g, ' ').trim();
        console.log('[API POST] Parsing Normalized SMS:', text);
        
        const pPagaste = /Pagaste \$?([\d.,]+) (?:a (.*?) desde|desde (.*?) a (.*?))/i;
        const pRetiraste = /Retiraste \$?([\d.,]+) (?:en (.*?) de|de (.*?) en (.*?))/i;
        const pTransferiste = /transferiste \$?([\d.,]+) (?:a (.*?) desde|desde (.*?) a (.*?))/i;
        const pQR = /pagaste \$?([\d.,]+) por codigo QR .*? (?:a (.*?) el|desde (.*?) a (.*?) el)/i;
        const pNomina = /pago de Nomina de (.*?) por \$?([\d.,]+)/i;
        const pRecibiste = /recibiste una transferencia de (.*?) por \$?([\d.,]+)/i;

        let match;
        if ((match = text.match(pPagaste)) || (match = text.match(pTransferiste))) {
          amountStrFromSMS = match[1];
          const candidate1 = match[2];
          const candidate2 = match[4];
          merchant = (candidate1 || candidate2 || 'Desconocido').trim();
          if (merchant.toLowerCase().includes('cuenta') && (candidate1 && candidate2)) {
            merchant = (candidate1.toLowerCase().includes('cuenta') ? candidate2 : candidate1).trim();
          }
          source = 'sms_bank';
          smsMatched = true;
        } else if ((match = text.match(pRetiraste))) {
          amountStrFromSMS = match[1];
          merchant = (match[2] || match[4] || 'Cajero/Corresponsal').trim();
          source = 'sms_bank';
          smsMatched = true;
        } else if ((match = text.match(pQR))) {
          amountStrFromSMS = match[1];
          merchant = (match[2] || match[4] || 'Código QR').trim();
          source = 'sms_bank';
          smsMatched = true;
        } else if ((match = text.match(pNomina))) {
          merchant = match[1].trim();
          amountStrFromSMS = match[2];
          source = 'sms_income';
          category = 'Otros'; 
          smsMatched = true;
        } else if ((match = text.match(pRecibiste))) {
          merchant = match[1].trim();
          amountStrFromSMS = match[2];
          source = 'sms_income';
          smsMatched = true;
        }

        if (smsMatched) {
          console.log('[API POST] Match found:', merchant, amountStrFromSMS);
        } else {
          console.warn('[API POST] No SMS pattern matched the text:', text);
          if (text.toLowerCase().includes('transferiste')) console.log('DEBUG: "Transferiste" was present but regex failed.');
          return res.status(422).json({ error: 'SMS format not recognized', text });
        }
      } else if (!ENABLE_APPLE_PAY && source === 'apple_pay') {
        console.log('[API POST] Apple Pay request rejected (disabled)');
        return res.status(403).json({ error: 'Apple Pay is currently disabled' });
      }

      // ── Amount Parsing ─────────────────────────────────────────────────────
      let amount = 0;
      const rawAmount = amountStrFromSMS ?? body.amount ?? body.value ?? body.monto; 
      console.log('[API POST] Raw amount received:', rawAmount, `(Type: ${typeof rawAmount})`);

      if (typeof rawAmount === 'number') {
        amount = rawAmount;
      } else if (rawAmount) {
        let amountStr = String(rawAmount).trim();
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
        amount = parseFloat(amountStr) || 0;
      }

      if (amount === 0 && source !== 'manual') {
        console.warn('[API POST] Rejecting transaction with 0 amount');
        return res.status(422).json({ error: 'Invalid amount (0)' });
      }

      console.log('[API POST] Final parsed amount:', amount);

      // ── Deduplication Logic (5-minute window) ──────────────────────────────
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
