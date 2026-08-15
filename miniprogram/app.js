// 诗海小程序入口：网络字体 + 索引预取（与网页版同源同字体）
const data = require("./utils/data");

const FONT_URLS = [
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5/files/noto-serif-sc-chinese-simplified-400-normal.woff2",
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5/files/noto-serif-sc-chinese-simplified-600-normal.woff2"
];

App({
  globalData: { total: 0 },

  onLaunch() {
    // 思源宋体：webview(页面) + native(canvas 分享图) 双端生效；失败静默回退系统宋体
    FONT_URLS.forEach((url, i) => {
      wx.loadFontFace({
        global: true,
        family: "Noto Serif SC",
        source: 'url("' + url + '")',
        desc: { weight: i === 0 ? "400" : "600" },
        scopes: ["native", "webview"],
        success: () => console.log("font loaded:", url),
        fail: () => {}
      });
    });
    data
      .loadIndex()
      .then((index) => {
        this.globalData.total = (index && index.total) || 0;
      })
      .catch(() => {});
  }
});
