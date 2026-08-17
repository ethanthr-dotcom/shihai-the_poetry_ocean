#!/usr/bin/env python3
# 重建 search-index.json：移除高频字符（出现在 >50% 分块中的字符），大幅减小体积
# 高频字符对 narrowByDigest 无区分作用（几乎所有块都含），移除后：
#   - 文件体积降约 59%
#   - 前端 Set 更小，过滤更快
#   - 新增 globalChars 字段，记录被索引的字符集合（移除高频后）
# 前端 narrowByDigest 只对 kw 中属于 globalChars 的字符做"必须包含"判断，其余跳过
# 向后兼容：若无 globalChars 字段（v1），回退到"全部字符都判断"的原逻辑
#
# 用法：python3 tools/rebuild_search_index.py
# 输出：data/search-index.json + cloudfunctions/poemData/data/search-index.json.gz
import json, gzip, os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "search-index.json")
HIGH_FREQ_RATIO = 0.5  # 出现在 >50% 分块中的字符视为高频，移除

with open(SRC, "r", encoding="utf-8") as f:
    d = json.load(f)

chunks = d.get("chunks", [])
n = len(chunks)

# 统计每个字符出现在多少块中
char_blocks = Counter()
for c in chunks:
    for ch in set(c.get("cs", "")):
        char_blocks[ch] += 1

threshold = n * HIGH_FREQ_RATIO
high_freq = set(ch for ch, cnt in char_blocks.items() if cnt > threshold)

# 重建：每块 cs 只保留非高频字符（去重排序，排序保证确定性）
new_chunks = []
all_kept = set()
for c in chunks:
    kept = sorted(set(c.get("cs", "")) - high_freq)
    all_kept.update(kept)
    new_chunks.append({"f": c["f"], "cs": "".join(kept)})

out = {
    "v": 2,
    "total": d.get("total", 0),
    "globalChars": "".join(sorted(all_kept)),
    "chunks": new_chunks,
}

# 写明文 JSON（网页端 jsDelivr CDN 读这里）
with open(SRC, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

# 写 gzip 副本（小程序云函数读这里）
gz_path = os.path.join(ROOT, "cloudfunctions", "poemData", "data", "search-index.json.gz")
with open(gz_path, "wb") as f:
    f.write(gzip.compress(json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8")))

old_total = sum(len(c.get("cs", "")) for c in chunks)
new_total = sum(len(c["cs"]) for c in new_chunks)
print("重建完成：")
print("  分块数:", n)
print("  全局唯一字符:", len(char_blocks))
print("  移除高频字符:", len(high_freq), "(出现在 >", int(HIGH_FREQ_RATIO * 100), "% 块中)")
print("  保留索引字符:", len(all_kept))
print("  字符总量:", old_total, "->", new_total, "(降", round((1 - new_total / old_total) * 100, 1), "%)")
print("  输出:", SRC)
print("  输出:", gz_path)
