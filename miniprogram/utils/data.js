// 数据层：与网页版 index.html 同构的两级索引 + 按需取块逻辑
const cfg = require("./config");
const { fetchJson } = require("./request");

let INDEX = null;
let FULL_INDEX = null;
const chunkCache = new Map();

function readCache(key) {
  try {
    const raw = wx.getStorageSync(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts < cfg.CACHE_TTL) return obj.data;
  } catch (e) {}
  return null;
}

function writeCache(key, data) {
  try {
    wx.setStorageSync(key, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) {}
}

// 精简索引（file/count/dynasties），首屏必需
async function loadIndex() {
  if (INDEX) return INDEX;
  const cached = readCache(cfg.INDEX_CACHE_KEY);
  if (cached) {
    INDEX = cached;
    return INDEX;
  }
  INDEX = await fetchJson(cfg.DATA_BASE + "data/index.json");
  writeCache(cfg.INDEX_CACHE_KEY, INDEX);
  return INDEX;
}

// 筛选索引（额外含 authors/types），仅使用作者/体裁筛选时懒加载
async function ensureFullIndex() {
  if (FULL_INDEX) return FULL_INDEX;
  const cached = readCache(cfg.FULL_CACHE_KEY);
  if (cached) {
    FULL_INDEX = cached;
    return FULL_INDEX;
  }
  try {
    FULL_INDEX = await fetchJson(cfg.DATA_BASE + "data/index-full.json");
    writeCache(cfg.FULL_CACHE_KEY, FULL_INDEX);
  } catch (e) {}
  return FULL_INDEX;
}

// 按需加载单个分块（内存缓存，限制数量防膨胀）
async function loadChunk(file) {
  if (chunkCache.has(file)) return chunkCache.get(file);
  const poems = await fetchJson(cfg.DATA_BASE + "data/" + file);
  chunkCache.set(file, poems);
  if (chunkCache.size > 12) {
    chunkCache.delete(chunkCache.keys().next().value);
  }
  return poems;
}

function chunkHasDynasty(c, dynasty) {
  if (Array.isArray(c.dynasties)) return c.dynasties.includes(dynasty);
  return c.dynasty === dynasty;
}

// 索引层筛选候选块
function filterChunks(author, dynasty, type) {
  const source = (author || type) && FULL_INDEX ? FULL_INDEX : INDEX;
  if (!source) return [];
  let chunks = source.chunks;
  if (dynasty) chunks = chunks.filter((c) => chunkHasDynasty(c, dynasty));
  if (author) {
    chunks = chunks.filter(
      (c) => Array.isArray(c.authors) && c.authors.some((a) => a.trim() === author)
    );
  }
  if (type) {
    chunks = chunks.filter(
      (c) => Array.isArray(c.types) && c.types.some((t) => t.trim() === type)
    );
  }
  return chunks;
}

// 块内逐首精确匹配
function matchPoem(poem, author, dynasty, type) {
  if (author && (poem.a || "").trim() !== author) return false;
  if (dynasty && (poem.d || "").trim() !== dynasty) return false;
  if (type && (poem.y || "").trim() !== type) return false;
  return true;
}

function weightedRandom(items) {
  const total = items.reduce((s, c) => s + c.count, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.count;
    if (r < 0) return item;
  }
  return items[items.length - 1];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 随机抽取一首：加权选块 → 块内随机；maxLen>0 时只取内容不超过 maxLen 字的诗（尝试块数放宽到 24）
async function findRandomPoem(author, dynasty, type, maxLen) {
  const index = await loadIndex();
  if (!index) throw new Error("索引加载失败");

  if ((author || type) && !FULL_INDEX) {
    await ensureFullIndex();
    if (!FULL_INDEX) throw new Error("筛选数据加载失败，请检查网络后重试");
  }

  const candidates = filterChunks(author, dynasty, type);
  if (!candidates.length) throw new Error("未找到匹配条件的诗");

  const first = weightedRandom(candidates);
  const rest = shuffle(candidates.filter((c) => c.file !== first.file));
  const order = [first].concat(rest);
  const maxTries = Math.min(order.length, maxLen ? 24 : 8);

  for (let i = 0; i < maxTries; i++) {
    const poems = await loadChunk(order[i].file);
    let matched = poems.filter((p) => matchPoem(p, author, dynasty, type));
    // 竖排模式：内容超过 maxLen 字的不推荐，换一首短的
    if (maxLen) matched = matched.filter((p) => Array.from(p.c || "").length <= maxLen);
    if (matched.length) {
      return matched[Math.floor(Math.random() * matched.length)];
    }
  }
  throw new Error("未找到匹配条件的诗");
}

module.exports = {
  loadIndex,
  ensureFullIndex,
  loadChunk,
  filterChunks,
  matchPoem,
  findRandomPoem
};
