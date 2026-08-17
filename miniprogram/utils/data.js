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

// 搜索摘要索引：每块标题字符集，标题模糊检索先收窄数据块
// v2 格式：含 globalChars（移除高频字符后的索引字符集），cs 只含 globalChars 内的字符
let SEARCH_IDX = null;
let _digestMap = null;       // 缓存 file -> Set<char>，避免每次搜索重建
let _digestGlobalSet = null; // 全局被索引字符集（v2），用于过滤 kw
let _digestVer = 0;          // 版本号：每次 SEARCH_IDX 更新时自增，避免对象引用比较失效
let _digestBuiltVer = -1;    // _digestMap 构建时的 _digestVer，不等则重建
async function ensureSearchIndex() {
  if (SEARCH_IDX) return SEARCH_IDX;
  const cached = readCache(cfg.SEARCH_CACHE_KEY);
  if (cached) { SEARCH_IDX = cached; _digestVer++; return SEARCH_IDX; }
  try {
    SEARCH_IDX = await fetchJson(cfg.DATA_BASE + "data/search-index.json");
    writeCache(cfg.SEARCH_CACHE_KEY, SEARCH_IDX);
    _digestVer++;
  } catch (e) {}
  return SEARCH_IDX;
}
function narrowByDigest(candidates, kw) {
  if (!SEARCH_IDX || !Array.isArray(SEARCH_IDX.chunks) || !kw || kw.length < 2) return candidates;
  // 首次或索引变更时构建 file -> Set<char> 映射（Set 的 has 是 O(1)，远快于字符串 indexOf）
  // 用版本号比较：缓存反序列化后对象引用会变，版本号稳定避免重复重建
  if (!_digestMap || _digestVer !== _digestBuiltVer) {
    _digestMap = new Map();
    SEARCH_IDX.chunks.forEach((c) => _digestMap.set(c.f, new Set(c.cs)));
    // v2：构建全局索引字符集；v1（无 globalChars）则视为全部字符都索引
    _digestGlobalSet = SEARCH_IDX.globalChars ? new Set(SEARCH_IDX.globalChars) : null;
    _digestBuiltVer = _digestVer;
  }
  // v2：kw 中只保留被索引的字符（高频字符已移除，无区分度，跳过）
  const uniq = [...new Set(kw)].filter((ch) => !_digestGlobalSet || _digestGlobalSet.has(ch));
  if (!uniq.length) return candidates; // kw 中无被索引字符，无法收窄
  return candidates.filter((c) => {
    const set = _digestMap.get(c.file);
    if (!set) return true;
    for (let i = 0; i < uniq.length; i++) if (!set.has(uniq[i])) return false;
    return true;
  });
}

