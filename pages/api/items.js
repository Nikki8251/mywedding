import { kvGet, kvSet } from '../../lib/kv';
import { ITEMS as DEFAULT_ITEMS } from '../../lib/data';

const KEY = 'wedding-items';

// GET  /api/items          -> { items: [...] } (falls back to the imported
//                              default from the spreadsheet until someone
//                              adds/removes an item for the first time)
// POST /api/items { items } -> saves the whole checklist array
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const items = (await kvGet(KEY)) || DEFAULT_ITEMS;
    return res.status(200).json({ items });
  }

  if (req.method === 'POST') {
    try {
      const { items } = req.body || {};
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items must be an array' });
      }
      await kvSet(KEY, items);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'save failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}
