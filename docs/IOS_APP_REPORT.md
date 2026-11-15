# 诗海 · iOS 离线 App 构建报告书

- 日期：2026-11-15
- 环境：macOS / Xcode 27.2 (27B52) / iOS SDK 27.2 / Swift 6.4.2
- 目标：把诗词小程序 / 网页端完整移植为原生 iOS 应用，**全量数据与资源内嵌，运行时零云服务、零网络请求**
- 状态：✅ 构建通过、模拟器实机验证通过

---

## 1. 验收对照

| 要求 | 实现 | 结果 |
|---|---|---|
| 打包成 iOS 应用 | `ios/Shihai.xcodeproj` → `.app` / `.ipa`（iPhone + iPad） | ✅ |
| 所有数据库内嵌 | 345 个诗词分块 + 3 个索引（348 个 JSON，90.3 MB）随包安装 | ✅ |
| 所有资源包内嵌 | `assets/` 12 个图标 / logo + 网页本体 + 原生桥接层 | ✅ |
| 不使用云服务 | 不引入微信云开发、云函数、云数据库；`WKWebView` 只加载自定义离线 scheme | ✅ |
| 不需要询问 | 全程自动决策与执行，无澄清提问 | ✅ |
| 整理目录 / 报告 / README / 推送 | 新增 `ios/`、`docs/`，改写中英文 README，提交并推送 | 见第 9、10 节 |
| 卡片右上角按钮 | 清除 WebKit 按钮原生外观，两个角标统一基线并收进圆角边框内 | ✅ |
| 分享卡片预览 | 底部上弹预览 + 「分享到微信」/「保存到相册」双选项 | ✅ |
| 思源宋体 | 本机 `SourceHanSerifCN` Regular / Bold 转 woff2 内嵌，页面与 Canvas 同步使用 | ✅ |
| 液态玻璃图标 | Icon Composer `.icon` 分层文档接入工程，`actool` 编译出自适应图标 | ✅ |

---

## 2. 交付清单

```
ios/
├── Shihai.xcodeproj/
│   ├── project.pbxproj                 # 工程文件（UIKit + WebKit，iOS 16+）
│   └── xcshareddata/xcschemes/Shihai.xcscheme
├── Shihai/
│   ├── ShihaiApp.swift                 # AppDelegate / SceneDelegate / RootViewController + 启动层
│   ├── OfflineWebView.swift            # WKWebView 控制器、导航策略、原生能力桥接
│   ├── LocalSchemeHandler.swift        # shihai://localhost → .app/WebRoot 文件映射
│   ├── OfflineStore.swift              # localStorage 原生兜底（UserDefaults）
│   ├── shihai-native.js                # 页面侧桥接：分享预览/触感/主题/摇动/字体预载
│   ├── Info.plist                      # 中文应用名、场景、相册/运动权限、weixin 查询
│   ├── fonts/                          # 思源宋体 Regular + Bold（woff2，约 15.7 MB）
│   ├── AppIcon.icon/                   # Icon Composer 液态玻璃分层文档
│   │   ├── icon.json                   #   暖纸白底 + 玻璃印章 + 阴影/半透明设置
│   │   └── Assets/foreground.png       #   透明底圆形印章（1024px）
│   └── Assets.xcassets/
│       ├── AppIconLegacy.appiconset/    # 传统 PNG 图标（留白+阴影，旧系统回退）
│       └── LaunchBackground.colorset/
├── scripts/
│   ├── prepare-webroot.py              # 组装离线资源包、注入字体 CSS、替换 Canvas 字体
│   ├── make_appicon.sh                 # 图标生成入口（传统 PNG + Icon 前景层）
│   ├── make_appicon.swift              # CoreGraphics 双输出绘制
│   ├── make_fonts.py                   # 本机思源宋体 OTF → woff2
│   └── build.sh                        # 一键构建 + 校验 + 打 IPA
└── build/                              # 构建产物（.gitignore 忽略）
    ├── Shihai-Simulator.app            # 模拟器可直接安装
    ├── Shihai-device-unsigned.app      # 真机 App（未签名）
    ├── Shihai-unsigned.ipa             # 约 65 MB
    ├── BUILD_INFO.txt
    └── xcodebuild-*.log
```

