import raw from "../database/periodic-table-lookup.json";
import categoryRaw from "../database/periodic-table-data.json";

// The user-supplied category dataset ("periodic-table-data.json") groups elements
// by its "GroupBlock" column. That becomes the authoritative category used for
// element colors and filtering, keyed by atomic number.
const GROUP_BLOCK_COL = 15;
export const GROUP_BLOCK_BY_NUMBER = (() => {
  const map = new Map();
  const rows =
    categoryRaw && categoryRaw.Table && Array.isArray(categoryRaw.Table.Row)
      ? categoryRaw.Table.Row
      : [];
  rows.forEach((row) => {
    const cells = Array.isArray(row.Cell) ? row.Cell : [];
    const num = Number.parseInt(cells[0], 10);
    const block = cells[GROUP_BLOCK_COL];
    if (num >= 1 && num <= 118 && block && typeof block === "string") {
      map.set(num, block.toLowerCase());
    }
  });
  return map;
})();

// The same user dataset also carries a few numeric property columns that the
// lookup dataset lacks (AtomicRadius in pm, YearDiscovered) or leaves empty for
// some elements (MeltingPoint / BoilingPoint in K). It also carries the
// categorical columns (StandardState, OxidationStates, GroupBlock) that back
// the "Color by" options. RICH_BY_NUMBER exposes all of it.
const RICH_COL = {
  atomicRadius: 7,
  oxidationStates: 10,
  standardState: 11,
  melt: 12,
  boil: 13,
  groupBlock: 15,
  yearDiscovered: 16,
};

export const RICH_BY_NUMBER = (() => {
  const map = new Map();
  const rows =
    categoryRaw && categoryRaw.Table && Array.isArray(categoryRaw.Table.Row)
      ? categoryRaw.Table.Row
      : [];
  const toNum = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  rows.forEach((row) => {
    const cells = Array.isArray(row.Cell) ? row.Cell : [];
    const num = Number.parseInt(cells[0], 10);
    if (!(num >= 1 && num <= 118)) return;
    const text = (i) => {
      const v = cells[i];
      return v === "" || v === null || v === undefined ? null : String(v);
    };
    map.set(num, {
      atomicRadius: toNum(cells[RICH_COL.atomicRadius]),
      oxidationStates: text(RICH_COL.oxidationStates),
      standardState: text(RICH_COL.standardState),
      melt: toNum(cells[RICH_COL.melt]),
      boil: toNum(cells[RICH_COL.boil]),
      groupBlock: text(RICH_COL.groupBlock),
      yearDiscovered: text(RICH_COL.yearDiscovered),
    });
  });
  return map;
})();

// GroupBlock families collapse into a Metal / Metalloid / Nonmetal label for
// the "Metallicity" Color by option.
const METAL_BLOCKS = new Set([
  "alkali metal",
  "alkaline earth metal",
  "transition metal",
  "post-transition metal",
  "lanthanide",
  "actinide",
]);
const NONMETAL_BLOCKS = new Set(["nonmetal", "halogen", "noble gas"]);

export function metallicityFor(groupBlock) {
  if (!groupBlock) return null;
  const block = String(groupBlock).toLowerCase();
  if (METAL_BLOCKS.has(block)) return "Metal";
  if (block === "metalloid") return "Metalloid";
  if (NONMETAL_BLOCKS.has(block)) return "Nonmetal";
  return null;
}

// Standard-state labels from the dataset may be speculative ("Expected to be a
// Solid"). Compact them into "Expected(Solid)" style labels.
export function normalizeStandardState(value) {
  if (!value) return value;
  const s = String(value);
  const m = s.match(/^expected to be an? (.+)$/i);
  if (m) {
    const word = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    return `Expected(${word})`;
  }
  return s;
}

