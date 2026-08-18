# 诗海 · AI 接管指引 (TUTORIAL)

> 本文档供下一位接手本项目的 AI 助手阅读。读完本文，你应能独立完成功能开发、Bug 修复与两端部署同步。
> **最后更新**：2026-08-18 · **对应 commit**：b7bb8fa

---

## 1. 项目一句话

「诗海 The Poetry Ocean」是一个收录 **344,240 首古诗词**的纯前端阅读器，包含**网页端**和**微信小程序端**，两端功能对等、共享同一套数据。

- GitHub 仓库：`ethanthr-dotcom/shihai-the_poetry_ocean`
- 网页 Demo：https://ethanthr-dotcom.github.io/poetry-site/
- 用户本地工作目录：`/Users/ethanteng/Desktop/chinese-poetry-master`
- 小程序同步目录：`/Users/ethanteng/WeChatProjects/miniprogram-4/miniprogram/`

---

## 2. 仓库结构总览

```
chinese-poetry-master/
├── index.html                        # 网页端本体（单文件，~4000 行，含全部 CSS/JS）
├── data/                             # 345 个数据分块 + 3 个索引文件（~90MB）
│   ├── index.json                    #   精简索引（file/count/dynasties，18KB）
│   ├── index-full.json              #   筛选索引（额外含 authors/types，324KB）
│   ├── search-index.json            #   搜索摘要索引（标题字符集，用于标题模糊检索收窄分块）
│   └── 001.json … 345.json          #   每块 1000 首诗，短键名格式
├── assets/                           # logo / 图标（SVG / PNG）
├── tools/                            # Python 数据管线脚本
│   ├── convert_chinese_poetry.py     #   繁简转换 + 清理 + 切片 + 生成索引
│   └── rebuild_search_index.py       #   重建 search-index.json（移除高频字符，压缩 ~59%）
├── miniprogram/                      # 微信小程序源码
│   ├── app.js                        #   入口：云开发初始化 + 索引预取 + 访问统计
│   ├── app.wxss                      #   全局样式（page font-family 等）
│   ├── pages/index/
│   │   ├── index.js                  #   主页逻辑（~1850 行，随机抽诗/搜索/收藏/批注/分享/主题…）
│   │   ├── index.wxml                #   主页模板（~480 行）
│   │   └── index.wxss                #   主页样式（~640 行）
│   └── utils/
│       ├── config.js                 #   数据源配置（cloudbase / http 模式切换）
│       ├── data.js                   #   数据层：两级索引 + 按需取块 + 搜索收窄
│       ├── request.js                 #   取数封装：http 走 wx.request，cloudbase 走云函数
│       ├── themes.js                 #   16 主题 × 3 排版定义 + 主题存取
│       ├── share-canvas.js           #   Canvas 分享卡片绘制
│       └── verse.js                  #   正文拆分（句/分句/绝句判定/悬挂标点）
├── cloudfunctions/                   # 微信云函数
│   ├── poemData/                     #   数据函数 1：索引 + 分块 001-140（gzip 打包，~17MB）
│   │   ├── index.js                  #     读取 gzip 并内存缓存，按文件名返回 JSON
│   │   └── data/*.json.gz            #     压缩数据
│   ├── poemData2/                    #   数据函数 2：分块 141-345（~24MB）
│   │   ├── index.js
│   │   └── data/*.json.gz
│   └── visitStats/                   #   访问统计：云数据库原子递增计数器
│       └── index.js
├── project.config.example.json       # 开发者工具配置模板（复制为 project.config.json 后填 appid）
├── README.md                         # 中文说明
├── README_EN.md                      # 英文说明
├── THIRD-PARTY-NOTICES.md            # 第三方数据许可声明
├── LICENSE                           # MIT
└── .gitignore                        # 忽略 project.config.json / node_modules / Z*.png 等
```

---

## 3. 数据格式

### 3.1 诗词对象（短键名）

每个分块是一个 JSON 数组，每首诗的格式：

```json
{ "t": "静夜思", "a": "李白", "d": "唐", "y": "五言绝句", "c": "床前明月光，疑是地上霜。举头望明月，低头思故乡。" }
```

