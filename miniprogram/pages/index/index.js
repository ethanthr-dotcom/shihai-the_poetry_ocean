// 诗海单页：行为与网页版 index.html 对齐（抽取→渲染→主题→分享图）
const cfg = require("../../utils/config");
const data = require("../../utils/data");
const verse = require("../../utils/verse");
const themes = require("../../utils/themes");
const { drawShare, drawNoteShare } = require("../../utils/share-canvas");

// ====== 收藏：仅存本机本地缓存（等同浏览器 cookie/storage），清缓存即丢失 ======
const FAV_KEY = "shihai-favs-v1";
const NOTE_KEY = "shihai-notes-v1";
const NOTE_ASK_KEY = "shihai-note-ask";
const NOTE_RATIO_KEY = "shihai-note-ratio";
function favId(p) {
  const s = (p.t || "") + "|" + (p.a || "") + "|" + (p.c || "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// 均分换行：先算需要几行，再按行均分字数，断点优先落在标点之后（±2 字内）
function splitTitleLines(chars, unitW, innerW) {
  const PUNCT = "，、。！？；： ";
  const n = chars.length;
  const count = Math.max(2, Math.ceil((n * unitW) / innerW));
  const lines = [];
  let start = 0;
  for (let i = 1; i < count; i++) {
    const ideal = Math.round((n * i) / count);
    let pos = -1;
    for (let d = 0; d <= 2 && pos < 0; d++) {
      for (const p of [ideal + d, ideal - d]) {
        if (p <= start || p >= n) continue;
        if (PUNCT.includes(chars[p - 1])) { pos = p; break; }
      }
    }
    if (pos < 0) pos = Math.min(Math.max(ideal, start + 1), n - 1);
    lines.push(chars.slice(start, pos).join(""));
    start = pos;
  }
  lines.push(chars.slice(start).join(""));
  return lines;
}

const RATIO_OPTIONS = [
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "9:16", label: "9:16" },
  { value: "auto", label: "自动" }
];

Page({
  data: {
    // 主题变量由 JS 计算后经 style 绑定注入（等价网页版 :root style）
    varsStyle: "",
    isVertical: false,
    themePanelOpen: false,
    colorOptions: themes.COLOR_OPTIONS.map((o) => ({ ...o, active: o.value === "warm" })),
    directionOptions: themes.DIRECTION_OPTIONS.map((o) => ({ ...o, active: o.value === "horizontal" })),

    author: "",
    dynasty: "",
    type: "",
    libTip: "收录 34 万余首古诗词",
    statusText: "正在加载诗词库……",
    statusError: false,
    hasPoem: false,
    poem: null,
    verseLines: [],
    titleStyle: "",
    titleLines: [],
    metaStyle: "",
    categoryStyle: "",
    randomLoading: false,
    shareLoading: false,
    shareSheetShow: false,
    devShow: false,
    devRows: [],
    shareImg: "",
    randomBtnLines: ["今日与诗相逢"],
    randomTip: "读到心动的一首，可在下方生成卡片保存或分享",
    typeOptions: [],
    typeQuery: "",
    typeOptionsShown: [],
    resultsList: [],
    resultsLoading: false,
    resultsDone: false,
    resultsCount: 0,
    listMode: false,
    selMode: false,
    selIds: {},
    selCount: 0,
    currentFav: false,
    typeDropdownShow: false,
    favSheetShow: false,
    favBurst: false,
    guideShow: false,
    favList: [],
    favSelMode: false,
    currentNote: false,
    noteSheetShow: false,
    noteListData: [],
    noteSelMode: false,
    noteSelIds: {},
    noteSelCount: 0,
    noteEditShow: false,
    noteEditTitle: "写批注",
    noteEditMeta: "",
    noteEditHas: false,
    noteText: "",
    noteRatio: "3:4",
    noteRatioIndex: 1,
    noteRatioOptions: [
      { value: "1:1", label: "1:1", active: false },
      { value: "3:4", label: "3:4", active: true },
      { value: "9:16", label: "9:16", active: false },
      { value: "auto", label: "自动", active: false }
    ],
    noteAskShow: false,
    noteAskRemember: false,
    favSelIds: {},
    favSelCount: 0,
    shareBtnLines: ["下载或分享卡片"],
    mottoChars: "掬古人之诗·养今时之心".split(""),
    ratioOptions: RATIO_OPTIONS.map((o) => ({ ...o, active: o.value === "1:1", disabled: false })),
    ratioActiveIndex: 0,
    shareRatio: "1:1",
    progressState: "", // "" | run | done
    splashShow: true,
    disclaimerShow: false,
    uiReady: false,
    gearSpin: false
  },

  currentPoem: null,
  currentTheme: null,
  prevHorzTheme: null,
  indexReady: false,

  onLoad() {
    this.currentTheme = themes.loadTheme();
    this.applyTheme();
    // 首次使用提示：确认过则照常开屏；首次只展示提示抽屉，同意后直进主页（不再播开屏动画）
    let agreed = "";
    try { agreed = wx.getStorageSync("shihai-disclaimer-v1"); } catch (e) {}
    if (!agreed) {
      this.setData({ disclaimerShow: true, splashShow: false, uiReady: true });
    } else {
      this.startSplash();
    }
    this.loadFavs();
    this.loadNotes();
    this.boot();
    this.fitBtnLabels();
  },

  onResize() {
    this.fitBtnLabels();
  },

  // 按钮标签自适应换行：太窄时拆行，硬性保证每行不少于两个字
  fitBtnLabels() {
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 375; // 32rpx 字号 → 16*scale px
    // 按钮内文字可用宽 = 屏宽 - 页面左右16px*2 - 控件区36rpx + btn-row外扩16rpx - 按钮自身左右padding 32rpx*2
    const avail = winW - 32 - 36 * scale + 16 * scale - 32 * scale;
    const fontPx = 16 * scale;
    this.setData({
      randomBtnLines: this._splitBtnLabel("今日与诗相逢", avail, fontPx),
      shareBtnLines: this._splitBtnLabel("下载或分享卡片", avail, fontPx)
    });
  },

  _splitBtnLabel(text, availW, fontPx) {
    if (text.length * fontPx <= availW) return [text];
    const n = text.length;
    for (let k = 2; k <= Math.floor(n / 2); k++) {
      const per = Math.ceil(n / k);
      if (per * fontPx <= availW) {
        const lines = [];
        for (let i = 0; i < n; i += per) lines.push(text.slice(i, i + per));
        return lines;
      }
    }
    return [text];
  },

  onDismissDisclaimer() {
    this.haptic();
    try { wx.setStorageSync("shihai-disclaimer-v1", "1"); } catch (e) {}
    clearTimeout(this.splashTimer);
    this.setData({ disclaimerShow: false, splashShow: false, uiReady: true });
  },

  // ====== 开屏动画（与网页版一致：3.2s 自动消失，点击可跳过） ======
  startSplash() {
    const hide = () => {
      if (!this.data.splashShow) return;
      this.setData({ splashShow: false, uiReady: true });
    };
    this.splashTimer = setTimeout(hide, 3200);
  },
  onTapSplash() {
    clearTimeout(this.splashTimer);
    this.setData({ splashShow: false, uiReady: true });
  },

  // ====== 顶部进度条 ======
  progressStart() {
    this.setData({ progressState: "" });
    setTimeout(() => this.setData({ progressState: "run" }), 30);
  },
  progressDone() {
    this.setData({ progressState: "done" });
    setTimeout(() => this.setData({ progressState: "" }), 800);
  },

  // ====== 启动：加载索引 → 自动抽一首（与网页版一致） ======
  async boot() {
    try {
      const index = await data.loadIndex();
      this.indexReady = true;
      const total = (index && index.total) || 0;
      if (total) {
        this.setData({
          libTip: "收录 " + Math.floor(total / 10000) + " 万余首古诗词"
        });
      }
      this.setData({
        statusText: "收录 " + total.toLocaleString("zh-CN") + " 首诗词，点击下方按钮随机抽取",
        statusError: false
      });
      await this.loadRandomPoem(false);
    } catch (err) {
      this.showStatus("诗词库加载失败：" + (err && err.message ? err.message : err), true);
    }
  },

  showStatus(message, isError) {
    if (isError) {
      this.setData({ statusText: message, statusError: true, hasPoem: false, poem: null, verseLines: [] });
      this.currentPoem = null;
    } else {
      this.setData({ statusText: message, statusError: false });
    }
  },

  onAuthorInput(e) { this.setData({ author: e.detail.value }); },
  onDynastyInput(e) { this.setData({ dynasty: e.detail.value }); },
  onTypeInput(e) { this.setData({ type: e.detail.value }); },

  onRandomTap() {
    this.haptic();
    const author = (this.data.author || "").trim();
    const dynasty = (this.data.dynasty || "").trim();
    const type = (this.data.type || "").trim();
    // 填了任一筛选条件 → 结果列表替换诗词卡片；未填 → 随机一首（恢复卡片）
    if (author || dynasty || type) { this.openResults(author, dynasty, type); return; }
    this.setData({ listMode: false });
    this.loadRandomPoem(true);
  },

  // ====== 体裁选择器（数据库全部体裁，按常见度排序，支持搜索） ======
  onTypeFieldTap() {
    this.haptic();
    if (this.data.typeDropdownShow) { this.setData({ typeDropdownShow: false }); return; }
    if (!this.indexReady) { this.showStatus("诗词库尚未加载完成，请稍候……"); return; }
    if (!this.data.typeOptions.length) {
      data.ensureFullIndex().then(() => {
        this.setData({ typeOptions: data.collectTypes() });
        this._applyTypeQuery();
      });
    }
    this.setData({ typeDropdownShow: true, typeQuery: "" });
    this._applyTypeQuery();
  },
  onTypeQuery(e) {
    this.setData({ typeQuery: e.detail.value });
    this._applyTypeQuery();
  },
  _applyTypeQuery() {
    const q = (this.data.typeQuery || "").trim();
    const list = this.data.typeOptions || [];
    // 首项固定「无」= 清除体裁条件
    this.setData({ typeOptionsShown: ["无"].concat((q ? list.filter((t) => t.indexOf(q) >= 0) : list).slice(0, 299)) });
  },
  onTypeOptTap(e) {
    const v = e.currentTarget.dataset.value;
    this.haptic();
    if (v === "无") { this.setData({ type: "", typeDropdownShow: false }); return; }
    this.setData({ type: v === this.data.type ? "" : v, typeDropdownShow: false });
  },

  // ====== 收藏（本地缓存） ======
  loadFavs() {
    let list = [];
    try { list = wx.getStorageSync(FAV_KEY) || []; } catch (e) {}
    this._favs = Array.isArray(list) ? list : [];
    this._favSet = new Set(this._favs.map((p) => p.id));
  },
  saveFavs() {
    try { wx.setStorageSync(FAV_KEY, this._favs); } catch (e) {}
  },
  addFavs(poems) {
    let added = 0;
    poems.forEach((p) => {
      const id = p.id || favId(p);
      if (this._favSet.has(id)) return;
      this._favSet.add(id);
      this._favs.unshift({ id, t: p.t || "", a: p.a || "", d: p.d || "", y: p.y || "", c: p.c || "" });
      added++;
    });
    if (added) this.saveFavs();
    return added;
  },
  removeFav(id) {
    this._favSet.delete(id);
    this._favs = this._favs.filter((p) => p.id !== id);
    this.saveFavs();
  },
  toggleFav(poem) {
    const id = poem.id || favId(poem);
    if (this._favSet.has(id)) {
      this.removeFav(id);
      wx.showToast({ title: "已取消收藏", icon: "none" });
      return false;
    }
    this.addFavs([{ ...poem, id }]);
    wx.showToast({ title: "已收藏", icon: "none" });
    return true;
  },
  // 收藏状态变化后同步列表中所有小爱心
  _syncResultsFav() {
    const updates = {};
    this.data.resultsList.forEach((it, i) => {
      const f = this._favSet.has(it.id);
      if (f !== it.fav) updates["resultsList[" + i + "].fav"] = f;
    });
    if (Object.keys(updates).length) this.setData(updates);
  },
  // ====== 批注：纸笔图标写感悟，存本机本地缓存；批注本支持批量管理；批注卡片（批注大、诗词小） ======
  loadNotes() {
    let list = [];
    try { list = wx.getStorageSync(NOTE_KEY) || []; } catch (e) {}
    this._notes = Array.isArray(list) ? list : [];
    this._noteMap = new Map(this._notes.map((n) => [n.id, n]));
    try { this._noteAskMode = wx.getStorageSync(NOTE_ASK_KEY) || ""; } catch (e) { this._noteAskMode = ""; }
    try { this._noteRatio = wx.getStorageSync(NOTE_RATIO_KEY) || "3:4"; } catch (e) { this._noteRatio = "3:4"; }
  },
  saveNotes() {
    try { wx.setStorageSync(NOTE_KEY, this._notes); } catch (e) {}
  },
  _noteDate(ts) {
    const dt = new Date(ts || Date.now());
    return dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
  },
  _syncResultsNote() {
    const updates = {};
    this.data.resultsList.forEach((it, i) => {
      const h = this._noteMap.has(it.id);
      if (h !== it.hasNote) updates["resultsList[" + i + "].hasNote"] = h;
    });
    if (Object.keys(updates).length) this.setData(updates);
  },
  openNoteEditor(poem) {
    this._noteEditPoem = poem;
    const id = poem.id || favId(poem);
    const ex = this._noteMap.get(id);
    const r = this._noteRatio;
    this.setData({
      noteEditShow: true,
      noteEditTitle: ex ? "编辑批注" : "写批注",
      noteEditMeta: "《" + (poem.t || "无题") + "》" + [poem.d, poem.a].filter(Boolean).join(" · "),
      noteEditHas: !!ex,
      noteText: ex ? ex.n : "",
      noteRatio: r,
      noteRatioIndex: RATIO_OPTIONS.findIndex((o) => o.value === r),
      noteRatioOptions: RATIO_OPTIONS.map((o) => ({ ...o, active: o.value === r })),
      themePanelOpen: false,
      typeDropdownShow: false
    });
  },
  onCardNoteTap() {
    if (!this.currentPoem) return;
    this.haptic();
    this.openNoteEditor(this.currentPoem);
  },
  onResultNoteTap(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    this.openNoteEditor(item);
  },
  onNoteInput(e) { this.setData({ noteText: e.detail.value }); },
  onNoteRatioTap(e) {
    this.haptic();
    const value = e.currentTarget.dataset.value;
    this._noteRatio = value;
    try { wx.setStorageSync(NOTE_RATIO_KEY, value); } catch (err) {}
    this.setData({
      noteRatio: value,
      noteRatioIndex: RATIO_OPTIONS.findIndex((o) => o.value === value),
      noteRatioOptions: this.data.noteRatioOptions.map((o) => ({ ...o, active: o.value === value }))
    });
  },
  onNoteEditClose() { this.setData({ noteEditShow: false }); },
  onNoteRemove() {
    const poem = this._noteEditPoem;
    if (!poem) return;
    this.haptic();
    const id = poem.id || favId(poem);
    this._notes = this._notes.filter((n) => n.id !== id);
    this._noteMap.delete(id);
    this.saveNotes();
    this.setData({ noteEditShow: false });
    if (this.currentPoem && (this.currentPoem.id || favId(this.currentPoem)) === id) this.setData({ currentNote: false });
    this._syncResultsNote();
    wx.showToast({ title: "批注已删除", icon: "none" });
  },
  onNoteSave() {
    const poem = this._noteEditPoem;
    if (!poem) return;
    const text = (this.data.noteText || "").trim();
    if (!text) { wx.showToast({ title: "批注内容不能为空", icon: "none" }); return; }
    this.haptic();
    const id = poem.id || favId(poem);
    const ex = this._noteMap.get(id);
    if (ex) { ex.n = text; ex.ts = Date.now(); }
    else {
      const rec = { id, t: poem.t || "", a: poem.a || "", d: poem.d || "", y: poem.y || "", c: poem.c || "", n: text, ts: Date.now() };
      this._notes.unshift(rec);
      this._noteMap.set(id, rec);
    }
    this.saveNotes();
    this.setData({ noteEditShow: false });
    if (this.currentPoem && (this.currentPoem.id || favId(this.currentPoem)) === id) this.setData({ currentNote: true });
    this._syncResultsNote();
    // 「不再询问」记忆：yes=保存后直接生成卡片，no=只保存
    if (this._noteAskMode === "yes") { this.generateNoteShare(id); return; }
    if (this._noteAskMode === "no") { wx.showToast({ title: "批注已保存", icon: "none" }); return; }
    this._noteAskId = id;
    this.setData({ noteAskShow: true, noteAskRemember: false });
  },
  onNoteAskRememberToggle() { this.setData({ noteAskRemember: !this.data.noteAskRemember }); },
  _noteAskFinish(action) {
    if (this.data.noteAskRemember) {
      this._noteAskMode = action;
      try { wx.setStorageSync(NOTE_ASK_KEY, action); } catch (e) {}
    }
    const id = this._noteAskId;
    this.setData({ noteAskShow: false });
    if (action === "yes") this.generateNoteShare(id);
  },
  onNoteAskYes() { this.haptic(); this._noteAskFinish("yes"); },
  onNoteAskNo() { this.haptic(); this._noteAskFinish("no"); },
  onNoteToggle() {
    this.haptic();
    if (this.data.noteSheetShow) { this.setData({ noteSheetShow: false }); return; }
    this.openNoteSheet();
  },
  openNoteSheet() {
    this.setData({
      noteSheetShow: true,
      noteListData: this._notes.map((n) => ({ ...n, date: this._noteDate(n.ts) })),
      noteSelMode: false, noteSelIds: {}, noteSelCount: 0,
      themePanelOpen: false, typeDropdownShow: false
    });
  },
  onNoteSheetClose() { this.setData({ noteSheetShow: false }); },
  onNoteItemTap(e) {
    if (this.data.noteSelMode) { this.onNoteSelToggle(e); return; }
    const idx = e.currentTarget.dataset.index;
    const rec = this._notes[idx];
    if (!rec) return;
    this.haptic();
    this.setData({ noteSheetShow: false });
    this.openNoteEditor(rec);
  },
  onNoteItemCard(e) {
    const idx = e.currentTarget.dataset.index;
    const rec = this._notes[idx];
    if (!rec) return;
    this.haptic();
    this.setData({ noteSheetShow: false });
    this.generateNoteShare(rec.id);
  },
  onNoteManage() {
    this.haptic();
    if (this.data.noteSelMode) { this.setData({ noteSelMode: false, noteSelIds: {}, noteSelCount: 0 }); return; }
    this.setData({ noteSelMode: true, noteSelIds: {}, noteSelCount: 0 });
  },
  onNoteSelToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.noteListData[idx];
    if (!item) return;
    this.haptic();
    const selIds = { ...this.data.noteSelIds };
    if (selIds[item.id]) delete selIds[item.id]; else selIds[item.id] = true;
    this.setData({ noteSelIds: selIds, noteSelCount: Object.keys(selIds).length });
  },
  onNoteSelAll() {
    this.haptic();
    const selIds = {};
    if (!(this.data.noteSelCount >= this.data.noteListData.length && this.data.noteListData.length)) {
      this.data.noteListData.forEach((n) => { selIds[n.id] = true; });
    }
    this.setData({ noteSelIds: selIds, noteSelCount: Object.keys(selIds).length });
  },
  onNoteDelete() {
    const ids = this.data.noteSelIds;
    const targets = this._notes.filter((n) => ids[n.id]);
    if (!targets.length) return;
    wx.showModal({
      title: "删除批注",
      content: "确定删除选中的 " + targets.length + " 条批注？",
      success: (r) => {
        if (!r.confirm) return;
        targets.forEach((n) => this._noteMap.delete(n.id));
        this._notes = this._notes.filter((n) => !ids[n.id]);
        this.saveNotes();
        this._syncResultsNote();
        if (this.currentPoem && !this._noteMap.has(this.currentPoem.id || favId(this.currentPoem))) this.setData({ currentNote: false });
        this.openNoteSheet();
        wx.showToast({ title: "已删除", icon: "none" });
      }
    });
  },
  // 批注卡片生成：复用分享画布与预览/保存浮层
  async generateNoteShare(id) {
    const note = this._noteMap.get(id);
    if (!note) return;
    if (this.data.shareLoading) return;
    this.setData({ shareLoading: true });
    try {
      const t = this.currentTheme;
      const colors = themes.THEMES.color[t.color].vars;
      let rect = this._cardRect;
      if (!rect) {
        rect = await new Promise((resolve) => {
          wx.createSelectorQuery().select(".card-body").boundingClientRect().exec((r) => resolve(r && r[0]));
        });
      }
      const filePath = await new Promise((resolve, reject) => {
        wx.createSelectorQuery()
          .select("#shareCanvas")
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res || !res[0] || !res[0].node) return reject(new Error("画布初始化失败"));
            const canvas = res[0].node;
            const ctx = canvas.getContext("2d");
            try {
              await drawNoteShare({
                canvas, ctx, note,
                ratio: this._noteRatio,
                cardW: rect ? rect.width : 300,
                cardH: rect ? rect.height : 300,
                colors: {
                  bg: colors["--bg-color"], text: colors["--text-color"],
                  meta: colors["--meta-color"], accent: colors["--accent-color"],
                  category: colors["--category-color"], seal: colors["--seal-color"]
                },
                logoPath: "/assets/logo-yin.png"
              });
            } catch (e) {
              return reject(e);
            }
            const out = wx.env.USER_DATA_PATH + "/shihai_note_" + String(this._noteRatio).replace(":", "x") + "_" + Date.now() + ".png";
            wx.canvasToTempFilePath({
              canvas,
              fileType: "png",
              destWidth: canvas.width,
              destHeight: canvas.height,
              filePath: out,
              success: (r) => resolve(r.tempFilePath),
              fail: (e) => reject(new Error("导出图片失败：" + (e.errMsg || "")))
            });
          });
      });
      this._sharePath = filePath;
      this.setData({ shareImg: filePath, shareSheetShow: true });
    } catch (e) {
      this.showStatus("生成批注卡片失败：" + (e && e.message ? e.message : e), true);
    } finally {
      this.setData({ shareLoading: false });
    }
  },

  onCardFavTap() {
    if (!this.currentPoem) return;
    this.haptic();
    const fav = this.toggleFav(this.currentPoem);
    this.setData({ currentFav: fav });
    if (fav) {
      this.setData({ favBurst: true });
      clearTimeout(this._burstT);
      this._burstT = setTimeout(() => this.setData({ favBurst: false }), 650);
    }
  },
  onResultFavTap(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    const fav = this.toggleFav(item);
    this.setData({ ["resultsList[" + idx + "].fav"]: fav });
    if (fav) {
      this.setData({ ["resultsList[" + idx + "].burst"]: true });
      clearTimeout(this._burstT2);
      this._burstT2 = setTimeout(() => this.setData({ ["resultsList[" + idx + "].burst"]: false }), 650);
    }
    if (this.currentPoem && this.currentPoem.id === item.id) this.setData({ currentFav: fav });
  },
  onGuideOpen() {
    this.haptic();
    this.setData({ guideShow: true });
  },
  onGuideClose() {
    this.setData({ guideShow: false });
  },

  // ====== 收藏夹面板（设置图标旁入口；批量管理/删除） ======
  onFavToggle() {
    this.haptic();
    if (this.data.favSheetShow) { this.setData({ favSheetShow: false }); return; }
    this.openFavSheet();
  },
  openFavSheet() {
    this.setData({
      favSheetShow: true,
      favList: this._favs.map((p) => ({ ...p })),
      favSelMode: false, favSelIds: {}, favSelCount: 0,
      themePanelOpen: false, typeDropdownShow: false
    });
  },
  onFavSheetClose() { this.setData({ favSheetShow: false }); },
  onFavItemTap(e) {
    if (this.data.favSelMode) { this.onFavSelToggle(e); return; }
    const idx = e.currentTarget.dataset.index;
    const poem = this._favs[idx];
    if (!poem) return;
    this.haptic();
    this.setData({ favSheetShow: false, listMode: false });
    poem.id = poem.id || favId(poem);
    this.renderPoem(poem);
    setTimeout(() => wx.pageScrollTo({ selector: ".card", duration: 300 }), 80);
  },
  onFavManage() {
    this.haptic();
    if (this.data.favSelMode) { this.setData({ favSelMode: false, favSelIds: {}, favSelCount: 0 }); return; }
    this.setData({ favSelMode: true, favSelIds: {}, favSelCount: 0 });
  },
  onFavSelToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.favList[idx];
    if (!item) return;
    this.haptic();
    const selIds = { ...this.data.favSelIds };
    if (selIds[item.id]) delete selIds[item.id]; else selIds[item.id] = true;
    this.setData({ favSelIds: selIds, favSelCount: Object.keys(selIds).length });
  },
  onFavSelAll() {
    this.haptic();
    const selIds = {};
    if (!(this.data.favSelCount >= this.data.favList.length && this.data.favList.length)) {
      this.data.favList.forEach((p) => { selIds[p.id] = true; });
    }
    this.setData({ favSelIds: selIds, favSelCount: Object.keys(selIds).length });
  },
  onFavDelete() {
    const ids = this.data.favSelIds;
    const targets = this._favs.filter((p) => ids[p.id]);
    if (!targets.length) return;
    wx.showModal({
      title: "删除收藏",
      content: "确定删除选中的 " + targets.length + " 首收藏诗词？",
      success: (r) => {
        if (!r.confirm) return;
        targets.forEach((p) => this.removeFav(p.id));
        this._syncResultsFav();
        if (this.currentPoem && !this._favSet.has(favId(this.currentPoem))) this.setData({ currentFav: false });
        this.setData({
          favList: this._favs.map((p) => ({ ...p })),
          favSelIds: {}, favSelCount: 0
        });
        wx.showToast({ title: "已删除", icon: "success" });
      }
    });
  },

  // ====== 搜索结果列表：就地替换诗词卡片；无限分页（页面触底）；手风琴；批量收藏 ======
  async openResults(author, dynasty, type) {
    if (!this.indexReady) { this.showStatus("诗词库尚未加载完成，请稍候……"); return; }
    if (author || type) {
      const full = await data.ensureFullIndex();
      if (!full) { this.showStatus("筛选数据加载失败，请检查网络后重试", true); return; }
    }
    const candidates = data.filterChunks(author, dynasty, type);
    if (!candidates.length) { this.showStatus("未找到匹配条件的诗词", true); return; }
    this._resultChunks = candidates;
    this._resultCursor = 0;
    this._resultFilter = { author, dynasty, type };
    this._resultsBusy = false;
    this._openIdx = null;
    this.setData({
      listMode: true, resultsList: [], resultsDone: false, resultsCount: 0,
      selMode: false, selIds: {}, selCount: 0
    });
    setTimeout(() => wx.pageScrollTo({ selector: ".results-panel", duration: 300 }), 80);
    this.loadMoreResults();
  },
  async loadMoreResults() {
    if (this._resultsBusy || this.data.resultsDone || !this.data.listMode) return;
    this._resultsBusy = true;
    this.setData({ resultsLoading: true });
    const { author, dynasty, type } = this._resultFilter;
    let added = 0;
    try {
      while (added < 30 && this._resultCursor < this._resultChunks.length) {
        const chunk = this._resultChunks[this._resultCursor++];
        const poems = await data.loadChunk(chunk.file);
        const matched = poems.filter((p) => data.matchPoem(p, author, dynasty, type));
        if (matched.length) {
          const items = matched.map((p) => {
            const id = favId(p);
            return { id, t: p.t, a: p.a, d: p.d, y: p.y, c: p.c, open: false, fav: this._favSet.has(id), hasNote: !!(this._noteMap && this._noteMap.has(id)) };
          });
          this.setData({ resultsList: this.data.resultsList.concat(items) });
          added += items.length;
        }
      }
      this.setData({
        resultsDone: this._resultCursor >= this._resultChunks.length,
        resultsCount: this.data.resultsList.length
      });
    } catch (err) {
      this.showStatus("读取失败：" + (err && err.message ? err.message : err), true);
    } finally {
      this._resultsBusy = false;
      this.setData({ resultsLoading: false });
    }
  },
  // 页面触底自动加载下一页
  onReachBottom() {
    if (this.data.listMode && !this.data.resultsDone && !this.data.resultsLoading) this.loadMoreResults();
  },
  onResultItemTap(e) {
    const idx = e.currentTarget.dataset.index;
    // 多选模式下点整行 = 勾选/取消
    if (this.data.selMode) { this.onSelToggle(e); return; }
    this.haptic();
    const list = this.data.resultsList;
    const updates = {};
    // 手风琴：同一时间只展开一首
    if (this._openIdx != null && this._openIdx !== idx && list[this._openIdx] && list[this._openIdx].open) {
      updates["resultsList[" + this._openIdx + "].open"] = false;
    }
    const willOpen = !list[idx].open;
    updates["resultsList[" + idx + "].open"] = willOpen;
    this._openIdx = willOpen ? idx : null;
    this.setData(updates);
  },
  onResultShareTap(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    this.setData({ listMode: false });
    this.currentPoem = item;
    this.renderPoem(item);
    this._cardRect = null; // 让分享流程重新测量卡片尺寸
    setTimeout(() => this.onShareTap(), 350);
  },
  onListModeExit() {
    this.haptic();
    this.setData({ listMode: false });
  },
  // 多选（批量收藏）
  onSelModeEnter() {
    this.haptic();
    this.setData({ selMode: true, selIds: {}, selCount: 0 });
  },
  onSelModeExit() {
    this.haptic();
    this.setData({ selMode: false, selIds: {}, selCount: 0 });
  },
  onSelToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    const selIds = { ...this.data.selIds };
    if (selIds[item.id]) delete selIds[item.id]; else selIds[item.id] = true;
    this.setData({ selIds, selCount: Object.keys(selIds).length });
  },
  onSelAll() {
    this.haptic();
    const selIds = {};
    if (!(this.data.selCount >= this.data.resultsList.length && this.data.resultsList.length)) {
      this.data.resultsList.forEach((it) => { selIds[it.id] = true; });
    }
    this.setData({ selIds, selCount: Object.keys(selIds).length });
  },
  onSelFav() {
    const ids = this.data.selIds;
    const poems = this.data.resultsList.filter((it) => ids[it.id]);
    if (!poems.length) return;
    this.haptic();
    const added = this.addFavs(poems);
    this._syncResultsFav();
    wx.showToast({ title: added ? "已收藏 " + added + " 首" : "均已在收藏夹中", icon: "none" });
    this.setData({ selMode: false, selIds: {}, selCount: 0 });
  },

  // ====== 随机抽取（与网页版 loadRandomPoem 一致） ======
  async loadRandomPoem(userAction) {
    if (this.data.randomLoading) return;
    this.setData({ randomLoading: true });
    this.progressStart();
    const author = (this.data.author || "").trim();
    const dynasty = (this.data.dynasty || "").trim();
    const type = (this.data.type || "").trim();
    try {
      if (!this.indexReady) {
        this.showStatus("诗词库尚未加载完成，请稍候……");
        return;
      }
      // 竖排显示模式：不推荐内容超过 56 字的诗词
      const maxLen = this.currentTheme.direction === "vertical" ? 56 : 0;
      const poem = await data.findRandomPoem(author, dynasty, type, maxLen);
      this.renderPoem(poem);
      if (userAction) {
        wx.pageScrollTo({ selector: ".card", duration: 300 });
      }
    } catch (err) {
      this.showStatus("读取失败：" + (err && err.message ? err.message : err), true);
    } finally {
      this.setData({ randomLoading: false });
      this.progressDone();
    }
  },

  // ====== 渲染诗词（对齐网页版 renderPoem + fitCardText） ======
  _metaText(poem) {
    return [poem.d, poem.a].filter(Boolean).join(" · ");
  },

  renderPoem(poem) {
    this.currentPoem = poem;
    const meta = this._metaText(poem);
    const tt = this._buildTitle(poem.t || "无题");
    this.setData({
      hasPoem: true,
      currentFav: !!(this._favSet && this._favSet.has(favId(poem))),
      currentNote: !!(this._noteMap && this._noteMap.has(favId(poem))),
      statusText: "",
      statusError: false,
      poem: { t: poem.t || "无题", meta, type: poem.y || "" },
      titleLines: tt.lines,
      titleStyle: tt.style,
      metaStyle: this._fitInlineStyle(meta, "--meta-font-size"),
      categoryStyle: this._fitInlineStyle(poem.y ? "体裁：" + poem.y : "", "--category-font-size"),
      verseLines: this.buildVerseLines(poem)
    }, () => this.fitCardText());
  },

  // 标题排版：放得下则单行；超宽则均分为多行（优先在标点处断句），
  // 换行后仍超宽才等比缩小字号（最小 50%）——文字绝不触碰卡片内框
  _buildTitle(title, width) {
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    const fontRpx = parseFloat(themes.THEMES.size[this.currentTheme.size].vars["--title-font-size"]) * 2;
    // 留 6% 安全边距：补偿字宽估算误差，确保任何字体下都不碰边框
    const innerW = (width || this._cardInnerW()) * 0.94;
    const chars = Array.from(title);
    const unitW = fontRpx * scale;
    if (chars.length * unitW <= innerW) return { lines: [title], style: "" };
    const lines = splitTitleLines(chars, unitW, innerW);
    // 换行后某行仍超宽：等比缩小字号兜底（最小 50%）
    const maxN = Math.max(...lines.map((l) => Array.from(l).length));
    let style = "";
    if (maxN * unitW > innerW) {
      const shrunk = Math.max((fontRpx * innerW) / (maxN * unitW), fontRpx * 0.5);
      style = "font-size:" + shrunk + "rpx;";
    }
    return { lines, style };
  },

  // 硬性要求：作者行超宽时按比例缩小（最小 50%），保证不出卡片内框
  _fitInlineStyle(text, fontVar, width) {
    if (!text) return "";
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    const fontRpx = parseFloat(themes.THEMES.size[this.currentTheme.size].vars[fontVar]) * 2;
    const w = Array.from(text).length * fontRpx * scale;
    const innerW = width || this._cardInnerW();
    if (w <= innerW) return "";
    return "font-size:" + Math.max((fontRpx * innerW) / w, fontRpx * 0.5) + "rpx;";
  },

  // fitCardText 的排版结果：[{text, punct, wrap}]
  buildVerseLines(poem) {
    const isV = this.currentTheme && this.currentTheme.direction === "vertical";
    const verses = verse.splitVerses(poem.c);
    if (isV) {
      // 竖排：整句成列
      return verses.map((v) => ({ text: v, punct: "", wrap: false }));
    }
    return this._fitVerses(poem, verses);
  },

  _fitVerses(poem, verses, width) {
    const clauses = [];
    for (const v of verses) {
      for (const c of verse.splitClauseLines(v)) clauses.push(c);
    }
    const safeW = (width || this._cardInnerW()) * 0.98;
    const fontSize = this._contentFontPx();
    // 字宽估算留 6% 余量（含行尾悬挂标点），任何字都不允许碰到卡片内框
    const estW = (t) => t.length * fontSize * 1.06;
    const plain = (t) => t.replace(/[，、。！？；]/g, "").length;
    // 硬性规则：一旦有任何小句单独放不下，整首诗都以一行一个小句呈现
    const needBreak = clauses.some((c) => estW(c) > safeW);
    const out = [];
    for (let i = 0; i < clauses.length; i++) {
      const a = clauses[i];
      const b = clauses[i + 1];
      // 大句合并：两小句均较短（≤14 字）且合并后放得下（整句需折行时不合并）
      if (!needBreak && b && plain(a) <= 14 && plain(b) <= 14 && estW(a + b) <= safeW) {
        const sp = verse.hangSplit(a + b);
        out.push({ text: sp.body, punct: sp.punct, wrap: false });
        i++;
        continue;
      }
      const sp = verse.hangSplit(a);
      out.push({ text: sp.body, punct: sp.punct, wrap: plain(a) >= 8 || estW(a) > safeW });
    }
    return out;
  },

  _contentFontPx() {
    // 主题字号（设计 px）→ rpx(×2) → 实际屏幕 px
    const sizePx = themes.THEMES.size[this.currentTheme.size].vars["--content-font-size"];
    const winW = wx.getSystemInfoSync().windowWidth;
    return parseFloat(sizePx) * 2 * (winW / 750);
  },

  _cardInnerW() {
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    // 页面两侧留白（主题变量 --page-padding 水平值，设计 px → rpx(×2) → 屏幕 px）
    const padVar = themes.THEMES.layout[this.currentTheme.layout].vars["--page-padding"];
    const pagePad = parseFloat(padVar.split(" ")[1]) * 2 * scale;
    // 卡片铺满屏幕（主题已不再限制 max-width）
    const cardW = winW - pagePad * 2;
    const padX = themes.CARD_PAD_X[this.currentTheme.layout] * 2 * scale;
    // 与网页版一致：再减 28（装饰内框余量）
    return cardW - padX * 2 - 28 * scale;
  },

  // 卡片实际尺寸测量后再排版一次（等价 resize 监听）：
  // 直接取 .content 内容盒实测宽度（装饰内框之内的真实可用宽度）重排所有文字，
  // 不依赖公式估算，任何字体/缩放下都不可能超出内框
  fitCardText() {
    if (!this.currentPoem) return;
    wx.createSelectorQuery()
      .select(".card-body")
      .boundingClientRect()
      .select(".content")
      .boundingClientRect()
      .exec((res) => {
        if (!res || !res[0]) return;
        this._cardRect = res[0];
        if (this.currentTheme.direction === "vertical") return;
        const innerW = res[1] && res[1].width ? res[1].width : this._cardInnerW();
        const poem = this.currentPoem;
        const tt = this._buildTitle(poem.t || "无题", innerW);
        const meta = this._metaText(poem);
        this.setData({
          titleLines: tt.lines,
          titleStyle: tt.style,
          metaStyle: this._fitInlineStyle(meta, "--meta-font-size", innerW),
          categoryStyle: this._fitInlineStyle(poem.y ? "体裁：" + poem.y : "", "--category-font-size", innerW),
          verseLines: this._fitVerses(poem, verse.splitVerses(poem.c), innerW)
        });
      });
  },

  // ====== 主题面板（对齐网页版 themePanel） ======
  onThemeToggle() {
    // 长按已触发开发者面板：吃掉松手后随之而来的 tap，避免设置面板误开
    if (this._devLongPressFired) { this._devLongPressFired = false; return; }
    this.haptic();
    // 齿轮绕中心整周旋转（650ms 后复位类，供下次触发）
    this.setData({ gearSpin: true });
    clearTimeout(this._gearTimer);
    this._gearTimer = setTimeout(() => this.setData({ gearSpin: false }), 650);
    this.setData({ themePanelOpen: !this.data.themePanelOpen });
  },
  onPageTap() {
    const patch = {};
    if (this.data.themePanelOpen) patch.themePanelOpen = false;
    if (this.data.typeDropdownShow) patch.typeDropdownShow = false;
    if (Object.keys(patch).length) this.setData(patch);
  },
  // ====== 开发者入口：长按设置齿轮 5s ======
  onGearTouchStart(e) {
    const t = e.touches && e.touches[0];
    this._gearStart = t ? { x: t.clientX, y: t.clientY } : null;
    clearTimeout(this._devTimer);
    this._devTimer = setTimeout(() => {
      this._devTimer = null;
      this._devLongPressFired = true;
      this.openDevPanel();
    }, 5000);
  },
  onGearTouchEnd() {
    if (this._devTimer) { clearTimeout(this._devTimer); this._devTimer = null; }
  },
  onGearTouchMove(e) {
    // 手指轻微抖动不取消（位移阈值 12px），明显移动才视为放弃长按
    const t = e.touches && e.touches[0];
    if (t && this._gearStart) {
      const dx = t.clientX - this._gearStart.x, dy = t.clientY - this._gearStart.y;
      if (dx * dx + dy * dy <= 144) return;
    }
    if (this._devTimer) { clearTimeout(this._devTimer); this._devTimer = null; }
  },
  // 隐藏开发者入口：页脚版权行长按（原生 longpress，真机可靠；齿轮 5s 长按保留为备用）
  onDevEntry() {
    this.openDevPanel();
  },
  openDevPanel() {
    // 强触感提示长按已到位
    try { wx.vibrateShort({ type: "heavy" }); } catch (e) { try { wx.vibrateShort(); } catch (e2) {} }
    this.refreshDevRows();
    this.setData({ devShow: true, themePanelOpen: false });
    // 面板打开期间每秒刷新实时状态
    clearInterval(this._devInterval);
    this._devInterval = setInterval(() => this.refreshDevRows(), 1000);
  },
  refreshDevRows() {
    const app = getApp() || { globalData: {} };
    const g = app.globalData || {};
    let win = {}, acct = "";
    try { win = wx.getWindowInfo(); } catch (e) {}
    try { acct = wx.getAccountInfoSync().miniProgram.appId; } catch (e) {}
    try { wx.getNetworkType({ success: (r) => this._updateDevRow("网络", r.networkType) }); } catch (e) {}
    const cache = data.cacheStats();
    const t = this.currentTheme || {};
    const rows = [
      { k: "应用名称", v: "诗海 · The Poetry Ocean" },
      { k: "AppID", v: acct || "不可用" },
      { k: "基础库", v: (win.SDKVersion || "-") + (typeof __wxConfig !== "undefined" && __wxConfig.envVersion ? "（" + __wxConfig.envVersion + "）" : "") },
      { k: "网络", v: "检测中…" },
      { k: "诗词总数", v: (g.total || 0).toLocaleString() + " 首" },
      { k: "数据模式", v: cfg.DATA_MODE + (cfg.DATA_MODE === "cloudbase" ? "（" + cfg.CLOUDBASE_ENV + "）" : "") },
      { k: "内存缓存分块", v: cache.count + " 个" + (cache.count ? "：" + cache.chunks.slice(0, 8).join(", ") + (cache.chunks.length > 8 ? "…" : "") : "") },
      { k: "思源宋体", v: g.fontOk ? "✓ 已加载（" + (g.fontSrc || "") + "）" : "加载中/回退（" + (g.fontLoaded || []).length + "/2 字重）" },
      { k: "当前主题", v: (t.color || "-") + " · " + (t.layout || "-") + " · " + (t.direction || "-") },
      { k: "窗口尺寸", v: (win.windowWidth || "-") + "×" + (win.windowHeight || "-") + (win.pixelRatio ? " @" + win.pixelRatio + "x" : "") }
    ];
    this._devRowsCache = rows;
    this.setData({ devRows: rows });
  },
  _updateDevRow(k, v) {
    if (!this.data.devShow) return;
    const rows = this.data.devRows.map((r) => (r.k === k ? { k, v } : r));
    this.setData({ devRows: rows });
  },
  onDevReshowDisclaimer() {
    this.haptic();
    clearInterval(this._devInterval);
    this.setData({ devShow: false, disclaimerShow: true });
  },
  onDevClose() {
    clearInterval(this._devInterval);
    this.setData({ devShow: false });
  },
  noop() {},
  onThemeOptTap(e) {
    this.haptic();
    const { group, value } = e.currentTarget.dataset;
    if (this.currentTheme[group] === value) return;
    // 切到竖排：默认紧凑排版；切回横排恢复原选择（与网页版一致）
    if (group === "direction") {
      if (value === "vertical") {
        this.prevHorzTheme = { layout: this.currentTheme.layout };
        this.currentTheme.layout = "compact";
      } else if (this.prevHorzTheme) {
        this.currentTheme.layout = this.prevHorzTheme.layout;
        this.prevHorzTheme = null;
      }
    }
    this.currentTheme[group] = value;
    this.applyTheme();
    themes.saveTheme(this.currentTheme);
    // 切到竖排且当前诗内容超 56 字：自动换一首短诗
    if (group === "direction" && value === "vertical" && this.currentPoem &&
        Array.from(this.currentPoem.c || "").length > 56) {
      this.loadRandomPoem(false);
      return;
    }
    if (this.currentPoem) this.renderPoem(this.currentPoem);
  },

  applyTheme() {
    const t = this.currentTheme;
    const px2rpx = (v) => Math.round(parseFloat(v) * 2) + "rpx";
    const vars = {};
    ["color", "layout", "size"].forEach((g) => {
      const th = themes.THEMES[g][t[g]];
      Object.keys(th.vars).forEach((k) => {
        const raw = th.vars[k];
        // 字号/内边距按 750 设计稿换算成 rpx，其余原样
        vars[k] = /font-size|padding/.test(k) ? px2rpx(raw) : raw;
      });
    });
    const isVertical = t.direction === "vertical";
    // 竖排时强制自适应比例（与网页版 syncRatioOptions 一致）
    let shareRatio = this.data.shareRatio;
    if (isVertical) shareRatio = "auto";
    const varsStyle = Object.keys(vars).map((k) => k + ":" + vars[k]).join(";");
    this.setData({
      varsStyle,
      isVertical,
      shareRatio,
      ratioOptions: RATIO_OPTIONS.map((o) => ({
        ...o,
        disabled: isVertical && o.value !== "auto",
        active: isVertical ? o.value === "auto" : o.value === shareRatio
      })),
      ratioActiveIndex: RATIO_OPTIONS.findIndex((o) => o.value === (isVertical ? "auto" : shareRatio)),
      colorOptions: this.data.colorOptions.map((o) => ({ ...o, active: o.value === t.color })),
      directionOptions: this.data.directionOptions.map((o) => ({ ...o, active: o.value === t.direction }))
    });
  },

  onRatioTap(e) {
    this.haptic();
    const value = e.currentTarget.dataset.value;
    if (this.currentTheme.direction === "vertical" && value !== "auto") return;
    this.setData({
      shareRatio: value,
      ratioOptions: this.data.ratioOptions.map((o) => ({ ...o, active: o.value === value })),
      ratioActiveIndex: RATIO_OPTIONS.findIndex((o) => o.value === value)
    });
  },

  // ====== 分享卡片（canvas 2d 手绘 → 预览/保存，等价网页版下载） ======
  async onShareTap() {
    this.haptic();
    if (!this.currentPoem) {
      this.showStatus("请先随机抽取一首诗，再分享", true);
      return;
    }
    if (this.data.shareLoading) return;
    this.setData({ shareLoading: true });
    try {
      const t = this.currentTheme;
      const colors = themes.THEMES.color[t.color].vars;
      // 卡片实际宽高（自适应比例用），取最近一次测量值或现测
      let rect = this._cardRect;
      if (!rect) {
        rect = await new Promise((resolve) => {
          wx.createSelectorQuery().select(".card-body").boundingClientRect().exec((r) => resolve(r && r[0]));
        });
      }
      const vertical = t.direction === "vertical";
      const filePath = await new Promise((resolve, reject) => {
        wx.createSelectorQuery()
          .select("#shareCanvas")
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res || !res[0] || !res[0].node) return reject(new Error("画布初始化失败"));
            const canvas = res[0].node;
            const ctx = canvas.getContext("2d");
            try {
              await drawShare({
                canvas, ctx,
                poem: this.currentPoem,
                vertical,
                ratio: this.data.shareRatio,
                cardW: rect ? rect.width : 300,
                cardH: rect ? rect.height : 300,
                colors: {
                  bg: colors["--bg-color"], text: colors["--text-color"],
                  meta: colors["--meta-color"], accent: colors["--accent-color"],
                  category: colors["--category-color"], seal: colors["--seal-color"]
                },
                logoPath: vertical ? "/assets/logo-vertical.png" : "/assets/logo-yin.png"
              });
            } catch (e) {
              return reject(e);
            }
            const out = wx.env.USER_DATA_PATH + "/shihai_" + this.data.shareRatio.replace(":", "x") + "_" + Date.now() + ".png";
            wx.canvasToTempFilePath({
              canvas,
              fileType: "png",
              destWidth: canvas.width,
              destHeight: canvas.height,
              filePath: out,
              success: (r) => resolve(r.tempFilePath),
              fail: (e) => reject(new Error("导出图片失败：" + (e.errMsg || "")))
            });
          });
      });
      this._sharePath = filePath;
      // 弹出分享浮层：预览图上浮，下方三选项（朋友圈/朋友/相册）
      this.setData({ shareImg: filePath, shareSheetShow: true });
    } catch (e) {
      this.showStatus("生成卡片失败：" + (e && e.message ? e.message : e), true);
    } finally {
      this.setData({ shareLoading: false });
    }
  },

  // 轻触感震动反馈：medium 档位（短促有力的一下），不支持 type 的设备退回默认 vibrateShort
  haptic() {
    wx.vibrateShort({ type: "medium", fail: () => wx.vibrateShort({ fail: () => {} }) });
  },

  // 关闭分享浮层
  closeShareSheet() {
    this.setData({ shareSheetShow: false });
  },

  // 点预览图 → 全屏预览
  previewShareImg() {
    if (this._sharePath) wx.previewImage({ urls: [this._sharePath] });
  },

  saveShare() {
    this.haptic();
    const doSave = () =>
      wx.saveImageToPhotosAlbum({
        filePath: this._sharePath,
        success: () => wx.showToast({ title: "已保存到相册", icon: "success" }),
        fail: (e) => wx.showToast({ title: "保存失败：" + (e.errMsg || ""), icon: "none" })
      });
    wx.authorize({
      scope: "scope.writePhotosAlbum",
      success: doSave,
      fail: () =>
        wx.showModal({
          title: "需要相册权限",
          content: "请在设置中允许写入相册后重试",
          confirmText: "去设置",
          success: (r) => { if (r.confirm) wx.openSetting(); }
        })
    });
  },

  // 微信原生转发
  onShareAppMessage() {
    const p = this.currentPoem;
    return {
      title: p ? "诗海 · " + (p.t || "无题") + " — " + [p.d, p.a].filter(Boolean).join("·") : "诗海 · 古诗词浏览器",
      path: "/pages/index/index",
      imageUrl: this.data.shareImg || undefined
    };
  }
});
