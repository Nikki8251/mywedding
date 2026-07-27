import { kvGet, kvSet } from '../../lib/kv';
import { SEATING as DEFAULT_SEATING } from '../../lib/data';

const KEY = 'wedding-seating';

// GET  /api/seating         -> { tables: [...] } (falls back to the imported
//                               default from the spreadsheet until someone
//                               makes the first edit)
// POST /api/seating { tables } -> saves the whole seating arrangement
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const tables = (await kvGet(KEY)) || DEFAULT_SEATING;
    return res.status(200).json({ tables });
  }

  if (req.method === 'POST') {
    try {
      const { tables } = req.body || {};
      if (!Array.isArray(tables)) {
        return res.status(400).json({ error: 'tables must be an array' });
      }
      await kvSet(KEY, tables);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'save failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}