| 键 | 含义 | 类型 |
|----|------|------|
| `t` | 标题 | string |
| `a` | 作者 | string |
| `d` | 朝代 | string |
| `y` | 体裁 | string（如"五言绝句""七言律诗""词牌·菩萨蛮"） |
| `c` | 正文 | string（含标点） |

### 3.2 索引文件

| 文件 | 体积 | 字段 | 用途 |
|------|------|------|------|
| `index.json` | 18KB | `total`, `chunks[].{file,count,dynasties}` | 首屏必需，朝代筛选 |
| `index-full.json` | 324KB | 额外含 `chunks[].{authors,types}` | 作者/体裁筛选，懒加载 |
| `search-index.json` | — | `chunks[].{f,cs}`, `globalChars` | 标题模糊检索：按字符集收窄候选分块 |

> `search-index.json` 的 `cs` 字段已移除高频字符（出现在 >50% 分块中的字符），前端 `narrowByDigest` 只对 `globalChars` 内的字符做"必须包含"判断。

### 3.3 绝对禁止修改原始数据

数据文件（`data/*.json`、`cloudfunctions/*/data/*.json.gz`）是预处理产物，**不要手动编辑**。如需重新生成：

```bash
pip3 install zhconv          # 仅首次
python3 tools/convert_chinese_poetry.py   # 重建 data/ 下全部分块与索引
python3 tools/rebuild_search_index.py     # 重建搜索摘要索引
```

数据源是 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（MIT License），脚本会做：繁→简转换 → PUA/乱码清理（替换为 `□`）→ 体裁推断 → 去重 → 切片（每块 1000 首）→ 生成索引。

---

## 4. 架构与双端对照

```
网页端    浏览器 ──► index.html ──► data/*.json（本地相对路径 / jsDelivr CDN）
小程序端  页面 ──► wx.cloud.callFunction ──► poemData / poemData2（gzip 打包在函数内）
```

两端**共享同一套 `data/` 数据**，小程序通过云函数中转。数据层逻辑（两级索引 + 按需取块 + 搜索收窄）在两端是**同构**的：

| 能力 | 网页端 | 小程序端 |
|------|--------|----------|
| 入口 | `index.html` 内联 JS | `miniprogram/app.js` + `pages/index/index.js` |
| 数据层 | `index.html` 内联 | `miniprogram/utils/data.js` |
| 取数 | `fetch()` / CDN | `miniprogram/utils/request.js` → 云函数 |
| 主题 | `index.html` 内联 CSS 变量 | `miniprogram/utils/themes.js` |
| 正文拆分 | `index.html` 内联 | `miniprogram/utils/verse.js`（被 `share-canvas.js` 引用） |
| 分享卡片 | `index.html` Canvas 绘制 | `miniprogram/utils/share-canvas.js` |

> **关键原则**：修改任何数据逻辑或搜索逻辑时，**必须两端同步修改**，否则功能不一致。

---

## 5. 关键配置

### 5.1 数据源（`miniprogram/utils/config.js`）

```js
const DATA_MODE = "cloudbase";       // "cloudbase"（上架推荐）或 "http"
const USE_LOCAL = false;             // http 模式下为 true 时走本机 127.0.0.1:8765
const DATA_BASE = "https://cdn.jsdelivr.net/gh/ethanthr-dotcom/shihai-the_poetry_ocean@main/";
const CLOUDBASE_ENV = "cloud1-d2gtpvp0j78a22e70";  // 云开发环境 ID
const CLOUDBASE_FN = "poemData";     // 云函数 1（001-140）
const CLOUDBASE_FN2 = "poemData2";   // 云函数 2（141-345）
const CLOUDBASE_SPLIT = 140;         // 分块号 > 140 走第二个函数
```

> 两个云函数的原因：微信云函数部署包上限 50MB，345 个分块 gzip 后约 40MB，拆成两份。`request.js` 的 `fnForFile()` 按分块号自动路由。

### 5.2 网页端数据源自动识别

`index.html` 会检测当前 URL：
- 本地（`localhost` / `127.0.0.1` / `file://`）→ `IS_LOCAL = true` → 从相对路径 `data/` 加载
- 线上 → 从 jsDelivr CDN 加载

无需改代码即可在本地和线上无缝切换。

### 5.3 缓存键名约定

小程序端使用 `wx.getStorageSync` 缓存索引，键名定义在 `config.js`：

