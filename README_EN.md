
<h1 align="center">
🌊 The Poetry Ocean · 诗海
</h1>

<p align="center">
[简体中文](README.md) | [English](README_EN.md)

![Language](https://img.shields.io/badge/language-Chinese%20%7C%20English-blue)![License](https://img.shields.io/github/license/ethanthr-dotcom/shihai-the_poetry_ocean)

> Scoop the poems of the ancients, nourish the heart of today.

An open-source digital showcase for classical Chinese poetry — featuring **344,240 poems**, built as a pure front-end static website with no server and no back-end dependencies, using modern web technology to let a thousand years of verse be seen anew.

<p align="center">
  <img src="docs/screenshots/web-card.png" width="30%" alt="The Poetry Ocean web poem card" />
  <img src="docs/screenshots/mp-home.png" width="30%" alt="The Poetry Ocean mini-program home" />
  <img src="docs/screenshots/share-card.png" width="30%" alt="The Poetry Ocean share card" />
</p>

---

## Table of Contents

- [🚀 Online Demo](#-online-demo)
- [📖 Story Behind The Poetry Ocean](#-story-behind-the-poetry-ocean)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [🔧 Local Deployment Guide (Step by Step)](#-local-deployment-guide-step-by-step)
- [📚 Data](#-data)
- [🎨 Themes & Layouts](#-themes--layouts)
- [📱 Feature Guide](#-feature-guide)
- [❓ FAQ](#-faq)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 🚀 Online Demo

**Website**: https://ethanthr-dotcom.github.io/poetry-site/

> Open it in any browser on your computer or phone — no installation needed. Production data is distributed via the jsDelivr CDN, accessible within mainland China.

**WeChat Mini Program**: scan the QR code

<p align="center">
  <img src="docs/screenshots/mp-qrcode.jpg" width="220" alt="The Poetry Ocean mini-program QR code" />
</p>

> Scan it with WeChat to read 340,000+ classical poems on your phone.

---

## 📖 Story Behind The Poetry Ocean

In an age of fast-flowing information, we consume vast amounts of text every day, yet rarely stop to read the lines of poetry that have crossed a thousand years.

Classical Chinese poetry once recorded the feelings of countless people:
the sorrowful murmurs of Du Fu over his country and people, the heroic spirit of Li Bai wandering with a sword, the broad-mindedness of Su Shi facing the storms of life.
Yet many precious poetry resources still lie dormant in databases or traditional texts, distant from modern readers.

So I created "The Poetry Ocean" — hoping that through modern internet technology, these ancient words might find a new way to be presented.
The Poetry Ocean is not only a poetry display site, but an exploration of how traditional culture meets the digital age.

> When code meets poetry, when data carries civilization,
> the words once chanted for a thousand years can still shine in today's world.

---

## ✨ Features

### Reading

| Feature | Description |
|---------|-------------|
| **Random Poem** | Tap "Meet a Poem" to randomly show a classical poem — a surprise every time |
| **Poem of the Day** | Deterministic daily recommendation — everyone reads the same poem on the same day; the clock icon in the top bar shows recently-read poems (20 kept locally, re-readable / clearable) |
| **Horizontal / Vertical** | Dual reading directions; vertical mode auto-recommends short poems of 56 characters or fewer, perfect for phone screens |
| **Famous Line Glance** | Shows only one line; tap to reveal the full poem — great for quick moments of reading |

### Search

| Feature | Description |
|---------|-------------|
| **Smart Search** | A single search box + mode switch (smart detection / by author / by dynasty / by title); smart mode auto-detects input type with real-time hints |
| **Matching Rules** | Author / dynasty: exact match; title: fuzzy match (contains); combinable with any genre |
| **Genre Filter** | Full list of 1,479 genres embedded in code for zero wait; tap to expand a searchable grouped panel (Common / Poems / Ci & Qu tunes) |
| **Search Experience** | Real-time progress (chunks scanned / hits found); matched keywords bold-highlighted; opened entries marked "read" |
| **Results List** | Accordion-style expansion, smooth transitions, checkbox batch-favorite, auto-paging on scroll to bottom |

### Favorites & Annotations

| Feature | Description |
|---------|-------------|
| **Local Favorites** | Tap the star to favorite a poem (with a burst animation); favorites drawer supports batch manage / delete, one-click export |
| **Annotations** | Tap the pen icon to write your reading reflection (one per poem, editable / deletable); an annotation can be composed into a share card with the full poem |
| **Storage** | Favorites and annotations are stored in local cache (cookie / storage), never uploaded to any server — your privacy is protected |

### Sharing

| Feature | Description |
|---------|-------------|
| **HD Share Card** | Hand-drawn on Canvas, supports 1:1 / 3:4 / 9:16 / auto ratios; custom signature line |
| **Native Sharing** | Supports WeChat "Share to friend" and "Share to Moments"; sharing carries a poem deep link so friends open the exact same poem |

### Experience Details

| Feature | Description |
|---------|-------------|
| **Gestures** | Swipe card left/right for another poem, double-tap to favorite, long-press a line to copy it |
| **Animations** | Ink ripple on tap, card paper texture, top reading progress bar; poem cards enter with an ink effect |
| **Time-based Greeting** | The first tip changes by time of day (morning read / night read, etc.) |
| **16 Themes** | Warm Paper / Ink / Dark Night / Celadon / Morandi / Vivid / Starry Night / Rembrandt / Rouge / Daiqing / Moss / Amber / Indigo / Lotus / Pine Soot / Blue & White |
| **3 Layouts** | Centered / Wide / Compact, instant switching driven by CSS variables |
| **On-demand Loading** | 345 data chunks + two-level index, first visit loads only 18KB |
| **Splash Screen** | The motto "Scoop the poems of the ancients · Nourish the heart of today" appears character by character, tap to skip |
| **Developer Panel** | Long-press the settings gear for 5s (mini-program) or long-press the footer copyright line (web) to view device info, storage usage, etc. |

---

## 🛠️ Tech Stack

### Architecture Overview

```
Web            Browser ──► single-file index.html ──► data/*.json (local relative path / jsDelivr CDN)
Mini-program   Pages    ──► wx.cloud.callFunction ──► poemData / poemData2 (data gzipped inside the function)
```

Both platforms share the same `data/` directory. The mini-program accesses data through cloud functions. The data layer logic is isomorphic across both platforms.

| Part | Technology |
|------|------------|
| Website | Single-file `index.html` (vanilla HTML/CSS/JS, zero framework, zero build) |
| Theme System | CSS custom properties (variables) injected dynamically, 16 colors × 3 layouts, instant switch |
| Share Image | Canvas 2D hand-drawn layout, horizontal / vertical dual layouts |
| Font | System font stack (Songti SC / STSong / SimSun / PingFang SC / serif), no network loading, instant display |
| Data Distribution | jsDelivr CDN (web) / WeChat Cloud Development cloud functions (mini-program, gzipped) |
| Mini-program | Native WeChat Mini Program + multi-platform app, full port of the web features |
| Data Pipeline | Python: traditional-to-simplified conversion (zhconv), garble cleanup, slicing, two-level index |

---

## 📁 Repository Structure

```
chinese-poetry-master/
├── index.html                        # The website itself (single file, all CSS/JS inline, ~4000 lines)
├── data/                             # 345 data chunks + 3 index files (~90MB)
│   ├── index.json                    #   Lite index (file/count/dynasties, 18KB)
│   ├── index-full.json              #   Filter index (also authors/types, 324KB)
│   ├── search-index.json            #   Search digest index (title character sets)
│   └── 001.json … 345.json          #   1,000 poems per chunk
├── assets/                           # logo / icons (SVG / PNG)
├── tools/                            # Python data pipeline scripts
│   ├── convert_chinese_poetry.py     #   Traditional-to-simplified + cleanup + slicing + index generation
│   └── rebuild_search_index.py      #   Rebuild search digest index
├── miniprogram/                      # WeChat Mini Program source
│   ├── app.js                        #   Entry: cloud init + index prefetch + visit stats
│   ├── app.wxss                      #   Global styles
│   ├── pages/index/                  #   Main page (logic + template + styles)
│   └── utils/                        #   Utilities (config/data/request/theme/share/verse)
├── cloudfunctions/                   # WeChat cloud functions
│   ├── poemData/                     #   Data function 1 (index + chunks 001-140)
│   ├── poemData2/                    #   Data function 2 (chunks 141-345)
│   └── visitStats/                   #   Visit counter
├── project.config.example.json       # DevTools config template
├── README.md                         # Chinese readme
├── README_EN.md                      # English readme (this file)
├── THIRD-PARTY-NOTICES.md            # Third-party data license notice
├── LICENSE                           # MIT License
└── .gitignore
```

---

## 🔧 Local Deployment Guide (Step by Step)

> Don't worry — just follow the steps one by one, and you'll get it running!

### Option 1: Website (Easiest, 30 seconds)

> For: anyone who just wants to see it on their computer

**Step 1: Download the project**

Open a terminal (on Mac, press `Command + Space`, type `Terminal`, press Enter), then copy and paste these two commands:

```bash
git clone https://github.com/ethanthr-dotcom/shihai-the_poetry_ocean.git
cd shihai-the_poetry_ocean
```

> Don't have git installed? You can also go to the GitHub page, click the green `Code` button → `Download ZIP`, unzip it, and `cd` into the folder in your terminal.

**Step 2: Start a local server**

Type this in the terminal:

```bash
python3 -m http.server 8080
```

> When you see `Serving HTTP on ...`, it means it's working!
> If it says `python3` not found, try using `python` instead.

**Step 3: Open your browser**

Type this in your browser's address bar:

```
http://localhost:8080/
```

You should see The Poetry Ocean! 🎉

> **Good to know**: The site automatically detects that you're running locally and reads data directly from the `data/` folder — no CDN, super fast. When you deploy it online, it automatically switches to the CDN data source. No code changes needed!

---

### Option 2: WeChat Mini Program (requires Cloud Development)

> For: those who want to use it on their phone, inside WeChat

**Prerequisites** (prepare these first):

1. Download [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. Register a Mini Program account and get your own **AppID**
3. Enable a **Cloud Development** environment in WeChat DevTools

**Step 1: Import the project**

Open WeChat DevTools, click "Import Project":

- Project directory: select the repository root folder
- AppID: enter your own

> There's a `project.config.example.json` template file in the repo. Copy it, rename to `project.config.json`, and replace the `appid` with your own.
> (This file is gitignored and won't be uploaded to GitHub — don't worry.)

**Step 2: Fill in the Cloud Development environment ID**

Open `miniprogram/utils/config.js` and find this line:

```js
const CLOUDBASE_ENV = "cloud1-d2gtpvp0j78a22e70";
```

Replace the string with your own Cloud Development environment ID.
(You can find it in WeChat DevTools → "Cloud Development" console → Settings → Environment.)

**Step 3: Add permissions in the Cloud console**

Cloud Development console → Settings → Environment access permissions → Add your AppID.

**Step 4: Upload and deploy cloud functions**

In the DevTools file tree on the left:

1. Right-click the `cloudfunctions/poemData` folder → click "Upload and deploy: all files"
2. Wait for upload to complete (~17MB, 1-2 minutes)
3. Right-click the `cloudfunctions/poemData2` folder → click "Upload and deploy: all files"
4. Wait for upload to complete (~24MB, 1-2 minutes)

> **Why two cloud functions?**
> WeChat cloud function deployment packages are capped at 50MB. Our data is ~40MB gzipped, so it's split into two:
> - `poemData`: stores the index + chunks 001–140
> - `poemData2`: stores chunks 141–345
>
> The mini-program auto-routes by chunk number (`CLOUDBASE_SPLIT = 140`) — you don't need to worry about it.

**Step 5: Compile and run**

Click the "Compile" button at the top of DevTools, and you'll see The Poetry Ocean in the simulator! 🎉

> Both cloud functions are auto-warmed at startup, so random poem drawing is very fast.

---

### Option 3: Pure Local Debug (no Cloud Development needed)

> For: those who don't want to set up Cloud Development yet, but want to see it in DevTools

**Step 1: Change the config**

Open `miniprogram/utils/config.js` and change two lines:

```js
const DATA_MODE = "http";     // change to "http"
const USE_LOCAL = true;       // change to true
```

Now data will be read from `http://127.0.0.1:8765/`.

**Step 2: Start a local server**

In the repository root, run:

```bash
python3 -m http.server 8765
```

**Step 3: Configure DevTools**

In WeChat DevTools: Details → Local settings → check "Do not verify legal domains".

**Step 4: Compile and run**

Click "Compile" and you're good to go! 🎉

---

### Option 4: Regenerating the Data (Advanced)

> For: those who want to rebuild the data chunks from the original corpus

**Step 1: Install dependencies**

```bash
pip3 install zhconv
```

> `zhconv` is a Python library for traditional-to-simplified Chinese conversion. Install it once.

**Step 2: Run the conversion script**

```bash
python3 tools/convert_chinese_poetry.py
```

This script will:
1. Read the original corpus from `sources/chinese-poetry`
2. Convert traditional Chinese to simplified
3. Clean PUA code points and garbled characters (replace with `□`)
4. Infer genre (five/seven-character jueju, lüshi, gufeng, etc.)
5. Deduplicate (by author + title + first 20 characters of content)
6. Split into 345 chunks (1,000 poems each)
7. Generate the lite index and full index

**Step 3 (optional): Rebuild the search index**

```bash
python3 tools/rebuild_search_index.py
```

This script removes high-frequency characters (appearing in >50% of chunks), reducing the search index size by ~59%.

---

## 📚 Data

### Data Source

The poetry data comes from the open-source project [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) (MIT License), covering:

- Complete Tang Poems
- Complete Song Poems
- Song Ci (lyrics)
- Yuan Qu (arias)
- Five Dynasties poetry
- Chu Ci (Songs of Chu)
- Shi Jing (Book of Songs)
- Cao Cao's poems
- Nalan Xingde's poems
- and more

### Data Format

Each chunk is a JSON array. Each poem uses short key names to save space:

```json
{
  "t": "Quiet Night Thoughts",
  "a": "Li Bai",
  "d": "Tang",
  "y": "Five-character jueju",
  "c": "Before my bed, a pool of moonlight; I wonder if it's frost on the ground. I raise my head to gaze at the moon, I lower my head and think of home."
}
```

| Key | Meaning | Key | Meaning |
|-----|---------|-----|---------|
| `t` | Title | `d` | Dynasty |
| `a` | Author | `y` | Genre/Form |
| `c` | Content | | |

### Index Files

```
data/
├── index.json           # Lite index (file/count/dynasties, 18KB, required for first screen)
├── index-full.json      # Filter index (also authors/types, 324KB, lazy-loaded)
├── search-index.json    # Search digest index (title character sets, for fuzzy title search)
├── 001.json             # 345 chunks, 1,000 poems each
├── 002.json
└── ...345.json
```

### About Missing Characters "□"

The query UI displays this hint:

> Some characters showing as "□" are due to missing data in the original ancient texts — this is normal and not a bug.

This is because some original ancient texts have missing or special characters that have been uniformly replaced with `□`. It does not affect the reading experience.

---

## 🎨 Themes & Layouts

### 16 Theme Colors

| Theme | Tone | Theme | Tone |
|-------|------|-------|------|
| Warm Paper | Warm beige | Amber | Golden warmth |
| Ink | Clean black & white | Indigo | Deep night blue |
| Dark Night | Dark, eye-friendly | Lotus | Soft lavender |
| Celadon | Fresh green | Pine Soot | Steady pine green |
| Morandi | Low-saturation gray | Blue & White | Classic porcelain |
| Vivid | Bright purple | Rouge | Soft pink |
| Starry Night | Van Gogh blue | Daiqing | Calm blue-gray |
| Rembrandt | Warm gold & brown | Moss | Fresh grass green |

### 3 Layouts

- **Centered**: Card centered, with side margins
- **Wide**: Uses more screen width
- **Compact**: Reduced padding, more content per screen

> Vertical reading mode automatically switches to the compact layout.

---

## 📱 Feature Guide

### Random Poem

Tap "Meet a Poem" and the system picks a poem from 340,000+ using weighted random selection. The weighting is proportional to each chunk's poem count, so every poem has a fair chance of being selected.

### Poem of the Day

The system generates a deterministic seed from the current date (year×10000+month×100+day), multiplies it by the golden ratio constant for hashing, then jumps through the index to pick a chunk and a poem within it. This ensures everyone reads the same poem on the same day, and it's different every day.

### Search

- **Smart Detection**: Automatically determines whether your input is an author name, dynasty name, or title fragment
- **By Author**: Exact match (e.g., "Li Bai")
- **By Dynasty**: Exact match (e.g., "Tang")
- **By Title**: Fuzzy match (contains the keyword, e.g., "moon" finds all poems with "moon" in the title)
- **Genre Combination**: Any search mode can be combined with a genre filter

Title fuzzy search is optimized: it first uses the search digest index (`search-index.json`) to narrow down candidate chunks, loading only those likely to contain matches — avoiding a full 90MB scan.

### Favorites & Annotations

- Both favorites and annotations are stored locally (mini-program uses `wx.getStorageSync`, web uses `localStorage` + cookies)
- They are never uploaded to any server — switching devices won't sync them (this is by design, for privacy)
- Favorites can be exported as text with one click

### Share Cards

Hand-drawn on Canvas 2D, supporting both horizontal and vertical layouts. When generating, you can choose the aspect ratio (1:1 square / 3:4 portrait / 9:16 phone screen / auto). The card displays the full poem, author, dynasty, logo watermark, and your custom signature.

### Visit Counter

- **Mini-program**: Atomic increment counter based on WeChat Cloud Development database, counts every time the mini-program is opened (10-second throttle to prevent abuse)
- **Web**: Uses `localStorage` to track cumulative visit days on the local machine

---

## ❓ FAQ

<details>
<summary><b>The web page is blank — what do I do?</b></summary>

This might be a network issue — data chunks failed to load. The system automatically retries 3 times. If it still doesn't work, check your internet connection or try refreshing the page.

</details>

<details>
<summary><b>The mini-program shows "Cloud environment not authorized" — what do I do?</b></summary>

This means your Mini Program AppID hasn't been authorized in the Cloud Development environment. Go to WeChat DevTools → "Cloud Development" console → Settings → Environment → Environment access permissions, and add your AppID.

</details>

<details>
<summary><b>Some characters show as "□" — is this a bug?</b></summary>

No, it's not a bug. The original ancient texts have missing or special characters that have been uniformly replaced with "□". This is normal and doesn't affect reading other content.

</details>

<details>
<summary><b>Will my favorites and annotations survive a phone change?</b></summary>

Favorites and annotations are stored in local cache on your device — they're never uploaded to a server, so they won't sync across devices. If you need to keep them, use the "one-click export" feature before switching devices.

</details>

<details>
<summary><b>GitHub Pages build failed — what do I do?</b></summary>

GitHub Pages builds sometimes fail due to temporary GitHub-side rate limiting (429 Too Many Requests). This is not a code issue. Wait a few minutes and trigger a rebuild, or make an empty push:

```bash
git commit --allow-empty -m "trigger rebuild" && git push origin main
```

</details>

<details>
<summary><b>The terminal says "python3 not found" — what do I do?</b></summary>

On Mac, try using `python` instead of `python3`. Or install Python 3:

```bash
brew install python3
```

</details>

---

## 🤝 Contributing

Contributions to The Poetry Ocean are welcome! You can:

- 🐛 Report bugs or suggest features → [Open an Issue](https://github.com/ethanthr-dotcom/shihai-the_poetry_ocean/issues)
- 🔀 Fix bugs or add features → [Submit a Pull Request](https://github.com/ethanthr-dotcom/shihai-the_poetry_ocean/pulls)
- ⭐ Star the project so more people can find it
- 📢 Share it with friends who love classical poetry

> When modifying code, please note: the web (`index.html`) and mini-program (`miniprogram/`) data logic is isomorphic — if you change one side, please update the other to keep them in sync.

---

## 📜 License

This project's source code is open-sourced under the **MIT License** (see [LICENSE](LICENSE)).

The poetry data comes from [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) (MIT License); The Poetry Ocean reprocesses it with reorganization, slicing, indexing, and character cleanup. The license for third-party content is subject to its original project's declaration; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

The Poetry Ocean is a non-profit classical poetry reading and search tool; its content is for reading, learning, and research reference only.

---

> 🌊 May you find a poem that belongs to you, in this ocean of poetry.