其他新增：`docs/IOS_APP_REPORT.md`（本文件）；更新 `README.md`、`README_EN.md`、`.gitignore`；修复 `index.html` 的脚本语法错误。

---

## 3. 架构

```
┌──────────────────────── iOS App（.app）────────────────────────┐
│  UIKit Scene → RootViewController → WKWebView                  │
│     入口 URL: shihai://localhost/index.html                    │
│                    │                                           │
│  WKURLSchemeHandler（LocalSchemeHandler）                       │
│     读取 Bundle.main/.../WebRoot/**，合成 HTTPURLResponse       │
│                    │                                           │
│  WebRoot/                                                      │
│     index.html            ← 网页版 + 强制 DATA_BASE = ""        │
│     shihai-native.js      ← 原生桥接                            │
│     data/*.json           ← 348 个 JSON，90.3 MB（全量内置）    │
│     assets/**             ← 图标 / logo                        │
│     fonts/*.woff2         ← 思源宋体 Regular / Bold（内嵌）    │
│                    │                                           │
│  WKScriptMessageHandler「shihai」                              │
│     预览面板 / 相册保存 / 系统分享 / 触感 / 主题 / 摇动 / KV    │
└───────────────────────────────────────────────────────────────┘
           ↑ 无 URLSession、无 CDN、无云函数、无云数据库
```

**关键选择**：复用网页端 `index.html`（零框架、功能最全），而不是重写小程序 WXML。小程序与网页的数据层同构，网页版已包含随机抽诗、搜索、体裁筛选、收藏、批注、16 主题、分享卡片等全部能力。用自定义 scheme 而非本地 HTTP 服务，避免后台被系统挂起后端口失效。

| 配置 | 值 |
|---|---|
| Bundle ID | `com.shihai.poetry.ocean` |
| 显示名 | 诗海 |
| 最低系统 | iOS 16.0 |
| 设备 | iPhone / iPad（1,2） |
| 版本 | 1.0.0 (1) |
| 签名 | 工程启用 Automatic（Team `6LR3AB4299`）；命令行产物 `CODE_SIGNING_ALLOWED=NO` 未签名 |
| App 图标 | 主图标为 Icon Composer `.icon` 液态玻璃分层文档（暖纸白底 + 玻璃印章，系统生成 Default / Dark / Clear / Tinted）；传统 PNG 留白+阴影版保留作旧系统回退 |
| 内嵌字体 | 思源宋体 CN Regular(400) / Bold(700)，本机 `~/Library/Fonts/SourceHanSerifCN-*.otf` 转 woff2（7.5 + 8.1 MB），页面 CSS 与 Canvas 分享卡片共用 |

---

## 4. 离线保证

1. **数据内置**：`prepare-webroot.py` 在每次构建的 `Embed Offline Web Bundle` 阶段，把仓库 `data/`、`assets/`、`fonts/`、`index.html` 与桥接 JS 增量同步进 `.app/WebRoot/`。不联网、不重复入库大体积数据（数据本来就在仓库里）。字体同样从本地文件加载，没有 web font CDN。
2. **强制离线数据源**：生成的 `index.html` 把 `IS_LOCAL` 固定为 `true`、`DATA_BASE` 固定为空串，删除 CDN `preconnect`；构建校验断言产物中不含 `jsdelivr` / `https://`。
3. **同源 fetch 可用**：`WKURLSchemeHandler` 对 `shihai://localhost/**` 返回带 `Content-Type` 的响应，页面 `fetch("data/...")` 同源执行；自定义 scheme 下 `localStorage` 实测可用，收藏 / 批注 / 主题 / 阅读记录均持久化在本机。
4. **导航白名单**：`decidePolicyFor navigationAction` 仅放行 `shihai` / `data` / `blob` / `about` / `javascript`；`http(s)` 外链交给系统浏览器，WebView 自身不发起网络请求。
5. **本地兜底**：若未来 WebKit 版本把自定义 scheme 判为非安全源导致 `localStorage` 抛异常，`shihai-native.js` 会切换到由 `OfflineStore` 持久化的键值实现。
6. **排除云端**：小程序云函数（`poemData` / `poemData2` / `visitStats`）、云开发环境 ID、访问统计上报全部不进入 iOS 工程。