| 键 | 内容 | TTL |
|----|------|-----|
| `shihai-index-v1` | 精简索引 | 24h |
| `shihai-index-full-v2` | 筛选索引 | 24h |
| `shihai-search-index-v2` | 搜索摘要索引 | 24h |
| `shihai-visit-last-ts` | 访问统计上次时间戳 | — |
| `shihai-visit-count` | 访问统计计数缓存 | — |
| `poetry-theme-v1` | 主题选择 | 永久 |

> 修改索引格式后，**务必递增键名版本号**（如 `v1` → `v2`），否则用户拿到旧缓存会导致数据不一致。

---

## 6. 开发环境与运行

### 6.1 网页端

```bash
cd /Users/ethanteng/Desktop/chinese-poetry-master
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/
```

### 6.2 小程序端

1. 微信开发者工具 → 导入项目 → 选择仓库根目录
2. `project.config.example.json` → 复制为 `project.config.json` → 填入自己的 appid
3. 云开发控制台 → 记下环境 ID → 填入 `config.js` 的 `CLOUDBASE_ENV`
4. 右键 `poemData` / `poemData2` → 「上传并部署：所有文件」
5. 编译运行

### 6.3 纯本地调试模式（免云开发）

修改 `config.js`：
```js
const DATA_MODE = "http";
const USE_LOCAL = true;   // 数据从 http://127.0.0.1:8765/ 读取
```
然后在仓库根目录 `python3 -m http.server 8765`，开发者工具「详情 → 本地设置」勾选「不校验合法域名」。

---

## 7. 用户工作习惯与偏好

### 7.1 同步机制

用户在小程序开发者工具中使用的项目位于 `/Users/ethanteng/WeChatProjects/miniprogram-4/miniprogram/`。每次修改小程序代码后，需要手动同步：

```bash
# 同步修改过的文件到 WeChatProjects
cp miniprogram/app.js /Users/ethanteng/WeChatProjects/miniprogram-4/miniprogram/app.js
cp miniprogram/app.wxss /Users/ethanteng/WeChatProjects/miniprogram-4/miniprogram/app.wxss
# ... 其他文件同理
```

> 完整文件列表：`app.js`、`app.wxss`、`pages/index/index.js`、`index.wxml`、`index.wxss`、`utils/*.js`

### 7.2 Git 与推送

- 用户通常要求修改后推送到 GitHub
- 推送前用 `node -c` 检查 JS 语法
- 提交信息使用中文或英文均可，但要描述清楚改动内容
- **当前用户明确表示不要推送 GitHub 时，绝对不要推送**
- 推送命令：`git add <具体文件> && git commit -m "msg" && git push origin main`
- 终端 PATH 可能不完整，需要 `export PATH="/usr/bin:/bin:/usr/local/bin:$PATH"`

### 7.3 验证习惯

- 修改后用户会在微信开发者工具中编译刷新查看效果
- 用户不需要你运行测试（没有测试套件）
- 但你应该用 `node -c` 验证 JS 语法正确性

### 7.4 沟通语言

- 用户使用中文沟通，回复也应使用中文
- 代码注释使用中文

---

## 8. 核心功能实现速查

### 8.1 随机抽诗

**入口**：用户点击「与诗相逢」按钮
**流程**（小程序）：
1. `index.js` → `data.findRandomPoem(author, dynasty, type, maxLen)`
2. `loadIndex()` 加载精简索引（带缓存）
3. 如有作者/体裁筛选 → `ensureFullIndex()` 懒加载筛选索引
4. `filterChunks()` 在索引层筛选候选分块
5. `weightedRandom()` 加权选块 → `loadChunk(file)` 取块
6. `matchPoem()` 块内逐首匹配 → 随机取一首返回

**竖排模式**额外限制：`maxLen` 参数过滤内容超长的诗（默认 56 字以内）。

### 8.2 搜索

**模式**：智能识别 / 按作者 / 按朝代 / 按标题
- 作者/朝代：**精确**匹配
- 标题：**模糊**匹配（包含子串）
- 体裁：可任意组合

**标题模糊检索优化**：
1. `ensureSearchIndex()` 加载 `search-index.json`
2. `narrowByDigest(candidates, kw)` 用字符集 Set 过滤候选分块
3. 只加载可能命中的分块，避免全量扫描

