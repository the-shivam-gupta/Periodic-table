// Property scales for the heatmap / property view. Each property is either
// "numeric" (a continuous gradient) or "categorical" (a flat color per distinct
// value). Only uses fields that exist in the dataset. Missing values are
// surfaced as a blank (or a configured placeholder like "Ancient") — never
// invented.
import React from "react";

// Electron configuration strings like "[Ne] 3s2 3p5" get their orbital
// occupancies set as superscripts: [Ne] 3s<sup>2</sup> 3p<sup>5</sup>.
export function renderElectronConfig(value) {
  const s = String(value);
  const parts = s.split(/(\d+[spdf]\d+)/g).filter((p) => p !== "");
  return parts.map((p, i) => {
    const m = /^(\d+[spdf])(\d+)$/.exec(p);
    if (!m) return p;
    return (
      <span key={i}>
        {m[1]}
        <sup>{m[2]}</sup>
      </span>
    );
  });
}

export const PROPERTIES = [
  {
    key: "atomicMass",
    kind: "numeric",
    label: "Atomic Mass",
    unit: "u",
    accessor: (e) => e.atomicMass ?? null,
    fmt: (v) => formatSig(v, 5),
  },
  {
    key: "atomicRadius",
    kind: "numeric",
    label: "Atomic Radius",
    unit: "pm",
    accessor: (e) => e.atomicRadius ?? null,
    fmt: (v) => String(Math.round(v)),
  },
  {
    key: "density",
    kind: "numeric",
    label: "Density",
    unit: "g/cm³",
    accessor: (e) => e.density ?? null,
    fmt: (v) => formatSig(v, 4),
  },
  {
    key: "electronegativity",
    kind: "numeric",
    label: "Electronegativity",
    unit: "",
    accessor: (e) => e.electronegativity ?? null,
    fmt: (v) => String(v),
  },
  {
    key: "electronAffinity",
    kind: "numeric",
    label: "Electron Affinity",
    unit: "kJ/mol",
    accessor: (e) => e.electronAffinity ?? null,
    fmt: (v) => String(Math.round(v)),
  },
  {
    key: "ionization",
    kind: "numeric",
    label: "Ionization Energy",
    unit: "kJ/mol",
    accessor: (e) =>
      Array.isArray(e.ionizationEnergies) && e.ionizationEnergies.length
        ? e.ionizationEnergies[0]
        : null,
    fmt: (v) => String(Math.round(v)),
  },
  {
    key: "melt",
    kind: "numeric",
    label: "Melting Point",
    unit: "K",
    accessor: (e) => e.melt ?? null,
    fmt: (v) => String(Math.round(v)),
  },
  {
    key: "boil",
    kind: "numeric",
    label: "Boiling Point",
    unit: "K",
    accessor: (e) => e.boil ?? null,
    fmt: (v) => String(Math.round(v)),
  },
  {
    key: "yearDiscovered",
    kind: "numeric",
    label: "Year Discovered",
    unit: "",
    noValueText: "Ancient",
    accessor: (e) => {
      if (e.yearDiscovered == null || e.yearDiscovered === "") return null;
      const n = Number(e.yearDiscovered);
      return Number.isFinite(n) ? n : null; // "Ancient" → no numeric value
    },
    fmt: (v) => (v == null ? "Ancient" : String(Math.round(v))),
  },
  {
    key: "metallicity",
    kind: "categorical",
    label: "Metallicity",
    unit: "",
    accessor: (e) => e.metallicity ?? null,
    fmt: (v) => String(v),
  },
  {
    key: "standardState",
    kind: "categorical",
    label: "Standard State",
    unit: "",
    accessor: (e) => e.standardState ?? null,
    fmt: (v) => String(v),
  },
  {
    key: "oxidationStates",
    kind: "categorical",
    categoryShaded: true,
    label: "Oxidation States",
    unit: "",
    accessor: (e) => e.oxidationStates ?? null,
    fmt: (v) => String(v),
  },
  {
    key: "electronConfiguration",
    kind: "categorical",
    categoryShaded: true,
    label: "Electron Configuration",
    unit: "",
    accessor: (e) => e.electronConfigurationSemantic || e.electronConfiguration || null,
    fmt: (v) => renderElectronConfig(v),
  },
];

export function getPropertyConfig(key) {
  return PROPERTIES.find((p) => p.key === key) || null;
}

export function propertyValue(element, key) {
  const cfg = getPropertyConfig(key);
  if (!cfg) return null;
  return cfg.accessor(element);
}

