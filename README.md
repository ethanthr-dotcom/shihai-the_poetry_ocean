# 诗海 · 古诗词浏览器

收录 **344,240 首古诗词**，纯前端静态网站，无需服务器。

数据源：[chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)（全唐诗/全宋诗/宋词/元曲/五代诗词/楚辞/诗经/曹操/纳兰性德等），繁体已统一转简体，PUA 与乱码字符已清理。

## 功能

- 随机展示一首古诗词
- 按作者、朝代、体裁筛选
- 横排/竖排显示、多种主题配色与字号
- 一键生成高清分享卡片（1:1 / 3:4 / 9:16 / 自适应比例）
- 数据完全在浏览器中按需加载，无后端依赖

## 本地预览

```bash
python3 -m http.server 8080
```

浏览器打开 http://localhost:8080/

## 部署到 GitHub Pages

### 1. 创建 GitHub 仓库

在 GitHub 上新建一个仓库（例如 `shihai-the_poetry_ocean`）。

### 2. 推送代码

```bash
git init
git add .
git commit -m "诗海 · 古诗词浏览器"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -U origin main
```

### 3. 开启 GitHub Pages

1. 打开仓库的 **Settings** → **Pages**
2. **Source** 选择 **Deploy from a branch**
3. **Branch** 选择 **main**，文件夹选 **/ (root)**
4. 点击 **Save**

等待 1-2 分钟，页面将上线：

```
https://<你的用户名>.github.io/<仓库名>/
```

> 线上数据经 jsDelivr CDN 分发（`DATA_BASE` 指向本仓库的 jsDelivr 地址），国内访问友好。

## 数据结构

```
.
├── index.html           # 站点页面（单文件，含全部 CSS/JS）
├── assets/              # 站点图片资源
│   ├── logo-yang.svg    # 阳刻 logo（页头/开屏）
│   ├── logo-yin.svg     # 阴刻 logo（页脚/分享图）
│   ├── logo-vertical.svg# 竖版 logo（竖版分享图）
│   ├── icon.png         # 网站图标原图（498×498）
│   └── icons/           # 多尺寸 PNG 图标（16~512px + apple-touch）
├── data/
│   ├── index.json       # 精简索引（file/count/dynasties，18KB）
│   ├── index-full.json  # 筛选索引（额外含 authors/types，324KB）
│   ├── 001.json         # 345 个分块，每块 1000 首
│   ├── 002.json
│   └── ...345.json      # 总计约 90MB
├── tools/
│   └── convert_chinese_poetry.py  # 语料→data/ 的转换脚本
└── sources/
    └── chinese-poetry/  # 原始语料（按朝代/作者组织的 JSON）
```

重新生成数据：

```bash
pip3 install zhconv   # 仅首次
python3 tools/convert_chinese_poetry.py
```

每个分块的诗词对象使用短键名：

| 键 | 含义 |
|---|---|
| `t` | 标题 |
| `a` | 作者 |
| `d` | 朝代 |
| `y` | 体裁 |
| `c` | 正文 |

## 数据来源与许可证

本项目的诗词数据来源于 chinese-poetry/chinese-poetry：

https://github.com/chinese-poetry/chinese-poetry

该数据集采用 MIT License。

诗海对数据进行了重新整理、切片、索引和字符清理，
以适应纯前端静态网站的按需加载。

诗海的网页、交互逻辑及数据处理脚本由本项目自行实现。
第三方内容的许可证仍以其原始项目声明为准。

详见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