// 按需加载单个分块（内存 LRU 缓存，限制数量防膨胀）
let _chunkHits = 0, _chunkMisses = 0;
const _prefetchInflight = new Map(); // 预取去重：避免重复预取同一块
async function loadChunk(file) {
  if (chunkCache.has(file)) {
    _chunkHits++;
    // LRU 刷新：删除再插入，让其成为最近使用
    const v = chunkCache.get(file);
    chunkCache.delete(file);
    chunkCache.set(file, v);
    return v;
  }
  _chunkMisses++;
  // 网络失败自动重试（共 3 次，间隔递增）
  let poems = null, err = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { poems = await fetchJson(cfg.DATA_BASE + "data/" + file); err = null; break; } catch (e) { err = e; }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  if (err) throw err;
  chunkCache.set(file, poems);
  if (chunkCache.size > 20) {
    chunkCache.delete(chunkCache.keys().next().value);
  }
  return poems;
}
// 预取下一块（不阻塞当前流程，失败静默；用于翻页时提前预热下一块）
function prefetchChunk(file) {
  if (!file || chunkCache.has(file) || _prefetchInflight.has(file)) return;
  const p = loadChunk(file).then(() => { _prefetchInflight.delete(file); }).catch(() => { _prefetchInflight.delete(file); });
  _prefetchInflight.set(file, p);
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
      (c) => Array.isArray(c.types) && c.types.some((t) => (Array.isArray(type) ? type.indexOf(t.trim()) >= 0 : t.trim() === type))
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
// 统一搜索：作者 / 朝代精确匹配，标题模糊（包含）匹配
function matchKw(p, kw, type, mode) {
  if (/[\u25a1\ufffd]/.test((p.t ?? "") + (p.a ?? ""))) return false;
  if (type && (Array.isArray(type) ? type.indexOf((p.y ?? "").trim()) < 0 : (p.y ?? "").trim() !== type)) return false;
  if (!kw) return true;
  if (mode === "author") return (p.a ?? "").trim() === kw;
  if (mode === "dynasty") return (p.d ?? "").trim() === kw;
  if (mode === "title") return (p.t ?? "").indexOf(kw) >= 0;
  return (p.a ?? "").trim() === kw || (p.d ?? "").trim() === kw || (p.t ?? "").indexOf(kw) >= 0;
}
// 分块优先级：全索引中已知作者 > 含该朝代的分块，加快命中
// 预构建 file -> Set<author> 缓存，避免每次都对 authors 数组做 .some(.trim()===kw)
let _authorSetMap = null;
let _authorSetVer = 0;
function _ensureAuthorSetMap() {
  if (_authorSetMap && _authorSetVer === FULL_INDEX) return;
  if (!FULL_INDEX || !Array.isArray(FULL_INDEX.chunks)) { _authorSetMap = null; return; }
  _authorSetMap = new Map();
  FULL_INDEX.chunks.forEach((c) => {
    if (!Array.isArray(c.authors)) return;
    const s = new Set();
    for (let i = 0; i < c.authors.length; i++) { const a = (c.authors[i] || "").trim(); if (a) s.add(a); }
    _authorSetMap.set(c.file, s);
  });
  _authorSetVer = FULL_INDEX;
}
function chunkKwScore(c, kw, mode) {
  let s = 0;
  if (FULL_INDEX) {
    _ensureAuthorSetMap();
    const set = _authorSetMap && _authorSetMap.get(c.file);
    if (set && set.has(kw)) s += 2;
  }
  if (chunkHasDynasty(c, kw)) s += (mode === "dynasty" ? 2 : 1);
  return s;
}
function sortChunksByKw(list, kw, mode) {
  return list.slice().sort((a, b) => chunkKwScore(b, kw, mode) - chunkKwScore(a, kw, mode));
}
// 判断某分块是否含指定作者（用预构建 Set，O(1) 查找）
function chunkHasAuthor(file, kw) {
  if (!FULL_INDEX) return false;
  _ensureAuthorSetMap();
  const set = _authorSetMap && _authorSetMap.get(file);
  return !!(set && set.has(kw));
}

// 统一搜索版随机抽诗：关键词（作者/朝代精确 + 标题模糊）+ 体裁
async function findRandomPoemByKw(kw, type, maxLen, mode) {
  const index = await loadIndex();
  if (!index) throw new Error("索引加载失败");

  if ((kw || type) && !FULL_INDEX) {
    await ensureFullIndex();
    if (!FULL_INDEX) throw new Error("筛选数据加载失败，请检查网络后重试");
  }

  // 优先用全索引分块（含 authors），作者/朝代收窄才能生效
  let candidates = type ? filterChunks("", "", type) : (FULL_INDEX && FULL_INDEX.chunks ? FULL_INDEX.chunks.slice() : index.chunks.slice());
  if (kw) {
    candidates = sortChunksByKw(candidates, kw, mode);
    if (mode === "author" || mode === "dynasty") candidates = candidates.filter((c) => chunkKwScore(c, kw, mode) > 0);
    if (mode === "title") { await ensureSearchIndex(); candidates = narrowByDigest(candidates, kw); }
  }
  if (!candidates.length) throw new Error("未找到匹配条件的诗");

  const kwHit = kw ? candidates.filter((c) => chunkKwScore(c, kw, mode) > 0) : [];
  const first = kw && kwHit.length ? kwHit[Math.floor(Math.random() * kwHit.length)] : weightedRandom(candidates);
  const rest = shuffle(candidates.filter((c) => c.file !== first.file));
  const order = [first].concat(rest);
  const maxTries = Math.min(order.length, kw ? 48 : maxLen ? 24 : 8);

  for (let i = 0; i < maxTries; i++) {
    const poems = await loadChunk(order[i].file);
    let matched = poems.filter((p) => matchKw(p, kw, type, mode));
    // 竖排模式：内容超过 maxLen 字的不推荐，换一首短的
    if (maxLen) matched = matched.filter((p) => Array.from(p.c || "").length <= maxLen);
    if (matched.length) {
      return matched[Math.floor(Math.random() * matched.length)];
    }
  }
  throw new Error("未找到匹配条件的诗");
}

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

// 开发者调试：内存分块缓存统计（含命中率）
function cacheStats() {
  const total = _chunkHits + _chunkMisses;
  return {
    count: chunkCache.size,
    chunks: Array.from(chunkCache.keys()),
    hits: _chunkHits,
    misses: _chunkMisses,
    hitRate: total ? Math.round((_chunkHits / total) * 100) + "%" : "—"
  };
}

function getFullChunks() { return FULL_INDEX && Array.isArray(FULL_INDEX.chunks) ? FULL_INDEX.chunks : null; }

// ====== 意象索引：独立于原始数据库，记录每块包含的意象词 ======
let IMAGERY_IDX = null;
let _imageryMap = null;   // 缓存 file -> Set<image>，O(1) 查找
let _imageryVer = 0;
async function ensureImageryIndex() {
  if (IMAGERY_IDX) return IMAGERY_IDX;
  const cached = readCache("shihai-imagery-index-v1");
  if (cached) { IMAGERY_IDX = cached; _imageryVer++; return IMAGERY_IDX; }
  try {
    IMAGERY_IDX = await fetchJson(cfg.DATA_BASE + "data/imagery-index.json");
    writeCache("shihai-imagery-index-v1", IMAGERY_IDX);
    _imageryVer++;
  } catch (e) {}
  return IMAGERY_IDX;
}
// 按意象收窄候选分块：保留包含任一所选意象的分块
function filterByImagery(candidates, images) {
  if (!images || !images.length || !IMAGERY_IDX || !Array.isArray(IMAGERY_IDX.chunks)) return candidates;
  // 首次或索引变更时构建 file -> Set<image> 映射
  if (!_imageryMap || _imageryMap._ver !== _imageryVer) {
    _imageryMap = new Map();
    IMAGERY_IDX.chunks.forEach((c) => _imageryMap.set(c.f, new Set(c.images)));
    _imageryMap._ver = _imageryVer;
  }
  return candidates.filter((c) => {
    const set = _imageryMap.get(c.file);
    if (!set) return true; // 未知分块不过滤
    for (let i = 0; i < images.length; i++) if (set.has(images[i])) return true;
    return false;
  });
}
// 块内逐首匹配意象：诗词标题或正文包含任一所选意象词即命中
function matchImagery(poem, images) {
  if (!images || !images.length) return true;
  const text = (poem.t || "") + (poem.c || "");
  for (let i = 0; i < images.length; i++) if (text.indexOf(images[i]) >= 0) return true;
  return false;
}
// 提取一首诗的意象标签（用于展示）
function extractImageryTags(poem) {
  if (!IMAGERY_IDX || !IMAGERY_IDX.categories) return [];
  const text = (poem.t || "") + (poem.c || "");
  const tags = [];
  IMAGERY_IDX.categories.forEach((cat) => {
    (cat.items || []).forEach((img) => { if (text.indexOf(img) >= 0) tags.push(img); });
  });
  return tags;
}

module.exports = {
  loadIndex,
  ensureFullIndex,
  loadChunk,
  prefetchChunk,
  filterChunks,
  matchPoem,
  matchKw,
  chunkKwScore,
  chunkHasAuthor,
  sortChunksByKw,
  findRandomPoemByKw,
  findRandomPoem,
  findPoemByMeta,
  findDailyPoem,
  collectTypes,
  ensureSearchIndex,
  narrowByDigest,
  getFullChunks,
  cacheStats,
  ensureImageryIndex,
  filterByImagery,
  matchImagery,
  extractImageryTags
};