// A numeric property "exists" only when it is a finite number (0 is valid).
// A categorical property "exists" when it is a non-empty string.
export function isMissingValue(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value));
}

export function isMissingValueFor(kind, value) {
  if (kind === "categorical") {
    return value === null || value === undefined || value === "";
  }
  return isMissingValue(value);
}

// Fixed palette used to assign one color per distinct categorical value.
// Muted/dark tones (same family as the category colors) so white cell text
// stays at a strong contrast ratio instead of washing out against a bright
// fill.
export const CATEGORICAL_PALETTE = [
  "#642b26",
  "#764c28",
  "#695d20",
  "#63732b",
  "#3f6723",
  "#287925",
  "#26643b",
  "#287660",
  "#206369",
  "#2b5173",
  "#232e67",
  "#372579",
  "#4a2664",
  "#732876",
  "#692051",
  "#732b40",
];

function hashValue(value) {
  let h = 0;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// --- Color scale ---
// Scientific heat gradient tuned to the dark theme: low = indigo/blue →
// mid = cyan/teal → high = amber → very high = red. Muted/dark values (like
// a translucent tint over near-black) so white cell text keeps a strong
// contrast ratio instead of washing out against a bright fill.
export const STOPS = [
  [0.0, [40, 51, 113]],
  [0.38, [37, 106, 101]],
  [0.72, [126, 97, 37]],
  [1.0, [126, 37, 41]],
];

export function stopsGradient(direction = 90) {
  const stops = STOPS.map(
    ([t, rgb]) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}) ${t * 100}%`
  ).join(", ");
  return `linear-gradient(${direction}deg, ${stops})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(stops, t) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [ta, ca] = stops[i];
    const [tb, cb] = stops[i + 1];
    if (t >= ta && t <= tb) {
      const k = tb === ta ? 0 : (t - ta) / (tb - ta);
      return `rgb(${Math.round(lerp(ca[0], cb[0], k))}, ${Math.round(
        lerp(ca[1], cb[1], k)
      )}, ${Math.round(lerp(ca[2], cb[2], k))})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1][1][0]}, ${STOPS[STOPS.length - 1][1][1]}, ${STOPS[STOPS.length - 1][1][2]})`;
}

// buildScale returns a color-mapping scale for a property:
//  - numeric: { kind:"numeric", min, max, norm, color, missing }
//  - categorical: { kind:"categorical", values:[{value,color}], color, missing }
export function buildScale(elements, key) {
  const cfg = getPropertyConfig(key);
  if (!cfg) return null;

  if (cfg.kind === "categorical") {
    const seen = new Map();
    elements.forEach((e) => {
      const v = cfg.accessor(e);
      if (isMissingValueFor("categorical", v)) return;
      const label = String(v);
      if (!seen.has(label)) seen.set(label, 0);
    });
    const labels = Array.from(seen.keys()).sort();
    const values = labels.map((label) => ({
      value: label,
      color: CATEGORICAL_PALETTE[hashValue(label) % CATEGORICAL_PALETTE.length],
    }));
    const byValue = new Map(values.map((v) => [v.value, v.color]));
    return {
      kind: "categorical",
      values,
      color: (v) =>
        isMissingValueFor("categorical", v)
          ? null
          : byValue.get(String(v)) || null,
      missing: (v) => isMissingValueFor("categorical", v),
    };
  }

  // numeric
  let min = Infinity;
  let max = -Infinity;
  let count = 0;
  elements.forEach((e) => {
    const v = propertyValue(e, key);
    if (isMissingValue(v)) return;
    const n = Number(v);
    if (n < min) min = n;
    if (n > max) max = n;
    count += 1;
  });
  if (count === 0 || !isFinite(min) || !isFinite(max)) return null;
  if (min === max) max = min + 1;
  return {
    kind: "numeric",
    min,
    max,
    norm: (v) => (isMissingValue(v) ? null : (Number(v) - min) / (max - min)),
    color: (v) =>
      isMissingValue(v)
        ? null
        : lerpColor(STOPS, Math.max(0, Math.min(1, (Number(v) - min) / (max - min)))),
    missing: isMissingValue,
    count,
  };
}

export function formatSig(value, maxDigits = 4) {
  if (value === null || value === undefined) return "N/A";
  if (typeof value !== "number") return String(value);
  if (value === 0) return "0";
  if (!isFinite(value)) return "∞";
  const abs = Math.abs(value);
  if (abs >= 100000) return value.toExponential(2);
  if (abs >= 10000) return String(Math.round(value));
  const str = String(parseFloat(value.toPrecision(maxDigits)));
  return str;
}