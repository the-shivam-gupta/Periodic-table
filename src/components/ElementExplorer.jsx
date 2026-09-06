import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  FiExternalLink,
  FiInfo,
  FiZap,
  FiBookOpen,
  FiGrid,
  FiLayers,
  FiArrowLeft,
  FiStar,
  FiShare2,
} from "react-icons/fi";
import MoleculeVisualization from "./MoleculeVisualization";
import useScrollLock from "../hooks/useScrollLock";
import { animateDrawerIn, animateDrawerOut } from "../animations/modalAnimations";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";
import { categoryColors, categoryText, darkenRgbForText, titleCategory } from "../data/categories";
import {
  formatSig,
  getPropertyConfig,
  buildScale,
  isMissingValueFor,
  propertyValue,
  stopsGradient,
} from "../data/propertyScale";
import { ELEMENTS } from "../data/elements";
import { moleculesContaining } from "../data/molecules";

const has = (v) => v !== null && v !== undefined && v !== "";
const FAVORITES_KEY = "pt-favorites";

function readFavorites() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function writeFavorites(set) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  } catch {
    /* favorites are a nice-to-have, not required to function */
  }
}

function Fact({ label, empty, children }) {
  return (
    <div className={`fact${empty ? " fact--empty" : ""}`}>
      <span className="fact__label">{label}</span>
      <span className="fact__value">{children}</span>
    </div>
  );
}

function QuickBadge({ label, value }) {
  if (!has(value)) return null;
  return (
    <span className="explorer-chip">
      <span className="explorer-chip__label">{label}</span>
      <span className="explorer-chip__value">{value}</span>
    </span>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="detail-section-title">
      <Icon className="detail-section-title__icon" aria-hidden="true" />
      {children}
    </h3>
  );
}

function NotAvailable({ children }) {
  return <p className="explorer-not-available">{children} Not available for this element.</p>;
}

// No "Applications" or "Isotopes" tab: the dataset carries no
// applications/uses or isotope field for any element, so either would only
// ever render as a permanently-empty stub.
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "properties", label: "Properties" },
  { key: "compounds", label: "Compounds" },
];

