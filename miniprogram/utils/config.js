// 数据源配置：与网页版共享同一套 data/ 数据
// 开发调试可把 USE_LOCAL 改为 true，走本机 http://127.0.0.1:8765
// （需在微信开发者工具勾选"不校验合法域名"）
const USE_LOCAL = false;

const DATA_BASE = USE_LOCAL
  ? "http://127.0.0.1:8765/"
  : "https://cdn.jsdelivr.net/gh/ethanthr-dotcom/shihai-the_poetry_ocean@main/";

module.exports = {
  DATA_BASE,
  INDEX_CACHE_KEY: "shihai-index-v1",
  FULL_CACHE_KEY: "shihai-index-full-v1",
  CACHE_TTL: 24 * 3600 * 1000 // 索引缓存 24 小时
};
