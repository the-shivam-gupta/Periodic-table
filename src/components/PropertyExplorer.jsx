import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { FiBookOpen } from "react-icons/fi";
import { ELEMENTS } from "../data/elements";
import { useTheme } from "../theme/ThemeContext";
import { themeFillColor } from "../data/categories";
import {
  PROPERTIES,
  buildScale,
  propertyValue,
  getPropertyConfig,
  formatSig,
  stopsGradient,
  heatGradientStops,
  STOPS,
  DARK_STOPS,
} from "../data/propertyScale";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";
import PeriodicTable from "./PeriodicTable";

// Short, plain-language explanations for the Property Explorer — kept local
// since the dataset itself carries values, not prose descriptions.
const PROPERTY_INFO = {
  atomicMass: "The total mass of protons, neutrons, and electrons in an atom.",
  atomicRadius: "A measure of the size of an atom, typically the distance from the nucleus to the outermost electron shell, in picometers (pm).",
  density: "The mass of the element per unit volume in its standard state, in grams per cubic centimeter (g/cm³).",
  electronegativity: "Describes how strongly an atom attracts electrons in a chemical bond, on the Pauling scale.",
  electronAffinity: "The energy released or absorbed when a neutral atom gains an electron to form a negative ion, in kilojoules per mole (kJ/mol).",
  ionization: "The energy required to remove the most loosely held electron from a neutral atom, in kilojoules per mole (kJ/mol).",
  melt: "The temperature at which the element changes from solid to liquid, in kelvin (K).",
  boil: "The temperature at which the element changes from liquid to gas, in kelvin (K).",
  yearDiscovered: "The year the element was first isolated or identified — elements known since antiquity show as \"Ancient\".",
  metallicity: "Whether the element behaves chemically as a metal, metalloid, or nonmetal.",
  standardState: "The physical phase (solid, liquid, or gas) the element is normally found in at room temperature and pressure.",
  oxidationStates: "The possible charges an atom of the element can have when it forms compounds.",
  electronConfiguration: "How the element's electrons are distributed across atomic orbitals.",
};

