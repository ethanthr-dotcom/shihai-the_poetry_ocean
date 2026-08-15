// 诗海单页：行为与网页版 index.html 对齐（抽取→渲染→主题→分享图）
const data = require("../../utils/data");
const verse = require("../../utils/verse");
const themes = require("../../utils/themes");
const { drawShare } = require("../../utils/share-canvas");

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
  { value: "auto", label: "自适应" }
];

Page({
  data: {
    // 主题变量由 JS 计算后经 style 绑定注入（等价网页版 :root style）
    varsStyle: "",
    isVertical: false,
    themePanelOpen: false,
    colorOptions: themes.COLOR_OPTIONS.map((o) => ({ ...o, active: o.value === "warm" })),
    sizeOptions: themes.SIZE_OPTIONS.map((o) => ({ ...o, active: o.value === "medium" })),
    directionOptions: themes.DIRECTION_OPTIONS.map((o) => ({ ...o, active: o.value === "horizontal" })),

    author: "",
    dynasty: "",
    type: "",
    libTip: "共收录 34 万余首古诗词",
    statusText: "正在加载诗词库……",
    statusError: false,
    hasPoem: false,
    poem: null,
    verseLines: [],
    titleStyle: "",
    titleLines: [],
    metaStyle: "",
    randomLoading: false,
    shareLoading: false,
    ratioOptions: RATIO_OPTIONS.map((o) => ({ ...o, active: o.value === "1:1", disabled: false })),
    shareRatio: "1:1",
    progressState: "", // "" | run | done
    splashShow: true,
    disclaimerShow: false,
    uiReady: false
  },

  currentPoem: null,
  currentTheme: null,
  prevHorzTheme: null,
  indexReady: false,

  onLoad() {
    this.currentTheme = themes.loadTheme();
    this.applyTheme();
    // 首次使用提示：确认过则照常开屏，否则先展示提示、暂缓开屏
    let agreed = "";
    try { agreed = wx.getStorageSync("shihai-disclaimer-v1"); } catch (e) {}
    if (!agreed) {
      this.setData({ disclaimerShow: true });
    } else {
      this.startSplash();
    }
    this.boot();
  },

  onDismissDisclaimer() {
    try { wx.setStorageSync("shihai-disclaimer-v1", "1"); } catch (e) {}
    clearTimeout(this.splashTimer);
    this.setData({ disclaimerShow: false, splashShow: false, uiReady: true });
  },

  // ====== 开屏动画（与网页版一致：2.6s 自动消失，点击可跳过） ======
  startSplash() {
    const hide = () => {
      if (!this.data.splashShow) return;
      this.setData({ splashShow: false, uiReady: true });
    };
    this.splashTimer = setTimeout(hide, 2600);
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
          libTip: "共收录 " + Math.floor(total / 10000) + " 万余首古诗词"
        });
      }
      this.setData({
        statusText: "共收录 " + total.toLocaleString("zh-CN") + " 首诗词，点击下方按钮随机抽取",
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

  onRandomTap() { this.loadRandomPoem(true); },

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
  renderPoem(poem) {
    this.currentPoem = poem;
    const meta = [poem.d, poem.a].filter(Boolean).join(" · ");
    const tt = this._buildTitle(poem.t || "无题");
    this.setData({
      hasPoem: true,
      statusText: "",
      statusError: false,
      poem: { t: poem.t || "无题", meta, type: poem.y || "" },
      titleLines: tt.lines,
      titleStyle: tt.style,
      metaStyle: this._fitInlineStyle(meta, "--meta-font-size"),
      verseLines: this.buildVerseLines(poem)
    }, () => this.fitCardText());
  },

  // 标题排版：放得下则单行；超宽则均分为多行（优先在标点处断句），
  // 换行后仍超宽才等比缩小字号（最小 50%）——文字绝不触碰卡片内框
  _buildTitle(title) {
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    const fontRpx = parseFloat(themes.THEMES.size[this.currentTheme.size].vars["--title-font-size"]) * 2;
    const innerW = this._cardInnerW();
    const chars = Array.from(title);
    const unitW = fontRpx * scale;
    if (chars.length * unitW <= innerW) return { lines: [title], style: "" };
    const lines = splitTitleLines(chars, unitW, innerW);
    // 换行后某行仍超宽：等比缩小字号兜底
    const maxN = Math.max(...lines.map((l) => Array.from(l).length));
    let style = "";
    if (maxN * unitW > innerW) {
      const shrunk = Math.max((fontRpx * innerW) / (maxN * unitW), fontRpx * 0.5);
      style = "font-size:" + shrunk + "rpx;";
    }
    return { lines, style };
  },

  // 硬性要求：作者行超宽时按比例缩小（最小 50%），保证不出卡片内框
  _fitInlineStyle(text, fontVar) {
    if (!text) return "";
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    const fontRpx = parseFloat(themes.THEMES.size[this.currentTheme.size].vars[fontVar]) * 2;
    const w = Array.from(text).length * fontRpx * scale;
    const innerW = this._cardInnerW();
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

  _fitVerses(poem, verses) {
    const clauses = [];
    for (const v of verses) {
      for (const c of verse.splitClauseLines(v)) clauses.push(c);
    }
    const innerW = this._cardInnerW();
    const fontSize = this._contentFontPx();
    const out = [];
    if (verse.isShortJueju(poem)) {
      // 绝句：一行两个小句，宽度不够则一行一小句（以字数×字号估算，等价网页版探针）
      for (let i = 0; i < clauses.length; i += 2) {
        const a = clauses[i];
        const b = clauses[i + 1];
        if (b && (a.length + b.length) * fontSize <= innerW + 2) {
          const sp = verse.hangSplit(a + b);
          out.push({ text: sp.body, punct: sp.punct, wrap: false });
          continue;
        }
        const sa = verse.hangSplit(a);
        out.push({ text: sa.body, punct: sa.punct, wrap: false });
        if (b) {
          const sb = verse.hangSplit(b);
          out.push({ text: sb.body, punct: sb.punct, wrap: false });
        }
      }
    } else {
      for (const c of clauses) {
        const n = c.replace(/[，、。！？；]/g, "").length;
        const sp = verse.hangSplit(c);
        out.push({ text: sp.body, punct: sp.punct, wrap: n >= 8 });
      }
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
    const cardW = Math.min(winW - pagePad * 2, 900);
    const padX = themes.CARD_PAD_X[this.currentTheme.layout] * 2 * scale;
    // 与网页版一致：再减 28（装饰内框余量）
    return cardW - padX * 2 - 28 * scale;
  },

  // 卡片实际尺寸测量后再排版一次（等价 resize 监听）
  fitCardText() {
    if (!this.currentPoem) return;
    wx.createSelectorQuery()
      .select(".card")
      .boundingClientRect()
      .exec((res) => {
        if (!res || !res[0]) return;
        this._cardRect = res[0];
        if (this.currentTheme.direction !== "vertical") {
          this.setData({ verseLines: this._fitVerses(this.currentPoem, verse.splitVerses(this.currentPoem.c)) });
        }
      });
  },

  // ====== 主题面板（对齐网页版 themePanel） ======
  onThemeToggle() {
    this.setData({ themePanelOpen: !this.data.themePanelOpen });
  },
  onPageTap() {
    if (this.data.themePanelOpen) this.setData({ themePanelOpen: false });
  },
  noop() {},
  onThemeOptTap(e) {
    const { group, value } = e.currentTarget.dataset;
    if (this.currentTheme[group] === value) return;
    // 切到竖排：默认紧凑排版 + 小字号；切回横排恢复原选择（与网页版一致）
    if (group === "direction") {
      if (value === "vertical") {
        this.prevHorzTheme = { layout: this.currentTheme.layout, size: this.currentTheme.size };
        this.currentTheme.layout = "compact";
        this.currentTheme.size = "small";
      } else if (this.prevHorzTheme) {
        this.currentTheme.layout = this.prevHorzTheme.layout;
        this.currentTheme.size = this.prevHorzTheme.size;
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
      colorOptions: this.data.colorOptions.map((o) => ({ ...o, active: o.value === t.color })),
      sizeOptions: this.data.sizeOptions.map((o) => ({ ...o, active: o.value === t.size })),
      directionOptions: this.data.directionOptions.map((o) => ({ ...o, active: o.value === t.direction }))
    });
  },

  onRatioTap(e) {
    const value = e.currentTarget.dataset.value;
    if (this.currentTheme.direction === "vertical" && value !== "auto") return;
    this.setData({
      shareRatio: value,
      ratioOptions: this.data.ratioOptions.map((o) => ({ ...o, active: o.value === value }))
    });
  },

  // ====== 分享卡片（canvas 2d 手绘 → 预览/保存，等价网页版下载） ======
  async onShareTap() {
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
          wx.createSelectorQuery().select(".card").boundingClientRect().exec((r) => resolve(r && r[0]));
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
      this.previewShare();
    } catch (e) {
      this.showStatus("生成卡片失败：" + (e && e.message ? e.message : e), true);
    } finally {
      this.setData({ shareLoading: false });
    }
  },

  // 生成后先预览（长按可保存/转发），并询问是否存入相册
  previewShare() {
    wx.previewImage({ urls: [this._sharePath] });
    wx.showModal({
      title: "保存分享卡片",
      content: "是否将卡片图片保存到相册？",
      confirmText: "保存",
      cancelText: "不用",
      success: (res) => { if (res.confirm) this.saveShare(); }
    });
  },

  saveShare() {
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
      path: "/pages/index/index"
    };
  }
});