export default function ElementExplorer({ element, onClose, accentColor, propertyKey, missing = false }) {
  const rootRef = useRef(null);
  const figureBodyRef = useRef(null);
  const bodyRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [figureTab, setFigureTab] = useState("photo");
  const [tab, setTab] = useState("overview");
  const [favorites, setFavorites] = useState(readFavorites);
  const [shared, setShared] = useState(false);
  const [from, to] = categoryColors(element.category);
  // When a "Color by" property is active, the symbol, the card wash, the top
  // accent line and the category chip all follow that property's color for
  // this element (matching the hover preview card) instead of always falling
  // back to the plain category color — otherwise opening the explorer while
  // Color-by is on looks like it reset to "None". There's only one solid
  // color from a heat property (not a two-stop pair like the category
  // gradients), so it stands in for both `from` and `to` wherever a gradient
  // needs two stops.
  const symbolColor = accentColor || from;
  const symbolColorTo = accentColor || to;
  // The symbol's own text needs to stay readable against its pastel fill, so
  // — unlike symbolColor/symbolColorTo above, which paint the light
  // background — it always resolves to a dark, saturated shade: the
  // category's own dark text color by default, or a darkened version of the
  // exact "Color by" accent so it still matches whatever the cell is
  // currently showing (mirrors how .el-symbol gets its color in Element.jsx).
  // `missing` (this element has no value for the active "Color by" property)
  // overrides all of that to null/none, matching the grid cell's own
  // transparent "missing" treatment instead of quietly falling back to the
  // plain category color — otherwise the explorer looks colored-in for an
  // element the table itself shows as having no data for that property.
  const symbolTextColor = missing
    ? null
    : accentColor
      ? darkenRgbForText(accentColor) || categoryText(element.category)
      : categoryText(element.category);
  const relatedMolecules = useMemo(
    () => moleculesContaining(element.symbol),
    [element.symbol]
  );

  // Visualization strip at the bottom of Overview — mirrors whichever
  // property the table is currently colored by; falls back to
  // Electronegativity (a property every element in the visible set tends to
  // have) so the strip is never blank on first open.
  const vizKey = propertyKey || "electronegativity";
  const vizCfg = getPropertyConfig(vizKey);
  const vizScale = useMemo(() => buildScale(ELEMENTS, vizKey), [vizKey]);
  const vizValue = vizCfg ? propertyValue(element, vizKey) : null;
  const vizMissing = vizCfg ? isMissingValueFor(vizCfg.kind, vizValue) : true;
  const vizPct =
    vizScale && vizScale.kind === "numeric" && !vizMissing
      ? Math.max(0, Math.min(1, vizScale.norm(vizValue))) * 100
      : null;

  const isFavorite = favorites.has(element.number);
  const toggleFavorite = () => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(element.number)) next.delete(element.number);
      else next.add(element.number);
      writeFavorites(next);
      return next;
    });
  };

  const share = async () => {
    const text = `${element.name} (${element.symbol}) — atomic number ${element.number}, ${titleCategory(
      element.category
    )}, atomic mass ${formatSig(element.atomicMass, 5)} u.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${element.name} — Periodic Table`, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShared(true);
        window.setTimeout(() => setShared(false), 1600);
      }
    } catch {
      /* user cancelled the share sheet — nothing to do */
    }
  };

  useEffect(() => {
    setImgError(false);
    setModelError(false);
    setFigureTab("photo");
    setTab("overview");
  }, [element.number]);

  // Ease the tab body in on every tab switch instead of letting it pop in.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || prefersReducedMotion()) return;
    gsap.fromTo(
      body,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", overwrite: "auto" }
    );
  }, [tab, element.number]);

  // <model-viewer> is a custom element from a fairly large library — load it
  // lazily on first use (opening any element's detail panel) rather than
  // paying for it in the app's initial bundle. The element auto-upgrades in
  // place the instant the module registers it, even if it was already
  // sitting in the DOM as an unknown tag.
  useEffect(() => {
    import("@google/model-viewer").catch(() => {});
  }, []);

  const photoAvailable = Boolean(element.image);
  const modelAvailable = Boolean(element.bohrModel3d);
  const showFigureTabs = photoAvailable && modelAvailable;
  const activeFigTab = showFigureTabs ? figureTab : modelAvailable ? "3d" : "photo";
  const showModel = activeFigTab === "3d" && modelAvailable && !modelError;
  const showPhoto = activeFigTab === "photo" && photoAvailable && !imgError;

  // Photo/3D Model swap the figure's whole content (an <img> for one, a
  // <model-viewer> for the other) rather than crossfading a shared element,
  // so React just hard-swaps the DOM with nothing in between. Ease the new
  // content in on every switch instead of letting it pop in instantly.
  useLayoutEffect(() => {
    const body = figureBodyRef.current;
    if (!body || prefersReducedMotion()) return;
    gsap.fromTo(
      body,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.32, ease: "power2.out", overwrite: "auto" }
    );
  }, [activeFigTab, showModel, showPhoto]);

  const hasShells = Array.isArray(element.shells) && element.shells.length > 0;
  const hasIonizationEnergies =
    Array.isArray(element.ionizationEnergies) && element.ionizationEnergies.length > 0;
  const hasPhysicalFacts =
    has(element.phase) ||
    has(element.density) ||
    has(element.melt) ||
    has(element.boil) ||
    has(element.molarHeat);
  const hasFigure = photoAvailable || modelAvailable;

  const close = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      onClose();
      return;
    }
    const tl = animateDrawerOut(root, root.querySelector(".detail-card"));
    tl.eventCallback("onComplete", onClose);
  }, [onClose]);

  useScrollLock(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      animateDrawerIn(
        root,
        root.querySelector(".detail-card"),
        root.querySelector(".detail-header"),
        [...root.querySelectorAll(".detail-section")]
      );
    }, root);
    return () => ctx.revert();
  }, [element.number]);

  return (
    <div
      ref={rootRef}
      className="detail-overlay explorer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${element.name} details`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="detail-card explorer-card"
        style={
          missing
            ? undefined
            : {
                background: `linear-gradient(180deg, color-mix(in srgb, ${symbolColor} 16%, transparent) 0%, color-mix(in srgb, ${symbolColor} 6%, transparent) 40%, transparent 100%), #ffffff`,
              }
        }
      >
        <div className="explorer-breadcrumb">
          <button type="button" className="explorer-breadcrumb__back" onClick={close} aria-label="Back to elements">
            <FiArrowLeft aria-hidden="true" />
            <span>
              Elements <span className="explorer-breadcrumb__sep">/</span> {element.name}
            </span>
          </button>
          <div className="explorer-breadcrumb__actions">
            <button
              type="button"
              className={`explorer-icon-btn${isFavorite ? " is-active" : ""}`}
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <FiStar aria-hidden="true" />
            </button>
            <button type="button" className="explorer-icon-btn" onClick={share} aria-label="Share this element">
              <FiShare2 aria-hidden="true" />
            </button>
            {shared && <span className="explorer-share-toast">Copied</span>}
          </div>
        </div>

        <header className="detail-header explorer-header">
          <div
            className={`explorer-accent${missing ? " is-missing" : ""}`}
            style={
              missing
                ? undefined
                : { background: `linear-gradient(90deg, ${symbolColor}, ${symbolColorTo})` }
            }
            aria-hidden="true"
          />
          <div className="explorer-heading">
            <span className="explorer-number">#{element.number}</span>
            <div className="explorer-symbol-block">
              <span
                className={`explorer-symbol${missing ? " is-missing" : ""}`}
                style={
                  missing
                    ? undefined
                    : {
                        background: `linear-gradient(160deg, ${symbolColor}, ${symbolColorTo})`,
                        color: symbolTextColor,
                      }
                }
              >
                {element.symbol}
              </span>
              <span className="explorer-name">{element.name}</span>
            </div>
            <span
              className={`detail-category explorer-category-chip${missing ? " is-missing" : ""}`}
              style={missing ? undefined : { background: symbolColor, color: symbolTextColor }}
            >
              {titleCategory(element.category)}
            </span>
            <div className="explorer-quick">
              <QuickBadge label="Block" value={element.block ? element.block.toUpperCase() : null} />
              <QuickBadge label="Period" value={element.period} />
              <QuickBadge label="Group" value={element.group} />
              <QuickBadge label="Phase" value={element.phase} />
              <QuickBadge
                label="Mass"
                value={has(element.atomicMass) ? `${formatSig(element.atomicMass, 5)} u` : null}
              />
            </div>
          </div>
        </header>

        <div className="explorer-stat-grid">
          <Fact label="Atomic Radius" empty={!has(element.atomicRadius)}>
            {has(element.atomicRadius) ? `${element.atomicRadius} pm` : "Not available"}
          </Fact>
          <Fact label="Ionization Energy" empty={!hasIonizationEnergies}>
            {hasIonizationEnergies ? `${element.ionizationEnergies[0]} kJ/mol` : "Not available"}
          </Fact>
          <Fact label="Electronegativity" empty={!has(element.electronegativity)}>
            {has(element.electronegativity) ? element.electronegativity : "Not available"}
          </Fact>
          <Fact label="Melting Point" empty={!has(element.melt)}>
            {has(element.melt) ? `${element.melt} K` : "Not available"}
          </Fact>
          <Fact label="Boiling Point" empty={!has(element.boil)}>
            {has(element.boil) ? `${element.boil} K` : "Not available"}
          </Fact>
          <Fact label="Density" empty={!has(element.density)}>
            {has(element.density) ? `${element.density} g/cm³` : "Not available"}
          </Fact>
        </div>

        <div className="detail-body explorer-body">
          <div className="explorer-tabs" role="tablist" aria-label={`${element.name} sections`}>
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`explorer-tab${tab === t.key ? " is-active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="explorer-main" ref={bodyRef} role="tabpanel">
            {tab === "overview" && (
              <>
                <section className="detail-section">
                  <SectionTitle icon={FiInfo}>Overview</SectionTitle>
                  {has(element.summary) ? (
                    <p className="detail-summary">{element.summary}</p>
                  ) : (
                    <NotAvailable>A written overview is</NotAvailable>
                  )}
                  {has(element.appearance) && (
                    <p className="explorer-appearance">
                      <span className="fact__label">Appearance</span> {element.appearance}
                    </p>
                  )}
                </section>

                {hasFigure && (
                  <section className="detail-section">
                    <figure className="explorer-figure">
                      {showFigureTabs && (
                        <div
                          className="explorer-figure-tabs"
                          role="tablist"
                          aria-label={`${element.name} figure view`}
                        >
                          <button
                            type="button"
                            role="tab"
                            aria-selected={figureTab === "photo"}
                            className={`explorer-figure-tab${figureTab === "photo" ? " is-active" : ""}`}
                            onClick={() => setFigureTab("photo")}
                          >
                            Photo
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={figureTab === "3d"}
                            className={`explorer-figure-tab${figureTab === "3d" ? " is-active" : ""}`}
                            onClick={() => setFigureTab("3d")}
                          >
                            3D Model
                          </button>
                        </div>
                      )}

                      <div className="explorer-figure-body" ref={figureBodyRef}>
                        {showModel ? (
                          <>
                            <div className="explorer-model-wrap">
                              {/* eslint-disable-next-line react/no-unknown-property */}
                              <model-viewer
                                key={element.bohrModel3d}
                                src={element.bohrModel3d}
                                alt={`${element.name} 3D atomic model`}
                                camera-controls
                                auto-rotate
                                rotation-per-second="16deg"
                                interaction-prompt="none"
                                shadow-intensity="0"
                                loading="eager"
                                onError={() => setModelError(true)}
                              />
                            </div>
                            <figcaption className="explorer-attribution">
                              Drag to rotate · scroll to zoom
                            </figcaption>
                          </>
                        ) : showPhoto ? (
                          <>
                            <div className="explorer-image-wrap">
                              <img
                                className="explorer-image"
                                src={element.image.url}
                                alt={element.image.title || `${element.name} sample`}
                                loading="lazy"
                                onError={() => setImgError(true)}
                              />
                            </div>
                            <figcaption className="explorer-attribution">
                              {element.image.title}
                            </figcaption>
                          </>
                        ) : (
                          <div className="explorer-image-fallback" style={{ background: from }}>
                            <span>{element.symbol}</span>
                            <em>
                              No {activeFigTab === "3d" ? "3D model" : "image"} available for {element.name}
                            </em>
                          </div>
                        )}
                      </div>
                    </figure>
                  </section>
                )}

                <section className="detail-section">
                  <SectionTitle icon={FiInfo}>Discovery</SectionTitle>
                  <div className="fact-grid">
                    <Fact label="Discovered by" empty={!has(element.discoveredBy)}>
                      {element.discoveredBy || "Unknown / ancient"}
                    </Fact>
                    <Fact label="Named by" empty={!has(element.namedBy)}>
                      {element.namedBy || "Unknown"}
                    </Fact>
                    <Fact label="Year Discovered" empty={!has(element.yearDiscovered)}>
                      {element.yearDiscovered || "Ancient"}
                    </Fact>
                  </div>
                </section>

                {vizCfg && vizPct != null && (
                  <section className="detail-section">
                    <p className="explorer-viz__label">
                      Visualization: {vizCfg.label}
                      {vizCfg.unit ? ` (${vizCfg.unit})` : ""}
                    </p>
                    <div className="explorer-viz">
                      <span className="explorer-viz__end">Low</span>
                      <span className="explorer-viz__bar" style={{ background: stopsGradient(90) }}>
                        <span className="explorer-viz__marker" style={{ left: `${vizPct}%` }} />
                      </span>
                      <span className="explorer-viz__end">High</span>
                    </div>
                  </section>
                )}

                {(has(element.source) || has(element.image && element.image.attribution)) && (
                  <section className="detail-section">
                    <SectionTitle icon={FiBookOpen}>Sources</SectionTitle>
                    <ul className="explorer-sources">
                      {has(element.source) && (
                        <li>
                          <a
                            className="explorer-source"
                            href={element.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {element.name} — periodic-table dataset article <FiExternalLink />
                          </a>
                        </li>
                      )}
                      {has(element.image && element.image.attribution) && (
                        <li className="explorer-source-note">{element.image.attribution}</li>
                      )}
                    </ul>
                  </section>
                )}
              </>
            )}

            {tab === "properties" && (
              <>
                <section className="detail-section">
                  <SectionTitle icon={FiZap}>Atomic Properties</SectionTitle>
                  <div className="fact-grid">
                    <Fact label="Electron Config" empty={!has(element.electronConfiguration)}>
                      {element.electronConfiguration || "Not available"}
                    </Fact>
                    {element.electronConfigurationSemantic !== element.electronConfiguration &&
                      has(element.electronConfigurationSemantic) && (
                        <Fact label="Short Form">{element.electronConfigurationSemantic}</Fact>
                      )}
                    <Fact label="Shells" empty={!hasShells}>
                      {hasShells ? element.shells.join(" · ") : "Not available"}
                    </Fact>
                    <Fact label="Electron Affinity" empty={!has(element.electronAffinity)}>
                      {has(element.electronAffinity) ? `${element.electronAffinity} kJ/mol` : "Not available"}
                    </Fact>
                    <Fact label="Oxidation States" empty={!has(element.oxidationStates)}>
                      {element.oxidationStates || "Not available"}
                    </Fact>
                    <Fact label="Standard State" empty={!has(element.standardState)}>
                      {element.standardState || "Not available"}
                    </Fact>
                  </div>
                </section>

                <section className="detail-section">
                  <SectionTitle icon={FiLayers}>Physical Properties</SectionTitle>
                  {hasPhysicalFacts ? (
                    <div className="fact-grid">
                      {has(element.phase) && <Fact label="Phase">{element.phase}</Fact>}
                      {has(element.density) && <Fact label="Density">{element.density} g/cm³</Fact>}
                      {has(element.melt) && <Fact label="Melting Point">{element.melt} K</Fact>}
                      {has(element.boil) && <Fact label="Boiling Point">{element.boil} K</Fact>}
                      {has(element.molarHeat) && (
                        <Fact label="Molar Heat">{element.molarHeat} J/(mol·K)</Fact>
                      )}
                    </div>
                  ) : (
                    <NotAvailable>Physical property data is</NotAvailable>
                  )}
                </section>
              </>
            )}

            {tab === "compounds" && (
              <section className="detail-section explorer-mols">
                <SectionTitle icon={FiGrid}>Related Molecules</SectionTitle>
                {relatedMolecules.length > 0 ? (
                  <div className="explorer-mols__grid">
                    {relatedMolecules.slice(0, 3).map((m) => (
                      <MoleculeVisualization key={m.key} molecule={m} className="molecule--mini" />
                    ))}
                  </div>
                ) : (
                  <NotAvailable>Compound data is</NotAvailable>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
