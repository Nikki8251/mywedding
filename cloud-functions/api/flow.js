// EdgeOne Makers Node.js Cloud Function
// Deployed URL: /api/flow  (mirrors the old Next.js pages/api/flow.js,
// which EdgeOne was not picking up — see cloud-functions/api/items.js too)

const KEY = 'wedding-flow';

const CEREMONY = [{"id": "ce1", "cat": "新娘准备", "name": "新娘起床", "dur": "5:00", "desc": "起床时间可根据自己情况调整，只要不耽误化妆即可。记得前一晚将婚礼当日所需随身物品准备好，以防婚礼当日太匆忙；记得将接亲房间装饰一下，建议简约装饰：喜字"}, {"id": "ce2", "cat": null, "name": "新娘化妆师到位", "dur": "5:30之前", "desc": "新娘准备化妆。准备吸管，化妆时候比较方便喝水；化妆千万不要在洗手间化妆，选个光线比较好的地方，必备神器镜子；准备创可贴（婚鞋第一次穿可能会磨脚）"}, {"id": "ce3", "cat": null, "name": "摄影摄像到位", "dur": "6:30之前", "desc": ""}, {"id": "ce4", "cat": null, "name": "新娘化妆", "dur": "5:30—8:30", "desc": "包括化妆期间抓拍拍摄。这个时候可以吃点东西喝水补充能量；提前化好可以合影；包含互动拍摄时间；新娘妈妈在新娘早晨拍摄期间化妆，具体时间看化妆师进度"}, {"id": "ce5", "cat": null, "name": "化妆，摆拍结束", "dur": "8:30", "desc": "与父母、家人一起合影拍照"}, {"id": "ce6", "cat": "新郎准备", "name": "新郎起床", "dur": "6:30", "desc": "起床时间可以根据自己习惯调整，只要不耽误化妆即可"}, {"id": "ce7", "cat": null, "name": "新郎化妆收拾", "dur": "7:00—8:00", "desc": ""}, {"id": "ce8", "cat": null, "name": "新郎摄影摄像到达", "dur": "8:00之前", "desc": ""}, {"id": "ce9", "cat": null, "name": "新郎和家人互动拍摄", "dur": "8:00—8:20", "desc": ""}, {"id": "ce10", "cat": null, "name": "新郎出发去新娘房间", "dur": "8:20", "desc": ""}, {"id": "ce11", "cat": "婚礼当天", "name": "新人给双方父母敬茶合影", "dur": "8:20—8:30", "desc": ""}, {"id": "ce12", "cat": null, "name": "和好朋友的时间", "dur": "8:30—9:10", "desc": "拍照合影聊天"}, {"id": "ce13", "cat": null, "name": "新娘换主纱妆造", "dur": "9:10—10:00", "desc": "头纱记得不要忘记带，提前和婚纱放一起"}, {"id": "ce14", "cat": null, "name": "新人仪式现场摆拍", "dur": "10:00—11:10", "desc": ""}, {"id": "ce15", "cat": null, "name": "仪式前准备", "dur": "11:10", "desc": "到仪式指定位置候场"}, {"id": "ce16", "cat": null, "name": "婚礼仪式开始", "dur": "11:18", "desc": "保持微笑，享受婚礼过程"}, {"id": "ce17", "cat": null, "name": "婚礼礼成", "dur": "11:48", "desc": "舞台区合影留念（父母、家人、同事同学、朋友）"}, {"id": "ce18", "cat": null, "name": "午宴开始", "dur": "11:58", "desc": ""}, {"id": "ce19", "cat": null, "name": "招呼宾客", "dur": "12:18", "desc": ""}, {"id": "ce20", "cat": null, "name": "新娘换敬酒服", "dur": "12:28", "desc": "给新娘在化妆间适当准备点小零食；准备敬酒，新郎新娘、双方父母先大厅敬酒再包间敬酒"}];

