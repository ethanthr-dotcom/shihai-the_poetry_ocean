#!/usr/bin/env bash
# 一键构建诗海 iOS 离线版：模拟器 .app + 真机 .ipa
# 数据全部来自仓库本地 data/ assets/，构建过程不访问网络。
set -euo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS="$(cd "$SCRIPTS/.." && pwd)"
REPO="$(cd "$IOS/.." && pwd)"
OUT="$IOS/build"
DD="$OUT/DerivedData"
PROJ="$IOS/Shihai.xcodeproj"

mkdir -p "$OUT"
echo "==> 项目: $PROJ"

ICON="$IOS/Shihai/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
if [ ! -f "$ICON" ]; then
  echo "==> 图标缺失，自动生成"
  bash "$SCRIPTS/make_appicon.sh" "$REPO/assets/icons/icon-512.png" "$ICON"
fi

echo "==> [1/3] 构建 iOS Simulator (Release)"
xcodebuild -project "$PROJ" -scheme Shihai -configuration Release \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath "$DD" \
  CODE_SIGNING_ALLOWED=NO build 2>&1 | tee "$OUT/xcodebuild-simulator.log" | tail -n 18

echo "==> [2/3] 构建 iOS Device (Release, unsigned)"
xcodebuild -project "$PROJ" -scheme Shihai -configuration Release \
  -destination 'generic/platform=iOS' -sdk iphoneos -derivedDataPath "$DD" \
  CODE_SIGNING_ALLOWED=NO build 2>&1 | tee "$OUT/xcodebuild-device.log" | tail -n 18

SIM_APP="$DD/Build/Products/Release-iphonesimulator/Shihai.app"
DEV_APP="$DD/Build/Products/Release-iphoneos/Shihai.app"
for app in "$SIM_APP" "$DEV_APP"; do
  [ -d "$app" ] || { echo "构建产物缺失: $app" >&2; exit 1; }
done

echo "==> [3/3] 打包 IPA 并校验内嵌资源"
# 旧产物移到临时目录，避免直接批量删除
STALE="$OUT/.stale-$(date +%s)"
mkdir -p "$STALE"
for item in Payload Shihai-Simulator.app Shihai-device-unsigned.app; do
  [ -e "$OUT/$item" ] && mv "$OUT/$item" "$STALE/$item"
done
rm -f "$OUT/Shihai-unsigned.ipa"
cp -R "$SIM_APP" "$OUT/Shihai-Simulator.app"
cp -R "$DEV_APP" "$OUT/Shihai-device-unsigned.app"
mkdir -p "$OUT/Payload"
cp -R "$DEV_APP" "$OUT/Payload/Shihai.app"
(cd "$OUT" && zip -qry Shihai-unsigned.ipa Payload)

for app in "$OUT/Shihai-Simulator.app" "$OUT/Payload/Shihai.app"; do
  COUNT=$(find "$app/WebRoot/data" -name '*.json' -type f | wc -l | tr -d ' ')
  if [ "$COUNT" -lt 348 ]; then echo "数据分块不完整 ($COUNT) in $app" >&2; exit 1; fi
  python3 - "$app/WebRoot/index.html" <<'PY' || exit 1
import sys
from pathlib import Path
html = Path(sys.argv[1]).read_text(encoding="utf-8")
assert 'const DATA_BASE = "";' in html, "未强制离线数据源"
assert "jsdelivr" not in html and "https://" not in html, "残留远程 URL"
assert 'src="shihai-native.js"' in html, "缺少原生桥接层"
print("  离线校验通过:", sys.argv[1])
PY
  if [ ! -f "$app/WebRoot/shihai-native.js" ] || [ ! -d "$app/WebRoot/assets" ]; then
    echo "资源缺失: $app" >&2; exit 1
  fi
  printf '  %s : %s 个 JSON, WebRoot %.1f MB\n' \
    "$(basename "$app")" "$COUNT" \
    "$(du -sm "$app/WebRoot" | awk '{print $1}')"
done

{
  echo "诗海 iOS 离线版构建信息"
  date "+构建时间: %Y-%m-%d %H:%M:%S %z"
  echo "Xcode: $(xcodebuild -version | tr '\n' ' ')"
  echo "Bundle ID: com.shihai.poetry.ocean"
  echo "数据: $(find "$OUT/Payload/Shihai.app/WebRoot/data" -name '*.json' -type f | wc -l | tr -d ' ') 个 JSON 分块/索引"
  echo "真机 App: $OUT/Shihai-device-unsigned.app"
  echo "模拟器 App: $OUT/Shihai-Simulator.app"
  echo "未签名 IPA: $OUT/Shihai-unsigned.ipa (需用 Xcode/签名工具重签后安装)"
} > "$OUT/BUILD_INFO.txt"

echo "==> 完成"
cat "$OUT/BUILD_INFO.txt"
