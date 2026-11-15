#!/usr/bin/env bash
# 生成两套图标资源：
#   - 传统 PNG：白底留白 + 缩小印章 + 柔和投影（无 alpha，供旧系统回退）
#   - Icon Composer 前景层：透明底、无投影，交系统渲染 Liquid Glass
# 用法: make_appicon.sh [源 PNG] [传统 PNG 输出] [Icon 前景 PNG 输出]
set -euo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPTS/../.." && pwd)"
SRC="${1:-$REPO/assets/icons/icon-512.png}"
OUT="${2:-$SCRIPTS/../Shihai/Assets.xcassets/AppIconLegacy.appiconset/AppIcon-1024.png}"
FG="${3:-$SCRIPTS/../Shihai/AppIcon.icon/Assets/foreground.png}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$(dirname "$OUT")" "$(dirname "$FG")"
swiftc "$SCRIPTS/make_appicon.swift" -o "$TMP/make_appicon"
"$TMP/make_appicon" "$SRC" "$OUT" "$FG"

if sips -g hasAlpha "$OUT" | grep -q 'yes'; then
  echo "传统图标仍含 alpha 通道" >&2
  exit 1
fi
if sips -g hasAlpha "$FG" | grep -q 'no'; then
  echo "Icon 前景层缺少 alpha 通道" >&2
  exit 1
fi
sips -g pixelWidth -g pixelHeight "$OUT" "$FG" >/dev/null
echo "已生成: $OUT 与 $FG"
