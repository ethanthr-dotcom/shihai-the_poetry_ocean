
<h1 align="center">
🌊 诗海 · The Poetry Ocean
</h1>

<p align="center">
[简体中文](README.md) | [English](README_EN.md)

![Language](https://img.shields.io/badge/language-Chinese%20%7C%20English-blue)![License](https://img.shields.io/github/license/ethanthr-dotcom/shihai-the_poetry_ocean)

An open-source digital showcase for classical Chinese poetry — featuring **344,240 poems**, built as a pure front-end static website with no server and no back-end dependencies, using modern web technology to let a thousand years of verse be seen anew.

<p align="center">
  <img src="docs/screenshots/web-card.png" width="30%" alt="The Poetry Ocean web poem card" />
  <img src="docs/screenshots/mp-home.png" width="30%" alt="The Poetry Ocean mini-program home" />
  <img src="docs/screenshots/share-card.png" width="30%" alt="The Poetry Ocean share card" />
</p>

## 🚀 Online Demo

**Website**: https://ethanthr-dotcom.github.io/poetry-site/

**WeChat Mini Program / Multi-platform app**: scan the QR code

<p align="center">
  <img src="docs/screenshots/mp-qrcode.jpg" width="220" alt="The Poetry Ocean mini-program QR code" />
</p>

> Production data is distributed via the jsDelivr CDN, accessible within mainland China.

## 📖 Story Behind The Poetry Ocean

In an age of fast-flowing information, we consume vast amounts of text every day, yet rarely stop to read the lines of poetry that have crossed a thousand years.

Classical Chinese poetry once recorded the feelings of countless people:
the sorrowful murmurs of Du Yu over his country and people, the heroic spirit of Li Bai wandering with a sword, the broad-mindedness of Su Shi facing the storms of life.
Yet many precious poetry resources still lie dormant in databases or traditional texts, distant from modern readers.

So I created "The Poetry Ocean" — hoping that through modern internet technology, these ancient words might find a new way to be presented.
The Poetry Ocean is not only a poetry display site, but an exploration of how traditional culture meets the digital age.

> When code meets poetry, when data carries civilization,
> the words once chanted for a thousand years can still shine in today's world.

## ✨ Features

- **Random poem**: "Meet a Poem" shows a random classical poem with one tap
- **Poem of the day**: "Today's Poem" is a deterministic daily recommendation — everyone reads the same poem on the same day; the clock icon in the top bar shows recently-read poems (20 kept locally, re-readable / clearable)
- **Gestures**: swipe the poem card left/right for another random poem, double-tap the card to favorite, long-press a line to copy it
- **Smart search**: a single search box + mode switch (smart detection / by author / by dynasty / by title, default mode configurable in settings); in smart mode the input is auto-detected as author, dynasty, or title with a real-time hint; author / dynasty are exact matches, title is fuzzy, combinable with any genre; the full genre list (1,479 items) is embedded in code for zero wait: tap the genre field to expand a searchable grouped panel (Common / Poems / Ci & Qu tunes), the first entry "None" means unrestricted
- **Search experience**: real-time progress during retrieval (chunks scanned / hits found), parallel chunk loading for speed; matched keywords are bold-highlighted in result titles and author lines (search-engine style); opened entries are marked "read" for easy distinction; fuzzy title retrieval is narrowed via an offline character-digest index (search-index.json) with parallel prefetching for a major speed boost; detection results shown as a badge + short note
- **Local favorites**: tap the star beside a poem to favorite it (with a burst animation); the favorites drawer supports batch manage / delete; favorites are stored in local cache (cookie / storage), with one-click export of all favorites
- **Annotations**: tap the pen icon beside a poem to write your reading reflection (one per poem, editable / deletable); the annotation drawer supports batch manage / delete; an annotation can be composed into a share card together with the full poem (annotation large, poem small, ratio chosen when generating the card); after saving, it remembers whether to generate a card (the post-save card prompt can be turned off in Settings → "Annotation card reminder"); annotations are also stored in local cache (cookie / storage)
- **Search results list**: replaces the poem card in place, accordion-style single-poem expansion (auto vertically centered after expanding), smooth transitions, checkbox batch-favorite, auto-paging on scroll to bottom; generate a card for any poem right inside the list without going back to the home page
- **Refined experience**: ink ripple on tap, card paper texture, top reading progress bar; settings offer theme preview (color buttons with tiny dots), shake-to-draw-a-poem, famous-line glance (shows only one line, tap to reveal the full poem); share cards support a custom signature line; copy full poem and read-aloud (web speech synthesis) appear as a single line of text links below the card; tap an author's name to jump to all their poems; search history shows only when the search box is focused (one-click clearable), search within favorites; today's tip carries a solar-term greeting; the guide panel shows reading stats (read count / visit days / consecutive days); no-result queries show guiding copy; first-visit spotlight guide (auto fades in 3s, re-prompts after 30 days without a visit); pinch-zoom disabled on web; failed chunk loads auto-retry 3 times; the browser tab title syncs with the current poem
- **User guide**: the lightbulb icon in the top bar brings up the feature intro; all buttons have press-scale bounce and haptic feedback, all overlays animate out on close; poem cards enter with an ink effect, the first tip changes by time of day (morning read / night read, etc.)
- **Data note**: the inline hint in the query UI explains that "□" marks are missing characters from the original ancient texts or glyphs not covered by the font — a normal phenomenon, not a bug
- **16 theme colors** + three layouts (centered / wide / compact), instant switching driven by CSS variables; the settings panel is split into "Theme styles / Experience toggles" collapsible groups, toggle items in a compact two-column layout, internally scrollable when too tall, options equal-width aligned with full names shown
- **Horizontal / vertical** dual reading directions; vertical mode auto-recommends short poems of 56 characters or fewer
- **HD share card**: hand-drawn on Canvas, supports 1:1 / 3:4 / 9:16 / auto ratios
- **Native sharing**: supports "Share to friend" and "Share to Moments" (Android), sharing carries a poem deep link so friends open the exact same poem
- **On-demand loading**: 345 data chunks + two-level index, first visit loads only 18KB
- **Overflow-proof layout**: any text touching a border wraps by rule, fully adaptive across devices
- **WeChat Mini Program / Multi-platform app**: feature-parity with the website, data distributed via WeChat Cloud Development cloud functions, no domain ICP filing needed
- **Character-by-character splash screen**: the motto "Scoop the poems of the ancients · Nourish the heart of today" appears character by character, tap to skip
- **First-use notice**: a bottom-drawer data source and disclaimer, after agreeing you go straight to the home page
- **Hidden developer panel**: long-press the settings gear for 5s in the mini-program, or long-press the footer copyright line on the web; divided into "App / Device & System / Data & Storage / Runtime Status" four sections with real-time refresh (device model, battery, local storage usage, favorites & annotation counts, font / theme / network status, JS heap memory, etc.), supports one-click copy of all info and re-showing the splash notice

## 🛠️ Tech Stack

### Architecture Overview

```
Web       Browser ──► single-file index.html ──► data/*.json (local relative path / jsDelivr CDN)
Mini-program  Pages ──► wx.cloud.callFunction ──► poemData / poemData2 (data gzipped inside the function)
```

| Part | Tech |
|---|---|
| Website | Single-file `index.html` (vanilla HTML/CSS/JS, zero framework, zero build) |
| Theme system | CSS custom properties (variables) injected dynamically, 16 colors × 3 layouts, instant switch |
| Share image | Canvas 2D hand-drawn layout, horizontal / vertical dual layouts |
| Font | Noto Serif SC (Source Han Serif), `wx.loadFontFace` works on both page and share canvas, jsDelivr → unpkg dual-CDN fallback |
| Data distribution | jsDelivr CDN (web) / WeChat Cloud Development cloud functions (mini-program, gzipped) |
| Mini-program | Native WeChat Mini Program + multi-platform app, full port of the web features |
| Data pipeline | Python: traditional-to-simplified conversion (zhconv), garble cleanup, slicing, two-level index |

### Repository Structure

```
.
├── index.html          # The site itself (single file, all CSS/JS inline)
├── project.config.example.json # DevTools config template (copy to project.config.json and fill in your own appid)
├── data/               # 345 data chunks + two-level index (~90MB)
├── assets/             # logo / icons
├── tools/              # corpus conversion scripts
├── miniprogram/        # WeChat Mini Program source
└── cloudfunctions/     # Data cloud functions (poemData / poemData2, data gzipped)
```

### Local Deployment

#### ① Website (30 seconds)

Just any static file server:

```bash
git clone https://github.com/ethanthr-dotcom/shihai-the_poetry_ocean.git
cd shihai-the_poetry_ocean
python3 -m http.server 8080
```

Open http://localhost:8080/ in your browser.
The site auto-detects the local environment (`IS_LOCAL`) and loads chunks on demand from the relative `data/` path without going through the CDN; when deployed to any static host (GitHub Pages / Cloudflare Pages, etc.) it automatically switches to the jsDelivr data source — no code changes needed.

#### ② WeChat Mini Program (Cloud Development mode)

Prerequisites: WeChat DevTools, your own Mini Program AppID, an enabled Cloud Development environment.

1. Create a new "Cloud Development" template project in DevTools;
2. Copy `project.config.example.json` to `project.config.json` (this file contains a personal appid and is gitignored, not committed), then use DevTools "Import Project" to select the repository root, and replace the `appid` in the config with your own;
3. Open the "Cloud Development" console → Settings → Environment:
   - Note the **Environment ID** and fill it into `CLOUDBASE_ENV` in `miniprogram/utils/config.js`;
   - Add your AppID under "Environment access permissions";
4. Right-click `poemData` and `poemData2` → **Upload and deploy: all files** (~17MB / ~24MB, a minute or two each);
5. Compile and run — random poem drawing fetches data via the cloud function (both functions are auto-warmed at startup).

> Why two cloud functions? WeChat cloud function deployment packages are capped at 50MB; the 345 chunks (~40MB gzipped) are split into 001–140 and 141–345 across two functions, and the mini-program auto-routes by chunk number (`CLOUDBASE_SPLIT = 140`). The cloud function reads and `gunzip`s on the fly with an in-memory cache.

#### ③ Pure local debug mode (optional, no Cloud Development needed)

You can run the mini-program without enabling Cloud Development by editing `miniprogram/utils/config.js`:

```js
const DATA_MODE = "http";
const USE_LOCAL = true;   // data now read from http://127.0.0.1:8765/
```

Then run `python3 -m http.server 8765` in the repository root, and in DevTools under "Details → Local settings" check **Do not verify legal domains**.

#### ④ Regenerating the data

```bash
pip3 install zhconv   # first time only
python3 tools/convert_chinese_poetry.py
```

## 📚 Data Source

The poetry data comes from the open-source project [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) (MIT License), covering the Complete Tang Poems, Complete Song Poems, Song Ci, Yuan Qu, Five Dynasties poetry, Chu Ci, the Book of Songs (Shi Jing), Cao Cao, Nalan Xingde, and more.

The Poetry Ocean reprocesses the original corpus to suit on-demand loading on a pure front-end static site:

- Traditional characters uniformly converted to simplified
- PUA code points and garbled characters cleaned
- Split into 345 chunks (1,000 poems each, ~90MB total) with a two-level index for lazy loading

```
data/
├── index.json       # Lite index (file/count/dynasties, 18KB)
├── index-full.json  # Filter index (also authors/types, 324KB)
├── 001.json         # 345 chunks, 1,000 poems each
├── 002.json
└── ...345.json
```

Each chunk's poem objects use short key names:

| Key | Meaning | Key | Meaning |
|---|---|---|---|
| `t` | Title | `d` | Dynasty |
| `a` | Author | `y` | Genre/Form |
| `c` | Content | | |

Regenerate the data:

```bash
pip3 install zhconv   # first time only
python3 tools/convert_chinese_poetry.py
```

## 📜 License

This project's source code is open-sourced under the **MIT License** (see [LICENSE](LICENSE)).

The poetry data comes from chinese-poetry/chinese-poetry (MIT License); The Poetry Ocean reprocesses it with reorganization, slicing, indexing, and character cleanup. The license for third-party content is subject to its original project's declaration; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

The Poetry Ocean is a non-profit classical poetry reading and search tool; its content is for reading, learning, and research reference only.
