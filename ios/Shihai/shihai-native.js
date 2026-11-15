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

  /* ---- 运行期诊断：JS 异常 / 字体加载失败写入 App Documents/shihai-debug.log ---- */
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

  /* ---- 分享卡片预览浮层：底部上弹，预览图 + 分享到微信 / 保存到相册 ---- */
  var SHARE_CSS = '' +
    '.sh-mask{position:fixed;inset:0;z-index:2200;display:flex;align-items:flex-end;justify-content:center;' +
    'background:rgba(0,0,0,.5);animation:shFade .22s ease}' +
    '.sh-sheet{position:relative;width:100%;max-width:560px;box-sizing:border-box;' +
    'background:var(--bg-color,#fff);color:var(--text-color,#333);' +
    'border-top:1px solid var(--accent-color,#888);border-radius:18px 18px 0 0;' +
    'padding:18px 20px calc(20px + env(safe-area-inset-bottom));' +
    'box-shadow:0 -12px 40px rgba(0,0,0,.25);animation:shUp .3s cubic-bezier(.2,.8,.2,1)}' +
    '.sh-head{font-size:16px;font-weight:600;text-align:center;letter-spacing:2px;margin-bottom:12px}' +
    '.sh-preview{display:block;max-width:100%;max-height:46vh;margin:0 auto 14px;object-fit:contain;' +
    'border-radius:10px;box-shadow:0 6px 22px rgba(0,0,0,.18);cursor:zoom-in}' +
    '.sh-actions{display:flex;gap:10px}' +
    '.sh-btn{flex:1;padding:11px 6px;border-radius:10px;font-size:14px;letter-spacing:1px;cursor:pointer;' +
    '-webkit-appearance:none;appearance:none;border:1px solid var(--card-border,#ddd);' +
    'background:var(--input-bg,#fff);color:var(--text-color,#333)}' +
    '.sh-btn.primary{background:var(--accent-color,#4f5f4a);color:var(--button-text,#fff);' +
    'border-color:var(--accent-color,#4f5f4a)}' +
    '.sh-tip{margin-top:10px;font-size:11px;line-height:1.6;text-align:center;opacity:.65}' +
    '.sh-close{position:absolute;top:10px;right:14px;width:28px;height:28px;border:0;border-radius:50%;' +
    'background:transparent;color:var(--meta-color,#888);font-size:17px;line-height:28px;' +
    '-webkit-appearance:none;appearance:none;cursor:pointer}' +
    '.sh-full{position:fixed;inset:0;z-index:2400;background:rgba(0,0,0,.92);display:flex;' +
    'align-items:center;justify-content:center;padding:16px}' +
    '.sh-full img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px}' +
    '@keyframes shFade{from{opacity:0}to{opacity:1}}' +
    '@keyframes shUp{from{transform:translateY(100%)}to{transform:none}}';

  var styleInjected = false;
  var shareSheet = null;
  function ensureShareStyle() {
    if (styleInjected) return;
    var style = document.createElement("style");
    style.id = "shihai-share-style";
    style.textContent = SHARE_CSS;
    document.head.appendChild(style);
    styleInjected = true;
  }
  function closeShareSheet() {
    if (shareSheet && shareSheet.parentNode) shareSheet.parentNode.removeChild(shareSheet);
    shareSheet = null;
  }
  function showFullPreview(src) {
    var full = document.createElement("div");
    full.className = "sh-full";
    var img = document.createElement("img");
    img.src = src;
    img.alt = "分享卡片全屏预览";
    full.appendChild(img);
    full.addEventListener("click", function () {
      if (full.parentNode) full.parentNode.removeChild(full);
    });
    document.body.appendChild(full);
  }
  function showShareSheet(dataURL, filename) {
    try {
      closeShareSheet();
      ensureShareStyle();
      var mask = document.createElement("div");
      mask.className = "sh-mask";
      var sheet = document.createElement("div");
      sheet.className = "sh-sheet";

      var close = document.createElement("button");
      close.className = "sh-close";
      close.type = "button";
      close.setAttribute("aria-label", "关闭");
      close.textContent = "✕";
      close.addEventListener("click", function (e) { e.stopPropagation(); closeShareSheet(); });

      var head = document.createElement("div");
      head.className = "sh-head";
      head.textContent = "分享卡片";

      var img = document.createElement("img");
      img.className = "sh-preview";
      img.src = dataURL;
      img.alt = "诗词分享卡片预览";
      img.addEventListener("click", function (e) { e.stopPropagation(); showFullPreview(dataURL); });

      var actions = document.createElement("div");
      actions.className = "sh-actions";

      function makeBtn(text, primary, handler) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sh-btn" + (primary ? " primary" : "");
        b.textContent = text;
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          post("haptic", {});
          handler();
        });
        return b;
      }
      actions.appendChild(makeBtn("💬 分享到微信", true, function () {
        post("share-image", { dataURL: dataURL, filename: filename });
      }));
      actions.appendChild(makeBtn("🖼️ 保存到相册", false, function () {
        post("save-image", { dataURL: dataURL, filename: filename });
      }));

      var tip = document.createElement("div");
      tip.className = "sh-tip";
      tip.textContent = "在系统分享面板中选择微信 · 点图片全屏预览 · 点空白处关闭";

      sheet.appendChild(close);
      sheet.appendChild(head);
      sheet.appendChild(img);
      sheet.appendChild(actions);
      sheet.appendChild(tip);
      mask.appendChild(sheet);
      mask.addEventListener("click", function (e) { if (e.target === mask) closeShareSheet(); });
      document.body.appendChild(mask);
      shareSheet = mask;
    } catch (e) {
      // 预览失败时退回直接保存，保证功能可用
      post("save-image", { dataURL: dataURL, filename: filename });
    }
  }

  /* ---- 下载拦截：图片先弹预览，文本交给系统分享 ---- */
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
      showShareSheet(href, name);
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
    // 预载内嵌思源宋体，保证 Canvas 生成卡片时字体已就绪
    try {
      if (document.fonts && document.fonts.load) {
        document.fonts.load('400 20px "Source Han Serif CN"').catch(function () {});
        document.fonts.load('700 20px "Source Han Serif CN"').catch(function () {});
        window.addEventListener("load", function () {
          setTimeout(function () {
            if (!document.fonts.check('20px "Source Han Serif CN"')) {
              post("debug", { msg: "FONT NOT LOADED: Source Han Serif CN" });
            }
          }, 1500);
        });
      }
    } catch (e) {}
  });
})();
