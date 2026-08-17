// 每日推送订阅管理云函数
// 记录用户对每日诗词推送的订阅/取消订阅
// 数据库集合：subscribers（字段：_openid, subscribed, createdAt, updatedAt）
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: 401, msg: "未获取到用户身份" };

  const action = event.action || "subscribe";
  const col = db.collection("subscribers");

  if (action === "subscribe") {
    // upsert：已存在则更新，不存在则新增
    const existing = await col.where({ _openid: OPENID }).get();
    if (existing.data.length > 0) {
      await col.doc(existing.data[0]._id).update({
        data: { subscribed: true, updatedAt: db.serverDate() },
      });
    } else {
      await col.add({
        data: { _openid: OPENID, subscribed: true, createdAt: db.serverDate() },
      });
    }
    return { code: 200, subscribed: true };
  }

  if (action === "unsubscribe") {
    await col.where({ _openid: OPENID }).update({
      data: { subscribed: false, updatedAt: db.serverDate() },
    });
    return { code: 200, subscribed: false };
  }

  return { code: 400, msg: "未知操作" };
};
