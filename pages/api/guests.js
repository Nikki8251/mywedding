import { kvGet, kvSet } from '../../lib/kv';

const KEY = 'wedding-guests';

// GET  /api/guests        -> full guest array
// POST /api/guests { guests: [...] } -> saves the whole array
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const guests = (await kvGet(KEY)) || [];
    return res.status(200).json({ guests });
  }

  if (req.method === 'POST') {
    try {
      const { guests } = req.body || {};
      if (!Array.isArray(guests)) {
        return res.status(400).json({ error: 'guests must be an array' });
      }
      await kvSet(KEY, guests);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'save failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}