**关于「所有资源」的边界**：`sources/`（约 359 MB 原始语料）与 `cloudfunctions/*/data/*.gz`（同一份 `data/` 的 gzip 副本）是数据管线的构建输入 / 重复副本，不是运行时依赖，故不嵌入，避免安装包膨胀到 450 MB 以上。运行时所需的数据与资源 100% 内置。

---

## 5. 原生能力桥接

| 网页能力 | iOS 实现 |
|---|---|
| `a[download]` 分享卡片 PNG | 拦截点击 → 底部上弹预览面板（预览图 + 全屏放大 + 关闭），由用户二选一 |
| 预览「保存到相册」 | `PHPhotoLibrary` 写入相册 + 页面 toast |
| 预览「分享到微信」 | `UIActivityViewController` 系统分享面板；已装微信时可在面板中选择微信，未安装时给出提示 |
| 收藏导出 txt（Blob URL） | `FileReader` → `UIActivityViewController` 系统分享 |
| 卡片右上两个角标 | 注入 CSS 清除 WebKit `button` 原生外观、统一尺寸与基线、收进圆角内侧 |
| `navigator.vibrate` 触感 | `UIImpactFeedbackGenerator` |
| 摇一摇换诗 | `CMMotionManager` 加速度检测 → 合成 `devicemotion` 事件 |
| 16 套主题背景 | 页面轮询 `--bg-color` → 同步 UIView 背景与状态栏样式 |
| `alert` / `confirm` | `UIAlertController` |
| 首次启动开屏 | UIKit 启动层遮住 WebView 白屏，`didFinish` 后淡出 |
| JS 异常 | 写入 `Documents/shihai-debug.log`，便于排障 |
| 微信「分享给朋友 / 朋友圈」 | 小程序专用能力不适用；iOS 端通过系统分享面板选择微信，或直接保存卡片到相册 |

---

## 6. 构建流程

```bash
bash ios/scripts/build.sh
```

1. `xcodebuild -scheme Shihai -configuration Release`（模拟器 + 真机，各一次）。
2. 每次构建的 Run Script phase 执行 `prepare-webroot.py`：
   - 修补 `index.html`（离线数据源、注入桥接脚本、移除 CDN 引用、`</head>` 前注入 `@font-face` 与字体变量覆盖、把两处 Canvas `FONT` 换成思源宋体）；
   - 增量同步 `data/`、`assets/`、`fonts/` 到 `$CONTENTS_FOLDER_PATH/WebRoot/`，只覆盖变化文件、不做批量删除；
   - 断言 348 个分块齐全、无远程 URL、两个 woff2 已内嵌。
3. `actool` 编译 `Assets.xcassets` 与 `AppIcon.icon`，生成带 Default / Dark / Clear / Tinted 外观的自适应图标；旧系统图标由 Xcode 自动从 `.icon` 生成。
4. 校验两份 `.app` 内 `WebRoot/data/*.json` 数量、字体文件与离线配置。
5. 复制产物、`zip` 成未签名 IPA、写 `BUILD_INFO.txt`。

构建脚本对环境的两处适配：图标生成改用纯 CoreGraphics 的命令行工具（避免 CLI 中 AppKit 初始化崩溃，同时支持圆形裁剪、留白、投影与透明前景层）；资源同步改为增量覆盖（避免构建期大批量删除被拦截）。字体由 `make_fonts.py` 用 fontTools + brotli 从本机 OTF 转 woff2，体积减少约 30%。

