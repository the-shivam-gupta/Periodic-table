// Molecule dataset — entirely separate from the element dataset.
// Each atom is placed on a normalized 0..1 canvas; the visualizer scales it.
// bonds: [atomIndexA, atomIndexB, order(1|2|3)] — atom indices are positions
// in this molecule's own `atoms` array (this is the schema the existing
// renderer, MoleculeVisualization.jsx, already expects — bonds are NOT
// string ids, atoms have no `id` field, and a molecule's own local list is
// always what bond indices point into).

const A = (symbol, x, y) => ({ symbol, x, y });

// --- Small 2D layout helpers ------------------------------------------------
// These only decide *where* atoms sit on the flat 0..1 canvas so bigger/more
// symmetric molecules stay readable and evenly spaced without hand-rounding
// every coordinate — they have no effect on how a molecule is rendered
// (MoleculeVisualization.jsx is untouched) or on what bonds exist. Used below
// for benzene/toluene's ring and for the symmetric "central atom + n evenly
// spaced substituents" molecules (BF3, BCl3, SF6, PCl5, XeF4).
function ringPoints(n, { cx = 0.5, cy = 0.5, r = 0.32, startDeg = -90 } = {}) {
  const start = (startDeg * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const a = start + (i * 2 * Math.PI) / n;
    return [
      Number((cx + r * Math.cos(a)).toFixed(3)),
      Number((cy + r * Math.sin(a)).toFixed(3)),
    ];
  });
}

