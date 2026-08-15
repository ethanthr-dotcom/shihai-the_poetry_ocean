// 主题定义：与网页版 index.html 的 THEMES 完全一致
const THEME_KEY = "poetry-theme-v1";

const THEMES = {
  color: {
    warm: {
      label: "暖纸",
      vars: {
        "--bg-color": "#f4f1e8", "--text-color": "#2f2a24",
        "--card-bg": "rgba(255,255,255,.82)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#ddd4c7",
        "--card-shadow": "0 8px 26px rgba(70,55,35,.08)",
        "--accent-color": "#4f5f4a", "--meta-color": "#766d63",
        "--tip-color": "#756c62", "--label-color": "#665d54",
        "--input-bg": "#fff", "--input-border": "#cfc4b6",
        "--subtitle-color": "#746b61", "--category-color": "#958a7e",
        "--error-color": "#a3382f", "--button-text": "#fff",
        "--seal-color": "#a3382f"
      }
    },
    ink: {
      label: "水墨",
      vars: {
        "--bg-color": "#fafaf8", "--text-color": "#333333",
        "--card-bg": "rgba(255,255,255,.9)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#e0e0e0",
        "--card-shadow": "0 8px 26px rgba(0,0,0,.06)",
        "--accent-color": "#555555", "--meta-color": "#888888",
        "--tip-color": "#888888", "--label-color": "#777777",
        "--input-bg": "#fff", "--input-border": "#d0d0d0",
        "--subtitle-color": "#999999", "--category-color": "#aaaaaa",
        "--error-color": "#c0392b", "--button-text": "#fff",
        "--seal-color": "#a03a30"
      }
    },
    dark: {
      label: "暗夜",
      vars: {
        "--bg-color": "#1a1a1a", "--text-color": "#e0d9cc",
        "--card-bg": "rgba(40,38,35,.92)", "--sheet-bg": "rgb(40,38,35)", "--card-border": "#3a3733",
        "--card-shadow": "0 8px 26px rgba(0,0,0,.3)",
        "--accent-color": "#8a9a7a", "--meta-color": "#a09888",
        "--tip-color": "#9a9080", "--label-color": "#a09888",
        "--input-bg": "#2a2825", "--input-border": "#4a4740",
        "--subtitle-color": "#a09888", "--category-color": "#8a8076",
        "--error-color": "#d4645a", "--button-text": "#1a1a1a",
        "--seal-color": "#8f4a42"
      }
    },
    celadon: {
      label: "青瓷",
      vars: {
        "--bg-color": "#eef3f0", "--text-color": "#2d3a35",
        "--card-bg": "rgba(255,255,255,.85)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#c8d8d0",
        "--card-shadow": "0 8px 26px rgba(45,58,53,.08)",
        "--accent-color": "#4a7a6a", "--meta-color": "#6a8a7a",
        "--tip-color": "#6a8a7a", "--label-color": "#5a7a6a",
        "--input-bg": "#fff", "--input-border": "#b8c8c0",
        "--subtitle-color": "#7a9a8a", "--category-color": "#8aaa9a",
        "--error-color": "#b04a3a", "--button-text": "#fff",
        "--seal-color": "#a85a4e"
      }
    },
    morandi: {
      label: "莫兰迪",
      vars: {
        "--bg-color": "#e5e1da", "--text-color": "#57534b",
        "--card-bg": "rgba(233,229,222,.88)", "--sheet-bg": "rgb(233,229,222)", "--card-border": "#d3cdc2",
        "--card-shadow": "0 8px 26px rgba(87,83,75,.08)",
        "--accent-color": "#8a9a84", "--meta-color": "#7d776c",
        "--tip-color": "#857f74", "--label-color": "#6e6860",
        "--input-bg": "#ece8e1", "--input-border": "#c9c2b6",
        "--subtitle-color": "#8b857a", "--category-color": "#9a9488",
        "--error-color": "#b56a5e", "--button-text": "#fff",
        "--seal-color": "#a5756c"
      }
    },
    vivid: {
      label: "炽烈",
      vars: {
        "--bg-color": "#faf8ff", "--text-color": "#221845",
        "--card-bg": "rgba(255,255,255,.9)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#d9d0f5",
        "--card-shadow": "0 8px 26px rgba(109,40,217,.10)",
        "--accent-color": "#6d28d9", "--meta-color": "#5b4b9e",
        "--tip-color": "#6d5fb0", "--label-color": "#4c3f85",
        "--input-bg": "#fff", "--input-border": "#c7b8f0",
        "--subtitle-color": "#7a68c2", "--category-color": "#9488c8",
        "--error-color": "#d61f69", "--button-text": "#fff",
        "--seal-color": "#b3423a"
      }
    },
    vangogh: {
      label: "星夜",
      vars: {
        "--bg-color": "#0e1834", "--text-color": "#e8e6d8",
        "--card-bg": "rgba(21,33,66,.9)", "--sheet-bg": "rgb(21,33,66)", "--card-border": "#2c3f75",
        "--card-shadow": "0 8px 26px rgba(0,0,10,.4)",
        "--accent-color": "#f0c419", "--meta-color": "#a9b4d8",
        "--tip-color": "#98a3c8", "--label-color": "#a9b4d8",
        "--input-bg": "#16234a", "--input-border": "#34497f",
        "--subtitle-color": "#8f9cc4", "--category-color": "#7f8cb4",
        "--error-color": "#ff8a7a", "--button-text": "#0e1834",
        "--seal-color": "#a3453c"
      }
    },
    rembrandt: {
      label: "伦勃朗",
      vars: {
        "--bg-color": "#1a130d", "--text-color": "#e8dcc0",
        "--card-bg": "rgba(38,28,18,.92)", "--sheet-bg": "rgb(38,28,18)", "--card-border": "#4a3a26",
        "--card-shadow": "0 8px 26px rgba(0,0,0,.45)",
        "--accent-color": "#c9973f", "--meta-color": "#b5a37f",
        "--tip-color": "#a89470", "--label-color": "#b5a37f",
        "--input-bg": "#241a10", "--input-border": "#56432c",
        "--subtitle-color": "#a89470", "--category-color": "#93815f",
        "--error-color": "#e0705f", "--button-text": "#1a130d",
        "--seal-color": "#8a4a35"
      }
    },
    rouge: {
      label: "胭脂",
      vars: {
        "--bg-color": "#fbe8ec", "--text-color": "#4a2730",
        "--card-bg": "rgba(255,255,255,.82)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#f0c8d2",
        "--card-shadow": "0 8px 26px rgba(176,74,100,.08)",
        "--accent-color": "#b04a64", "--meta-color": "#8a6a72",
        "--tip-color": "#8a6a72", "--label-color": "#7a5a62",
        "--input-bg": "#fff", "--input-border": "#e6b8c2",
        "--subtitle-color": "#9a7a82", "--category-color": "#aa8a92",
        "--error-color": "#a3382f", "--button-text": "#fff",
        "--seal-color": "#9a3848"
      }
    },
    daiqing: {
      label: "黛青",
      vars: {
        "--bg-color": "#e8edf2", "--text-color": "#2a3548",
        "--card-bg": "rgba(255,255,255,.85)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#c8d4e2",
        "--card-shadow": "0 8px 26px rgba(42,53,72,.08)",
        "--accent-color": "#3a5a7a", "--meta-color": "#6a7a8a",
        "--tip-color": "#6a7a8a", "--label-color": "#5a6a7a",
        "--input-bg": "#fff", "--input-border": "#b8c4d2",
        "--subtitle-color": "#7a8a9a", "--category-color": "#8a9aaa",
        "--error-color": "#b04a3a", "--button-text": "#fff",
        "--seal-color": "#a85a4e"
      }
    },
    moss: {
      label: "苔绿",
      vars: {
        "--bg-color": "#e8efe6", "--text-color": "#2a3a28",
        "--card-bg": "rgba(255,255,255,.85)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#c8d8c0",
        "--card-shadow": "0 8px 26px rgba(42,58,40,.08)",
        "--accent-color": "#4a6a3a", "--meta-color": "#6a8a5a",
        "--tip-color": "#6a8a5a", "--label-color": "#5a7a4a",
        "--input-bg": "#fff", "--input-border": "#b8c8a8",
        "--subtitle-color": "#7a9a6a", "--category-color": "#8aaa7a",
        "--error-color": "#a3382f", "--button-text": "#fff",
        "--seal-color": "#9a5a3a"
      }
    },
    amber: {
      label: "琥珀",
      vars: {
        "--bg-color": "#f6ede0", "--text-color": "#4a3920",
        "--card-bg": "rgba(255,255,255,.85)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#e8d4b0",
        "--card-shadow": "0 8px 26px rgba(176,138,58,.08)",
        "--accent-color": "#b08a3a", "--meta-color": "#8a7a52",
        "--tip-color": "#8a7a52", "--label-color": "#7a6a42",
        "--input-bg": "#fff", "--input-border": "#dcc898",
        "--subtitle-color": "#9a8a62", "--category-color": "#aa9a72",
        "--error-color": "#a3382f", "--button-text": "#4a3920",
        "--seal-color": "#9a4a2a"
      }
    },
    indigo: {
      label: "靛蓝",
      vars: {
        "--bg-color": "#1a1f3a", "--text-color": "#d8dcea",
        "--card-bg": "rgba(30,36,60,.92)", "--sheet-bg": "rgb(30,36,60)", "--card-border": "#34406a",
        "--card-shadow": "0 8px 26px rgba(0,0,20,.4)",
        "--accent-color": "#7a8ae8", "--meta-color": "#a0a8c8",
        "--tip-color": "#98a0c0", "--label-color": "#a0a8c8",
        "--input-bg": "#242a48", "--input-border": "#3a4a72",
        "--subtitle-color": "#8a92b8", "--category-color": "#7a82a8",
        "--error-color": "#e87060", "--button-text": "#1a1f3a",
        "--seal-color": "#8a5a4a"
      }
    },
    lotus: {
      label: "藕荷",
      vars: {
        "--bg-color": "#efe8f0", "--text-color": "#3a2a40",
        "--card-bg": "rgba(255,255,255,.85)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#d8c8e0",
        "--card-shadow": "0 8px 26px rgba(122,90,138,.08)",
        "--accent-color": "#7a5a8a", "--meta-color": "#7a6a82",
        "--tip-color": "#7a6a82", "--label-color": "#6a5a72",
        "--input-bg": "#fff", "--input-border": "#c8b8d0",
        "--subtitle-color": "#8a7a92", "--category-color": "#9a8aa2",
        "--error-color": "#a3382f", "--button-text": "#fff",
        "--seal-color": "#9a5a6a"
      }
    },
    pine: {
      label: "松烟",
      vars: {
        "--bg-color": "#d8dcd6", "--text-color": "#2a2e28",
        "--card-bg": "rgba(255,255,255,.7)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#bcc4b8",
        "--card-shadow": "0 8px 26px rgba(42,46,40,.08)",
        "--accent-color": "#4a5a48", "--meta-color": "#6a7a68",
        "--tip-color": "#6a7a68", "--label-color": "#5a6a58",
        "--input-bg": "#e8ece6", "--input-border": "#a8b0a4",
        "--subtitle-color": "#7a8a78", "--category-color": "#8a9a88",
        "--error-color": "#a3382f", "--button-text": "#fff",
        "--seal-color": "#9a4a3a"
      }
    },
    qinghua: {
      label: "青花",
      vars: {
        "--bg-color": "#eef2f6", "--text-color": "#1a2a3a",
        "--card-bg": "rgba(255,255,255,.85)", "--sheet-bg": "rgb(252,248,241)", "--card-border": "#c4d4e0",
        "--card-shadow": "0 8px 26px rgba(26,42,58,.08)",
        "--accent-color": "#2a5a8a", "--meta-color": "#5a6a7a",
        "--tip-color": "#5a6a7a", "--label-color": "#4a5a6a",
        "--input-bg": "#fff", "--input-border": "#b4c4d4",
        "--subtitle-color": "#6a7a8a", "--category-color": "#7a8a9a",
        "--error-color": "#a3382f", "--button-text": "#fff",
        "--seal-color": "#a05a3a"
      }
    }
  },
  layout: {
    // 卡片铺满屏幕，两侧各留 16px（750 设计稿下即 32rpx）一字符边距
    centered: { label: "居中", vars: { "--max-width": "none", "--page-padding": "48px 16px", "--card-padding": "42px 25px" } },
    wide: { label: "宽屏", vars: { "--max-width": "none", "--page-padding": "48px 16px", "--card-padding": "42px 25px" } },
    compact: { label: "紧凑", vars: { "--max-width": "none", "--page-padding": "32px 16px", "--card-padding": "30px 25px" } }
  },
  size: {
    // 字号选项已移除：固定大号（标题 29/作者 18/正文 21/体裁 16）
    large: { label: "大", vars: { "--title-font-size": "29px", "--meta-font-size": "18px", "--content-font-size": "21px", "--category-font-size": "16px" } }
  }
};

