// Light, pastel tones — each pair is one hue at two close, high-lightness
// values (a soft tint sitting over a near-white background), so dark navy
// cell text stays at a strong, calm contrast ratio instead of the harsh
// white-on-saturated-color look of a dashboard/game UI.
export const CATEGORY_COLORS = {
  "alkali metal": ["#F4D2D4", "#E9A5AB"],
  "alkaline earth metal": ["#F4E2D2", "#E9C5A5"],
  halogen: ["#F4EDD2", "#E9DBA5"],
  actinide: ["#DAF4D2", "#B6E9A5"],
  nonmetal: ["#D2F4E0", "#A5E9C1"],
  "diatomic nonmetal": ["#D2F4E0", "#A5E9C1"],
  "polyatomic nonmetal": ["#D2F4E0", "#A5E9C1"],
  metalloid: ["#D2F4F1", "#A5E9E3"],
  lanthanide: ["#D2ECF4", "#A5D8E9"],
  "transition metal": ["#D2E0F4", "#A5C1E9"],
  "post-transition metal": ["#D7D2F4", "#B0A5E9"],
  "noble gas": ["#ECD2F4", "#D8A5E9"],
};

export const DEFAULT_COLOR = ["#E7EAEF", "#D7DCE4"];

// A single, more saturated "ink" per category — used only where a pastel
// fill would be too pale to read (hover glow rings, active filter borders),
// never as a background of its own.
export const CATEGORY_ACCENT = {
  "alkali metal": "#B9313D",
  "alkaline earth metal": "#B97131",
  halogen: "#B99E31",
  actinide: "#53B931",
  nonmetal: "#31B96A",
  "diatomic nonmetal": "#31B96A",
  "polyatomic nonmetal": "#31B96A",
  metalloid: "#31B9AE",
  lanthanide: "#3197B9",
  "transition metal": "#316AB9",
  "post-transition metal": "#4831B9",
  "noble gas": "#9731B9",
};

export const DEFAULT_ACCENT = "#6B7686";

// A dark, saturated version of each category's hue — used as the TEXT color
// on top of the pastel fill (number/symbol/name/mass), so every category
// reads as its own consistent color family instead of one flat black/navy
// for every cell regardless of category.
export const CATEGORY_TEXT = {
  "alkali metal": "#711E25",
  "alkaline earth metal": "#71451E",
  halogen: "#71601E",
  actinide: "#33711E",
  nonmetal: "#1E7140",
  "diatomic nonmetal": "#1E7140",
  "polyatomic nonmetal": "#1E7140",
  metalloid: "#1E716A",
  lanthanide: "#1E5C71",
  "transition metal": "#1E4071",
  "post-transition metal": "#2C1E71",
  "noble gas": "#5C1E71",
};

export const DEFAULT_TEXT = "#1B2430";

export function categoryText(category) {
  return CATEGORY_TEXT[category] || DEFAULT_TEXT;
}

export const FILTER_COLORS = {
  "alkali-metal": ["#F4D2D4", "#E9A5AB"],
  "alkaline-earth-metal": ["#F4E2D2", "#E9C5A5"],
  "transition-metal": ["#D2E0F4", "#A5C1E9"],
  "post-transition-metal": ["#D7D2F4", "#B0A5E9"],
  metalloid: ["#D2F4F1", "#A5E9E3"],
  halogen: ["#F4EDD2", "#E9DBA5"],
  "noble-gas": ["#ECD2F4", "#D8A5E9"],
  nonmetal: ["#D2F4E0", "#A5E9C1"],
  lanthanide: ["#D2ECF4", "#A5D8E9"],
  actinide: ["#DAF4D2", "#B6E9A5"],
};

export const FILTER_ACCENT = {
  "alkali-metal": "#B9313D",
  "alkaline-earth-metal": "#B97131",
  "transition-metal": "#316AB9",
  "post-transition-metal": "#4831B9",
  metalloid: "#31B9AE",
  halogen: "#B99E31",
  "noble-gas": "#9731B9",
  nonmetal: "#31B96A",
  lanthanide: "#3197B9",
  actinide: "#53B931",
};

export function categoryColors(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

export function categoryAccent(category) {
  return CATEGORY_ACCENT[category] || DEFAULT_ACCENT;
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

export function rgbToHsl(r, g, b) {
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

export function hslToRgb(h, s, l) {
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

// Turns an already-computed "rgb(r, g, b)" color — e.g. a point along a
// "Color by" property's heat gradient — into a dark, saturated text color in
// the same hue family, the same way categoryText() does for category fills.
// Used so cell text stays colorful (matching whatever the cell is actually
// showing) instead of falling back to flat black once a property gradient
// replaces the category color.
export function darkenRgbForText(rgbString) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(rgbString || "");
  if (!m) return null;
  const [h] = rgbToHsl(Number(m[1]), Number(m[2]), Number(m[3]));
  const [r, g, b] = hslToRgb(h, 58, 28);
  return `rgb(${r}, ${g}, ${b})`;
}

// Shades an element's own category color by its exact property value, so
// elements that share a category — and would otherwise share one flat color —
// are still told apart in a per-value "Color by" view, without introducing an
// unrelated rainbow of colors. `salt` (typically the property key, e.g.
// "oxidationStates") keeps two different properties from landing the same
// element on the same shade. Clamped to stay light/pastel (never drifts dark)
// so it always reads as a calm, textbook-like tint with dark cell text.
export function categoryShade(category, value, salt) {
  const [fromHex] = categoryColors(category);
  const [r, g, b] = hexToRgb(fromHex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const hash = hashStr(`${salt}:${value}`);
  const hueShift = (hash % 57) - 28; // -28..+28 degrees — stays in the family
  const lightShift = (Math.floor(hash / 57) % 21) - 10; // -10..+10 points
  const newH = h + hueShift;
  const newS = Math.max(40, s);
  const newL = Math.max(58, Math.min(94, l + lightShift));
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
