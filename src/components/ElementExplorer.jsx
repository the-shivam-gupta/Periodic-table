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
import AtomVisualization from "./AtomVisualization";
import MoleculeVisualization from "./MoleculeVisualization";
import { animateDetailIn, animateDetailOut } from "../animations/modalAnimations";
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

export default function ElementExplorer({ element, onClose }) {
  const rootRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [from, to] = categoryColors(element.category);
  const relatedMolecules = moleculesContaining(element.symbol);

  useEffect(() => setImgError(false), [element.number]);

  const close = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      onClose();
      return;
    }
    const tl = animateDetailOut(root, root.querySelector(".detail-card"));
    tl.eventCallback("onComplete", onClose);
  }, [onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      animateDetailIn(
        root,
        root.querySelector(".detail-card"),
        root.querySelector(".detail-header"),
        [...root.querySelectorAll(".detail-section")],
        root.querySelector(".atom")
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
      <div className="detail-card explorer-card">
        <button type="button" className="detail-close" onClick={close} aria-label="Close details">
          <span className="detail-close__glyph detail-close__cross" aria-hidden="true">
            ×
          </span>
          <span className="detail-close__glyph detail-close__minus" aria-hidden="true">
            −
          </span>
        </button>

        <header
          className="detail-header explorer-header"
          style={{ background: `linear-gradient(150deg, ${from}4d, transparent 68%)` }}
        >
          <div
            className="explorer-accent"
            style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
            aria-hidden="true"
          />
          <div className="explorer-heading">
            <span className="explorer-number">#{element.number}</span>
            <div className="explorer-symbol-block">
              <span className="explorer-symbol" style={{ color: from }}>
                {element.symbol}
              </span>
              <span className="explorer-name">{element.name}</span>
            </div>
            <span
              className="detail-category explorer-category-chip"
              style={{ background: `${from}33`, borderColor: `${from}99` }}
            >
              <span
                className="explorer-category-chip__dot"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
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

          <AtomVisualization element={element} />
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

              <section className="detail-section">
                <SectionTitle icon={FiZap}>Atomic Properties</SectionTitle>
                <div className="fact-grid">
                  <Fact label="Electron Config" empty={!has(element.electronConfiguration)}>
                    {element.electronConfiguration || "N/A"}
                  </Fact>
                  {element.electronConfigurationSemantic !== element.electronConfiguration &&
                    has(element.electronConfigurationSemantic) && (
                      <Fact label="Short Form">{element.electronConfigurationSemantic}</Fact>
                    )}
                  <Fact
                    label="Shells"
                    empty={!(Array.isArray(element.shells) && element.shells.length)}
                  >
                    {Array.isArray(element.shells) && element.shells.length
                      ? element.shells.join(" · ")
                      : "N/A"}
                  </Fact>
                  <Fact label="Electron Affinity" empty={!has(element.electronAffinity)}>
                    {has(element.electronAffinity) ? `${element.electronAffinity} kJ/mol` : "N/A"}
                  </Fact>
                  <Fact label="Electronegativity" empty={!has(element.electronegativity)}>
                    {has(element.electronegativity) ? element.electronegativity : "N/A"}
                  </Fact>
                  <Fact
                    label="Ionization Energy"
                    empty={
                      !(
                        Array.isArray(element.ionizationEnergies) &&
                        element.ionizationEnergies.length
                      )
                    }
                  >
                    {Array.isArray(element.ionizationEnergies) &&
                    element.ionizationEnergies.length
                      ? `${element.ionizationEnergies.join(" · ")} kJ/mol`
                      : "N/A"}
                  </Fact>
                </div>
              </section>

              <section className="detail-section">
                <SectionTitle icon={FiThermometer}>Physical Properties</SectionTitle>
                <div className="fact-grid">
                  <Fact label="Phase" empty={!has(element.phase)}>
                    {element.phase || "N/A"}
                  </Fact>
                  <Fact label="Density" empty={!has(element.density)}>
                    {has(element.density) ? `${element.density} g/cm³` : "N/A"}
                  </Fact>
                  <Fact label="Melting Point" empty={!has(element.melt)}>
                    {has(element.melt) ? `${element.melt} K` : "N/A"}
                  </Fact>
                  <Fact label="Boiling Point" empty={!has(element.boil)}>
                    {has(element.boil) ? `${element.boil} K` : "N/A"}
                  </Fact>
                  <Fact label="Molar Heat" empty={!has(element.molarHeat)}>
                    {has(element.molarHeat) ? `${element.molarHeat} J/(mol·K)` : "N/A"}
                  </Fact>
                </div>
              </section>

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
                {element.image && !imgError ? (
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
                    <em>No image available for {element.name}</em>
                  </div>
                )}
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