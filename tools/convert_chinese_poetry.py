#!/usr/bin/env python3
"""
将 chinese-poetry/chinese-poetry 仓库数据转换为本项目格式并切分：
- 字段映射为短键名：t=标题, a=作者, d=朝代, y=体裁, c=正文
- 繁体（全唐诗等）统一转简体，清理 PUA/乱码字符与正文内空格
- 诗类按句长/句数推断体裁（五七言绝句/律诗/古风），词以词牌为体裁
- 按 (作者+标题+正文前20字) 去重
- 每块 1000 首，输出 poetry-site/data/NNN.json（覆盖旧数据）
- 生成精简索引 index.json（file/count/dynasties）
  与筛选索引 index-full.json（额外含 authors/types）
"""
import glob
import json
import os
import re
import shutil

from zhconv import convert

# 仓库内自包含路径：语料在 sources/chinese-poetry，输出到 data/
_HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(_HERE, "..", "sources", "chinese-poetry")
OUT = os.path.join(_HERE, "..", "data")
CHUNK_SIZE = 1000

# 朝代排序权重（影响分块顺序，与筛选下拉无关）
DYNASTY_ORDER = ["先秦", "汉", "魏晋", "三国", "南北朝", "隋", "唐", "五代", "宋", "金", "元", "明", "清", "近代"]

PUNCT_END = "。！？；，、：…"
RE_WS = re.compile(r"[\s\u3000]+")


def clean_text(s):
    """PUA(U+E000-F8FF) 与 U+FFFD 无法渲染 → □；去掉内部空白"""
    if not isinstance(s, str):
        return ""
    s = RE_WS.sub("", s)
    return "".join(
        "□" if (0xE000 <= ord(ch) <= 0xF8FF or ord(ch) == 0xFFFD or ord(ch) > 0xFFFF) else ch
        for ch in s
    )


def t2s(s):
    r = convert(s, "zh-cn")
    if any(ord(ch) > 0xFFFF for ch in r):
        # zhconv 会把个别生僻字转到扩展区（网页字体无法渲染），
        # 此时逐字转换，仍得到非 BMP 的保留原字
        out = []
        for ch in s:
            c = convert(ch, "zh-cn")
            out.append(ch if (not c or any(ord(x) > 0xFFFF for x in c)) else c)
        return "".join(out)
    return r


def join_lines(lines, to_simplified):
    """拼接正文：行尾无标点时补句号"""
    parts = []
    for ln in lines:
        ln = clean_text(ln)
        if not ln:
            continue
        if to_simplified:
            ln = t2s(ln)
        if ln[-1] not in PUNCT_END:
            ln += "。"
        parts.append(ln)
    return "".join(parts)


def infer_shi_type(content):
    """按小句字数与句数推断诗的体裁（全唐诗每段为一联，需先按标点拆小句；4=绝句 8=律诗）"""
    clauses = re.split(r"[。！？；，、]", content)
    clauses = [c for c in clauses if c]
    if not clauses:
        return ""
    lens = {sum(1 for ch in c if ch not in PUNCT_END) for c in clauses}
    if len(lens) != 1:
        return ""
    n = lens.pop()
    cnt = len(clauses)
    if n == 5:
        return {4: "五言绝句", 8: "五言律诗"}.get(cnt, "五言古风")
    if n == 7:
        return {4: "七言绝句", 8: "七言律诗"}.get(cnt, "七言古风")
    return ""


def norm_author(a):
    a = clean_text(a)
    # 全唐诗作者常带官职括号注记，如 "李白（一作…）"，保留原名
    return a or "佚名"


poems = []
seen = set()


def add(title, author, dynasty, type_name, content, to_simplified=False):
    title = clean_text(title)
    author = clean_text(author)
    if to_simplified:
        title = t2s(title)
        author = t2s(author)
    title = title or "无题"
    author = author or "佚名"
    content = clean_text(content)
    if not content or len(content) < 4:
        return
    key = (author, title, content[:20])
    if key in seen:
        return
    seen.add(key)
    poems.append({"t": title, "a": author, "d": dynasty, "y": type_name, "c": content})


def load_shi(pattern, dynasty, simplified):
    """全唐诗/全宋诗：poet.*.json，paragraphs 各为一联（已带标点）"""
    files = sorted(glob.glob(os.path.join(ROOT, pattern)))
    n = 0
    for fp in files:
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
        for p in data:
            lines = [clean_text(x) for x in (p.get("paragraphs") or []) if clean_text(x)]
            if not lines:
                continue
            content = join_lines(lines, not simplified)
            y = infer_shi_type(content)
            title = p.get("title") or ""
            add(title, p.get("author") or "", dynasty, y, content, to_simplified=not simplified)
            n += 1
    print(f"  {pattern}: {n} 首")


def load_ci(pattern, dynasty):
    """宋词：ci.song.*.json，rhythmic=词牌"""
    files = sorted(glob.glob(os.path.join(ROOT, pattern)))
    n = 0
    for fp in files:
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
        for p in data:
            lines = [clean_text(x) for x in (p.get("paragraphs") or []) if clean_text(x)]
            if not lines:
                continue
            content = join_lines(lines, False)
            rhythmic = clean_text(p.get("rhythmic") or "")
            title = clean_text(p.get("title") or "")
            full_title = rhythmic + ("·" + title if title else "")
            add(full_title or rhythmic, p.get("author") or "", dynasty, rhythmic or "词", content)
            n += 1
    print(f"  {pattern}: {n} 首")


