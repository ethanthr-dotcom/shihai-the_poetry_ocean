// 数据取数封装：http 模式走 wx.request；cloudbase 模式走云函数 callFunction
const cfg = require("./config");

// 数据云函数路由：分块号 > CLOUDBASE_SPLIT 走第二个函数（绕开单函数 50MB 部署上限）
function fnForFile(file) {
  const m = /^(\d{3})\.json$/.exec(file);
  return m && parseInt(m[1], 10) > cfg.CLOUDBASE_SPLIT ? cfg.CLOUDBASE_FN2 : cfg.CLOUDBASE_FN;
}

// 云函数取数：数据 JSON（gzip）打包在云函数目录内，按文件名读取返回
function fetchCloudJson(relPath) {
  const file = relPath.replace(/^data\//, "");
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: fnForFile(file),
      data: { file },
      success: (res) => {
        const r = (res && res.result) || {};
        if (r.code === 200) resolve(r.data);
        else reject(new Error("云函数返回错误：" + (r.code || "unknown")));
      },
      fail: (err) => reject(new Error((err && err.errMsg) || "云函数调用失败"))
    });
  });
}

function fetchJson(url) {
  // 云开发模式：把完整 URL 还原为相对路径（如 data/index.json），按分块号路由云函数
  if (cfg.DATA_MODE === "cloudbase") {
    const rel = url.indexOf(cfg.DATA_BASE) === 0 ? url.slice(cfg.DATA_BASE.length) : url;
    return fetchCloudJson(rel);
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: "GET",
      dataType: "json",
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error("请求失败 (HTTP " + res.statusCode + ")"));
        }
      },
      fail: (err) => reject(new Error((err && err.errMsg) || "网络错误"))
    });
  });
}

module.exports = { fetchJson };
