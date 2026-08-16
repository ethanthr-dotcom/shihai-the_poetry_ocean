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
  // 过滤标题/作者含缺字符（□/替换符）的残损条目，避免显示为方块
  if (/[\u25a1\ufffd]/.test((poem.t || "") + (poem.a || ""))) return false;
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

// 分享深链：按 标题/作者/朝代 定位唯一一首诗
// 先用作者+朝代收窄候选分块，再块内按 标题前缀 + 作者/朝代精确 匹配
async function findPoemByMeta(title, author, dynasty) {
  if (!title) return null;
  const index = await loadIndex();
  if (!index) return null;
  if (author && !FULL_INDEX) await ensureFullIndex();
  const chunks = filterChunks(author || null, dynasty || null, null).slice(0, 30);
  for (const c of chunks) {
    let poems = [];
    try { poems = await loadChunk(c.file); } catch (e) { continue; }
    const hit = (poems || []).find((p) =>
      (!author || (p.a || "").trim() === author) &&
      (!dynasty || (p.d || "").trim() === dynasty) &&
      ((p.t || "") === title || (p.t || "").indexOf(title) === 0)
    );
    if (hit) return hit;
  }
  return null;
}

// 今日之诗：按日期确定性挑选，所有人当天读到同一首
async function findDailyPoem() {
  const idx = await loadIndex();
  const d = new Date();
  let seed = ((d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) >>> 0);
  seed = (seed * 2654435761) >>> 0;
  const chunks = idx.chunks;
  for (let i = 0; i < 6; i++) {
    const chunk = chunks[(seed + i * 7919) % chunks.length];
    let poems;
    try { poems = await loadChunk(chunk.file); } catch (e) { continue; }
    if (!poems || !poems.length) continue;
    for (let j = 0; j < 8; j++) {
      const p = poems[(((seed >> 3) + i * 31 + j * 97) % poems.length + poems.length) % poems.length];
      if (!/[\u25a1\ufffd]/.test((p.t || "") + (p.a || "") + (p.c || ""))) return p;
    }
  }
  throw new Error("今日之诗读取失败");
}

// 收集全部体裁（按出现的分块数降序，过滤乱码条目），体裁选择器用；带缓存
let TYPES_LIST = null;
function collectTypes() {
  if (TYPES_LIST) return TYPES_LIST;
  if (!FULL_INDEX) return [];
  const counts = new Map();
  FULL_INDEX.chunks.forEach((c) =>
    (c.types || []).forEach((t) => {
      if (!t || t.charAt(0) === "□" || t.indexOf("“") >= 0) return;
      counts.set(t, (counts.get(t) || 0) + 1);
    })
  );
  TYPES_LIST = Array.from(counts.entries())
    .sort((x, y) => y[1] - x[1])
    .map((x) => x[0]);
  return TYPES_LIST;
}

// 开发者调试：内存分块缓存统计
function cacheStats() {
  return { count: chunkCache.size, chunks: Array.from(chunkCache.keys()) };
}

module.exports = {
  loadIndex,
  ensureFullIndex,
  loadChunk,
  filterChunks,
  matchPoem,
  findRandomPoem,
  findPoemByMeta,
  findDailyPoem,
  collectTypes,
  cacheStats
};
