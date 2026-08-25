// EdgeOne Makers Node.js Cloud Function
// Deployed URL: /api/seating  (mirrors the old Next.js pages/api/seating.js
// which EdgeOne was not picking up)
 
const KEY = 'wedding-seating';
 
const DEFAULT_SEATING = [{"id": "t1", "label": "1号桌", "capacity": "15人桌", "guests": ["杨东强", "孙虹", "王林涛", "丁英彩", "杨宇浩", "王宁", "王瑾惠", "大鹏", "东华", "王林波", "马传峰", "孙静", "杨新强", "马思成", "付佳"]}, {"id": "t2", "label": "2号桌", "capacity": "12-14人桌", "guests": ["孙维章", "郭福玲", "杨洪斌", "郑桂兰", "杨志强", "杨志强", "杨三强", "杨三强", "秀梅", "秀梅", "杨丹", "宗睿", "宗睿", "华莎莎", "杨子涵"]}, {"id": "t3", "label": "3号桌", "capacity": "12-14人桌", "guests": ["王一展", "王一展", "赵泽西", "吴明昊", "郝运智", "颖智", "元宝（小朋友）", "王禹", "邹邹", "Maple", "Maple老公"]}, {"id": "t4", "label": "4号桌", "capacity": "12-14人桌", "guests": ["许馨予", "老冯", "小幸运（小朋友）", "晓云姐姐", "晓云老公", "艳云姐姐", "艳云小孩（小朋友）", "朱梦雨", "张文慧", "向泽启", "张曼", "张曼老公", "张曼儿子（小朋友）"]}, {"id": "t5", "label": "5号桌", "capacity": "10人桌", "guests": ["Gary", "Gary", "Ressell", "舒傲", "朱安妮", "吴丹妮", "张宇翔", "张扬", "崔嘉琪"]}];
 
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
  const tables = (await kvGet(context.env, KEY)) || DEFAULT_SEATING;
  return json({ tables });
}
 
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const tables = body && body.tables;
    if (!Array.isArray(tables)) {
      return json({ error: 'tables must be an array' }, 400);
    }
    const ok = await kvSet(context.env, KEY, tables);
    if (!ok) return json({ error: 'save failed' }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'save failed', detail: String(e && e.message || e) }, 500);
  }
}
