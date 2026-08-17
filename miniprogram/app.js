// 诗海小程序入口：网络字体 + 索引预取（与网页版同源同字体）
const cfg = require("./utils/config");
const data = require("./utils/data");

// 思源宋体：CDN 直载（最初版本方案，真机验证可正常显示）
// 主源 jsDelivr，失败自动切备用 CDN（unpkg，固定版本）；两者都失败则静默回退系统宋体
const FONT_CDNS = [
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5/files/",
  "https://unpkg.com/@fontsource/noto-serif-sc@5.3.0/files/"
];
const FONT_FILES = [
  "noto-serif-sc-chinese-simplified-400-normal.woff2",
  "noto-serif-sc-chinese-simplified-600-normal.woff2"
];

App({
  globalData: { total: 0, fontOk: false, fontLoaded: [], fontSrc: "", visitCount: 0, visitCbks: [] },

  // webview(页面) + native(canvas 分享图) 双端生效；失败逐个 CDN 降级，最终静默回退系统宋体
  _loadFont(file, weightIdx, cdnIdx) {
    if (cdnIdx >= FONT_CDNS.length) return; // 全部来源均失败：回退系统字体
    const url = FONT_CDNS[cdnIdx] + file;
    wx.loadFontFace({
      global: true,
      family: "Noto Serif SC",
      source: 'url("' + url + '")',
      desc: { weight: weightIdx === 0 ? "400" : "600" },
      scopes: ["native", "webview"],
      success: () => {
        console.log("font loaded:", url);
        if (!this.globalData.fontLoaded.includes(file)) this.globalData.fontLoaded.push(file);
        this.globalData.fontSrc = "CDN 直载";
        if (this.globalData.fontLoaded.length >= FONT_FILES.length) this.globalData.fontOk = true;
      },
      fail: (err) => {
        console.warn("loadFontFace fail:", url, err);
        this._loadFont(file, weightIdx, cdnIdx + 1);
      }
    });
  },

  onLaunch() {
    // 云开发模式：先初始化云环境（数据走云函数，免服务器域名白名单）
    if (cfg.DATA_MODE === "cloudbase" && cfg.CLOUDBASE_ENV) {
      try {
        wx.cloud.init({ env: cfg.CLOUDBASE_ENV, traceUser: false });
      } catch (e) {
        console.warn("云开发初始化失败：", e);
      }
    }
    // 思源宋体：两个 CDN 依次直载
    FONT_FILES.forEach((file, i) => this._loadFont(file, i, 0));
    this._loadPoemData();
    // 访问统计：每次打开都递增云端计数（每日可多次）；10 秒短节流防异常刷量
    this._trackVisit();
    wx.onNetworkStatusChange((res) => {
      if (res.isConnected && !this.globalData.fontOk) {
        setTimeout(() => FONT_FILES.forEach((file, i) => this._loadFont(file, i, 0)), 1200);
      }
      // 网络恢复后若访问计数未取到，重试一次
      if (res.isConnected && !this.globalData.visitCount) this._trackVisit();
    });
  },

  // 访问统计：每次打开都计数（每日可多次）；仅用 10 秒短节流防止异常重启刷量；云端持久化保存
  _trackVisit() {
    const LAST_KEY = "shihai-visit-last-ts";
    const now = Date.now();
    let lastTs = 0;
    try { lastTs = wx.getStorageSync(LAST_KEY) || 0; } catch (e) {}
    if (now - lastTs < 10000) {
      // 10 秒内已上报：仅查询展示用计数
      this._queryVisit();
      return;
    }
    try { wx.setStorageSync(LAST_KEY, now); } catch (e) {}
    if (cfg.DATA_MODE !== "cloudbase" || !cfg.CLOUDBASE_ENV) return;
    wx.cloud.callFunction({
      name: "visitStats",
      data: { action: "incr", platform: "mp" },
      success: (res) => {
        const cnt = res && res.result && typeof res.result.count === "number" ? res.result.count : 0;
        if (cnt) {
          this.globalData.visitCount = cnt;
          try { wx.setStorageSync("shihai-visit-count", cnt); } catch (e) {}
          this._notifyVisit(cnt);
        }
      },
      fail: () => { this._queryVisit(); }
    });
  },

  // 仅查询计数（当天已上报过时使用）
  _queryVisit() {
    if (cfg.DATA_MODE !== "cloudbase" || !cfg.CLOUDBASE_ENV) {
      // 非云开发模式：用本地累计计数
      const LOCAL_KEY = "shihai-visit-local";
      let local = 0;
      try { local = wx.getStorageSync(LOCAL_KEY) || 0; } catch (e) {}
      this.globalData.visitCount = local;
      this._notifyVisit(local);
      return;
    }
    wx.cloud.callFunction({
      name: "visitStats",
      data: { action: "query" },
      success: (res) => {
        const cnt = res && res.result && typeof res.result.count === "number" ? res.result.count : 0;
        this.globalData.visitCount = cnt;
        try { wx.setStorageSync("shihai-visit-count", cnt); } catch (e) {}
        this._notifyVisit(cnt);
      },
      fail: () => {
        // 取云端失败时回退本地缓存
        let cached = 0;
        try { cached = wx.getStorageSync("shihai-visit-count") || 0; } catch (e) {}
        this.globalData.visitCount = cached;
        this._notifyVisit(cached);
      }
    });
  },

  // 通知页面更新展示
  _notifyVisit(cnt) {
    this.globalData.visitCbks.forEach((fn) => { try { fn(cnt); } catch (e) {} });
  },
  onVisitUpdate(fn) {
    if (typeof fn === "function") this.globalData.visitCbks.push(fn);
    return () => {
      const i = this.globalData.visitCbks.indexOf(fn);
      if (i >= 0) this.globalData.visitCbks.splice(i, 1);
    };
  },

  _loadPoemData() {

    data
      .loadIndex()
      .then((index) => {
        this.globalData.total = (index && index.total) || 0;
        // 预热：索引就绪后从两个数据云函数各静默预取一个随机分块
        // （poemData 管 001-140、poemData2 管 141-345），避免用户首次抽诗遭遇冷启动
        if (cfg.DATA_MODE === "cloudbase") {
          const pad = (n) => String(n).padStart(3, "0") + ".json";
          const totalChunks = (index && index.chunks && index.chunks.length) || 345;
          const upper = Math.max(1, totalChunks - cfg.CLOUDBASE_SPLIT);
          data.loadChunk(pad(1 + Math.floor(Math.random() * cfg.CLOUDBASE_SPLIT))).catch(() => {});
          data.loadChunk(pad(cfg.CLOUDBASE_SPLIT + 1 + Math.floor(Math.random() * upper))).catch(() => {});
        }
      })
      .catch(() => {});
  }
});
