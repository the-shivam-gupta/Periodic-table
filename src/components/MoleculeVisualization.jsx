import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { SYMBOL_MAP } from "../data/elements";
import { categoryColors, DEFAULT_COLOR } from "../data/categories";
import { drawMolecule } from "../animations/moleculeAnimations";

const W = 240;
const H = 200;
const PAD = 26;
const ATOM_R = 17;
const DENSE_THRESHOLD = 18;
const MIN_ATOM_SCALE = 0.65;
function atomScaleFor(atomCount) {
  if (atomCount <= DENSE_THRESHOLD) return 1;
  return Math.max(MIN_ATOM_SCALE, DENSE_THRESHOLD / atomCount);
}

function atomColor(symbol) {
  const el = SYMBOL_MAP.get(String(symbol).toLowerCase());
  if (!el) return DEFAULT_COLOR;
  return categoryColors(el.category);
}

const px = (x) => PAD + x * (W - PAD * 2);
const py = (y) => PAD + y * (H - PAD * 2);

function angleBetween(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export default function MoleculeVisualization({
  molecule,
  className = "",
  showCaption = true,
}) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      drawMolecule(rootRef.current);
    }, rootRef);
    return () => ctx.revert();
  }, [molecule.key]);

  if (!molecule) return null;

  const bonds = molecule.bonds || [];
  const atoms = molecule.atoms || [];
  const scale = atomScaleFor(atoms.length);
  const atomR = ATOM_R * scale;

  const renderBondLines = (i, j, order, keyPrefix) => {
    const ax = px(atoms[i].x);
    const ay = py(atoms[i].y);
    const bx = px(atoms[j].x);
    const by = py(atoms[j].y);
    const angle = angleBetween(ax, ay, bx, by);
    const perp = [Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2)];
    const offsets = (order === 3 ? [-4, 0, 4] : order === 2 ? [-3.5, 3.5] : [0]).map(
      (o) => o * scale
    );

    return offsets.map((off, k) => {
      const dx = perp[0] * off;
      const dy = perp[1] * off;
      return (
        <line
          key={`${keyPrefix}-${k}`}
          className={`mol-bond__line mol-bond__line--${order}`}
          x1={ax + dx}
          y1={ay + dy}
          x2={bx + dx}
          y2={by + dy}
        />
      );
    });
  };

  return (
    <div className={`molecule ${className}`} ref={rootRef}>
      <svg
        className="molecule__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          molecule.name
            ? `Structural drawing of ${molecule.name} (${molecule.formula})`
            : "Molecule visualization"
        }
      >
        <g className="mol-stage">
          <g className="mol-group">
            {bonds.map(([i, j, order = 1], b) =>
              renderBondLines(i, j, order, `bond-${b}`)
            )}
            {atoms.map((atom, i) => {
              const [from, to] = atomColor(atom.symbol);
              return (
                <g key={i} className="mol-atom" style={{ transformOrigin: "center" }}>
                  <circle
                    className="mol-atom__halo"
                    cx={px(atom.x)}
                    cy={py(atom.y)}
                    r={atomR + 3 * scale}
                    fill={from}
                    opacity="0.18"
                  />
                  <circle
                    className="mol-atom__ball"
                    cx={px(atom.x)}
                    cy={py(atom.y)}
                    r={atomR}
                    fill={`url(#molgrad-${molecule.key}-${i})`}
                    stroke={to}
                    strokeWidth="1"
                  />
                  <text
                    className="mol-symbol"
                    x={px(atom.x)}
                    y={py(atom.y) + 4 * scale}
                    textAnchor="middle"
                    style={scale < 1 ? { fontSize: `${13 * scale}px`, strokeWidth: `${3 * scale}px` } : undefined}
                  >
                    {atom.symbol}
                  </text>
                  <defs>
                    <linearGradient
                      id={`molgrad-${molecule.key}-${i}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={from} />
                      <stop offset="100%" stopColor={to} />
                    </linearGradient>
                  </defs>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      {showCaption && (
        <div className="molecule__caption">
          <span className="molecule__name">{molecule.name}</span>
          <span className="molecule__formula">{molecule.formula}</span>
        </div>
      )}
    </div>
  );
}