const PARENTS = [{"id": "pa1", "role": "新郎父母", "step": "起床", "time": "婚礼当日早上", "note": "整理着装，安排早饭、安排贴喜字"}, {"id": "pa2", "role": null, "step": "送迎亲团出发", "time": "婚礼当日早上", "note": "到酒店送新郎及迎亲团出发"}, {"id": "pa3", "role": null, "step": "接受敬茶改口", "time": "接亲结束后", "note": "同亲家一起接受儿女敬茶改口，准备好红包"}, {"id": "pa4", "role": null, "step": "迎宾", "time": "上午10:30", "note": "在迎宾区与新人合影，迎宾区迎接客人"}, {"id": "pa5", "role": null, "step": "仪式准备", "time": "仪式开始前10分钟", "note": "在督导引领下到前排就坐"}, {"id": "pa6", "role": null, "step": "仪式环节", "time": "仪式进行中", "note": "前排就坐，参与仪式环节"}, {"id": "pa7", "role": null, "step": "合影", "time": "婚礼礼成后", "note": "与新人及亲属合影"}, {"id": "pa8", "role": null, "step": "就餐", "time": "合影结束后", "note": "陪同客人就餐"}, {"id": "pa9", "role": null, "step": "敬酒", "time": "就餐中", "note": "准备敬酒，由主持人陪同敬单间"}, {"id": "pa10", "role": null, "step": "送宾", "time": "喜宴结束后", "note": "陪同新人及家人送宾"}, {"id": "pa11", "role": "新娘父母", "step": "起床", "time": "婚礼当日早上", "note": "整理着装，收拾屋子"}, {"id": "pa12", "role": null, "step": "接亲准备", "time": "接亲前", "note": "准备好果盘、茶水、带把的茶具一套，接亲前通知前台半个小时后送达"}, {"id": "pa13", "role": null, "step": "准备水饺", "time": "接亲前", "note": "准备水饺等待新郎"}, {"id": "pa14", "role": null, "step": "迎接新郎", "time": "新郎到达时", "note": "新娘妈妈给新人喂水饺，与新人合影，接受儿女敬茶改口，准备好红包"}, {"id": "pa15", "role": null, "step": "迎宾", "time": "上午10:30", "note": "在迎宾区与新人合影，迎宾区迎接客人"}, {"id": "pa16", "role": null, "step": "仪式准备", "time": "仪式开始前", "note": "母亲到前排就坐，父亲到彩排指定位置候场"}, {"id": "pa17", "role": null, "step": "仪式环节", "time": "仪式进行中", "note": "参与仪式内容，按照仪式流程和前一天彩排执行"}, {"id": "pa18", "role": null, "step": "合影", "time": "婚礼礼成后", "note": "与新人及亲属合影"}, {"id": "pa19", "role": null, "step": "就餐", "time": "合影结束后", "note": "在接待主管带领下去贵宾包间就坐"}, {"id": "pa20", "role": null, "step": "敬酒", "time": "就餐中", "note": "在总管以及督导安排下与新人、男方父母一起敬酒"}];

const MANAGERS = [{"id": "mg1", "role": "大总管", "num": "2-4人", "duty": "整体指挥协调，统筹各岗位工作，应对突发情况", "time": "婚礼全流程"}, {"id": "mg2", "role": "迎宾主管", "num": "1-2人", "duty": "1、来宾接待事宜；2、迎宾人员胸花发放；3、仪式前提醒贵宾入座；4、喜宴结束后陪同送宾", "time": "上午10:30至婚礼结束"}, {"id": "mg3", "role": "礼金主管", "num": "2人", "duty": "1、礼金保管记录事宜；2、签到台准备；3、仪式后清点记录并保管礼金", "time": "上午9:30至婚礼结束"}];

const DEFAULT_FLOW = { ceremony: CEREMONY, parents: PARENTS, managers: MANAGERS };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
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
  const flow = (await kvGet(context.env, KEY)) || DEFAULT_FLOW;
  return json({ flow });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const flow = body && body.flow;
    if (!flow || typeof flow !== 'object' || Array.isArray(flow)) {
      return json({ error: 'flow must be an object' }, 400);
    }
    const ok = await kvSet(context.env, KEY, flow);
    if (!ok) return json({ error: 'save failed' }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'save failed' }, 500);
  }
}
