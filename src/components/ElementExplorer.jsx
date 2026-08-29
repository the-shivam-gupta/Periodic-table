import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  FiExternalLink,
  FiInfo,
  FiZap,
  FiThermometer,
  FiClock,
  FiBookOpen,
  FiGrid,
} from "react-icons/fi";
import MoleculeVisualization from "./MoleculeVisualization";
import useScrollLock from "../hooks/useScrollLock";
import { animateDetailIn, animateDetailOut } from "../animations/modalAnimations";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";
import { categoryColors, titleCategory } from "../data/categories";
import { formatSig } from "../data/propertyScale";
import { moleculesContaining } from "../data/molecules";

const has = (v) => v !== null && v !== undefined && v !== "";

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

export default function ElementExplorer({ element, onClose, accentColor }) {
  const rootRef = useRef(null);
  const figureBodyRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [figureTab, setFigureTab] = useState("photo");
  const [from, to] = categoryColors(element.category);
  // When a "Color by" property is active, the symbol, the active figure tab,
  // the card wash, the top accent line and the category chip all follow
  // that property's color for this element (matching the hover preview
  // card) instead of always falling back to the plain category color —
  // otherwise opening the explorer while Color-by is on looks like it reset
  // to "None". There's only one solid color from a heat property (not a
  // two-stop pair like the category gradients), so it stands in for both
  // `from` and `to` wherever a gradient needs two stops.
  const symbolColor = accentColor || from;
  const symbolColorTo = accentColor || to;
  const relatedMolecules = moleculesContaining(element.symbol);

  useEffect(() => {
    setImgError(false);
    setModelError(false);
    setFigureTab("photo");
  }, [element.number]);

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
  const activeTab = showFigureTabs ? figureTab : modelAvailable ? "3d" : "photo";
  const showModel = activeTab === "3d" && modelAvailable && !modelError;
  const showPhoto = activeTab === "photo" && photoAvailable && !imgError;

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
  }, [activeTab, showModel, showPhoto]);

  const hasShells = Array.isArray(element.shells) && element.shells.length > 0;
  const hasIonizationEnergies =
    Array.isArray(element.ionizationEnergies) && element.ionizationEnergies.length > 0;
  const hasAtomicFacts =
    has(element.electronConfiguration) ||
    (has(element.electronConfigurationSemantic) &&
      element.electronConfigurationSemantic !== element.electronConfiguration) ||
    hasShells ||
    has(element.electronAffinity) ||
    has(element.electronegativity) ||
    hasIonizationEnergies;
  const hasPhysicalFacts =
    has(element.phase) ||
    has(element.density) ||
    has(element.melt) ||
    has(element.boil) ||
    has(element.molarHeat);

  const close = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      onClose();
      return;
    }
    const tl = animateDetailOut(root, root.querySelector(".detail-card"));
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
      animateDetailIn(
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
    >
      <div
        className="detail-card explorer-card"
        style={{
          // `color-mix` rather than the hex-alpha-suffix trick (`${x}42`) —
          // symbolColor is a plain hex string for the category-color case,
          // but an `rgb(r, g, b)` string when a Color-by property is active,
          // and appending hex digits to an rgb() string just produces
          // invalid CSS. color-mix works with either.
          background: `linear-gradient(180deg, color-mix(in srgb, ${symbolColor} 26%, transparent) 0%, color-mix(in srgb, ${symbolColor} 10%, transparent) 40%, color-mix(in srgb, ${symbolColor} 4%, transparent) 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015) 40%), #121725`,
        }}
      >
        <button type="button" className="detail-close" onClick={close} aria-label="Close details">
          <span className="detail-close__glyph detail-close__cross" aria-hidden="true">
            ×
          </span>
          <span className="detail-close__glyph detail-close__minus" aria-hidden="true">
            −
          </span>
        </button>

        <header className="detail-header explorer-header">
          <div
            className="explorer-accent"
            style={{ background: `linear-gradient(90deg, ${symbolColor}, ${symbolColorTo})` }}
            aria-hidden="true"
          />
          <div className="explorer-heading">
            <span className="explorer-number">#{element.number}</span>
            <div className="explorer-symbol-block">
              <span className="explorer-symbol" style={{ color: symbolColor }}>
                {element.symbol}
              </span>
              <span className="explorer-name">{element.name}</span>
            </div>
            <span
              className="detail-category explorer-category-chip"
              style={{
                background: `color-mix(in srgb, ${symbolColor} 20%, transparent)`,
                borderColor: `color-mix(in srgb, ${symbolColor} 60%, transparent)`,
              }}
            >
              <span
                className="explorer-category-chip__dot"
                style={{ background: `linear-gradient(135deg, ${symbolColor}, ${symbolColorTo})` }}
                aria-hidden="true"
              />
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

        <div className="detail-body explorer-body">
          <div className="explorer-layout">
            <div className="explorer-main">
              {has(element.summary) && (
                <section className="detail-section">
                  <SectionTitle icon={FiInfo}>Overview</SectionTitle>
                  <p className="detail-summary">{element.summary}</p>
                  {has(element.appearance) && (
                    <p className="explorer-appearance">
                      <span className="fact__label">Appearance</span> {element.appearance}
                    </p>
                  )}
                </section>
              )}

              {hasAtomicFacts && (
                <section className="detail-section">
                  <SectionTitle icon={FiZap}>Atomic Properties</SectionTitle>
                  <div className="fact-grid">
                    {has(element.electronConfiguration) && (
                      <Fact label="Electron Config">{element.electronConfiguration}</Fact>
                    )}
                    {element.electronConfigurationSemantic !== element.electronConfiguration &&
                      has(element.electronConfigurationSemantic) && (
                        <Fact label="Short Form">{element.electronConfigurationSemantic}</Fact>
                      )}
                    {hasShells && <Fact label="Shells">{element.shells.join(" · ")}</Fact>}
                    {has(element.electronAffinity) && (
                      <Fact label="Electron Affinity">{element.electronAffinity} kJ/mol</Fact>
                    )}
                    {has(element.electronegativity) && (
                      <Fact label="Electronegativity">{element.electronegativity}</Fact>
                    )}
                    {hasIonizationEnergies && (
                      <Fact label="Ionization Energy">
                        {element.ionizationEnergies.join(" · ")} kJ/mol
                      </Fact>
                    )}
                  </div>
                </section>
              )}

              {hasPhysicalFacts && (
                <section className="detail-section">
                  <SectionTitle icon={FiThermometer}>Physical Properties</SectionTitle>
                  <div className="fact-grid">
                    {has(element.phase) && <Fact label="Phase">{element.phase}</Fact>}
                    {has(element.density) && (
                      <Fact label="Density">{element.density} g/cm³</Fact>
                    )}
                    {has(element.melt) && <Fact label="Melting Point">{element.melt} K</Fact>}
                    {has(element.boil) && <Fact label="Boiling Point">{element.boil} K</Fact>}
                    {has(element.molarHeat) && (
                      <Fact label="Molar Heat">{element.molarHeat} J/(mol·K)</Fact>
                    )}
                  </div>
                </section>
              )}

              <section className="detail-section">
                <SectionTitle icon={FiClock}>Discovery</SectionTitle>
                <div className="fact-grid">
                  <Fact label="Discovered by" empty={!has(element.discoveredBy)}>
                    {element.discoveredBy || "Unknown / ancient"}
                  </Fact>
                  <Fact label="Named by" empty={!has(element.namedBy)}>
                    {element.namedBy || "Unknown"}
                  </Fact>
                </div>
              </section>
            </div>

            <aside className="explorer-side">
              <figure className="explorer-figure">
                {showFigureTabs && (
                  <div
                    className="explorer-figure-tabs"
                    role="tablist"
                    aria-label={`${element.name} figure view`}
                    style={{ "--figure-tab-active": symbolColor }}
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
                    <div
                      className="explorer-image-fallback"
                      style={{ background: `linear-gradient(155deg, ${from}, transparent)` }}
                    >
                      <span>{element.symbol}</span>
                      <em>
                        No {activeTab === "3d" ? "3D model" : "image"} available for {element.name}
                      </em>
                    </div>
                  )}
                </div>
              </figure>

              {relatedMolecules.length > 0 && (
                <section className="detail-section explorer-mols">
                  <SectionTitle icon={FiGrid}>Related Molecules</SectionTitle>
                  <div className="explorer-mols__grid">
                    {relatedMolecules.slice(0, 3).map((m) => (
                      <MoleculeVisualization key={m.key} molecule={m} className="molecule--mini" />
                    ))}
                  </div>
                </section>
              )}

              {(has(element.source) ||
                has(element.image && element.image.attribution) ||
                has(element.spectralImg) ||
                has(element.bohrModelImage)) && (
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
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}