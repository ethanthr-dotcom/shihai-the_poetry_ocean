// 与网页版一致的正文拆分规则
const HANG_PUNCT = "，、。！？；：";

// 按完整句拆分正文（。！？；各占一行）
function splitVerses(text) {
  const clean = (text || "").replace(/\s+/g, "");
  if (!clean) return [];
  const lines = [];
  let buf = "";
  for (const ch of clean) {
    buf += ch;
    if ("。！？；".includes(ch)) {
      lines.push(buf);
      buf = "";
    }
  }
  if (buf) lines.push(buf);
  return lines;
}

// 按逗号/顿号拆分长句为完整分句（每行都以标点结尾）
function splitClauseLines(text) {
  const parts = [];
  let buf = "";
  for (const ch of text) {
    buf += ch;
    if ("，、".includes(ch)) {
      parts.push(buf);
      buf = "";
    }
  }
  if (buf) parts.push(buf);
  return parts.length > 1 ? parts : [text];
}

// 判断是否为五言/七言绝句
function isShortJueju(poem) {
  const t = poem.y || "";
  if (/五言绝句|七言绝句/.test(t)) return true;
  const clauses = [];
  for (const v of splitVerses(poem.c)) {
    for (const c of splitClauseLines(v)) clauses.push(c);
  }
  if (clauses.length < 2 || clauses.length > 4) return false;
  return clauses.every((c) => {
    const n = c.replace(/[，、。！？；]/g, "").length;
    return n === 5 || n === 7;
  });
}

// 悬挂标点拆分：居中按文字计算，行尾标点不参与居中
function hangSplit(text) {
  const last = text.charAt(text.length - 1);
  if (HANG_PUNCT.includes(last)) {
    return { body: text.slice(0, -1), punct: last };
  }
  return { body: text, punct: "" };
}

module.exports = { HANG_PUNCT, splitVerses, splitClauseLines, isShortJueju, hangSplit };