// Properties — pick a property from the sidebar, read what it means, and see
// it visualized across the same periodic table used on the Table view.
export default function PropertyExplorer({ onOpen }) {
  const { theme, isDark } = useTheme();
  const [explorerKey, setExplorerKey] = useState("atomicMass");
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const contentRef = useRef(null);
  const isFirstRef = useRef(true);
  const [scale, setScale] = useState(1);

  const explorerCfg = getPropertyConfig(explorerKey);
  const explorerScale = useMemo(() => buildScale(ELEMENTS, explorerKey), [explorerKey]);
  const explorerHeatStyle = (el) => {
    if (!explorerScale) return null;
    const v = propertyValue(el, explorerKey);
    if (explorerScale.missing(v)) return null;
    const c = explorerScale.color(v);
    if (!c) return null;
    // Two distinct lightness stops of the same hue — matching how each
    // category's own two-stop gradient reads, instead of the same color
    // twice (which shows no gradient sheen at all). The pastel heat color
    // is mapped onto the active theme first (mid-dark in dark mode).
    const themed = themeFillColor(c, theme);
    const [from, to] = heatGradientStops(themed, theme);
    return `linear-gradient(110deg, ${from}, ${to})`;
  };
  const explorerHeatBadge = (el) => {
    if (!explorerScale) return null;
    const v = propertyValue(el, explorerKey);
    if (explorerScale.missing(v)) return explorerCfg?.noValueText ?? null;
    return explorerCfg.fmt(v);
  };

  // Shrink the (unscaled) table down to fit the available width so the whole
  // periodic table is visible in one view — no horizontal scrolling needed.
  // `offsetWidth`/`offsetHeight` on the inner wrapper reflect its natural,
  // untransformed layout size regardless of any CSS transform already
  // applied, so this can safely re-measure after every scale change too.
  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    const recompute = () => {
      const naturalWidth = inner.offsetWidth;
      const naturalHeight = inner.offsetHeight;
      if (!naturalWidth || !naturalHeight) return;
      const available = outer.clientWidth;
      const next = Math.min(1, available / naturalWidth);
      setScale(next);
      outer.style.height = `${Math.ceil(naturalHeight * next)}px`;
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [explorerKey]);

  // Switching properties (title, description, gradient/note, and the whole
  // recolored table) swaps a lot at once — ease the new content in with a
  // simple one-way fade+rise instead of letting it all snap in place. A
  // fade-*out*-then-in (of content that's already been replaced by the time
  // this runs) reads as a blink, not a transition, so this only ever
  // animates onward from a starting state — never back down to invisible.
  // Skipped on first mount, since the panel is already fading in as part of
  // the view itself switching in.
  useLayoutEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    const node = contentRef.current;
    if (!node) return;
    const reduced = prefersReducedMotion();
    gsap.fromTo(
      node,
      { opacity: 0.4, y: 6 },
      { opacity: 1, y: 0, duration: reduced ? 0.01 : 0.3, ease: "power2.out", overwrite: "auto" }
    );
  }, [explorerKey]);

  return (
    <div className="property-explorer-view">
      <aside className="property-nav">
        <div className="property-nav__head">
          <FiBookOpen aria-hidden="true" />
          <span>Properties</span>
        </div>
        <nav className="property-nav__list">
          {PROPERTIES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`property-nav__item${explorerKey === p.key ? " is-active" : ""}`}
              onClick={() => setExplorerKey(p.key)}
            >
              {p.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="property-content" ref={contentRef}>
        {explorerCfg && (
          <>
            <h2 className="property-content__title">{explorerCfg.label}</h2>
            <p className="property-content__desc">
              {PROPERTY_INFO[explorerKey] || `${explorerCfg.label} data for each element.`}
            </p>

            {explorerScale && explorerScale.kind === "numeric" ? (
              <div className="property-content__gradient">
                <span className="property-content__end">Low</span>
                <span className="property-content__min">
                  {formatSig(explorerScale.min, 4)} {explorerCfg.unit}
                </span>
                <span className="property-content__bar" style={{ background: stopsGradient(90, isDark ? DARK_STOPS : STOPS) }} />
                <span className="property-content__max">
                  {formatSig(explorerScale.max, 4)} {explorerCfg.unit}
                </span>
                <span className="property-content__end">High</span>
              </div>
            ) : explorerScale && explorerCfg.categoryShaded ? (
              // Oxidation States / Electron Configuration have far too many
              // distinct values to list — each element instead keeps its own
              // category color, just shaded by its exact value, so a short
              // note explains the coloring instead of dumping every value.
              <p className="property-content__note">
                Each element keeps its own category color here, shaded by its exact value —
                elements in the same category with different {explorerCfg.label.toLowerCase()} get
                slightly different shades.
              </p>
            ) : explorerScale ? (
              <div className="property-content__values">
                <span className="property-content__values-label">Distinct values</span>
                <div className="property-content__swatches">
                  {explorerScale.values.map((v) => (
                    <span className="property-content__swatch-item" key={v.value}>
                      <span
                        className="property-content__swatch"
                        style={{ background: themeFillColor(v.color, theme) }}
                        aria-hidden="true"
                      />
                      {v.value}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="property-content__table-outer" ref={outerRef}>
              <div
                className="property-content__table-scale"
                ref={innerRef}
                style={{ transform: `scale(${scale})` }}
              >
                <PeriodicTable
                  mode="wide"
                  hoverEnabled={false}
                  onSelect={onOpen}
                  heatStyle={explorerScale ? explorerHeatStyle : null}
                  heatBadge={explorerScale ? explorerHeatBadge : null}
                  heatLabel={explorerCfg.label}
                  heatUnit={explorerCfg.unit}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