---

## 7. 验证结果

| 项 | 结果 |
|---|---|
| `xcodebuild -list` | Target `Shihai`、Debug/Release、共享 scheme 识别正常 |
| 模拟器 Release 编译 | **BUILD SUCCEEDED** |
| 真机 Release 编译 | **BUILD SUCCEEDED** |
| 包内 JSON 数 | 348（345 分块 + `index.json` / `index-full.json` / `search-index.json`），两份 .app 一致 |
| 包内 WebRoot 体积 | 约 120 MB（含 15.7 MB 字体）；IPA 约 65 MB |
| 离线断言 | `DATA_BASE = ""`、无 `jsdelivr`、无 `https://`、含桥接层与两个 woff2 |
| 模拟器运行 | iPhone 17 / iOS 27.2，安装启动成功 |
| 页面渲染 | 显示诗词卡片「清平乐 · 宋 · 黄人杰」、搜索框、体裁筛选、「与诗相逢」按钮、顶栏工具 |
| 卡片角标 | 纸笔与收藏星统一基线、完整落在卡片圆角边框内，无系统按钮灰底方块 |
| 思源宋体 | 两个 woff2 随包安装，`document.fonts.check` 通过、无 `FONT NOT LOADED` 记录；截图确认标题/正文为思源宋体 |
| 分享卡片预览 | 模拟器截图确认底部上弹面板：预览图、全屏放大、「分享到微信」「保存到相册」双按钮、关闭 |
| 液态玻璃图标 | `CFBundleIconName = AppIcon`；`assetutil --info` 含 `IconGroup` / `IconImageStack` / `UIAppearanceDark` / `ISAppearanceTintable`；`ictool` 导出 Default / Dark / TintedLight 三种外观 |
| 数据加载 | `fetch` 从包内 `data/` 成功取回索引与分块并完成随机抽诗（`shihai-debug.log` 无 JS 错误） |
| 本地存储 | WebKit `WebsiteData/LocalStorage` 正常创建，未触发兜底 shim |
| 网络 | 未发现 App 主动发起的 http(s) 请求 |

首次启动会显示网页自带的「使用提示 / 同意」浮层与开屏动画，属正常一次性流程；确认后进入完整阅读界面。

---

## 8. 修复的上游缺陷

排查模拟器只停在开屏动画时，捕获到：

```
SyntaxError: Unexpected end of script @ index.html:4061
```

根因：`index.html` 第 ~1115 行 `function saveOpts() { try { ... } catch (e) {}` 缺少函数闭合的 `}`，导致整段内联脚本无法解析，页面 JS 全部不执行（网页端同样受影响，不只是 iOS）。

修复：

```diff
-    function saveOpts() { try { localStorage.setItem(OPTS_KEY, JSON.stringify(appOpts)); } catch (e) {}
+    function saveOpts() { try { localStorage.setItem(OPTS_KEY, JSON.stringify(appOpts)); } catch (e) {} }
```

`node --check` 校验通过（大括号 622 / 622）。修复直接落在仓库根 `index.html`，网页端与 iOS 端同时受益。

另修复一处 CSS 层叠问题：`.onboard-bar` 的窄屏媒体查询写在基础规则**之前**，被后面的 `max-width: calc(100vw - 320px)` 覆盖，导致手机宽度下首次引导条被压成窄竖条。在基础规则之后补写同名 `@media (max-width: 650px)` 声明，恢复横向宽条。

再修复卡片右上角两个角标：`.card-fav` / `.card-note` 是 `<button>`，iOS WKWebView 会套用系统控件外观（纸笔图标出现灰底方块），且 `top: 10px; right: 14px/46px` 紧贴圆角、视觉上越出边框。新增 `.card > .card-fav, .card > .card-note` 规则，设置 `-webkit-appearance: none`、`background: transparent`、统一 26px 尺寸与 flex 居中，并把位置内收到 `top: 20px; right: 22px / 56px`。以上修复全部落在仓库根 `index.html`，网页端与 iOS 端同时受益，未改动任何数据文件。