export const MOLECULES = [
  {
    key: "h2",
    name: "Hydrogen",
    formula: "H₂",
    tagline: "The lightest molecule.",
    category: "molecule",
    atoms: [A("H", 0.34, 0.5), A("H", 0.66, 0.5)],
    bonds: [[0, 1, 1]],
  },
  {
    key: "o2",
    name: "Oxygen",
    formula: "O₂",
    tagline: "What we breathe.",
    atoms: [A("O", 0.34, 0.5), A("O", 0.66, 0.5)],
    bonds: [[0, 1, 2]],
  },
  {
    key: "n2",
    name: "Nitrogen",
    formula: "N₂",
    tagline: "78% of the air.",
    atoms: [A("N", 0.34, 0.5), A("N", 0.66, 0.5)],
    bonds: [[0, 1, 3]],
  },
  {
    key: "f2",
    name: "Fluorine",
    formula: "F₂",
    tagline: "The most reactive nonmetal.",
    atoms: [A("F", 0.34, 0.5), A("F", 0.66, 0.5)],
    bonds: [[0, 1, 1]],
  },
  {
    key: "cl2",
    name: "Chlorine",
    formula: "Cl₂",
    tagline: "A pungent green-yellow gas.",
    atoms: [A("Cl", 0.34, 0.5), A("Cl", 0.66, 0.5)],
    bonds: [[0, 1, 1]],
  },
  {
    key: "h2o",
    name: "Water",
    formula: "H₂O",
    tagline: "The universal solvent.",
    atoms: [A("O", 0.5, 0.64), A("H", 0.23, 0.3), A("H", 0.77, 0.3)],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
    ],
  },
  {
    key: "co2",
    name: "Carbon dioxide",
    formula: "CO₂",
    tagline: "A linear greenhouse gas.",
    atoms: [A("C", 0.5, 0.5), A("O", 0.18, 0.5), A("O", 0.82, 0.5)],
    bonds: [
      [0, 1, 2],
      [0, 2, 2],
    ],
  },
  {
    key: "o3",
    name: "Ozone",
    formula: "O₃",
    tagline: "Protects the stratosphere.",
    atoms: [A("O", 0.5, 0.68), A("O", 0.27, 0.36), A("O", 0.73, 0.36)],
    bonds: [
      [0, 1, 1],
      [0, 2, 2],
    ],
  },
  {
    key: "nh3",
    name: "Ammonia",
    formula: "NH₃",
    tagline: "A pungent nitrogen hydride.",
    atoms: [A("N", 0.5, 0.28), A("H", 0.2, 0.76), A("H", 0.8, 0.76), A("H", 0.5, 0.86)],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ],
  },
  {
    key: "ch4",
    name: "Methane",
    formula: "CH₄",
    tagline: "The simplest hydrocarbon.",
    atoms: [A("C", 0.5, 0.5), A("H", 0.2, 0.5), A("H", 0.8, 0.5), A("H", 0.5, 0.2), A("H", 0.5, 0.8)],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
    ],
  },
  {
    key: "so2",
    name: "Sulfur dioxide",
    formula: "SO₂",
    tagline: "A bent volcanic gas.",
    atoms: [A("S", 0.5, 0.68), A("O", 0.28, 0.36), A("O", 0.72, 0.36)],
    bonds: [
      [0, 1, 2],
      [0, 2, 2],
    ],
  },
  {
    key: "hf",
    name: "Hydrogen fluoride",
    formula: "HF",
    tagline: "A strong acid in solution.",
    atoms: [A("H", 0.34, 0.5), A("F", 0.66, 0.5)],
    bonds: [[0, 1, 1]],
  },
  {
    key: "hcl",
    name: "Hydrogen chloride",
    formula: "HCl",
    tagline: "Forms hydrochloric acid.",
    atoms: [A("H", 0.34, 0.5), A("Cl", 0.66, 0.5)],
    bonds: [[0, 1, 1]],
  },
  {
    key: "h2o2",
    name: "Hydrogen peroxide",
    formula: "H₂O₂",
    tagline: "H–O–O–H, a bleach and oxidizer.",
    atoms: [A("H", 0.16, 0.28), A("O", 0.42, 0.52), A("O", 0.58, 0.52), A("H", 0.84, 0.72)],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
    ],
  },

  // ------------------------------------------------------------------------
  // Simple Inorganic Molecules
  // ------------------------------------------------------------------------
  {
    key: "co",
    name: "Carbon monoxide",
    formula: "CO",
    tagline: "A toxic, colorless gas.",
    atoms: [A("C", 0.34, 0.5), A("O", 0.66, 0.5)],
    bonds: [[0, 1, 3]],
  },
  {
    key: "n2o",
    name: "Nitrous oxide",
    formula: "N₂O",
    // Drawn as the neutral cumulated-double-bond resonance form (N=N=O)
    // rather than the triple-bond form (:N≡N⁺–O⁻:) — this renderer has no
    // way to show formal charges/lone pairs, and this form is a genuine,
    // commonly-taught resonance structure that keeps every bond a plain
    // single/double/triple line.
    tagline: "A linear nitrogen oxide and greenhouse gas.",
    atoms: [A("N", 0.18, 0.5), A("N", 0.5, 0.5), A("O", 0.82, 0.5)],
    bonds: [
      [0, 1, 2],
      [1, 2, 2],
    ],
  },
  {
    key: "no",
    name: "Nitric oxide",
    formula: "NO",
    // NO is an odd-electron radical with a real bond order of ~2.5; a double
    // bond is the closest whole-order simplification this schema supports.
    tagline: "A reactive signaling molecule.",
    atoms: [A("N", 0.34, 0.5), A("O", 0.66, 0.5)],
    bonds: [[0, 1, 2]],
  },
  {
    key: "no2",
    name: "Nitrogen dioxide",
    formula: "NO₂",
    // Also an odd-electron radical; the two N–O bonds are really equivalent
    // (~1.5 order) via resonance. Drawn as one of the two single-Lewis-
    // structure resonance forms (one single, one double bond).
    tagline: "A reactive reddish-brown nitrogen oxide.",
    atoms: [A("N", 0.5, 0.68), A("O", 0.27, 0.36), A("O", 0.73, 0.36)],
    bonds: [
      [0, 1, 1],
      [0, 2, 2],
    ],
  },
  {
    key: "so3",
    name: "Sulfur trioxide",
    formula: "SO₃",
    tagline: "An important precursor to sulfuric acid.",
    atoms: [A("S", 0.5, 0.5), A("O", 0.5, 0.18), A("O", 0.78, 0.68), A("O", 0.22, 0.68)],
    bonds: [
      [0, 1, 2],
      [0, 2, 2],
      [0, 3, 2],
    ],
  },
  {
    key: "h2s",
    name: "Hydrogen sulfide",
    formula: "H₂S",
    tagline: "A toxic gas with a characteristic rotten-egg odor.",
    atoms: [A("S", 0.5, 0.64), A("H", 0.23, 0.3), A("H", 0.77, 0.3)],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
    ],
  },
  {
    key: "ph3",
    name: "Phosphine",
    formula: "PH₃",
    tagline: "A phosphorus hydride with a pyramidal structure.",
    atoms: [A("P", 0.5, 0.28), A("H", 0.2, 0.76), A("H", 0.8, 0.76), A("H", 0.5, 0.86)],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ],
  },
  {
    key: "sih4",
    name: "Silane",
    formula: "SiH₄",
    tagline: "The silicon analogue of methane.",
    atoms: [A("Si", 0.5, 0.5), A("H", 0.2, 0.5), A("H", 0.8, 0.5), A("H", 0.5, 0.2), A("H", 0.5, 0.8)],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
    ],
  },
  {
    key: "n2o4",
    name: "Dinitrogen tetroxide",
    formula: "N₂O₄",
    tagline: "A dimeric nitrogen oxide.",
    // O₂N–NO₂: an N–N single bond joining two NO₂-style units, each with one
    // N=O double bond and one N–O single bond.
    atoms: [
      A("N", 0.35, 0.5),
      A("N", 0.65, 0.5),
      A("O", 0.15, 0.28),
      A("O", 0.15, 0.72),
      A("O", 0.85, 0.28),
      A("O", 0.85, 0.72),
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 2],
      [0, 3, 1],
      [1, 4, 2],
      [1, 5, 1],
    ],
  },
  {
    key: "cl2o",
    name: "Dichlorine monoxide",
    formula: "Cl₂O",
    tagline: "A reactive chlorine oxide.",
    atoms: [A("O", 0.5, 0.64), A("Cl", 0.23, 0.3), A("Cl", 0.77, 0.3)],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
    ],
  },

  // ------------------------------------------------------------------------
  // Acids
  // ------------------------------------------------------------------------
  {
    key: "h2so4",
    name: "Sulfuric acid",
    formula: "H₂SO₄",
    tagline: "A major industrial acid.",
    // S at the center of a cross: two S=O double bonds (top/bottom), two
    // S–OH single bonds (left/right).
    atoms: [
      A("S", 0.5, 0.5),
      A("O", 0.5, 0.15),
      A("O", 0.5, 0.85),
      A("O", 0.15, 0.5),
      A("H", 0.02, 0.5),
      A("O", 0.85, 0.5),
      A("H", 0.98, 0.5),
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 2],
      [0, 3, 1],
      [3, 4, 1],
      [0, 5, 1],
      [5, 6, 1],
    ],
  },
  {
    key: "hno3",
    name: "Nitric acid",
    formula: "HNO₃",
    tagline: "A strong oxidizing acid.",
    // N with one N=O (double), one terminal N–O (single), and one N–O–H arm.
    atoms: [
      A("N", 0.5, 0.55),
      A("O", 0.5, 0.2),
      A("O", 0.22, 0.75),
      A("O", 0.78, 0.7),
      A("H", 0.92, 0.9),
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [0, 3, 1],
      [3, 4, 1],
    ],
  },
  {
    key: "h2so3",
    name: "Sulfurous acid",
    formula: "H₂SO₃",
    tagline: "An unstable sulfur oxyacid.",
    // S(=O)(OH)₂: one S=O double bond and two S–OH single-bond arms.
    atoms: [
      A("S", 0.5, 0.55),
      A("O", 0.5, 0.2),
      A("O", 0.22, 0.75),
      A("H", 0.08, 0.92),
      A("O", 0.78, 0.75),
      A("H", 0.92, 0.92),
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [2, 3, 1],
      [0, 4, 1],
      [4, 5, 1],
    ],
  },
  {
    key: "h2co3",
    name: "Carbonic acid",
    formula: "H₂CO₃",
    tagline: "Forms when carbon dioxide dissolves in water.",
    // C(=O)(OH)₂ — same shape as sulfurous acid, carbon in place of sulfur.
    atoms: [
      A("C", 0.5, 0.55),
      A("O", 0.5, 0.2),
      A("O", 0.22, 0.75),
      A("H", 0.08, 0.92),
      A("O", 0.78, 0.75),
      A("H", 0.92, 0.92),
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [2, 3, 1],
      [0, 4, 1],
      [4, 5, 1],
    ],
  },
  {
    key: "h3po4",
    name: "Phosphoric acid",
    formula: "H₃PO₄",
    tagline: "A common phosphorus oxyacid.",
    // P(=O)(OH)₃ — P at the center of a cross: one P=O double bond (top),
    // three P–OH single-bond arms (left, right, bottom).
    atoms: [
      A("P", 0.5, 0.5),
      A("O", 0.5, 0.15),
      A("O", 0.15, 0.5),
      A("H", 0.02, 0.5),
      A("O", 0.85, 0.5),
      A("H", 0.98, 0.5),
      A("O", 0.5, 0.85),
      A("H", 0.5, 0.98),
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [2, 3, 1],
      [0, 4, 1],
      [4, 5, 1],
      [0, 6, 1],
      [6, 7, 1],
    ],
  },
  {
    key: "hbr",
    name: "Hydrogen bromide",
    formula: "HBr",
    tagline: "Hydrogen bromide forms hydrobromic acid in water.",
    atoms: [A("H", 0.34, 0.5), A("Br", 0.66, 0.5)],
    bonds: [[0, 1, 1]],
  },
  {
    key: "hi",
    name: "Hydrogen iodide",
    formula: "HI",
    tagline: "Hydrogen iodide forms hydroiodic acid in water.",
    atoms: [A("H", 0.34, 0.5), A("I", 0.66, 0.5)],
    bonds: [[0, 1, 1]],
  },

  // ------------------------------------------------------------------------
  // Hydrocarbons
  // ------------------------------------------------------------------------
  {
    key: "c2h6",
    name: "Ethane",
    formula: "C₂H₆",
    tagline: "A simple saturated hydrocarbon.",
    atoms: [
      A("C", 0.32, 0.5),
      A("C", 0.68, 0.5),
      A("H", 0.32, 0.18),
      A("H", 0.32, 0.82),
      A("H", 0.08, 0.5),
      A("H", 0.68, 0.18),
      A("H", 0.68, 0.82),
      A("H", 0.92, 0.5),
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
      [1, 5, 1],
      [1, 6, 1],
      [1, 7, 1],
    ],
  },
  {
    key: "c2h4",
    name: "Ethene",
    formula: "C₂H₄",
    tagline: "A two-carbon alkene with a carbon-carbon double bond.",
    atoms: [
      A("C", 0.35, 0.5),
      A("C", 0.65, 0.5),
      A("H", 0.15, 0.25),
      A("H", 0.15, 0.75),
      A("H", 0.85, 0.25),
      A("H", 0.85, 0.75),
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [0, 3, 1],
      [1, 4, 1],
      [1, 5, 1],
    ],
  },
  {
    key: "c2h2",
    name: "Ethyne",
    formula: "C₂H₂",
    tagline: "Also known as acetylene, with a carbon-carbon triple bond.",
    atoms: [A("H", 0.1, 0.5), A("C", 0.37, 0.5), A("C", 0.63, 0.5), A("H", 0.9, 0.5)],
    bonds: [
      [0, 1, 1],
      [1, 2, 3],
      [2, 3, 1],
    ],
  },
  {
    key: "c3h8",
    name: "Propane",
    formula: "C₃H₈",
    tagline: "A common three-carbon fuel.",
    atoms: [
      A("C", 0.15, 0.62),
      A("C", 0.5, 0.38),
      A("C", 0.85, 0.62),
      A("H", 0.02, 0.45),
      A("H", 0.02, 0.8),
      A("H", 0.18, 0.85),
      A("H", 0.4, 0.15),
      A("H", 0.6, 0.15),
      A("H", 0.98, 0.45),
      A("H", 0.98, 0.8),
      A("H", 0.82, 0.85),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
      [0, 5, 1],
      [1, 6, 1],
      [1, 7, 1],
      [2, 8, 1],
      [2, 9, 1],
      [2, 10, 1],
    ],
  },
  {
    key: "c3h6",
    name: "Propene",
    formula: "C₃H₆",
    tagline: "A three-carbon alkene.",
    // CH2=CH-CH3
    atoms: [
      A("C", 0.15, 0.5),
      A("C", 0.42, 0.5),
      A("C", 0.7, 0.6),
      A("H", 0.03, 0.32),
      A("H", 0.03, 0.68),
      A("H", 0.42, 0.22),
      A("H", 0.7, 0.85),
      A("H", 0.9, 0.5),
      A("H", 0.85, 0.75),
    ],
    bonds: [
      [0, 1, 2],
      [1, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
      [1, 5, 1],
      [2, 6, 1],
      [2, 7, 1],
      [2, 8, 1],
    ],
  },
  {
    key: "c4h10",
    name: "Butane",
    formula: "C₄H₁₀",
    tagline: "A common four-carbon hydrocarbon fuel.",
    atoms: [
      A("C", 0.12, 0.65),
      A("C", 0.38, 0.4),
      A("C", 0.62, 0.65),
      A("C", 0.88, 0.4),
      A("H", 0.0, 0.48),
      A("H", 0.0, 0.82),
      A("H", 0.15, 0.88),
      A("H", 0.3, 0.18),
      A("H", 0.46, 0.18),
      A("H", 0.54, 0.85),
      A("H", 0.7, 0.85),
      A("H", 0.98, 0.22),
      A("H", 0.98, 0.55),
      A("H", 0.85, 0.15),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [0, 4, 1],
      [0, 5, 1],
      [0, 6, 1],
      [1, 7, 1],
      [1, 8, 1],
      [2, 9, 1],
      [2, 10, 1],
      [3, 11, 1],
      [3, 12, 1],
      [3, 13, 1],
    ],
  },
  {
    key: "c6h6",
    name: "Benzene",
    formula: "C₆H₆",
    tagline: "An aromatic hydrocarbon with a six-membered ring.",
    // A regular hexagonal ring, alternating single/double bonds (a Kekulé
    // structure) — the real molecule's bonds are equivalent/delocalized, but
    // this renderer only draws single/double/triple lines.
    atoms: (() => {
      const ring = ringPoints(6, { r: 0.3 });
      const outer = ringPoints(6, { r: 0.42 });
      return [
        ...ring.map(([x, y]) => A("C", x, y)),
        ...outer.map(([x, y]) => A("H", x, y)),
      ];
    })(),
    bonds: [
      [0, 1, 2],
      [1, 2, 1],
      [2, 3, 2],
      [3, 4, 1],
      [4, 5, 2],
      [5, 0, 1],
      [0, 6, 1],
      [1, 7, 1],
      [2, 8, 1],
      [3, 9, 1],
      [4, 10, 1],
      [5, 11, 1],
    ],
  },
  {
    key: "c7h8",
    name: "Toluene",
    formula: "C₇H₈",
    tagline: "An aromatic hydrocarbon derived from benzene.",
    // Benzene's ring shifted down to leave headroom for a methyl group on
    // C0, in place of the hydrogen that carbon would otherwise carry.
    atoms: (() => {
      const center = { cx: 0.5, cy: 0.55, r: 0.26 };
      const ring = ringPoints(6, center);
      const outerH = ringPoints(6, { ...center, r: 0.37 });
      const methylC = ringPoints(1, { ...center, r: 0.4 })[0];
      return [
        ...ring.map(([x, y]) => A("C", x, y)), // 0-5: ring carbons
        A("H", outerH[1][0], outerH[1][1]), // 6: H on C1
        A("H", outerH[2][0], outerH[2][1]), // 7: H on C2
        A("H", outerH[3][0], outerH[3][1]), // 8: H on C3
        A("H", outerH[4][0], outerH[4][1]), // 9: H on C4
        A("H", outerH[5][0], outerH[5][1]), // 10: H on C5
        A("C", methylC[0], methylC[1]), // 11: methyl carbon, on C0
        A("H", methylC[0] - 0.18, 0.05), // 12
        A("H", methylC[0] + 0.18, 0.05), // 13
        A("H", methylC[0], 0.02), // 14
      ];
    })(),
    bonds: [
      [0, 1, 2],
      [1, 2, 1],
      [2, 3, 2],
      [3, 4, 1],
      [4, 5, 2],
      [5, 0, 1],
      [1, 6, 1],
      [2, 7, 1],
      [3, 8, 1],
      [4, 9, 1],
      [5, 10, 1],
      [0, 11, 1],
      [11, 12, 1],
      [11, 13, 1],
      [11, 14, 1],
    ],
  },

  // ------------------------------------------------------------------------
  // Organic Molecules
  // ------------------------------------------------------------------------
  {
    key: "ch3oh",
    name: "Methanol",
    formula: "CH₃OH",
    tagline: "The simplest alcohol.",
    atoms: [
      A("C", 0.4, 0.5),
      A("H", 0.4, 0.2),
      A("H", 0.4, 0.8),
      A("H", 0.15, 0.5),
      A("O", 0.68, 0.5),
      A("H", 0.9, 0.5),
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
      [4, 5, 1],
    ],
  },
  {
    key: "c2h5oh",
    name: "Ethanol",
    formula: "C₂H₅OH",
    tagline: "A common alcohol and solvent.",
    atoms: [
      A("C", 0.2, 0.5),
      A("C", 0.45, 0.5),
      A("O", 0.68, 0.5),
      A("H", 0.88, 0.5),
      A("H", 0.2, 0.22),
      A("H", 0.2, 0.78),
      A("H", 0.02, 0.5),
      A("H", 0.45, 0.22),
      A("H", 0.45, 0.78),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [0, 4, 1],
      [0, 5, 1],
      [0, 6, 1],
      [1, 7, 1],
      [1, 8, 1],
    ],
  },
  {
    key: "ch3cooh",
    name: "Acetic acid",
    formula: "C₂H₄O₂",
    tagline: "The main acid responsible for vinegar's acidity.",
    // CH3-C(=O)-OH
    atoms: [
      A("C", 0.2, 0.5),
      A("C", 0.5, 0.5),
      A("O", 0.5, 0.22),
      A("O", 0.72, 0.68),
      A("H", 0.9, 0.82),
      A("H", 0.2, 0.22),
      A("H", 0.2, 0.78),
      A("H", 0.02, 0.5),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 2],
      [1, 3, 1],
      [3, 4, 1],
      [0, 5, 1],
      [0, 6, 1],
      [0, 7, 1],
    ],
  },
  {
    key: "ch2o",
    name: "Formaldehyde",
    formula: "CH₂O",
    tagline: "The simplest aldehyde.",
    atoms: [A("C", 0.4, 0.5), A("O", 0.7, 0.5), A("H", 0.15, 0.3), A("H", 0.15, 0.7)],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [0, 3, 1],
    ],
  },
  {
    key: "c2h4o",
    name: "Acetaldehyde",
    formula: "C₂H₄O",
    tagline: "A simple two-carbon aldehyde.",
    // CH3-CHO
    atoms: [
      A("C", 0.2, 0.5),
      A("C", 0.5, 0.5),
      A("O", 0.5, 0.22),
      A("H", 0.72, 0.65),
      A("H", 0.2, 0.22),
      A("H", 0.2, 0.78),
      A("H", 0.02, 0.5),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 2],
      [1, 3, 1],
      [0, 4, 1],
      [0, 5, 1],
      [0, 6, 1],
    ],
  },
  {
    key: "c3h6o",
    name: "Acetone",
    formula: "C₃H₆O",
    tagline: "A common ketone and solvent.",
    // (CH3)2C=O
    atoms: [
      A("C", 0.22, 0.68),
      A("C", 0.5, 0.5),
      A("C", 0.78, 0.68),
      A("O", 0.5, 0.22),
      A("H", 0.05, 0.55),
      A("H", 0.05, 0.85),
      A("H", 0.22, 0.92),
      A("H", 0.95, 0.55),
      A("H", 0.95, 0.85),
      A("H", 0.78, 0.92),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [1, 3, 2],
      [0, 4, 1],
      [0, 5, 1],
      [0, 6, 1],
      [2, 7, 1],
      [2, 8, 1],
      [2, 9, 1],
    ],
  },
  {
    key: "ch3och3",
    name: "Dimethyl ether",
    formula: "C₂H₆O",
    tagline: "A simple ether.",
    // CH3-O-CH3 — an isomer of ethanol (same formula, different connectivity).
    atoms: [
      A("O", 0.5, 0.5),
      A("C", 0.25, 0.5),
      A("C", 0.75, 0.5),
      A("H", 0.25, 0.22),
      A("H", 0.25, 0.78),
      A("H", 0.05, 0.5),
      A("H", 0.75, 0.22),
      A("H", 0.75, 0.78),
      A("H", 0.95, 0.5),
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [1, 3, 1],
      [1, 4, 1],
      [1, 5, 1],
      [2, 6, 1],
      [2, 7, 1],
      [2, 8, 1],
    ],
  },
  {
    key: "c2h6o2",
    name: "Ethylene glycol",
    formula: "C₂H₆O₂",
    tagline: "A two-carbon diol.",
    // HOCH2-CH2OH
    atoms: [
      A("C", 0.32, 0.55),
      A("C", 0.68, 0.55),
      A("O", 0.15, 0.3),
      A("H", 0.03, 0.12),
      A("O", 0.85, 0.8),
      A("H", 0.97, 0.95),
      A("H", 0.15, 0.75),
      A("H", 0.4, 0.78),
      A("H", 0.6, 0.28),
      A("H", 0.85, 0.32),
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [2, 3, 1],
      [1, 4, 1],
      [4, 5, 1],
      [0, 6, 1],
      [0, 7, 1],
      [1, 8, 1],
      [1, 9, 1],
    ],
  },
  {
    key: "c3h8o3",
    name: "Glycerol",
    formula: "C₃H₈O₃",
    tagline: "A three-carbon alcohol containing three hydroxyl groups.",
    // HOCH2-CH(OH)-CH2OH
    atoms: [
      A("C", 0.18, 0.58),
      A("C", 0.5, 0.4),
      A("C", 0.82, 0.58),
      A("O", 0.05, 0.35),
      A("H", 0.02, 0.18),
      A("H", 0.05, 0.75),
      A("H", 0.25, 0.8),
      A("H", 0.5, 0.15),
      A("O", 0.5, 0.68),
      A("H", 0.5, 0.88),
      A("O", 0.95, 0.35),
      A("H", 0.98, 0.18),
      A("H", 0.95, 0.75),
      A("H", 0.75, 0.8),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [0, 3, 1],
      [3, 4, 1],
      [0, 5, 1],
      [0, 6, 1],
      [1, 7, 1],
      [1, 8, 1],
      [8, 9, 1],
      [2, 10, 1],
      [10, 11, 1],
      [2, 12, 1],
      [2, 13, 1],
    ],
  },

  // ------------------------------------------------------------------------
  // Biologically Important Molecules
  // ------------------------------------------------------------------------
  {
    key: "glucose",
    name: "Glucose",
    formula: "C₆H₁₂O₆",
    tagline: "A major energy source in living organisms.",
    // Drawn in its open-chain aldehyde form (the basis of its Fischer
    // projection) rather than the cyclic pyranose form that predominates in
    // solution — this flat renderer has no dedicated support for the
    // ring-closing hemiacetal oxygen a pyranose ring needs.
    atoms: [
      A("C", 0.08, 0.4),
      A("C", 0.24, 0.6),
      A("C", 0.4, 0.4),
      A("C", 0.56, 0.6),
      A("C", 0.72, 0.4),
      A("C", 0.88, 0.6),
      A("O", 0.08, 0.18),
      A("H", 0.2, 0.22),
      A("O", 0.16, 0.85),
      A("H", 0.08, 0.98),
      A("H", 0.32, 0.85),
      A("O", 0.32, 0.18),
      A("H", 0.24, 0.02),
      A("H", 0.48, 0.18),
      A("O", 0.48, 0.85),
      A("H", 0.4, 0.98),
      A("H", 0.64, 0.85),
      A("O", 0.64, 0.18),
      A("H", 0.56, 0.02),
      A("H", 0.8, 0.18),
      A("O", 0.88, 0.85),
      A("H", 0.88, 0.98),
      A("H", 1.0, 0.5),
      A("H", 0.98, 0.75),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [3, 4, 1],
      [4, 5, 1],
      [0, 6, 2],
      [0, 7, 1],
      [1, 8, 1],
      [8, 9, 1],
      [1, 10, 1],
      [2, 11, 1],
      [11, 12, 1],
      [2, 13, 1],
      [3, 14, 1],
      [14, 15, 1],
      [3, 16, 1],
      [4, 17, 1],
      [17, 18, 1],
      [4, 19, 1],
      [5, 20, 1],
      [20, 21, 1],
      [5, 22, 1],
      [5, 23, 1],
    ],
  },
  {
    key: "fructose",
    name: "Fructose",
    formula: "C₆H₁₂O₆",
    tagline: "A simple sugar and structural isomer of glucose.",
    // The open-chain ketose form — a C6 backbone like glucose's, but with the
    // carbonyl (C=O) on C2 rather than the terminal C1, and no H on that
    // carbon: the defining aldose-vs-ketose difference from glucose above.
    atoms: [
      A("C", 0.08, 0.6),
      A("C", 0.24, 0.4),
      A("C", 0.4, 0.6),
      A("C", 0.56, 0.4),
      A("C", 0.72, 0.6),
      A("C", 0.88, 0.4),
      A("H", 0.0, 0.5),
      A("H", 0.02, 0.75),
      A("O", 0.08, 0.85),
      A("H", 0.08, 0.98),
      A("O", 0.24, 0.18),
      A("O", 0.32, 0.85),
      A("H", 0.24, 0.98),
      A("H", 0.48, 0.85),
      A("O", 0.48, 0.18),
      A("H", 0.4, 0.02),
      A("H", 0.64, 0.18),
      A("O", 0.64, 0.85),
      A("H", 0.56, 0.98),
      A("H", 0.8, 0.85),
      A("O", 0.88, 0.18),
      A("H", 0.88, 0.02),
      A("H", 1.0, 0.5),
      A("H", 0.98, 0.25),
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [3, 4, 1],
      [4, 5, 1],
      [0, 6, 1],
      [0, 7, 1],
      [0, 8, 1],
      [8, 9, 1],
      [1, 10, 2],
      [2, 11, 1],
      [11, 12, 1],
      [2, 13, 1],
      [3, 14, 1],
      [14, 15, 1],
      [3, 16, 1],
      [4, 17, 1],
      [17, 18, 1],
      [4, 19, 1],
      [5, 20, 1],
      [20, 21, 1],
      [5, 22, 1],
      [5, 23, 1],
    ],
  },
  {
    key: "urea",
    name: "Urea",
    formula: "CH₄N₂O",
    tagline: "A major nitrogen-containing biological compound.",
    // (NH2)2C=O
    atoms: [
      A("C", 0.5, 0.5),
      A("O", 0.5, 0.2),
      A("N", 0.25, 0.72),
      A("N", 0.75, 0.72),
      A("H", 0.05, 0.6),
      A("H", 0.1, 0.9),
      A("H", 0.95, 0.6),
      A("H", 0.9, 0.9),
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 1],
      [0, 3, 1],
      [2, 4, 1],
      [2, 5, 1],
      [3, 6, 1],
      [3, 7, 1],
    ],
  },
  {
    key: "glycine",
    name: "Glycine",
    formula: "C₂H₅NO₂",
    tagline: "The simplest amino acid.",
    // H2N-CH2-COOH
    atoms: [
      A("N", 0.15, 0.35),
      A("H", 0.02, 0.18),
      A("H", 0.02, 0.48),
      A("C", 0.4, 0.5),
      A("H", 0.4, 0.25),
      A("H", 0.4, 0.75),
      A("C", 0.68, 0.5),
      A("O", 0.68, 0.22),
      A("O", 0.9, 0.65),
      A("H", 0.98, 0.85),
    ],
    bonds: [
      [0, 3, 1],
      [0, 1, 1],
      [0, 2, 1],
      [3, 4, 1],
      [3, 5, 1],
      [3, 6, 1],
      [6, 7, 2],
      [6, 8, 1],
      [8, 9, 1],
    ],
  },
  {
    key: "alanine",
    name: "Alanine",
    formula: "C₃H₇NO₂",
    tagline: "A common amino acid.",
    // H2N-CH(CH3)-COOH
    atoms: [
      A("N", 0.12, 0.28),
      A("H", 0.0, 0.12),
      A("H", 0.0, 0.42),
      A("C", 0.35, 0.42),
      A("H", 0.5, 0.22),
      A("C", 0.62, 0.28),
      A("O", 0.62, 0.05),
      A("O", 0.85, 0.42),
      A("H", 0.98, 0.58),
      A("C", 0.35, 0.72),
      A("H", 0.18, 0.85),
      A("H", 0.52, 0.85),
      A("H", 0.35, 0.98),
    ],
    bonds: [
      [0, 3, 1],
      [0, 1, 1],
      [0, 2, 1],
      [3, 4, 1],
      [3, 5, 1],
      [5, 6, 2],
      [5, 7, 1],
      [7, 8, 1],
      [3, 9, 1],
      [9, 10, 1],
      [9, 11, 1],
      [9, 12, 1],
    ],
  },
  {
    key: "caffeine",
    name: "Caffeine",
    formula: "C₈H₁₀N₄O₂",
    tagline: "A naturally occurring stimulant.",
    // The real fused-ring purine-2,6-dione skeleton (1,3,7-trimethylxanthine):
    // a six-membered pyrimidinedione ring (N1-C2-N3-C4-C5-C6) fused, along its
    // C4-C5 edge, to a five-membered imidazole ring (C4-N9=C8-N7-C5) —
    // methyls on N1/N3/N7, carbonyls on C2/C6, and the single aromatic C8-H.
    // Laid out and verified programmatically (a small layout script, not
    // hand-picked fractions): every bonded pair is kept at a clear distance,
    // no bond line passes near a third atom, and the whole thing was
    // searched to minimize how far anything sits outside the 0..1 canvas —
    // at 24 atoms this is dense enough that eyeballed spacing reliably ran
    // bonds directly under a neighboring atom or another atom entirely.
    atoms: [
      A("N", 0.255, 0.632), // 0: N1
      A("C", 0.394, 0.733), // 1: C2
      A("N", 0.532, 0.632), // 2: N3
      A("C", 0.532, 0.429), // 3: C4 (ring fusion)
      A("C", 0.394, 0.328), // 4: C5 (ring fusion)
      A("C", 0.255, 0.429), // 5: C6
      A("N", 0.596, 0.289), // 6: N9
      A("C", 0.596, 0.086), // 7: C8
      A("N", 0.457, 0.187), // 8: N7
      A("O", 0.394, 0.895), // 9: O on C2
      A("O", 0.145, 0.348), // 10: O on C6
      A("C", 0.145, 0.713), // 11: N1-methyl carbon
      A("H", 0.177, 0.863),
      A("H", 0.039, 0.791),
      A("H", 0.058, 0.603),
      A("C", 0.642, 0.713), // 15: N3-methyl carbon
      A("H", 0.729, 0.603),
      A("H", 0.748, 0.791),
      A("H", 0.611, 0.863),
      A("C", 0.355, 0.032), // 19: N7-methyl carbon
      A("H", 0.244, 0.098),
      A("H", 0.276, -0.087),
      A("H", 0.425, -0.095),
      A("H", 0.657, -0.049), // 23: the single ring C8-H
    ],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
      [3, 4, 2],
      [4, 5, 1],
      [5, 0, 1],
      [1, 9, 2],
      [5, 10, 2],
      [3, 6, 1],
      [6, 7, 2],
      [7, 8, 1],
      [8, 4, 1],
      [0, 11, 1],
      [11, 12, 1],
      [11, 13, 1],
      [11, 14, 1],
      [2, 15, 1],
      [15, 16, 1],
      [15, 17, 1],
      [15, 18, 1],
      [8, 19, 1],
      [19, 20, 1],
      [19, 21, 1],
      [19, 22, 1],
      [7, 23, 1],
    ],
  },

  // ------------------------------------------------------------------------
  // Geometrically Interesting Molecules
  // ------------------------------------------------------------------------
  {
    key: "cs2",
    name: "Carbon disulfide",
    formula: "CS₂",
    tagline: "A linear sulfur-containing carbon compound.",
    atoms: [A("S", 0.18, 0.5), A("C", 0.5, 0.5), A("S", 0.82, 0.5)],
    bonds: [
      [0, 1, 2],
      [1, 2, 2],
    ],
  },
  {
    key: "cos",
    name: "Carbonyl sulfide",
    formula: "COS",
    tagline: "A linear molecule containing carbon, oxygen, and sulfur.",
    atoms: [A("O", 0.18, 0.5), A("C", 0.5, 0.5), A("S", 0.82, 0.5)],
    bonds: [
      [0, 1, 2],
      [1, 2, 2],
    ],
  },
  {
    key: "bf3",
    name: "Boron trifluoride",
    formula: "BF₃",
    tagline: "A trigonal-planar boron halide.",
    atoms: (() => {
      const pts = ringPoints(3, { r: 0.3 });
      return [A("B", 0.5, 0.5), ...pts.map(([x, y]) => A("F", x, y))];
    })(),
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ],
  },
  {
    key: "bcl3",
    name: "Boron trichloride",
    formula: "BCl₃",
    tagline: "A trigonal-planar boron halide.",
    atoms: (() => {
      const pts = ringPoints(3, { r: 0.3 });
      return [A("B", 0.5, 0.5), ...pts.map(([x, y]) => A("Cl", x, y))];
    })(),
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ],
  },
  {
    key: "sf6",
    name: "Sulfur hexafluoride",
    formula: "SF₆",
    tagline: "A highly symmetrical octahedral molecule.",
    atoms: (() => {
      const pts = ringPoints(6, { r: 0.32 });
      return [A("S", 0.5, 0.5), ...pts.map(([x, y]) => A("F", x, y))];
    })(),
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
      [0, 5, 1],
      [0, 6, 1],
    ],
  },
  {
    key: "pcl5",
    name: "Phosphorus pentachloride",
    formula: "PCl₅",
    tagline: "A phosphorus halide with trigonal-bipyramidal geometry in the gas phase.",
    atoms: (() => {
      const pts = ringPoints(5, { r: 0.32 });
      return [A("P", 0.5, 0.5), ...pts.map(([x, y]) => A("Cl", x, y))];
    })(),
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
      [0, 5, 1],
    ],
  },
  {
    key: "xef4",
    name: "Xenon tetrafluoride",
    formula: "XeF₄",
    tagline: "A square-planar noble-gas compound.",
    atoms: (() => {
      const pts = ringPoints(4, { r: 0.32 });
      return [A("Xe", 0.5, 0.5), ...pts.map(([x, y]) => A("F", x, y))];
    })(),
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
    ],
  },
  {
    key: "xef2",
    name: "Xenon difluoride",
    formula: "XeF₂",
    tagline: "A linear noble-gas compound.",
    atoms: [A("F", 0.18, 0.5), A("Xe", 0.5, 0.5), A("F", 0.82, 0.5)],
    bonds: [
      [0, 1, 1],
      [1, 2, 1],
    ],
  },
  {
    key: "b2h6",
    name: "Diborane",
    formula: "B₂H₆",
    tagline: "A boron hydride containing bridging hydrogen atoms.",
    // Two borons bridged by two hydrogens (each bridging H bonded to both
    // borons — the standard flat-diagram way of drawing the 3-center-2-
    // electron B-H-B bond), plus two terminal hydrogens on each boron.
    atoms: [
      A("B", 0.3, 0.5),
      A("B", 0.7, 0.5),
      A("H", 0.5, 0.3),
      A("H", 0.5, 0.7),
      A("H", 0.1, 0.28),
      A("H", 0.1, 0.72),
      A("H", 0.9, 0.28),
      A("H", 0.9, 0.72),
    ],
    bonds: [
      [0, 2, 1],
      [1, 2, 1],
      [0, 3, 1],
      [1, 3, 1],
      [0, 4, 1],
      [0, 5, 1],
      [1, 6, 1],
      [1, 7, 1],
    ],
  },
];

