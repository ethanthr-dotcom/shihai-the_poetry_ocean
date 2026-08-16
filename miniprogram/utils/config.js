// 数据源配置：与网页版共享同一套 data/ 数据
// DATA_MODE:
//   "http"      —— HTTP 地址取数（默认 jsDelivr；开发调试可把 USE_LOCAL 改为 true
//                  走本机 http://127.0.0.1:8765，需在开发者工具勾选"不校验合法域名"）
//   "cloudbase" —— 微信云开发·云函数取数（上架推荐：免服务器域名白名单、免备案）。
//                  数据 JSON(gzip) 打包在 cloudfunctions/poemData[2]/data/ 内，
//                  在开发者工具中分别右键两个云函数「上传并部署：所有文件」
const DATA_MODE = "cloudbase";
const USE_LOCAL = false;

const DATA_BASE = USE_LOCAL
  ? "http://127.0.0.1:8765/"
  : "https://cdn.jsdelivr.net/gh/ethanthr-dotcom/shihai-the_poetry_ocean@main/";

// 云开发模式专用：
// CLOUDBASE_ENV —— 云开发环境 ID（云开发控制台 → 设置 → 环境ID）
// CLOUDBASE_FN / CLOUDBASE_FN2 —— 数据云函数（因单函数部署包有 50MB 上限，
//   数据拆两处：poemData 存索引+分块 001-140，poemData2 存分块 141-345）
const CLOUDBASE_ENV = "cloud1-d2gtpvp0j78a22e70";
const CLOUDBASE_FN = "poemData";
const CLOUDBASE_FN2 = "poemData2";
const CLOUDBASE_SPLIT = 140;

module.exports = {
  DATA_MODE,
  DATA_BASE,
  CLOUDBASE_ENV,
  CLOUDBASE_FN,
  CLOUDBASE_FN2,
  CLOUDBASE_SPLIT,
  INDEX_CACHE_KEY: "shihai-index-v1",
  FULL_CACHE_KEY: "shihai-index-full-v1",
  SEARCH_CACHE_KEY: "shihai-search-index-v1",
  CACHE_TTL: 24 * 3600 * 1000 // 索引缓存 24 小时
};