def main():
    print("== 唐诗（全唐诗 poet.tang，繁体转简体） ==")
    load_shi("全唐诗/poet.tang.*.json", "唐", simplified=False)

    print("== 宋诗（全唐诗目录 poet.song，繁体转简体） ==")
    load_shi("全唐诗/poet.song.*.json", "宋", simplified=False)

    print("== 宋词（ci.song，简体） ==")
    load_ci("宋词/ci.song.*.json", "宋")

    print("== 元曲 ==")
    with open(os.path.join(ROOT, "元曲/yuanqu.json"), encoding="utf-8") as f:
        data = json.load(f)
    n = 0
    for p in data:
        lines = [clean_text(x) for x in (p.get("paragraphs") or []) if clean_text(x)]
        if not lines:
            continue
        title = clean_text(p.get("title") or "")
        # 曲牌名并入标题展示，体裁统一为元曲（避免曲牌碎片化）
        add(title, p.get("author") or "", "元", "元曲", join_lines(lines, False))
        n += 1
    print(f"  元曲: {n} 首")

    print("== 五代（花间集 + 南唐） ==")
    n = 0
    for fp in sorted(glob.glob(os.path.join(ROOT, "五代诗词/huajianji/huajianji-*-juan.json"))):
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
        for p in data:
            lines = [clean_text(x) for x in (p.get("paragraphs") or []) if clean_text(x)]
            if not lines:
                continue
            rhythmic = clean_text(p.get("rhythmic") or "")
            title = clean_text(p.get("title") or "")
            add(title or rhythmic, p.get("author") or "", "五代", rhythmic or "词", join_lines(lines, False))
            n += 1
    with open(os.path.join(ROOT, "五代诗词/nantang/poetrys.json"), encoding="utf-8") as f:
        data = json.load(f)
    for p in data:
        lines = [clean_text(x) for x in (p.get("paragraphs") or []) if clean_text(x)]
        if not lines:
            continue
        rhythmic = clean_text(p.get("rhythmic") or "")
        add(rhythmic, p.get("author") or "", "五代", rhythmic or "词", join_lines(lines, False))
        n += 1
    print(f"  五代: {n} 首")

    print("== 小集合（曹操/纳兰/楚辞/诗经） ==")
    n = 0
    with open(os.path.join(ROOT, "曹操诗集/caocao.json"), encoding="utf-8") as f:
        for p in json.load(f):
            lines = [clean_text(x) for x in (p.get("paragraphs") or []) if clean_text(x)]
            add(p.get("title") or "", p.get("author") or "曹操", "三国", "", join_lines(lines, False))
            n += 1
    with open(os.path.join(ROOT, "纳兰性德/纳兰性德诗集.json"), encoding="utf-8") as f:
        for p in json.load(f):
            lines = [clean_text(x) for x in (p.get("para") or []) if clean_text(x)]
            title = clean_text(p.get("title") or "")
            y = title.split("·", 1)[0] if "·" in title else "词"
            add(title, p.get("author") or "纳兰性德", "清", y, join_lines(lines, False))
            n += 1
    with open(os.path.join(ROOT, "楚辞/chuci.json"), encoding="utf-8") as f:
        for p in json.load(f):
            lines = [clean_text(x) for x in (p.get("content") or []) if clean_text(x)]
            add(p.get("title") or "", p.get("author") or "屈原", "先秦", "楚辞", join_lines(lines, False))
            n += 1
    with open(os.path.join(ROOT, "诗经/shijing.json"), encoding="utf-8") as f:
        for p in json.load(f):
            lines = [clean_text(x) for x in (p.get("content") or []) if clean_text(x)]
            chapter = clean_text(p.get("chapter") or "")
            section = clean_text(p.get("section") or "")
            add(p.get("title") or "", "佚名", "先秦", "诗经", join_lines(lines, False))
            n += 1
    print(f"  小集合: {n} 首")

    # 按朝代 → 作者 → 标题排序后切块
    def dkey(p):
        d = p["d"]
        return (DYNASTY_ORDER.index(d) if d in DYNASTY_ORDER else 99, p["a"], p["t"])

    poems.sort(key=dkey)

    # 覆盖写入 data/ 目录
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    slim, full = [], []
    total = 0
    for i in range(0, len(poems), CHUNK_SIZE):
        sub = poems[i : i + CHUNK_SIZE]
        fname = f"{i // CHUNK_SIZE + 1:03d}.json"
        with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
            json.dump(sub, f, ensure_ascii=False, separators=(",", ":"))
        dynasties = sorted({p["d"] for p in sub} - {""})
        authors = sorted({p["a"] for p in sub} - {""})
        types = sorted({p["y"] for p in sub} - {""})
        slim.append({"file": fname, "count": len(sub), "dynasties": dynasties})
        full.append({"file": fname, "count": len(sub), "dynasties": dynasties,
                     "authors": authors, "types": types})
        total += len(sub)

    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"total": total, "chunks": slim}, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(OUT, "index-full.json"), "w", encoding="utf-8") as f:
        json.dump({"total": total, "chunks": full}, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT)) / 1048576
    print(f"\n完成：共 {total} 首，{len(slim)} 个分块（每块 ≤{CHUNK_SIZE} 首），数据总大小 {size_mb:.1f} MB")
    print(f"index.json      {os.path.getsize(os.path.join(OUT, 'index.json')) / 1024:.1f} KB")
    print(f"index-full.json {os.path.getsize(os.path.join(OUT, 'index-full.json')) / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