// Gallery/search category — one per molecule (never a molecule listed twice
// under two categories). Assigned here by key, in one place, rather than as
// a `category` field hand-repeated on all 63 object literals above — h2's
// old `category: "molecule"` (a leftover from before this field was ever
// read by anything) is superseded by this the same way.
const CATEGORY_BY_KEY = {
  // Inorganic — simple diatomics, oxides, hydrides.
  h2: "Inorganic", o2: "Inorganic", n2: "Inorganic", f2: "Inorganic", cl2: "Inorganic",
  h2o: "Inorganic", co2: "Inorganic", o3: "Inorganic", nh3: "Inorganic", so2: "Inorganic",
  h2o2: "Inorganic", co: "Inorganic", n2o: "Inorganic", no: "Inorganic", no2: "Inorganic",
  so3: "Inorganic", h2s: "Inorganic", ph3: "Inorganic", sih4: "Inorganic", n2o4: "Inorganic",
  cl2o: "Inorganic",
  // Acids
  hf: "Acids", hcl: "Acids", hbr: "Acids", hi: "Acids", h2so4: "Acids",
  hno3: "Acids", h2so3: "Acids", h2co3: "Acids", h3po4: "Acids",
  // Hydrocarbons
  ch4: "Hydrocarbons", c2h6: "Hydrocarbons", c2h4: "Hydrocarbons", c2h2: "Hydrocarbons",
  c3h8: "Hydrocarbons", c3h6: "Hydrocarbons", c4h10: "Hydrocarbons", c6h6: "Hydrocarbons",
  c7h8: "Hydrocarbons",
  // Organic — non-hydrocarbon, non-biological organic compounds.
  ch3oh: "Organic", c2h5oh: "Organic", ch3cooh: "Organic", ch2o: "Organic", c2h4o: "Organic",
  c3h6o: "Organic", ch3och3: "Organic", c2h6o2: "Organic", c3h8o3: "Organic",
  // Biological
  glucose: "Biological", fructose: "Biological", urea: "Biological", glycine: "Biological",
  alanine: "Biological", caffeine: "Biological",
  // Other — halides/noble-gas compounds that don't fit the buckets above.
  cs2: "Other", cos: "Other", bf3: "Other", bcl3: "Other", sf6: "Other",
  pcl5: "Other", xef4: "Other", xef2: "Other", b2h6: "Other",
};
export const MOLECULE_CATEGORIES = ["Inorganic", "Acids", "Hydrocarbons", "Organic", "Biological", "Other"];
MOLECULES.forEach((m) => {
  m.category = CATEGORY_BY_KEY[m.key] || "Other";
});