---

## 9. 目录整理与文档

- 新增 `ios/`（工程 / 源码 / 脚本 / 字体 / Icon Composer 文档 / 产物）、`docs/IOS_APP_REPORT.md`。
- `Assets.xcassets/AppIcon.appiconset` 改名为 `AppIconLegacy.appiconset`，避免与同名 `.icon` 冲突；主图标由 `AppIcon.icon` 提供。
- `README.md`、`README_EN.md`：更新简介、目录、架构图、技术栈表、仓库结构；新增「iOS 离线 App」章节（构建、Xcode 运行、真机签名、离线机制、报告链接）。
- `.gitignore`：新增 `ios/build/`、`ios/DerivedData/`、`*.xcuserstate`、`**/xcuserdata/`、`*.ipa`、`*.app/`、`.workbuddy/memory/`。构建产物（>100 MB）不入库；原始数据 `data/`、`assets/`、`sources/` 保持不变。

---

## 10. 签名与分发

命令行产物为**未签名**：`CODE_SIGNING_ALLOWED=NO` 便于在无描述文件的环境直接产出 `.app` / `.ipa`。装真机前二选一：

1. Xcode 打开 `ios/Shihai.xcodeproj` → Signing & Capabilities 选择自己的 Team → `Product → Archive` → 分发；
2. 用自己的证书 + 描述文件对 `Shihai-unsigned.ipa` 重签。

仓库不含任何证书、私钥或 App Store 凭据；也未执行上架动作。

**推送记录**：所有改动已推送到 `origin/main`（具体提交见 `git log`）。本机网络代理对 `git push` 的 CONNECT 隧道返回 502，因此改走 GitHub Git Data API：按 `git diff --no-renames --name-status` 逐个创建/复用 blob（删除项以 `sha: null` 写入 tree）→ 基于父提交 tree 创建新 tree → 用与本地一致的 tree / 作者 / 时间 / 提交信息创建 commit → 更新 `refs/heads/main`。远端 tree 与 commit SHA 均与本地一致并已核验；`docs/screenshots/ios-glass-icon.png` 为 Icon Composer 导出的 Default 外观预览。

---

## 11. 已知边界

- 微信生态内的「分享给朋友 / 朋友圈 / 小程序码深链」是小程序专用能力；iOS 端的「分享到微信」调起系统分享面板，需设备已安装微信才能在选择列表中出现。
- 内嵌思源宋体约 15.7 MB，首次启动需解析全字集字体，开屏动画可能比纯系统字体略晚 1~2 秒；字体只从本地包读取，不请求网络。
- `sources/` 原始语料、云函数 gzip 副本不嵌入（理由见第 4 节）。
- 网页端「访问统计」在 iOS 端为本机记录，不上报。
- 自定义 scheme 下首次启动需点一次「同意」使用提示。
- iPad 大屏沿用网页响应式布局，未做 iPad 专属分栏。

---

## 12. 复现命令

```bash
# 一键构建 + 校验
bash ios/scripts/build.sh

# 重新生成两套图标（传统 PNG + Icon 前景层）
bash ios/scripts/make_appicon.sh

# 从本机思源宋体重新生成 woff2（需 fonttools + brotli）
python3 ios/scripts/make_fonts.py

# 预览液态玻璃图标的各外观
ICTOOL="/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool"
"$ICTOOL" ios/Shihai/AppIcon.icon --export-image --output-file /tmp/glass.png \
  --platform iOS --rendition Default --width 1024 --height 1024 --scale 1

# 单独组装离线资源包（调试用）
python3 ios/scripts/prepare-webroot.py . /tmp/WebRoot

# 模拟器安装
xcrun simctl install booted ios/build/Shihai-Simulator.app
xcrun simctl launch booted com.shihai.poetry.ocean
```
