// Muted/dark tones — each pair is one hue at two close, low-lightness
// values, like a translucent tint sitting over a near-black background
// (e.g. linear-gradient(110deg, rgba(0,128,255,.4), rgba(0,128,255,.5)) —
// composited onto a near-black page). Keeps white cell text at a strong
// contrast ratio instead of washing out against a bright fill.
export const CATEGORY_COLORS = {
  nonmetal: ["#1f4c61", "#286480"],
  halogen: ["#215e54", "#2c7d6f"],
  "diatomic nonmetal": ["#1d4063", "#265482"],
  "polyatomic nonmetal": ["#25355b", "#314677"],
  "noble gas": ["#3b255b", "#4e3177"],
  "alkali metal": ["#65221b", "#852d23"],
  "alkaline earth metal": ["#674218", "#885820"],
  metalloid: ["#255b2e", "#31773d"],
  "post-transition metal": ["#63551d", "#827026"],
  "transition metal": ["#5e2140", "#7d2c54"],
  lanthanide: ["#23585c", "#2e747a"],
  actinide: ["#255b44", "#31775a"],
};

export const DEFAULT_COLOR = ["#3c4553", "#4d596a"];

export const FILTER_COLORS = {
  "alkali-metal": ["#65221b", "#852d23"],
  "alkaline-earth-metal": ["#674218", "#885820"],
  "transition-metal": ["#5e2140", "#7d2c54"],
  "post-transition-metal": ["#63551d", "#827026"],
  metalloid: ["#255b2e", "#31773d"],
  halogen: ["#215e54", "#2c7d6f"],
  "noble-gas": ["#3b255b", "#4e3177"],
  nonmetal: ["#1f4c61", "#286480"],
  lanthanide: ["#23585c", "#2e747a"],
  actinide: ["#255b44", "#31775a"],
};

export function categoryColors(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

function hashStr(value) {
  let h = 0;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return [h * 60, s * 100, l * 100];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  const hh = ((h % 360) + 360) % 360 / 360;
  const ss = s / 100;
  const ll = l / 100;
  if (ss === 0) {
    const v = Math.round(ll * 255);
    return [v, v, v];
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  return [
    Math.round(hueToRgb(p, q, hh + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hh) * 255),
    Math.round(hueToRgb(p, q, hh - 1 / 3) * 255),
  ];
}

// Shades an element's own category color by its exact property value, so
// elements that share a category — and would otherwise share one flat color —
// are still told apart in a per-value "Color by" view, without introducing an
// unrelated rainbow of colors. `salt` (typically the property key, e.g.
// "oxidationStates") keeps two different properties from landing the same
// element on the same shade.
export function categoryShade(category, value, salt) {
  const [fromHex] = categoryColors(category);
  const [r, g, b] = hexToRgb(fromHex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const hash = hashStr(`${salt}:${value}`);
  const hueShift = (hash % 57) - 28; // -28..+28 degrees — stays in the family
  const lightShift = (Math.floor(hash / 57) % 21) - 10; // -10..+10 points
  const newH = h + hueShift;
  const newS = Math.max(45, s);
  const newL = Math.max(22, Math.min(76, l + lightShift));
  const [nr, ng, nb] = hslToRgb(newH, newS, newL);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

export function titleCategory(category) {
  if (!category || typeof category !== "string") return category;
  return category.replace(/(^|\s)[a-z]/g, (m) => m.toUpperCase());
}

export const CATEGORIES = [
  { key: "alkali-metal", label: "Alkali Metals", match: (el) => el.category === "alkali metal" },
  {
    key: "alkaline-earth-metal",
    label: "Alkaline Earth Metals",
    match: (el) => el.category === "alkaline earth metal",
  },
  { key: "transition-metal", label: "Transition Metals", match: (el) => el.category === "transition metal" },
  {
    key: "post-transition-metal",
    label: "Post-transition Metals",
    match: (el) => el.category === "post-transition metal",
  },
  { key: "lanthanide", label: "Lanthanides", match: (el) => el.category === "lanthanide" },
  { key: "actinide", label: "Actinides", match: (el) => el.category === "actinide" },
  { key: "metalloid", label: "Metalloids", match: (el) => el.category === "metalloid" },
  { key: "halogen", label: "Halogens", match: (el) => el.category === "halogen" },
  { key: "noble-gas", label: "Noble Gases", match: (el) => el.category === "noble gas" },
  {
    key: "nonmetal",
    label: "Nonmetals",
    match: (el) => ["nonmetal", "noble gas"].includes(el.category),
  },
];

export const CATEGORY_CLASS = {
  nonmetal: "el-nonmetal",
  halogen: "el-halogen",
  "diatomic nonmetal": "el-diatomic-nonmetal",
  "noble gas": "el-noble-gas",
  "alkali metal": "el-alkali-metal",
  "alkaline earth metal": "el-alkaline-earth-metal",
  metalloid: "el-metalloid",
  "polyatomic nonmetal": "el-polyatomic-nonmetal",
  "post-transition metal": "el-post-transition-metal",
  "transition metal": "el-transition-metal",
  lanthanide: "el-lanthanide",
  actinide: "el-actinide",
};