// Converts a display formula's unicode subscripts (e.g. "C₆H₆") into plain
// digits ("C6H6"), for search matching and for the integrity check below —
// so a query typed as plain digits still matches the unicode-subscript
// formula shown on the card.
export function formulaPlain(formula) {
  return String(formula || "").replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d) =>
    String("₀₁₂₃₄₅₆₇₈₉".indexOf(d))
  );
}

// Molecular elements used in this set — used to look up colors from the element dataset.
export function moleculeElementSymbols(molecule) {
  const set = new Set(molecule.atoms.map((a) => a.symbol));
  return [...set];
}

export function moleculesContaining(symbol) {
  return MOLECULES.filter((m) => m.atoms.some((a) => a.symbol === symbol));
}

export function getMolecule(key) {
  return MOLECULES.find((m) => m.key === key) || null;
}

// --- Dev-only data integrity check -----------------------------------------
// Runs once at module load in development; never touches rendering or the
// exports above. Flags anything a hand-authored entry could get wrong:
// duplicate/missing ids, dangling bond references, and a formula that
// doesn't match the atom composition it's attached to.
function elementCountsFromFormula(formula) {
  // {symbol: count} from a plain-digit formula, e.g. "C6H12O6" -> { C: 6, H: 12, O: 6 }.
  const normalized = formulaPlain(formula);
  const counts = {};
  const re = /([A-Z][a-z]?)(\d*)/g;
  let m;
  while ((m = re.exec(normalized))) {
    const [, symbol, digits] = m;
    if (!symbol) continue;
    counts[symbol] = (counts[symbol] || 0) + (digits ? Number(digits) : 1);
  }
  return counts;
}