**关键函数**：
- `findRandomPoemByKw(kw, type, maxLen, mode)` — 关键词搜索版随机抽诗
- `matchKw(p, kw, type, mode)` — 单首匹配判断
- `chunkKwScore(c, kw, mode)` — 分块优先级评分（含该作者的分块排前面）
- `sortChunksByKw(list, kw, mode)` — 按评分排序候选分块

### 8.3 今日之诗

`findDailyPoem()` — 按日期确定性挑选（所有人当天同读一首）：
- 用 `年*10000 + 月*100 + 日` 生成种子
- 乘以黄金分割常数 `2654435761` 散列
- 在索引分块中跳跃取块，块内跳跃取诗
- 跳过含 `□` / `\ufffd` 的残损条目

### 8.4 分享卡片

**网页端**：`index.html` 内 Canvas 2D 绘制
**小程序端**：`miniprogram/utils/share-canvas.js`

两端绘制逻辑逐行一致，支持：
- 横版 / 竖版双布局
- 比例：1:1 / 3:4 / 9:16 / 自动
- logo 水印、印章、自定义签名行
- 批注大 + 诗词小模式

字体常量（`share-canvas.js` 第 4 行）：
```js
const FONT = '"Songti SC", "STSong", "SimSun", "PingFang SC", serif';
```

### 8.5 主题系统

**定义**：`miniprogram/utils/themes.js`（与 `index.html` 内联定义完全一致）
- 16 种配色：warm / ink / dark / celadon / morandi / vivid / vangogh / rembrandt / rouge / daiqing / moss / amber / indigo / lotus / pine / qinghua
- 3 种排版：centered / wide / compact
- 通过 CSS 自定义属性（变量）注入根节点 `style`
- 竖排自动切换为 compact 排版

**切换**：用户在设置面板选择 → `saveTheme()` 存入 `wx.setStorageSync` → `buildStyleVars()` 生成 style 字符串 → WXML 根节点绑定

### 8.6 访问统计

**小程序**（`cloudfunctions/visitStats/index.js`）：
- 云数据库集合 `visitStats`，文档 `counter`
- 每次打开小程序递增计数（每日可多次）
- 10 秒短节流防异常刷量
- 非云开发模式回退本地累计计数

**网页端**：
- `localStorage` 记录本机累计访问天数

### 8.7 收藏与批注

- 存储于本机（小程序 `wx.getStorageSync` / 网页 `localStorage` + cookie）
- 收藏：点星星触发迸溅动画
- 批注：每首一条，可与全诗同框生成分享卡片
- 支持一键导出全部收藏

---

## 9. 已删除的功能（勿恢复）

以下功能曾经存在但已被用户明确要求删除，**不要重新添加**：

| 功能 | 删除时间 | 说明 |
|------|----------|------|
| 节气主题 | 2026-08-17 | 二十四节气问候语及计算逻辑（`SOLAR_TERMS` / `TERM_C21` / `solarTermToday`） |
| 思源宋体（Noto Serif SC） | 2026-08-17 | 网络字体加载逻辑（`FONT_CDNS` / `ensureFonts` / `@font-face`），回退为系统字体 |
| 液态玻璃效果 | 2026-08-17 | 仅苹果设备的毛玻璃效果及设置开关 |
| 下拉多选菜单 | 2026-08-17 | 体裁选择改为双圆多选 + 底部抽屉面板 |
| 今日推荐/每日推送 | 2026-08-17 | 已回退（commit 082c6aa） |
| 意象分类搜索 | 2026-08-17 | 已回退（commit c8a9024），但用户有意重新开发，索引需建在数据库之外 |

> 缺字说明统一文案：「原始古籍数据缺损所致，属正常现象，并非程序错误」（不要写"字体未收录"）。

---

## 10. 常见任务操作指南

### 10.1 新增一个功能

1. **网页端**：在 `index.html` 中实现（HTML 结构 + CSS 样式 + JS 逻辑全在一个文件内）
2. **小程序端**：在 `miniprogram/pages/index/` 的对应文件中实现
   - 逻辑 → `index.js`
   - 模板 → `index.wxml`
   - 样式 → `index.wxss`
