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
    categoryStyle: "",
    randomLoading: false,
    shareLoading: false,
    shareSheetShow: false,
    shareImg: "",
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
  _metaText(poem) {
    return [poem.d, poem.a].filter(Boolean).join(" · ");
  },

  renderPoem(poem) {
    this.currentPoem = poem;
    const meta = this._metaText(poem);
    const tt = this._buildTitle(poem.t || "无题");
    this.setData({
      hasPoem: true,
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
      .select(".card")
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
    this.setData({ themePanelOpen: !this.data.themePanelOpen });
  },
  onPageTap() {
    if (this.data.themePanelOpen) this.setData({ themePanelOpen: false });
  },
  noop() {},
  onThemeOptTap(e) {
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
      colorOptions: this.data.colorOptions.map((o) => ({ ...o, active: o.value === t.color })),
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
      // 弹出分享浮层：预览图上浮，下方三选项（朋友圈/朋友/相册）
      this.setData({ shareImg: filePath, shareSheetShow: true });
    } catch (e) {
      this.showStatus("生成卡片失败：" + (e && e.message ? e.message : e), true);
    } finally {
      this.setData({ shareLoading: false });
    }
  },

  // 关闭分享浮层
  closeShareSheet() {
    this.setData({ shareSheetShow: false });
  },

  noop() {},

  // 点预览图 → 全屏预览
  previewShareImg() {
    if (this._sharePath) wx.previewImage({ urls: [this._sharePath] });
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
      path: "/pages/index/index",
      imageUrl: this.data.shareImg || undefined
    };
  }
});
