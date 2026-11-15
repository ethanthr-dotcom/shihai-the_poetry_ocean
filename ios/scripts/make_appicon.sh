#!/usr/bin/env bash
# 由 512px 印章源图生成 App Store 要求的 1024px 无 alpha 图标：
# 白底留白 + 缩小的圆形 logo + 柔和投影。
# 用法: make_appicon.sh [源 PNG] [输出 PNG]
set -euo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPTS/../.." && pwd)"
SRC="${1:-$REPO/assets/icons/icon-512.png}"
OUT="${2:-$SCRIPTS/../Shihai/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

swiftc "$SCRIPTS/make_appicon.swift" -o "$TMP/make_appicon"
"$TMP/make_appicon" "$SRC" "$OUT"

if sips -g hasAlpha "$OUT" | grep -q 'yes'; then
  echo "图标仍含 alpha 通道" >&2
  exit 1
fi
sips -g pixelWidth -g pixelHeight "$OUT" >/dev/null
echo "已生成: $OUT"
