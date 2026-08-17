// 分享卡片绘制：与网页版 canvas 绘制逻辑逐行一致（宽固定 3000，高按比例）
const verse = require("./verse");

const FONT = '"Songti SC", "STSong", "SimSun", "PingFang SC", serif';
const LOGO_RATIO = 222 / 126;   // 横版 logo 宽高比
const V_LOGO_RATIO = 126 / 222; // 竖版 logo 宽高比

function roundRectPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// opts: { poem, vertical, ratio, cardW, cardH, colors:{bg,text,meta,accent,category,seal}, canvas, ctx, logoPath }
// 画布图片加载：onload 完成才可 drawImage（带 3s 超时兜底）
function loadImage(canvas, src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    let done = false;
    const finish = (img) => { if (!done) { done = true; resolve(img); } };
    try {
      const img = canvas.createImage();
      img.onload = () => finish(img);
      img.onerror = () => finish(null);
      setTimeout(() => finish(null), 3000);
      img.src = src;
    } catch (e) { finish(null); }
  });
}

async function drawShare(opts) {
  const { canvas, ctx, poem, vertical, ratio, cardW, cardH, colors, logoPath, sign } = opts;
  const bg = colors.bg || "#f4f1e8";
  const textColor = colors.text || "#2f2a24";
  const metaColor = colors.meta || "#766d63";
  const accent = colors.accent || "#4f5f4a";
  const catColor = colors.category || "#958a7e";
  const sealColor = colors.seal || "#a3382f";

  const title = poem.t || "无题";
  const authorMeta = [poem.d, poem.a].filter(Boolean).join(" \u00b7 ");
  const verses = verse.splitVerses(poem.c);

  // 画布：宽固定 3000px；高按比例；文字到边框间距固定，卡片不缩放
  const W = 3000;
  let H;
  if (ratio === "auto") {
    const cw = cardW || 1;
    const ch = cardH || cw;
    H = Math.round((W * ch) / cw);
  } else {
    const parts = ratio.split(":");
    H = Math.round((W * Number(parts[1])) / Number(parts[0]));
  }
  H = Math.min(Math.max(H, 1000), 8000);
  canvas.width = W;
  canvas.height = H;
  const M = Math.round(W * 0.115);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 内框装饰线
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 3;
  ctx.strokeRect(M * 0.45, M * 0.45, W - M * 0.9, H - M * 0.9);
  ctx.globalAlpha = 1;

  // 水印「詩」
  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = textColor;
  ctx.font = "600 " + Math.round(W * 0.38) + "px " + FONT;
  ctx.fillText("詩", W * 0.8, H * 0.87);
  ctx.restore();

  // 点缀：竹子（左下）、山峦（右下），低透明度不干扰文字
  const decoBaseY = H - Math.round(M * 0.45);
  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.09;
  const bX = Math.round(M * 0.6), bW = Math.round(W * 0.0075);
  const segH = Math.round(Math.min(H * 0.085, W * 0.075));
  for (let i = 0; i < 4; i++) {
    const yT = decoBaseY - segH * (i + 1) - Math.round(segH * 0.1) * i;
    roundRectPath(ctx, bX, yT, bW, segH, bW * 0.45);
    ctx.fill();
  }
  const leafY = decoBaseY - segH * 4.5;
  ctx.beginPath();
  ctx.ellipse(bX + bW * 3.4, leafY, bW * 3.6, bW, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bX - bW * 2.2, leafY + bW * 3, bW * 3.2, bW * 0.9, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // 山峦：远山（淡）+ 近山（稍深）
  const mX0 = W * 0.6, mX1 = W - M * 0.45;
  const mH = Math.min(H * 0.125, W * 0.11);
  ctx.globalAlpha = 0.05;
  ctx.beginPath();
  ctx.moveTo(mX0, decoBaseY);
  ctx.lineTo(mX0 + (mX1 - mX0) * 0.2, decoBaseY - mH * 0.8);
  ctx.lineTo(mX0 + (mX1 - mX0) * 0.38, decoBaseY - mH * 0.36);
  ctx.lineTo(mX0 + (mX1 - mX0) * 0.6, decoBaseY - mH);
  ctx.lineTo(mX0 + (mX1 - mX0) * 0.8, decoBaseY - mH * 0.4);
  ctx.lineTo(mX1, decoBaseY - mH * 0.68);
  ctx.lineTo(mX1, decoBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.09;
  ctx.beginPath();
  ctx.moveTo(mX0 + (mX1 - mX0) * 0.25, decoBaseY);
  ctx.lineTo(mX0 + (mX1 - mX0) * 0.45, decoBaseY - mH * 0.56);
  ctx.lineTo(mX0 + (mX1 - mX0) * 0.62, decoBaseY - mH * 0.24);
  ctx.lineTo(mX0 + (mX1 - mX0) * 0.82, decoBaseY - mH * 0.6);
  ctx.lineTo(mX1, decoBaseY - mH * 0.32);
  ctx.lineTo(mX1, decoBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const footerText = "诗海 \u00b7 非营利古诗词共享项目";
  const signText = ((sign || "") + "").trim();

  // 印章位 logo：横排用阴刻横版、竖排用竖版；加载失败退化为红色圆角方框
  const logoImg = await loadImage(canvas, logoPath);

  if (!vertical) {
    // ---------- 横排：换行必须在标点处——优先整句一行，放不下才一小句一行；字号按设计基准，实在超宽才等比缩小 ----------
    const availW = W - M * 2 - 100;
    const availH = H - M * 2;
    const SC = W / 750;
    const measureList = (size, list) => {
      ctx.font = size + "px " + FONT;
      return list.reduce((m, s) => Math.max(m, ctx.measureText(s).width), 0);
    };
    const clauseLines = [];
    for (const v of verses) {
      for (const p of verse.splitClauseLines(v)) clauseLines.push(p);
    }
    let scale = 1;
    const layout = () => {
      const fontSize = Math.round(26 * SC * scale);
      const logoH = Math.round(fontSize * 1.45);
      return {
        fontSize,
        titleFont: Math.round(36 * SC * scale),
        metaFont: Math.round(23 * SC * scale),
        catFont: Math.round(20 * SC * scale),
        lineH: Math.round(fontSize * 1.8),
        logoH,
        logoW: Math.round(logoH * LOGO_RATIO)
      };
    };
    const blockHeight = (L, list) =>
      L.titleFont + 80 + L.metaFont + 70 + list.length * L.lineH +
      90 + L.logoH + 90 + L.catFont + (signText ? Math.round(L.catFont * 1.5) + 24 : 0);

    let lines = verses;
    let L = layout();
    if (measureList(L.fontSize, verses) > availW) lines = clauseLines;
    for (;;) {
      L = layout();
      ctx.font = "600 " + L.titleFont + "px " + FONT;
      const tw = ctx.measureText(title).width;
      ctx.font = L.catFont + "px " + FONT;
      const fw = ctx.measureText(footerText).width;
      const wMax = Math.max(measureList(L.fontSize, lines), tw, fw, L.logoW);
      if (wMax <= availW || scale <= 0.35) break;
      scale *= availW / wMax;
    }
    if (blockHeight(L, lines) > availH && scale > 0.35) {
      scale *= availH / blockHeight(L, lines);
      L = layout();
    }

    let y = M + Math.max(0, (availH - blockHeight(L, lines)) / 2);
    ctx.fillStyle = textColor;
    ctx.font = "600 " + L.titleFont + "px " + FONT;
    ctx.fillText(title, W / 2, y + L.titleFont / 2);
    y += L.titleFont + 80;
    ctx.fillStyle = metaColor;
    ctx.font = L.metaFont + "px " + FONT;
    ctx.fillText(authorMeta, W / 2, y + L.metaFont / 2);
    y += L.metaFont + 70;
    ctx.fillStyle = textColor;
    ctx.font = L.fontSize + "px " + FONT;
    // 与网页一致：以文字为基准中心对齐，行尾标点悬挂在外不参与居中
    for (const line of lines) {
      const sp = verse.hangSplit(line);
      if (sp.punct) {
        const bw = ctx.measureText(sp.body).width;
        ctx.textAlign = "left";
        ctx.fillText(sp.body, W / 2 - bw / 2, y + L.lineH / 2);
        ctx.fillText(sp.punct, W / 2 + bw / 2, y + L.lineH / 2);
        ctx.textAlign = "center";
      } else {
        ctx.fillText(line, W / 2, y + L.lineH / 2);
      }
      y += L.lineH;
    }
    y += 90;
    // 诗海阴刻 logo（印章位）
    if (logoImg) {
      ctx.drawImage(logoImg, W / 2 - L.logoW / 2, y, L.logoW, L.logoH);
    } else {
      ctx.fillStyle = sealColor;
      roundRectPath(ctx, W / 2 - L.logoW / 2, y, L.logoW, L.logoH, L.logoH * 0.15);
      ctx.fill();
    }
    y += L.logoH + 90;
    ctx.fillStyle = catColor;
    ctx.font = L.catFont + "px " + FONT;
    ctx.fillText(footerText, W / 2, y + L.catFont / 2);
    if (signText) {
      y += L.catFont + 24;
      ctx.fillStyle = metaColor;
      ctx.font = Math.round(L.catFont * 0.95) + "px " + FONT;
      ctx.fillText(signText, W / 2, y + L.catFont / 2);
    }
  } else {
    // ---------- 竖排：右标题列 → 诗句列 → 左作者列；竖版 logo 置于页面底部；全部元素不出边框 ----------
    const ADV = 1.35;
    const footerH = Math.round(W * 0.05);
    const availW = W - M * 2;
    const metaCol = authorMeta.replace(/ /g, ""); // 竖排作者列去掉空格，朝代与作者不隔太远
    const maxChars = Math.max(
      title.length, metaCol.length,
      ...verses.map((x) => x.length), 1
    );
    const sizeFor = (ah) => Math.max(
      Math.min(
        Math.floor(ah / (maxChars * ADV + 4.2)),
        Math.floor(availW / ((verses.length + 1.15) * ADV + 1)),
        Math.round(W * 0.04)
      ), 30);
    // 先估算字号，再为底部 logo 预留空间重算，保证内容不与 logo 重叠
    let charSize = sizeFor(H - M * 2 - footerH);
    const vLogoW = Math.round(charSize * 1.6);
    const vLogoH = Math.round(vLogoW / V_LOGO_RATIO);
    const vLogoGap = Math.round(charSize * 0.9);
    const availH = H - M * 2 - footerH - vLogoH - vLogoGap;
    charSize = sizeFor(availH);
    const colGap = Math.round(charSize * ADV);
    const totalW = colGap * (verses.length + 1.15);
    const topPad = charSize * 0.55;
    const totalH = topPad + (maxChars - 1) * colGap + charSize * 0.85;
    const startY = M + Math.max(0, (availH - totalH) / 2) + topPad;

    const drawVCol = (cx, text, size, weight, color) => {
      ctx.font = weight + " " + size + "px " + FONT;
      ctx.fillStyle = color;
      let yy = startY;
      for (const ch of text) {
        ctx.fillText(ch, cx, yy);
        yy += colGap;
      }
      return yy;
    };

    let x = W / 2 + totalW / 2;
    drawVCol(x, title, Math.round(charSize * 1.1), "600", textColor);
    x -= Math.round(colGap * 1.15);
    for (const v of verses) {
      drawVCol(x, v, charSize, "400", textColor);
      x -= colGap;
    }
    drawVCol(x, metaCol, Math.round(charSize * 0.6), "400", metaColor);
    // 诗海竖版 logo：页面底部水平居中（页脚之上），与内容不重叠
    const vBoxY = H - M - footerH - vLogoH;
    if (logoImg) {
      ctx.drawImage(logoImg, W / 2 - vLogoW / 2, vBoxY, vLogoW, vLogoH);
    } else {
      ctx.fillStyle = sealColor;
      roundRectPath(ctx, W / 2 - vLogoW / 2, vBoxY, vLogoW, vLogoH, vLogoH * 0.15);
      ctx.fill();
    }
    // 页脚：不超出内框——超宽自动缩字号
    const fMaxW = W - M * 0.9 - 40;
    const vFooter = signText ? footerText + " \u00b7 " + signText : footerText;
    let fSize = Math.round(20 * (W / 750));
    ctx.fillStyle = catColor;
    for (;;) {
      ctx.font = fSize + "px " + FONT;
      if (ctx.measureText(vFooter).width <= fMaxW || fSize <= 28) break;
      fSize -= 4;
    }
    ctx.fillText(vFooter, W / 2, H - M * 0.45 - fSize * 0.75);
  }
}

// 批注卡片：批注大字居上、全诗小字在下；边框/水印/印章 logo/页脚与诗词卡片同风格
// opts: { canvas, ctx, note, ratio, cardW, cardH, colors, logoPath }
async function drawNoteShare(opts) {
  const { canvas, ctx, note, ratio, cardW, cardH, colors, logoPath } = opts;
  const bg = colors.bg || "#f4f1e8";
  const textColor = colors.text || "#2f2a24";
  const metaColor = colors.meta || "#766d63";
  const accent = colors.accent || "#4f5f4a";
  const catColor = colors.category || "#958a7e";
  const sealColor = colors.seal || "#a3382f";
  const HANG = "\uff0c\u3001\u3002\uff01\uff1f\uff1b\uff1a";

  const title = note.t || "\u65e0\u9898";
  const authorMeta = [note.d, note.a].filter(Boolean).join(" \u00b7 ");
  const verses = verse.splitVerses(note.c || "");

  const W = 3000;
  let H;
  if (ratio === "auto") {
    const cw = cardW || 1;
    const ch = cardH || cw;
    H = Math.round((W * ch) / cw);
  } else {
    const parts = String(ratio).split(":");
    H = Math.round((W * Number(parts[1])) / Number(parts[0]));
  }
  H = Math.min(Math.max(H, 1000), 8000);
  canvas.width = W;
  canvas.height = H;
  const M = Math.round(W * 0.115);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 内框装饰线
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 3;
  ctx.strokeRect(M * 0.45, M * 0.45, W - M * 0.9, H - M * 0.9);
  ctx.globalAlpha = 1;

  // 水印「詩」
  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.fillStyle = textColor;
  ctx.font = "600 " + Math.round(W * 0.38) + "px " + FONT;
  ctx.fillText("\u8a69", W * 0.8, H * 0.87);
  ctx.restore();

  const footerText = "\u8bd7\u6d77 \u00b7 \u975e\u8425\u5229\u53e4\u8bd7\u8bcd\u5171\u4eab\u9879\u76ee";
  const logoImg = await loadImage(canvas, logoPath);

  const SC = W / 750;
  const availW = W - M * 2 - 100;
  const availH = H - M * 2;
  let scale = 1, L, noteLines;
  const layout = () => {
    const noteFont = Math.round(40 * SC * scale);
    const verseFont = Math.round(23 * SC * scale);
    return {
      noteFont, noteLH: Math.round(noteFont * 1.75),
      titleFont: Math.round(26 * SC * scale), metaFont: Math.round(20 * SC * scale),
      verseFont, verseLH: Math.round(verseFont * 1.85),
      logoH: Math.round(verseFont * 1.5), logoW: Math.round(verseFont * 1.5 * LOGO_RATIO),
      catFont: Math.round(20 * SC * scale)
    };
  };
  const wrapNote = (size) => {
    ctx.font = "600 " + size + "px " + FONT;
    const lines = [];
    let cur = "";
    for (const ch of note.n) {
      if (cur && ctx.measureText(cur + ch).width > availW) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const blockH = () =>
    noteLines.length * L.noteLH + 90 + 4 + 90 +
    L.titleFont + 50 + L.metaFont + 60 +
    verses.length * L.verseLH + 80 + L.logoH + 70 + L.catFont;
  for (;;) {
    L = layout();
    noteLines = wrapNote(L.noteFont);
    ctx.font = "600 " + L.noteFont + "px " + FONT;
    let wMax = noteLines.reduce((mx, s) => Math.max(mx, ctx.measureText(s).width), 0);
    ctx.font = "600 " + L.titleFont + "px " + FONT;
    wMax = Math.max(wMax, ctx.measureText(title).width, L.logoW);
    if ((wMax <= availW && blockH() <= availH) || scale <= 0.3) break;
    scale *= Math.max(0.6, Math.min(availW / Math.max(wMax, 1), availH / Math.max(blockH(), 1)));
  }
  let y = M + Math.max(0, (availH - blockH()) / 2);
  ctx.fillStyle = textColor;
  ctx.font = "600 " + L.noteFont + "px " + FONT;
  for (const line of noteLines) {
    ctx.fillText(line, W / 2, y + L.noteLH / 2);
    y += L.noteLH;
  }
  y += 90;
  ctx.save();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(W / 2 - 60, y, 120, 4);
  ctx.restore();
  y += 4 + 90;
  ctx.fillStyle = textColor;
  ctx.font = "600 " + L.titleFont + "px " + FONT;
  ctx.fillText(title, W / 2, y + L.titleFont / 2);
  y += L.titleFont + 50;
  ctx.fillStyle = metaColor;
  ctx.font = L.metaFont + "px " + FONT;
  ctx.fillText(authorMeta, W / 2, y + L.metaFont / 2);
  y += L.metaFont + 60;
  ctx.fillStyle = textColor;
  ctx.font = L.verseFont + "px " + FONT;
  for (const line of verses) {
    const last = line.charAt(line.length - 1);
    if (HANG.includes(last)) {
      const body = line.slice(0, -1);
      const bw = ctx.measureText(body).width;
      ctx.textAlign = "left";
      ctx.fillText(body, W / 2 - bw / 2, y + L.verseLH / 2);
      ctx.fillText(last, W / 2 + bw / 2, y + L.verseLH / 2);
      ctx.textAlign = "center";
    } else {
      ctx.fillText(line, W / 2, y + L.verseLH / 2);
    }
    y += L.verseLH;
  }
  y += 80;
  if (logoImg) {
    ctx.drawImage(logoImg, W / 2 - L.logoW / 2, y, L.logoW, L.logoH);
  } else {
    ctx.fillStyle = sealColor;
    roundRectPath(ctx, W / 2 - L.logoW / 2, y, L.logoW, L.logoH, L.logoH * 0.15);
    ctx.fill();
  }
  y += L.logoH + 70;
  ctx.fillStyle = catColor;
  ctx.font = L.catFont + "px " + FONT;
  ctx.fillText(footerText, W / 2, y + L.catFont / 2);
}

module.exports = { drawShare, drawNoteShare };