// normalizeElement converts ONE raw dataset record into the application's
// element model. It only renames/derives — it never invents scientific data.
// The raw record is kept on `element.raw` so the dataset stays the source of truth.
export function normalizeElement(record) {
  const rich = RICH_BY_NUMBER.get(record.number);
  return {
    number: record.number,
    symbol: record.symbol,
    name: record.name,
    category: GROUP_BLOCK_BY_NUMBER.get(record.number) || record.category || null,
    block: record.block || null,
    period: record.period,
    group: record.group,
    phase: record.phase || null,
    xpos: record.xpos,
    ypos: record.ypos,
    wxpos: record.wxpos,
    wypos: record.wypos,
    atomicMass: record.atomic_mass,
    appearance: record.appearance || null,
    density: record.density ?? null,
    melt: record.melt ?? rich?.melt ?? null,
    boil: record.boil ?? rich?.boil ?? null,
    atomicRadius: rich?.atomicRadius ?? null,
    standardState: normalizeStandardState(rich?.standardState) ?? null,
    oxidationStates: rich?.oxidationStates ?? null,
    groupBlock: rich?.groupBlock ?? null,
    yearDiscovered: rich?.yearDiscovered ?? null,
    metallicity: metallicityFor(rich?.groupBlock) ?? null,
    molarHeat: record.molar_heat ?? null,
    discoveredBy: record.discovered_by || null,
    namedBy: record.named_by || null,
    summary: record.summary || null,
    shells: Array.isArray(record.shells) ? record.shells : [],
    electronConfiguration: record.electron_configuration || null,
    electronConfigurationSemantic: record.electron_configuration_semantic || null,
    electronAffinity: record.electron_affinity ?? null,
    electronegativity: record.electronegativity_pauling ?? null,
    ionizationEnergies: Array.isArray(record.ionization_energies)
      ? record.ionization_energies
      : [],
    cpkHex: record["cpk-hex"] || null,
    image: record.image || null,
    bohrModelImage: record.bohr_model_image || null,
    bohrModel3d: record.bohr_model_3d || null,
    spectralImg: record.spectral_img || null,
    source: record.source || null,
    raw: record,
  };
}

// ORDER is the dataset's own list/order of elements (keys only — never rendered
// as a table on its own; the table derives from positional fields below).
const ORDER_KEYS = Array.isArray(raw.order) ? raw.order : [];

export function isTableElement(e) {
  return e && e.number && e.number >= 1 && e.number <= 118;
}

export const ELEMENTS = ORDER_KEYS.map((key) =>
  raw[key] ? normalizeElement(raw[key]) : null
).filter((e) => e && isTableElement(e));

export const NUMBER_MAP = new Map(ELEMENTS.map((e) => [e.number, e]));
export const SYMBOL_MAP = new Map(
  ELEMENTS.map((e) => [e.symbol.toLowerCase(), e])
);
export const KEY_BY_NUMBER = new Map(
  ORDER_KEYS.map((key) => [raw[key] && raw[key].number, key])
);

export const MAIN_ROWS = 7;
export const MAIN_COLS = 18;
export const LAN_COLS = 15;
export const WIDE_COLS = 32;

// Compact (18-column) grid derived from xpos/ypos, with the f-block pulled out
// into a two-row lanthanide/actinide panel (ypos 9 = lanthanides, 10 = actinides).
export function buildCompactGrid(elements = ELEMENTS) {
  const main = Array.from({ length: MAIN_ROWS }, () =>
    Array(MAIN_COLS).fill(null)
  );
  const lan = [Array(LAN_COLS).fill(null), Array(LAN_COLS).fill(null)];

  elements.forEach((e) => {
    if (e.ypos >= 1 && e.ypos <= MAIN_ROWS) {
      const r = e.ypos - 1;
      const c = e.xpos - 1;
      if (r >= 0 && r < MAIN_ROWS && c >= 0 && c < MAIN_COLS) main[r][c] = e;
    } else if (e.ypos === 9) {
      const c = e.xpos - 3;
      if (c >= 0 && c < LAN_COLS) lan[0][c] = e;
    } else if (e.ypos === 10) {
      const c = e.xpos - 3;
      if (c >= 0 && c < LAN_COLS) lan[1][c] = e;
    }
  });

  return { main, lan };
}

// Wide (32-column) grid derived from wxpos/wypos — the classic wide format where
// the f-block stays inline within periods 6 and 7.
export function buildWideGrid(elements = ELEMENTS) {
  const rows = Array.from({ length: MAIN_ROWS }, () =>
    Array(WIDE_COLS).fill(null)
  );
  elements.forEach((e) => {
    if (!e.wxpos || !e.wypos) return;
    const r = e.wypos - 1;
    const c = e.wxpos - 1;
    if (r >= 0 && r < MAIN_ROWS && c >= 0 && c < WIDE_COLS) rows[r][c] = e;
  });
  return rows;
}

// Flatten the compact output into an { element, panel, row, col } list so callers
// can guarantee every element appears exactly once when rendered.
export function flattenCompact(elements = ELEMENTS) {
  const { main, lan } = buildCompactGrid(elements);
  const cells = [];
  main.forEach((row, r) =>
    row.forEach((el, c) => {
      if (el) cells.push({ element: el, panel: "main", row: r, col: c });
    })
  );
  lan.forEach((row, r) =>
    row.forEach((el, c) => {
      if (el) cells.push({ element: el, panel: "lan", row: r, col: c });
    })
  );
  return cells;
}