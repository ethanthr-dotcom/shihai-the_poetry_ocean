#!/usr/bin/env bash
# 由仓库 512px 图标生成 App Store 要求的 1024px 无 alpha 图标。
# 用法: make_appicon.sh [源 PNG] [输出 PNG]
set -euo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPTS/../.." && pwd)"
SRC="${1:-$REPO/assets/icons/icon-512.png}"
OUT="${2:-$SCRIPTS/../Shihai/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 放大 → 经 JPEG 去除 alpha（透明区落白）→ 转回 PNG
sips -z 1024 1024 "$SRC" --out "$TMP/icon.png" >/dev/null
sips -s format jpeg -s formatOptions 95 "$TMP/icon.png" --out "$TMP/icon.jpg" >/dev/null
sips -s format png "$TMP/icon.jpg" --out "$OUT" >/dev/null

if sips -g hasAlpha "$OUT" | grep -q 'yes'; then
  echo "图标仍含 alpha 通道" >&2
  exit 1
fi
echo "已生成: $OUT (1024x1024, 无 alpha)"
