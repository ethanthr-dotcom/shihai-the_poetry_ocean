#!/usr/bin/env python3
"""把仓库里的网页版与全部数据组装成 iOS App 的离线资源包 WebRoot。

用法: prepare-webroot.py <仓库根目录> <输出目录>
输出目录会直接写进 .app bundle，运行时由 LocalSchemeHandler 逐文件映射。
所有内容都来自本机磁盘，脚本不访问网络，产物中不含任何远程 URL。
"""

import hashlib
import json
import pathlib
import shutil
import sys

DATA_SOURCE_LINE = r'''    const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    const DATA_BASE = IS_LOCAL ? "" : "https://cdn.jsdelivr.net/gh/ethanthr-dotcom/shihai-the_poetry_ocean@main/";'''

DATA_REPLACEMENT = '''    // iOS 离线版：DATA_BASE 恒为空，345 个数据分块 + 3 个索引全部内嵌在 App Bundle
    const IS_LOCAL = true;
    const DATA_BASE = "";'''

IOS_HEAD = '''<head>
  <script src="shihai-native.js"></script>
  <style id="shihai-ios">html,body{-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}</style>'''


def signature(folder: pathlib.Path) -> dict:
    files = sorted(p for p in folder.iterdir() if p.is_file())
    return {
        "count": len(files),
        "bytes": sum(p.stat().st_size for p in files),
        "mtime": max((int(p.stat().st_mtime) for p in files), default=0),
    }


def sync_tree(src: pathlib.Path, dst: pathlib.Path) -> None:
    """增量同步，只覆盖变化的文件，不删除目录（避免构建期大批量删除）。"""
    dst.mkdir(parents=True, exist_ok=True)
    for item in sorted(src.iterdir()):
        if item.name.startswith("."):
            continue
        target = dst / item.name
        if item.is_dir():
            sync_tree(item, target)
        elif item.is_file():
            if target.exists():
                a, b = item.stat(), target.stat()
                if a.st_size == b.st_size and int(a.st_mtime) <= int(b.st_mtime):
                    continue
            shutil.copy2(item, target)


def copy_tree(src: pathlib.Path, dst: pathlib.Path, stamp: dict, key: str):
    sig = signature(src)
    if dst.is_dir() and signature(dst).get("count") == sig["count"] and stamp.get(key) == sig:
        return "cached"
    sync_tree(src, dst)
    stamp[key] = sig
    return "synced"


def make_offline_html(repo: pathlib.Path, dest: pathlib.Path) -> str:
    html = (repo / "index.html").read_text(encoding="utf-8")
    if DATA_SOURCE_LINE not in html:
        raise RuntimeError("index.html 的数据源配置行与预期不符，请检查上游版本")
    html = html.replace(DATA_SOURCE_LINE, DATA_REPLACEMENT, 1)
    html = html.replace('  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>\n', "", 1)
    if html.count("<head>") != 1:
        raise RuntimeError("index.html 的 <head> 标记异常")
    html = html.replace("<head>", IOS_HEAD, 1)
    if "jsdelivr" in html:
        raise RuntimeError("离线版 index.html 仍残留 CDN 引用")
    (dest / "index.html").write_text(html, encoding="utf-8")
    return hashlib.sha256(html.encode("utf-8")).hexdigest()[:16]


def main() -> int:
    if len(sys.argv) != 3:
        print("用法: prepare-webroot.py <仓库根目录> <输出目录>", file=sys.stderr)
        return 2
    repo = pathlib.Path(sys.argv[1]).resolve()
    dest = pathlib.Path(sys.argv[2]).resolve()
    ios = repo / "ios"
    for required in ("index.html", "data", "assets", "ios/Shihai/shihai-native.js"):
        if not (repo / required).exists():
            raise RuntimeError("缺少必需文件: " + required)
    dest.mkdir(parents=True, exist_ok=True)

    stamp_path = dest / ".shihai-stamp"
    old_stamp = {}
    if stamp_path.exists():
        try:
            old_stamp = json.loads(stamp_path.read_text(encoding="utf-8"))
        except Exception:
            old_stamp = {}

    html_sig = {
        "count": 1,
        "bytes": (repo / "index.html").stat().st_size,
        "mtime": int((repo / "index.html").stat().st_mtime),
    }
    stamp = {k: v for k, v in old_stamp.items() if k in ("data", "assets") and isinstance(v, dict)}
    if old_stamp.get("index") == html_sig and (dest / "index.html").exists():
        stamp["index"] = html_sig
        html_hash = "cached"
    else:
        html_hash = make_offline_html(repo, dest)
        stamp["index"] = html_sig

    shutil.copy2(ios / "Shihai" / "shihai-native.js", dest / "shihai-native.js")
    copy_tree(repo / "data", dest / "data", stamp, "data")
    copy_tree(repo / "assets", dest / "assets", stamp, "assets")
    stamp_path.write_text(json.dumps(stamp, ensure_ascii=False, sort_keys=True), encoding="utf-8")

    chunks = [p for p in (dest / "data").iterdir() if p.suffix == ".json"]
    total_bytes = sum(p.stat().st_size for p in (dest / "data").iterdir() if p.is_file())
    if len(chunks) < 348:
        raise RuntimeError("数据分块不完整: %d" % len(chunks))
    offline = (dest / "index.html").read_text(encoding="utf-8")
    if "jsdelivr" in offline or 'const DATA_BASE = "";' not in offline:
        raise RuntimeError("离线校验失败")
    print(
        "[WebRoot] index=%s chunks=%d data=%.1f MB assets=%d -> %s"
        % (
            html_hash,
            len(chunks),
            total_bytes / 1024 / 1024,
            len([p for p in (dest / "assets").rglob("*") if p.is_file()]),
            dest,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
