// 诗海访问统计云函数：基于云开发数据库的持久化计数器
// 即使小程序更新，数据库记录依然保留；所有用户共享同一全局计数
// 部署前需在云开发控制台 → 数据库 → 创建集合 visitStats（权限：所有用户可读，仅创建者可写）
// 或在云开发控制台 → 数据库权限设置中改为「所有用户可读写」以便匿名递增
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const COLL = "visitStats";
const DOC_ID = "counter";

exports.main = async (event) => {
  const action = event && event.action ? event.action : "incr";
  const platform = event && event.platform ? event.platform : "unknown";

  try {
    if (action === "query") {
      // 仅查询，不递增
      try {
        const doc = await db.collection(COLL).doc(DOC_ID).get();
        return { code: 200, count: doc.data.count || 0, lastVisit: doc.data.lastVisit || "" };
      } catch (e) {
        return { code: 200, count: 0, lastVisit: "" };
      }
    }

    // 默认：递增 + 返回新计数
    let updated = false;
    try {
      const res = await db
        .collection(COLL)
        .doc(DOC_ID)
        .update({
          data: {
            count: _.inc(1),
            lastVisit: db.serverDate(),
            lastPlatform: platform
          }
        });
      if (res.stats && res.stats.updated > 0) updated = true;
    } catch (e) {
      // 文档不存在，下面创建
    }

    if (!updated) {
      // 首次：创建计数文档
      try {
        await db.collection(COLL).add({
          data: { _id: DOC_ID, count: 1, lastVisit: db.serverDate(), lastPlatform: platform }
        });
        return { code: 200, count: 1 };
      } catch (e) {
        // 并发创建冲突：再尝试递增
        try {
          await db
            .collection(COLL)
            .doc(DOC_ID)
            .update({ data: { count: _.inc(1), lastVisit: db.serverDate(), lastPlatform: platform } });
        } catch (e2) {}
      }
    }

    // 读取最新计数返回
    try {
      const doc = await db.collection(COLL).doc(DOC_ID).get();
      return { code: 200, count: doc.data.count || 0 };
    } catch (e) {
      return { code: 200, count: updated ? 0 : 1 };
    }
  } catch (e) {
    return { code: 500, msg: String(e), count: 0 };
  }
};
