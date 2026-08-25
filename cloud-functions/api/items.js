// EdgeOne Makers Node.js Cloud Function
// Deployed URL: /api/items  (mirrors the old Next.js pages/api/items.js,
// which EdgeOne was not picking up — see cloud-functions/api/flow.js too)
 
const KEY = 'wedding-items';
 
const DEFAULT_ITEMS = [{"id": "i001", "cat": "婚礼服装", "sub": "新郎", "name": "男士西服", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i002", "cat": "婚礼服装", "sub": "新郎", "name": "白色衬衣", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i003", "cat": "婚礼服装", "sub": "新郎", "name": "领结/领带", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i004", "cat": "婚礼服装", "sub": "新郎", "name": "皮鞋（建议深色）", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i005", "cat": "婚礼服装", "sub": "新郎", "name": "袜子", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i006", "cat": "婚礼服装", "sub": "新娘", "name": "新娘晨袍（化妆时）", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i007", "cat": "婚礼服装", "sub": "新娘", "name": "出门纱/中式迎亲礼服", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "done", "note": ""}, {"id": "i008", "cat": "婚礼服装", "sub": "新娘", "name": "仪式主纱", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "done", "note": ""}, {"id": "i009", "cat": "婚礼服装", "sub": "新娘", "name": "敬酒礼服", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "done", "note": ""}, {"id": "i010", "cat": "婚礼服装", "sub": "新娘", "name": "婚鞋", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i011", "cat": "婚礼服装", "sub": "新娘", "name": "女士内衣", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i012", "cat": "婚礼服装", "sub": "伴郎", "name": "伴郎衬衣", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i013", "cat": "婚礼服装", "sub": "伴郎", "name": "伴郎领结", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i014", "cat": "婚礼服装", "sub": "伴娘", "name": "伴娘礼服", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i015", "cat": "婚礼服装", "sub": "伴娘", "name": "伴手礼", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i016", "cat": "婚礼采购", "sub": "喜糖盒", "name": "喜糖盒", "deadline": "婚礼前1个月", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i017", "cat": "婚礼采购", "sub": "喜糖", "name": "喜糖（多备30–50份）", "deadline": "婚礼前1个月", "priority": "必要", "owner": "父母", "status": "todo", "note": "山姆采购"}, {"id": "i018", "cat": "婚礼采购", "sub": "酒店酒水", "name": "喜烟（每桌1–2盒，散烟摆放）", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": "山姆采购"}, {"id": "i019", "cat": "婚礼采购", "sub": "酒店酒水", "name": "酒水：白酒/红酒", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": "山姆采购"}, {"id": "i020", "cat": "婚礼采购", "sub": "酒店酒水", "name": "软饮/饮料/碳酸饮料", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": "山姆采购"}, {"id": "i021", "cat": "婚礼采购", "sub": "酒店酒水", "name": "矿泉水（每桌10瓶）", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": "山姆采购"}, {"id": "i022", "cat": "婚礼采购", "sub": "酒店酒水", "name": "茶叶", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": "山姆采购"}, {"id": "i023", "cat": "婚礼采购", "sub": "酒店酒水", "name": "抽纸", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": ""}, {"id": "i024", "cat": "婚礼采购", "sub": "草坪必备", "name": "矿泉水4箱", "deadline": "婚礼前15天", "priority": "重要", "owner": "父母", "status": "todo", "note": "山姆采购"}, {"id": "i025", "cat": "婚礼采购", "sub": "草坪必备", "name": "驱蚊水", "deadline": "婚礼前15天", "priority": "重要", "owner": "新娘", "status": "todo", "note": "山姆采购"}, {"id": "i026", "cat": "婚礼采购", "sub": "酒店用品", "name": "剪刀/胶带（拆封酒水用）", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": ""}, {"id": "i027", "cat": "婚礼采购", "sub": "酒店用品", "name": "签到本", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i028", "cat": "婚礼采购", "sub": "酒店用品", "name": "签到笔", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i029", "cat": "婚礼采购", "sub": "酒店用品", "name": "空红包（签到备用/接亲用）", "deadline": "婚礼前15天", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i030", "cat": "婚礼采购", "sub": "酒店用品", "name": "胸花（总管/贵宾）", "deadline": "婚礼前15天", "priority": "非必要", "owner": "婚礼策划", "status": "pending", "note": ""}, {"id": "i031", "cat": "婚礼采购", "sub": "酒店用品", "name": "礼金箱", "deadline": "婚礼前15天", "priority": "非必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i032", "cat": "婚礼采购", "sub": "婚房装饰", "name": "喜字", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i033", "cat": "婚礼采购", "sub": "婚房装饰", "name": "胶带/点胶", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i034", "cat": "婚礼采购", "sub": "婚房装饰", "name": "喜糖水果", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i035", "cat": "婚礼采购", "sub": "婚房装饰", "name": "床品", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": ""}, {"id": "i036", "cat": "婚礼采购", "sub": "婚房装饰", "name": "装饰饰品", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i037", "cat": "婚礼采购", "sub": "接亲用品", "name": "喜碗喜筷/托盘", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i038", "cat": "婚礼采购", "sub": "接亲用品", "name": "茶壶茶碗/托盘", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i039", "cat": "婚礼采购", "sub": "接亲用品", "name": "茶叶（敬茶）", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": ""}, {"id": "i040", "cat": "婚礼采购", "sub": "接亲用品", "name": "跪垫", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i041", "cat": "婚礼采购", "sub": "接亲用品", "name": "水饺", "deadline": "婚礼前15天", "priority": "必要", "owner": "父母", "status": "todo", "note": ""}, {"id": "i042", "cat": "婚礼采购", "sub": "婚礼环节", "name": "备用假戒指", "deadline": "婚礼前15天", "priority": "必要", "owner": "婚礼策划", "status": "pending", "note": ""}, {"id": "i043", "cat": "婚礼采购", "sub": "婚礼环节", "name": "誓言卡2份", "deadline": "婚礼前15天", "priority": "必要", "owner": "婚礼策划", "status": "pending", "note": ""}, {"id": "i044", "cat": "婚礼采购", "sub": "婚礼环节", "name": "礼物和小道具", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i045", "cat": "婚礼采购", "sub": "婚礼环节", "name": "花童安排", "deadline": "婚礼前15天", "priority": "必要", "owner": "新娘", "status": "pending", "note": ""}, {"id": "i046", "cat": "婚礼准备", "sub": "应急包", "name": "纸巾/湿纸巾", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i047", "cat": "婚礼准备", "sub": "应急包", "name": "护手霜（防静电）", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i048", "cat": "婚礼准备", "sub": "应急包", "name": "防晒喷雾", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i049", "cat": "婚礼准备", "sub": "应急包", "name": "暖宝宝", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i050", "cat": "婚礼准备", "sub": "应急包", "name": "吸管", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i051", "cat": "婚礼准备", "sub": "应急包", "name": "针线包/别针", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i052", "cat": "婚礼准备", "sub": "应急包", "name": "充电宝", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i053", "cat": "婚礼准备", "sub": "应急包", "name": "创可贴", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i054", "cat": "婚礼准备", "sub": "应急包", "name": "眼药水", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i055", "cat": "婚礼准备", "sub": "应急包", "name": "脚后跟防磨膏", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i056", "cat": "婚礼准备", "sub": "应急包", "name": "高跟鞋贴", "deadline": "婚礼前1周", "priority": "必要", "owner": "伴娘", "status": "todo", "note": ""}, {"id": "i057", "cat": "婚礼准备", "sub": "确认事项", "name": "桌卡名称/包间名称", "deadline": "婚礼前1周", "priority": "重要", "owner": "双方", "status": "todo", "note": "新人提供电子版，策划制作"}, {"id": "i058", "cat": "婚礼准备", "sub": "确认事项", "name": "婚纱照/指示牌照片", "deadline": "婚礼前1周", "priority": "重要", "owner": "双方", "status": "todo", "note": ""}, {"id": "i059", "cat": "婚礼准备", "sub": "确认事项", "name": "新郎理发", "deadline": "婚礼前1周", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i060", "cat": "婚礼准备", "sub": "确认事项", "name": "新娘美甲", "deadline": "婚礼前1周", "priority": "必要", "owner": "新娘", "status": "todo", "note": ""}, {"id": "i061", "cat": "婚礼准备", "sub": "确认事项", "name": "换零钱", "deadline": "婚礼前1周", "priority": "必要", "owner": "双方", "status": "todo", "note": ""}, {"id": "i062", "cat": "婚礼准备", "sub": "确认事项", "name": "确定最终宾客人数", "deadline": "婚礼前1周", "priority": "重要", "owner": "双方", "status": "todo", "note": ""}, {"id": "i063", "cat": "婚礼准备", "sub": "确认事项", "name": "确定最终总管事宜", "deadline": "婚礼前1周", "priority": "重要", "owner": "双方", "status": "todo", "note": ""}, {"id": "i064", "cat": "婚礼准备", "sub": "婚礼前3天", "name": "准备新词/誓言", "deadline": "婚礼前3天", "priority": "必要", "owner": "双方", "status": "todo", "note": ""}, {"id": "i065", "cat": "婚礼准备", "sub": "婚礼前3天", "name": "与酒店沟通酒水送达时间", "deadline": "婚礼前3天", "priority": "必要", "owner": "新郎", "status": "todo", "note": ""}, {"id": "i066", "cat": "婚礼准备", "sub": "婚礼前3天", "name": "家中张贴喜字", "deadline": "婚礼前3天", "priority": "必要", "owner": "父母", "status": "todo", "note": ""}, {"id": "i067", "cat": "婚礼准备", "sub": "婚礼前3天", "name": "核对婚礼筹备清单", "deadline": "婚礼前3天", "priority": "必要", "owner": "双方", "status": "todo", "note": ""}, {"id": "i068", "cat": "婚礼准备", "sub": "婚礼前1天", "name": "酒水物品送到酒店", "deadline": "婚礼前1天", "priority": "重要", "owner": "酒店总管", "status": "todo", "note": ""}];
 
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
  const url = new URL(context.request.url);
  if (url.searchParams.get('debug') === '1') {
    const env = context.env;
    const kvUrl = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
    const kvToken = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
    const debug = {
      hasUrl: !!kvUrl,
      hasToken: !!kvToken,
      urlPreview: kvUrl ? kvUrl.slice(0, 30) + '...' : null,
    };
    if (kvUrl && kvToken) {
      try {
        const testValue = 'ping-' + Date.now();
        const setR = await fetch(`${kvUrl}/set/wedding-debug-ping`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'text/plain' },
          body: testValue,
        });
        debug.setStatus = setR.status;
        debug.setBody = await setR.text();
        const getR = await fetch(`${kvUrl}/get/wedding-debug-ping`, {
          headers: { Authorization: `Bearer ${kvToken}` },
        });
        debug.getStatus = getR.status;
        debug.getBody = await getR.text();
        debug.roundTripOk = debug.getBody.includes(testValue);
      } catch (e) {
        debug.error = String(e && e.message || e);
      }
    }
    return json({ debug });
  }
  if (url.searchParams.get('debug') === '3') {
    const marker = await kvGet(context.env, 'wedding-post-debug');
    return json({ postMarker: marker || null });
  }
  const items = (await kvGet(context.env, KEY)) || DEFAULT_ITEMS;
  return json({ items });
}
 
export async function onRequestPost(context) {
  // Unconditional marker write, best-effort, so we can tell from a GET
  // (?debug=3) whether a real POST from the app ever reached this
  // function at all, independent of whether the rest of the logic below
  // succeeds or throws.
  try {
    const rawBody = await context.request.clone().text();
    await kvSet(context.env, 'wedding-post-debug', {
      at: new Date().toISOString(),
      bodyPreview: rawBody.slice(0, 200),
    });
  } catch (e) {
    // ignore - this is best-effort diagnostics only
  }
 
  // Diagnostic-only requests (from test-post.html) must NEVER touch the
  // real checklist data - this guard is what makes that safe regardless
  // of what body the test page sends.
  const reqUrl = new URL(context.request.url);
  if (reqUrl.searchParams.get('debug') === '3') {
    return json({ ok: true, diagOnly: true });
  }
 
  try {
    const body = await context.request.json();
    const items = body && body.items;
    if (!Array.isArray(items)) {
      return json({ error: 'items must be an array' }, 400);
    }
    const ok = await kvSet(context.env, KEY, items);
    if (!ok) return json({ error: 'save failed' }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'save failed', detail: String(e && e.message || e) }, 500);
  }
}
 
