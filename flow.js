import { kvGet, kvSet } from '../../lib/kv';
import { CEREMONY as DEFAULT_CEREMONY, PARENTS as DEFAULT_PARENTS, MANAGERS as DEFAULT_MANAGERS } from '../../lib/data';

const KEY = 'wedding-flow';

const DEFAULT_FLOW = { ceremony: DEFAULT_CEREMONY, parents: DEFAULT_PARENTS, managers: DEFAULT_MANAGERS };

// GET  /api/flow         -> { flow: { ceremony, parents, managers } } (falls
//                            back to the imported defaults until someone
//                            adds/removes a step for the first time)
// POST /api/flow { flow } -> saves the whole flow object
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const flow = (await kvGet(KEY)) || DEFAULT_FLOW;
    return res.status(200).json({ flow });
  }

  if (req.method === 'POST') {
    try {
      const { flow } = req.body || {};
      if (!flow || typeof flow !== 'object' || Array.isArray(flow)) {
        return res.status(400).json({ error: 'flow must be an object' });
      }
      await kvSet(KEY, flow);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'save failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}
