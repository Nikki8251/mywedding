import { kvGet, kvSet } from '../../lib/kv';

// GET  /api/status?cat=婚礼服装        -> { itemId: {status, by, at}, ... }
// POST /api/status  { cat, data }      -> saves the whole map for that category
export default async function handler(req, res) {
  const key = (cat) => `wedding-status-${cat}`;

  if (req.method === 'GET') {
    const { cat } = req.query;
    if (!cat) return res.status(400).json({ error: 'missing cat' });
    const data = (await kvGet(key(cat))) || {};
    return res.status(200).json({ data });
  }

  if (req.method === 'POST') {
    try {
      const { cat, data } = req.body || {};
      if (!cat || typeof data !== 'object') {
        return res.status(400).json({ error: 'missing cat or data' });
      }
      await kvSet(key(cat), data);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'save failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}