3. 如涉及数据/主题/分享，同步修改 `utils/` 下对应文件
4. 同步到 WeChatProjects
5. `node -c` 验证语法
6. 推送 GitHub（除非用户说不要推）

### 10.2 修复 Bug

1. 用 Grep 搜索相关代码定位问题
2. 两端同步修复
3. `node -c` 验证
4. 同步 WeChatProjects
5. 推送 GitHub

### 10.3 修改主题

- 编辑 `miniprogram/utils/themes.js` 的 `THEMES` 对象
- 同时编辑 `index.html` 中内联的 `THEMES` 定义（搜索同名配色键即可）
- 两端必须完全一致

### 10.4 修改数据源

- 编辑 `miniprogram/utils/config.js`
- 网页端数据源在 `index.html` 中搜索 `DATA_BASE` / `IS_LOCAL`

### 10.5 部署云函数

1. 修改 `cloudfunctions/poemData/index.js` 或 `cloudfunctions/poemData2/index.js`
2. 在微信开发者工具中右键对应云函数 → 「上传并部署：所有文件」
3. 等待部署完成（约 1-2 分钟）

---

## 11. 注意事项与陷阱

### 11.1 index.html 是单文件

`index.html` 约 4000 行，包含全部 CSS 和 JS。修改时要小心缩进和作用域。搜索特定函数时用 Grep 按函数名定位。

### 11.2 小程序端无 npm

小程序使用微信原生开发，`utils/` 下的模块通过 `require()` 引入，不需要也不存在 `package.json`（云函数有，小程序前端没有）。

### 11.3 云函数部署包大小

`poemData` 和 `poemData2` 的数据目录已 gzip 压缩。如果数据更新导致部署包超过 50MB，需要调整 `CLOUDBASE_SPLIT` 的分界点（在 `config.js` 中修改），并在 `request.js` 的 `fnForFile()` 中自动路由。

### 11.4 缺字 `□` 处理

- 原始数据中 PUA 码位和 `\ufffd` 已被替换为 `□`
- 搜索/抽诗时跳过标题或作者含 `□` / `\ufffd` 的条目（`matchPoem` / `matchKw` 中的正则 `/[\u25a1\ufffd]/`）
- 这是设计意图，不要"修复"成显示原文

### 11.5 GitHub Pages 构建

- 仓库通过 GitHub Pages 部署网页端
- Pages 构建有时会因为 GitHub 端 429 限速失败，这不是代码问题
- 失败时可以做空推送触发重新构建：`git commit --allow-empty -m "trigger rebuild" && git push`

### 11.6 终端 PATH 问题

在 Trae 的终端中，`git` 等系统命令可能不在 PATH 中。运行命令前加：
```bash
export PATH="/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
```

---

## 12. 快速定位代码

| 需求 | 搜索关键词 | 文件 |
|------|-----------|------|
| 随机抽诗逻辑 | `findRandomPoem` | `data.js` / `index.html` |
| 搜索逻辑 | `findRandomPoemByKw` | `data.js` / `index.html` |
| 今日之诗 | `findDailyPoem` | `data.js` / `index.html` |
| 主题定义 | `THEMES` | `themes.js` / `index.html` |
| 分享卡片绘制 | `drawCard` / `drawShareCard` | `share-canvas.js` / `index.html` |
| 收藏/批注存储 | `favorites` / `notes` | `index.js` / `index.html` |
| 访问统计 | `_trackVisit` / `visitStats` | `app.js` / `index.html` |
| 体裁选择器 | `TYPES_LIST` / `collectTypes` | `data.js` / `index.html` |
| 搜索索引收窄 | `narrowByDigest` | `data.js` / `index.html` |
| 开发者面板 | `devPanel` / `长按` / `longpress` | `index.js` / `index.html` |

---

## 13. 版本信息

- 当前最新 commit：`b7bb8fa`
- 分支：`main`
- 小程序云开发环境：`cloud1-d2gtpvp0j78a22e70`
- 数据总量：344,240 首
- 分块数：345（001-345，最后一块 240 首）
- GitHub Pages URL：https://ethanthr-dotcom.github.io/poetry-site/

---

> 如果你有任何不确定的地方，优先阅读 `README.md`（项目说明）和 `config.js`（配置），然后搜索相关函数名定位代码。两端逻辑同构，改一端时务必对照另一端。
