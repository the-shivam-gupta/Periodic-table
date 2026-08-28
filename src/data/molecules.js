// Molecule dataset — entirely separate from the element dataset.
// Each atom is placed on a normalized 0..1 canvas; the visualizer scales it.
// bonds: [atomIndexA, atomIndexB, order(1|2|3)]

const A = (symbol, x, y) => ({ symbol, x, y });

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
];

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