function validateMolecules(molecules) {
  const errors = [];
  const seenKeys = new Set();

  molecules.forEach((mol, mi) => {
    const label = mol.key || `#${mi}`;
    if (!mol.key) errors.push(`${label}: missing key`);
    else if (seenKeys.has(mol.key)) errors.push(`${label}: duplicate key`);
    seenKeys.add(mol.key);
    if (!mol.name) errors.push(`${label}: missing name`);
    if (!mol.formula) errors.push(`${label}: missing formula`);
    if (!mol.tagline) errors.push(`${label}: missing tagline`);
    if (!MOLECULE_CATEGORIES.includes(mol.category)) {
      errors.push(`${label}: invalid category ${mol.category}`);
    }
    if (!Array.isArray(mol.atoms) || mol.atoms.length === 0) {
      errors.push(`${label}: atoms missing/empty`);
      return;
    }
    if (!Array.isArray(mol.bonds)) {
      errors.push(`${label}: bonds missing`);
      return;
    }

    mol.atoms.forEach((atom, ai) => {
      if (!atom || typeof atom.symbol !== "string") {
        errors.push(`${label}: atom[${ai}] missing symbol`);
      }
      if (typeof atom?.x !== "number" || typeof atom?.y !== "number") {
        errors.push(`${label}: atom[${ai}] has non-numeric coordinates`);
      }
    });

    mol.bonds.forEach(([i, j, order = 1], bi) => {
      if (!(i >= 0 && i < mol.atoms.length)) {
        errors.push(`${label}: bond[${bi}] references missing atom index ${i}`);
      }
      if (!(j >= 0 && j < mol.atoms.length)) {
        errors.push(`${label}: bond[${bi}] references missing atom index ${j}`);
      }
      if (![1, 2, 3].includes(order)) {
        errors.push(`${label}: bond[${bi}] has invalid order ${order}`);
      }
    });

    const expected = elementCountsFromFormula(mol.formula);
    const actual = {};
    mol.atoms.forEach((atom) => {
      if (atom?.symbol) actual[atom.symbol] = (actual[atom.symbol] || 0) + 1;
    });
    const symbols = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    symbols.forEach((symbol) => {
      if ((expected[symbol] || 0) !== (actual[symbol] || 0)) {
        errors.push(
          `${label}: formula ${mol.formula} expects ${symbol}×${expected[symbol] || 0}, atoms have ×${actual[symbol] || 0}`
        );
      }
    });
  });

  return errors;
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  const errors = validateMolecules(MOLECULES);
  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[molecules.js] ${errors.length} data integrity issue(s):\n` + errors.join("\n"));
  }
}
