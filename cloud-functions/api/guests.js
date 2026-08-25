// EdgeOne Makers Node.js Cloud Function
// Deployed URL: /api/guests  (mirrors the old Next.js pages/api/guests.js
// which EdgeOne was not picking up)
 
const KEY = 'wedding-guests';
 
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
 
export async function onRequestGet(context) {
  const guests = (await kvGet(context.env, KEY)) || [];
  return json({ guests });
}
 
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const guests = body && body.guests;
    if (!Array.isArray(guests)) {
      return json({ error: 'guests must be an array' }, 400);
    }
    const ok = await kvSet(context.env, KEY, guests);
    if (!ok) return json({ error: 'save failed' }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'save failed', detail: String(e && e.message || e) }, 500);
  }
}
 
