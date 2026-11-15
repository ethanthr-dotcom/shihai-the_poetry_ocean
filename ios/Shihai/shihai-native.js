/*
 * 诗海 iOS 离线桥接层。
 * 在 <head> 最前面同步加载，早于页面业务脚本。
 * 只与本机 App 通信（WKScriptMessageHandler），不发起任何网络请求。
 */
(function () {
  "use strict";

  var H = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.shihai;
  function post(type, payload) {
    if (!H) return;
    try {
      var msg = { type: type };
      if (payload) for (var k in payload) msg[k] = payload[k];
      H.postMessage(msg);
    } catch (e) {}
  }

  var native = {
    isIOS: true,
    post: post,
    fireShake: function () {
      function fire(x, y, z) {
        var e = new Event("devicemotion");
        Object.defineProperty(e, "accelerationIncludingGravity", {
          value: { x: x, y: y, z: z }
        });
        window.dispatchEvent(e);
      }
      fire(0, 0, 0);
      setTimeout(function () { fire(18, 12, 0); }, 40);
    }
  };
  window.ShihaiNative = native;

  /* ---- 运行期诊断：JS 异常写入 App Documents/shihai-debug.log ---- */
  window.addEventListener("error", function (e) {
    post("debug", { msg: "JS ERROR: " + e.message + " @" + (e.filename || "") + ":" + (e.lineno || 0) });
  });
  window.addEventListener("unhandledrejection", function (e) {
    post("debug", { msg: "REJECTION: " + String(e.reason) });
  });

  /* ---- localStorage 兜底：自定义 scheme 若被 WebKit 判为非安全源，改用原生持久化 ---- */
  try {
    var probe = "__shihai_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch (e) {
    var kv = {};
    try {
      var injected = window.__SHIHAI_KV__ || {};
      for (var k0 in injected) if (Object.prototype.hasOwnProperty.call(injected, k0)) kv[k0] = injected[k0];
    } catch (e0) {}
    var shim = {
      get length() { return Object.keys(kv).length; },
      key: function (i) { var keys = Object.keys(kv); return i >= 0 && i < keys.length ? keys[i] : null; },
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(kv, k) ? kv[k] : null; },
      setItem: function (k, v) { kv[k] = String(v); post("kv-set", { k: k, v: String(v) }); },
      removeItem: function (k) { delete kv[k]; post("kv-remove", { k: k }); },
      clear: function () { kv = {}; post("kv-clear", {}); }
    };
    try { Object.defineProperty(window, "localStorage", { value: shim, configurable: true }); } catch (e2) {}
  }

  /* ---- 触感反馈：iOS 无 navigator.vibrate，映射到 UIImpactFeedbackGenerator ---- */
  try {
    Object.defineProperty(navigator, "vibrate", {
      value: function () { post("haptic", {}); return true; },
      configurable: true
    });
  } catch (e) {}

  /* ---- 下载拦截：WKWebView 不支持 a[download]，转交原生保存 / 分享 ---- */
  var blobMap = new Map();
  try {
    var createObjectURL = URL.createObjectURL.bind(URL);
    var revokeObjectURL = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = function (blob) {
      var url = createObjectURL(blob);
      if (blob) blobMap.set(url, blob);
      return url;
    };
    URL.revokeObjectURL = function (url) {
      blobMap.delete(url);
      return revokeObjectURL(url);
    };
  } catch (e) {}

  var originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (!this.download) return originalClick.apply(this, arguments);
    var href = this.getAttribute("href") || "";
    var name = this.download;
    if (href.indexOf("data:image/") === 0) {
      post("save-image", { dataURL: href, filename: name });
      return;
    }
    if (href.indexOf("blob:") === 0) {
      var blob = blobMap.get(href);
      if (blob) {
        var reader = new FileReader();
        reader.onload = function () { post("share-file", { dataURL: String(reader.result), filename: name }); };
        reader.onerror = function () { post("share-file", { dataURL: "", filename: name }); };
        try { reader.readAsDataURL(blob); } catch (e) { post("share-file", { dataURL: "", filename: name }); }
        return;
      }
    }
    if (href.indexOf("data:") === 0) {
      post("share-file", { dataURL: href, filename: name });
      return;
    }
    return originalClick.apply(this, arguments);
  };

  /* ---- 主题背景同步：让状态栏 / 安全区外的底色跟随 16 套主题 ---- */
  var lastBg = "";
  function syncTheme() {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue("--bg-color").trim();
      if (v && v !== lastBg) {
        lastBg = v;
        post("theme", { hex: v });
      }
    } catch (e) {}
  }
  setInterval(syncTheme, 700);

  document.addEventListener("DOMContentLoaded", function () {
    syncTheme();
    post("ready", {});
  });
})();
