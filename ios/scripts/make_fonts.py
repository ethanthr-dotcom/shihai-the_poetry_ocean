#!/usr/bin/env python3
"""把本机安装的思源宋体（Source Han Serif CN）转换为 App 内嵌的 woff2。

默认源目录 ~/Library/Fonts，输出 ios/Shihai/fonts/。
需要 fontTools + brotli：python3 -m pip install fonttools brotli

用法: make_fonts.py [--src-dir DIR] [--out-dir DIR]
"""
import argparse
import pathlib
import shutil
import sys

WEIGHTS = {
    "SourceHanSerifCN-Regular-1.otf": "SourceHanSerifCN-Regular.woff2",
    "SourceHanSerifCN-Bold-2.otf": "SourceHanSerifCN-Bold.woff2",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src-dir", default=str(pathlib.Path.home() / "Library/Fonts"))
    parser.add_argument("--out-dir", default=str(
        pathlib.Path(__file__).resolve().parent.parent / "Shihai/fonts"))
    args = parser.parse_args()

    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        print("缺少 fontTools，请先运行: python3 -m pip install fonttools brotli", file=sys.stderr)
        return 1

    src_dir = pathlib.Path(args.src_dir).expanduser()
    out_dir = pathlib.Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    for source_name, target_name in WEIGHTS.items():
        source = src_dir / source_name
        if not source.exists():
            print("缺少字体文件: %s" % source, file=sys.stderr)
            return 1
        target = out_dir / target_name
        font = TTFont(str(source))
        font.flavor = "woff2"
        font.save(str(target))
        print("%s -> %s (%.1f MB)" % (
            source_name, target, target.stat().st_size / 1048576))
    return 0


if __name__ == "__main__":
    sys.exit(main())
