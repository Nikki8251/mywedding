// EdgeOne Makers Node.js Cloud Function
// Deployed URL: /api/status  (mirrors the old Next.js pages/api/status.js
// which EdgeOne was not picking up)
//
// This is the endpoint that actually saves checklist done/todo/doing
// status per item - the missing piece that kept the checklist progress
// from persisting even after /api/items and /api/flow were fixed.
 
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
 
async function kvGet(env, key) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const j = await r.json();
  if (j.result == null) return null;
  try {
    return JSON.parse(j.result);
  } catch {
    return j.result;
  }
}
 
async function kvSet(env, key, value) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  const r = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(value),
  });
  if (!r.ok) return false;
  const j = await r.json();
  return j.result === 'OK';
}
 
const statusKey = (cat) => `wedding-status-${cat}`;
 
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const cat = url.searchParams.get('cat');
  if (!cat) return json({ error: 'missing cat' }, 400);
  const data = (await kvGet(context.env, statusKey(cat))) || {};
  return json({ data });
}
 
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const cat = body && body.cat;
    const data = body && body.data;
    if (!cat || typeof data !== 'object') {
      return json({ error: 'missing cat or data' }, 400);
    }
    const ok = await kvSet(context.env, statusKey(cat), data);
    if (!ok) return json({ error: 'save failed' }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'save failed', detail: String(e && e.message || e) }, 500);
  }
}
