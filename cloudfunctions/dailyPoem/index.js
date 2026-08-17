// 每日诗词推送云函数
// 定时触发（建议每天 08:00），向所有订阅用户发送一首随机诗词
// 依赖：subscribers 集合（由 dailySubscribe 云函数维护）
//       poemData / poemData2 云函数提供诗词数据
//
// 配置定时触发器（cloudfunctions/dailyPoem/config.json）：
//   { "triggers": [{ "type": "timer", "name": "dailyPush", "config": "0 0 8 * * * *" }] }
//
// 订阅消息模板 ID：在小程序后台 → 订阅消息 → 创建模板后替换下方 TMPL_ID
// 模板字段建议：thing1=诗名, thing2=作者, thing3=朝代
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 订阅消息模板 ID（用户在小程序后台创建后替换）
const TMPL_ID = "DAILY_POEM_TMPL_ID";

exports.main = async () => {
  const db = cloud.database();

  // 1. 获取索引
  const idxRes = await cloud.callFunction({ name: "poemData", data: { file: "index.json" } });
  if (!idxRes.result || idxRes.result.code !== 200) return { code: 500, error: "index_failed" };
  const index = idxRes.result.data;

  // 2. 随机选一个分块
  const chunk = index.chunks[Math.floor(Math.random() * index.chunks.length)];
  const chunkNum = parseInt(chunk.file, 10);
  const fnName = chunkNum <= 140 ? "poemData" : "poemData2";

  // 3. 获取该分块的诗词
  const poemRes = await cloud.callFunction({ name: fnName, data: { file: chunk.file } });
  if (!poemRes.result || poemRes.result.code !== 200) return { code: 500, error: "chunk_failed" };
  const poems = poemRes.result.data;

  // 4. 随机选一首
  const poem = poems[Math.floor(Math.random() * poems.length)];

  // 5. 获取订阅用户（每次最多处理 100 条，避免超时）
  const subs = await db.collection("subscribers").where({ subscribed: true }).limit(100).get();

  // 6. 逐个发送订阅消息
  let sent = 0, failed = 0;
  for (const sub of subs.data) {
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: sub._openid,
        templateId: TMPL_ID,
        page: "pages/index/index",
        data: {
          thing1: { value: (poem.t || "无题").substring(0, 20) },
          thing2: { value: (poem.a || "佚名").substring(0, 20) },
          thing3: { value: (poem.d || "").substring(0, 20) },
        },
      });
      sent++;
    } catch (e) {
      failed++;
      // 订阅次数用尽(43101)或用户取消(47003)：标记为未订阅
      if (e.errCode === 43101 || e.errCode === 47003) {
        try {
          await db.collection("subscribers").doc(sub._id).update({ data: { subscribed: false } });
        } catch (e2) {}
      }
    }
  }

  return { code: 200, sent, failed, poem: { t: poem.t, a: poem.a, d: poem.d } };
};