// 面板选项列表（顺序与网页版一致）
const COLOR_OPTIONS = ["warm", "ink", "dark", "celadon", "morandi", "vivid", "vangogh", "rembrandt", "rouge", "daiqing", "moss", "amber", "indigo", "lotus", "pine", "qinghua"].map(
  (v) => ({ value: v, label: THEMES.color[v].label })
);
const LAYOUT_OPTIONS = ["centered", "wide", "compact"].map((v) => ({ value: v, label: THEMES.layout[v].label }));
const DIRECTION_OPTIONS = [
  { value: "horizontal", label: "横排" },
  { value: "vertical", label: "竖排" }
];

// 卡片左右内边距（fitCardText 探针换算用）
const CARD_PAD_X = { centered: 25, wide: 25, compact: 25 };

// 主题 → 根节点 style 字符串
function buildStyleVars(theme) {
  const parts = [];
  ["color", "layout", "size"].forEach((g) => {
    const t = THEMES[g][theme[g]];
    if (!t) return;
    Object.keys(t.vars).forEach((k) => parts.push(k + ":" + t.vars[k]));
  });
  return parts.join(";");
}

function loadTheme() {
  const theme = { color: "warm", layout: "centered", size: "large", direction: "horizontal" };
  try {
    const saved = wx.getStorageSync(THEME_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      if (p.color && THEMES.color[p.color]) theme.color = p.color;
      if (p.layout && THEMES.layout[p.layout]) theme.layout = p.layout;
      if (p.direction === "vertical" || p.direction === "horizontal") theme.direction = p.direction;
      // 竖排分享图默认紧凑排版
      if (theme.direction === "vertical") {
        theme.layout = "compact";
      }
    }
  } catch (e) {}
  return theme;
}

function saveTheme(theme) {
  try {
    wx.setStorageSync(THEME_KEY, JSON.stringify(theme));
  } catch (e) {}
}

module.exports = {
  THEMES, THEME_KEY, CARD_PAD_X,
  COLOR_OPTIONS, LAYOUT_OPTIONS, DIRECTION_OPTIONS,
  buildStyleVars, loadTheme, saveTheme
};
