#!/usr/bin/env python3
# 意象索引构建脚本：遍历 data/ 分块，为每块统计包含的意象
# 不修改原始数据库，只生成独立的 data/imagery-index.json
#
# 用法：python3 tools/build_imagery_index.py
# 输出：data/imagery-index.json（网页端 jsDelivr CDN 读这里）
#       cloudfunctions/poemData/data/imagery-index.json.gz（小程序云函数读这里）
#
# 索引格式（分块级，体积小，约 50-80KB）：
# {
#   "v": 1,
#   "total": 344240,
#   "categories": [
#     { "name": "天文气象", "items": ["月","日","星",...] },
#     { "name": "地理自然", "items": ["山","水","江",...] },
#     ...
#   ],
#   "chunks": [
#     { "f": "001.json", "images": ["月","酒","剑",...] },
#     ...
#   ]
# }
import json, gzip, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
CHUNK_COUNT = 345

# 意象词典（5 大类，共 84 个意象）
IMAGERY_DICT = [
    {
        "name": "天文气象",
        "items": ["月", "日", "星", "云", "风", "雨", "雪", "霜", "露", "霞", "虹", "雷", "烟", "雾", "天", "空"]
    },
    {
        "name": "地理自然",
        "items": ["山", "水", "江", "河", "湖", "海", "泉", "溪", "石", "岩", "峰", "谷", "林", "木", "草", "花"]
    },
    {
        "name": "植物花卉",
        "items": ["梅", "兰", "竹", "菊", "松", "柳", "桃", "李", "莲", "荷", "桂", "杏", "枫", "芦", "苔", "藤"]
    },
    {
        "name": "动物生灵",
        "items": ["雁", "燕", "莺", "鹃", "鸦", "鹤", "鱼", "龙", "凤", "虎", "马", "牛", "羊", "犬", "鸡", "蝉"]
    },
    {
        "name": "器物人事",
        "items": ["酒", "茶", "剑", "弓", "琴", "笛", "书", "墨", "舟", "车", "桥", "楼", "钟", "灯", "镜", "帘", "舟船", "客", "乡", "梦"]
    }
]

# 展平所有意象词（按长度降序，优先匹配长词如"舟船"再匹配单字"舟"）
ALL_IMAGES = []
for cat in IMAGERY_DICT:
    ALL_IMAGES.extend(cat["items"])
ALL_IMAGES.sort(key=len, reverse=True)

print("意象词典：", len(IMAGERY_DICT), "类，共", len(ALL_IMAGES), "个意象")
print("开始遍历", CHUNK_COUNT, "个分块...")

chunks_index = []
total_poems = 0

for i in range(1, CHUNK_COUNT + 1):
    fname = f"{i:03d}.json"
    fpath = os.path.join(DATA_DIR, fname)
    if not os.path.exists(fpath):
        print(f"  跳过（不存在）: {fname}")
        continue

    with open(fpath, "r", encoding="utf-8") as f:
        poems = json.load(f)

    total_poems += len(poems)
    # 统计该块包含哪些意象（在标题或正文中出现）
    block_images = set()
    for p in poems:
        text = (p.get("t", "") + p.get("c", ""))
        for img in ALL_IMAGES:
            if img in text:
                block_images.add(img)

    chunks_index.append({"f": fname, "images": sorted(block_images)})

    if i % 50 == 0:
        print(f"  已处理 {i}/{CHUNK_COUNT} 块")

out = {
    "v": 1,
    "total": total_poems,
    "categories": IMAGERY_DICT,
    "chunks": chunks_index
}

# 写明文 JSON（网页端读这里）
out_path = os.path.join(DATA_DIR, "imagery-index.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

# 写 gzip 副本（小程序云函数读这里）
gz_path = os.path.join(ROOT, "cloudfunctions", "poemData", "data", "imagery-index.json.gz")
with open(gz_path, "wb") as f:
    f.write(gzip.compress(json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8")))

# 统计
total_images = sum(len(c["images"]) for c in chunks_index)
avg_images = total_images / len(chunks_index) if chunks_index else 0
print(f"\n构建完成：")
print(f"  分块数: {len(chunks_index)}")
print(f"  诗词总数: {total_poems}")
print(f"  平均每块意象数: {avg_images:.1f}")
print(f"  输出: {out_path}")
print(f"  输出: {gz_path}")
