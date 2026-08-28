import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import SearchBar from "../components/SearchBar";
import TableToolbar from "../components/TableToolbar";
import ElementExplorer from "../components/ElementExplorer";
import BackgroundEffects from "../components/BackgroundEffects";
import PreviewCard from "../components/PreviewCard";
import PeriodicTable from "../components/PeriodicTable";
import ListView from "../components/ListView";
import Game from "../components/Game";
import { ELEMENTS, NUMBER_MAP } from "../data/elements";
import { CATEGORIES, categoryColors, categoryShade, titleCategory } from "../data/categories";
import { buildCategoryCounts } from "../animations/categoryAnimations";
import { playPageEntrance } from "../animations/tableAnimations";
import {
  prefersReducedMotion,
  setForcedReducedMotion,
} from "../animations/usePrefersReducedMotion";
import { entrance } from "../animations/gameAnimations";
import PropertyShowcase from "../components/PropertyShowcase";
import {
  getPropertyConfig,
  propertyValue,
  buildScale,
  formatSig,
  stopsGradient,
  isMissingValueFor,
} from "../data/propertyScale";

const VIEWS = [
  { key: "table", label: "Table" },
  { key: "list", label: "List / Properties" },
  { key: "game", label: "Game" },
];

export default function App() {
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [heatKey, setHeatKey] = useState(null);
  const [showcaseNumber, setShowcaseNumber] = useState(null);
  const [showcaseManual, setShowcaseManual] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [showMass, setShowMass] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const rootRef = useRef(null);
  const cursorRef = useRef(null);
  const previewRef = useRef(null);
  const tableRef = useRef(null);
  const viewPanelRef = useRef(null);

  const searchIndex = useMemo(() => ELEMENTS.map((e) => ({ element: e })), []);
  const categoryCounts = useMemo(() => buildCategoryCounts(ELEMENTS), []);

  const heatScale = useMemo(
    () => (heatKey ? buildScale(ELEMENTS, heatKey) : null),
    [heatKey]
  );
  const heatConfig = heatKey ? getPropertyConfig(heatKey) : null;

  const isDimmed = useCallback(
    (el) => {
      if (!activeCategory) return false;
      const cat = CATEGORIES.find((c) => c.key === activeCategory);
      return cat ? !cat.match(el) : false;
    },
    [activeCategory]
  );

  const heatStyleFor = useCallback(
    (el) => {
      if (!heatScale) return null;
      const v = propertyValue(el, heatKey);
      if (heatScale.missing(v)) return null;
      const c = heatConfig?.categoryShaded
        ? categoryShade(el.category, v, heatKey)
        : heatScale.color(v);
      const soft = c.replace("rgb(", "rgba(").replace(")", ", 0.8)");
      return `linear-gradient(160deg, ${c}, ${soft})`;
    },
    [heatScale, heatKey, heatConfig]
  );

  const heatBadgeFor = useCallback(
    (el) => {
      if (!heatConfig || !heatScale) return null;
      const v = propertyValue(el, heatKey);
      if (heatScale.missing(v)) return heatConfig.noValueText ?? null;
      return heatConfig.fmt(v);
    },
    [heatConfig, heatScale, heatKey]
  );

  // Default showcase element: for numeric properties a value-bearing element
  // near the middle of the current property's range (skewing toward well-known
  // low-Z elements); for categorical properties simply a value-bearing element.
  const autoShowcase = useMemo(() => {
    if (!heatKey || !heatScale) return null;
    if (heatScale.kind === "categorical") {
      return (
        ELEMENTS.find((e) => !isMissingValueFor("categorical", propertyValue(e, heatKey))) ||
        ELEMENTS[0] ||
        null
      );
    }
    let best = null;
    let bestScore = Infinity;
    ELEMENTS.forEach((e) => {
      const v = propertyValue(e, heatKey);
      if (heatScale.missing(v)) return;
      const n = (Number(v) - heatScale.min) / (heatScale.max - heatScale.min);
      const score =
        Math.abs(n - 0.5) + (e.number > 100 ? 0.3 : 0) + e.number * 0.0002;
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    });
    return best || null;
  }, [heatKey, heatScale]);

  useEffect(() => {
    if (heatKey && !showcaseManual) {
      setShowcaseNumber(autoShowcase ? autoShowcase.number : null);
    }
  }, [heatKey, autoShowcase, showcaseManual]);

  // The element shown in the center. Hover takes priority (transient), then
  // the user's selected/auto-picked representative element. Nothing shows
  // until one of those actually happens — no default element on first load.
  const showcaseEl = useMemo(() => {
    if (hoveredElement && hoveredElement.number != null) return hoveredElement;
    if (showcaseNumber != null) {
      const selected = NUMBER_MAP.get(showcaseNumber);
      if (selected) return selected;
    }
    if (heatKey && heatScale && autoShowcase) return autoShowcase;
    return null;
  }, [hoveredElement, showcaseNumber, heatKey, heatScale, autoShowcase]);

  // Heat mode is active whenever a Color by property (numeric OR categorical) is
  // selected; the category-coloring default (heatKey === null) is not heat mode.
  const heatMode = heatKey !== null && heatScale !== null;
  const isFeatured =
    !!showcaseEl &&
    !!hoveredElement &&
    hoveredElement.number === showcaseEl.number;

  // Bottom value + label + tile color, unified across all modes. In a heat mode
  // (numeric or categorical) the tile shows the selected property's value; in
  // the default category mode it shows the element's category name. Atomic mass
  // is never a colorable property — it shows at the top-right of every cell.
  const showcasePropValue = showcaseEl
    ? heatMode
      ? propertyValue(showcaseEl, heatKey)
      : null
    : undefined;

  const showcaseMissing = heatMode
    ? !showcaseEl ||
      isMissingValueFor(heatConfig?.kind, showcasePropValue)
    : false;

  const categoryName = showcaseEl ? titleCategory(showcaseEl.category) : null;

  const showcaseValueText = heatMode
    ? !showcaseEl || showcaseMissing
      ? heatConfig?.noValueText ?? ""
      : heatConfig.unit
        ? `${heatConfig.fmt(showcasePropValue)} ${heatConfig.unit}`
        : heatConfig.fmt(showcasePropValue)
    : categoryName || "";

  const showcaseColor = (() => {
    if (!showcaseEl) return undefined;
    if (heatMode) {
      const v = propertyValue(showcaseEl, heatKey);
      if (isMissingValueFor(heatConfig?.kind, v)) return undefined;
      return heatStyleFor(showcaseEl);
    }
    const [from, to] = categoryColors(showcaseEl.category);
    return from && to ? `linear-gradient(180deg, ${from}, ${to})` : undefined;
  })();

  const showcaseValueLabel = heatMode
    ? heatConfig
      ? heatConfig.label
      : ""
    : "Category";

  const centerNode =
    showcaseEl ? (
      <PropertyShowcase
        element={showcaseEl}
        valueText={showcaseValueText}
        valueLabel={showcaseValueLabel}
        color={showcaseColor}
        missing={showcaseMissing}
        featured={isFeatured}
      />
    ) : null;

  const relatedFor = useCallback((el, max = 48) => {
    const out = [];
    ELEMENTS.forEach((e) => {
      if (e.number === el.number) return;
      const sameCategory =
        el.category != null &&
        e.category === el.category &&
        !el.category.startsWith("unknown");
      const sameGroup = !sameCategory && el.group != null && e.group === el.group;
      const samePeriod =
        !sameCategory && el.period != null && e.period === el.period;
      if (sameCategory || sameGroup || samePeriod) out.push(e.number);
    });
    return out.slice(0, max);
  }, []);

  const positionPreview = useCallback((node) => {
    const pv = previewRef.current;
    if (!pv || !node) return;
    const rect = node.getBoundingClientRect();
    const inner = pv.firstElementChild || pv;
    const innerRect = inner.getBoundingClientRect();
    const w = innerRect.width || 150;
    const h = innerRect.height || 200;
    const gap = 16;

    let x = rect.right + gap;
    if (x + w > window.innerWidth - 10) x = rect.left - w - gap;
    const y = Math.max(10, Math.min(rect.top, window.innerHeight - h - 10));

    gsap.to(pv, {
      x,
      y,
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "back.out(1.5)",
      overwrite: "auto",
    });
  }, []);

  const hidePreview = useCallback(() => {
    const pv = previewRef.current;
    if (!pv) return;
    gsap.to(pv, { opacity: 0, scale: 0.9, duration: 0.2, ease: "power2.in", overwrite: "auto" });
  }, []);

  const handleHoverEnter = useCallback(
    (number, node) => {
      setHoveredElement(NUMBER_MAP.get(number) || null);
      positionPreview(node);
    },
    [positionPreview]
  );

  const handleHoverLeave = useCallback(() => {
    setHoveredElement(null);
    hidePreview();
  }, [hidePreview]);

  const openDetail = useCallback(
    (el) => {
      if (!el || !el.number) return;
      hidePreview();
      setSelected(el);
      setShowcaseNumber(el.number);
      setShowcaseManual(true);
    },
    [hidePreview]
  );

  const closeDetail = useCallback(() => {
    setSelected(null);
    tableRef.current?.reset(0.4);
  }, []);

  useLayoutEffect(() => {
    if (!selected) return;
    tableRef.current?.dim(selected.number, 0.16, 0.5);
    tableRef.current?.pulse(relatedFor(selected), 0.45);
  }, [selected, relatedFor]);

  const handleSearchSelect = useCallback(
    (el) => {
      if (!el) return;
      setView("table");
      window.setTimeout(() => {
        const node = tableRef.current?.getNode(el.number);
        if (node) {
          try {
            node.scrollIntoView({
              behavior: prefersReducedMotion() ? "auto" : "smooth",
              block: "center",
              inline: "center",
            });
          } catch {
            node.scrollIntoView(true);
          }
          tableRef.current?.flash(el.number);
        }
        window.setTimeout(() => openDetail(el), 620);
      }, 60);
    },
    [openDetail]
  );

  const handleCategoryChange = useCallback((key) => {
    setActiveCategory(key);
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      playPageEntrance(rootRef.current);
      if (prefersReducedMotion()) return;

      const footer = rootRef.current?.querySelector(".footer");
      if (footer) {
        gsap.from(footer, {
          opacity: 0,
          y: 18,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: footer, start: "top 94%" },
        });
      }
    }, rootRef.current);
    return () => ctx.revert();
  }, []);

  // Animate view panels when switching tabs
  useLayoutEffect(() => {
    if (viewPanelRef.current) {
      entrance(viewPanelRef.current.querySelectorAll(".view-entrance"));
    }
  }, [view]);

  // Cursor glow
  useEffect(() => {
    const el = cursorRef.current;
    if (!el || prefersReducedMotion()) return;
    if (typeof window.matchMedia === "function" && !window.matchMedia("(hover: hover)").matches) {
      return;
    }
    const qx = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" });
    const qy = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" });
    const onMove = (e) => {
      qx(e.clientX);
      qy(e.clientY);
    };
    gsap.to(el, { opacity: 1, duration: 1.2, delay: 0.6 });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Reduce-motion setting (user toggle overrides the OS preference)
  useEffect(() => {
    setForcedReducedMotion(reduceMotion);
    document.documentElement.classList.toggle("force-reduced-motion", reduceMotion);
  }, [reduceMotion]);

  // Keep the table scrolled to its start when switching views or layouts.
  useEffect(() => {
    if (view !== "table") return;
    const scroller = rootRef.current?.querySelector(".table-scroll");
    if (scroller) {
      scroller.scrollLeft = 0;
      scroller.scrollTop = 0;
    }
  }, [view]);

  return (
    <div className="app" ref={rootRef}>
      <BackgroundEffects />
      <div ref={cursorRef} className="cursor-glow" aria-hidden="true" />

      <main className="app-shell">
        <section className="hero">
          <div className="hero__inner">
            <p className="hero__eyebrow">Interactive · Educational</p>
            <h1 className="app-title">
              Periodic Table<span className="app-title__dot">.</span>
            </h1>
            <p className="hero__subtitle">
              The same 118-element dataset, everywhere — table, properties, and games.
            </p>
            <SearchBar index={searchIndex} onSelect={handleSearchSelect} />
          </div>
        </section>

        <nav className="nav-tabs" aria-label="Primary">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              className={`nav-tab${view === v.key ? " is-active" : ""}`}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </nav>

        <div className="view-panel" ref={viewPanelRef}>
          {view === "table" && (
            <div className="view-entrance">
              <TableToolbar
                categories={CATEGORIES}
                counts={categoryCounts}
                total={ELEMENTS.length}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                heatKey={heatKey}
                onHeatChange={setHeatKey}
                showNames={showNames}
                onToggleNames={() => setShowNames((v) => !v)}
                showMass={showMass}
                onToggleMass={() => setShowMass((v) => !v)}
                showCategories={showCategories}
                onToggleCategories={() => setShowCategories((v) => !v)}
                reduceMotion={reduceMotion}
                onToggleReduceMotion={() => setReduceMotion((v) => !v)}
              />

              <p className="table-caption" aria-live="polite">
                {activeCategory
                  ? `${categoryCounts[activeCategory] ?? 0} of ${ELEMENTS.length} elements · ${
                      CATEGORIES.find((c) => c.key === activeCategory)?.label ?? ""
                    }`
                  : `${ELEMENTS.length} elements · Hover to preview · Click to explore`}
              </p>

              <div className="heat-legend">
                  <span className="heat-legend__title">Coloring by</span>
                  {heatScale ? (
                    heatScale.kind === "categorical" ? (
                      heatConfig?.categoryShaded ? (
                        <>
                          <span className="heat-legend__label">
                            {heatConfig?.label}
                          </span>
                          <span className="heat-legend__note">
                            each element keeps its category color, shaded by its exact value
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="heat-legend__label">
                            {heatConfig?.label}
                          </span>
                          <span className="heat-legend__cats">
                            {heatScale.values.map((v) => (
                              <span className="heat-legend__cat" key={v.value}>
                                <span
                                  className="heat-legend__swatch"
                                  style={{ background: v.color }}
                                  aria-hidden="true"
                                />
                                <span className="heat-legend__cat-label">
                                  {v.value}
                                </span>
                              </span>
                            ))}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <span className="heat-legend__label">
                          {heatConfig?.label}
                        </span>
                        <span className="heat-legend__graph">
                          <span className="heat-legend__min">
                            {formatSig(heatScale.min, 4)}
                            {heatConfig?.unit ? ` ${heatConfig.unit}` : ""}
                          </span>
                          <span
                            className="heat-legend__bar"
                            style={{ background: stopsGradient(90) }}
                            aria-hidden="true"
                          />
                          <span className="heat-legend__max">
                            {formatSig(heatScale.max, 4)}
                            {heatConfig?.unit ? ` ${heatConfig.unit}` : ""}
                          </span>
                          <span className="heat-legend__low">Low</span>
                          <span className="heat-legend__space" aria-hidden="true" />
                          <span className="heat-legend__high">High</span>
                        </span>
                        <span className="heat-legend__na">
                          · some elements lack a value
                        </span>
                      </>
                    )
                  ) : (
                    <span className="heat-legend__label">None</span>
                  )}
                </div>

              <section className="table-section">
                <div className="table-scroll">
                  <PeriodicTable
                    ref={tableRef}
                    mode="wide"
                    onSelect={openDetail}
                    onHover={handleHoverEnter}
                    onHoverLeave={handleHoverLeave}
                    dimPredicate={activeCategory ? isDimmed : null}
                    heatStyle={heatKey ? heatStyleFor : null}
                    heatBadge={heatKey ? heatBadgeFor : null}
                    heatLabel={heatConfig?.label || ""}
                    heatUnit={heatConfig?.unit || ""}
                    centerNode={centerNode}
                    showNames={showNames}
                    showMass={showMass}
                    showCategories={showCategories}
                    locked={!!selected}
                  />
                </div>
              </section>
            </div>
          )}

          {view === "list" && (
            <div className="view-entrance">
              <ListView onOpen={openDetail} />
            </div>
          )}

          {view === "game" && (
            <div className="view-entrance">
              <Game />
            </div>
          )}
        </div>

        <footer className="footer">
          <span>118 elements · single dataset: periodic-table-lookup.json</span>
          <span>Built with React + GSAP</span>
        </footer>
      </main>

      <div ref={previewRef} className="hover-preview">
        {hoveredElement && (
          <PreviewCard
            element={hoveredElement}
            background={heatStyleFor(hoveredElement)}
            missing={
              heatMode &&
              isMissingValueFor(heatConfig?.kind, propertyValue(hoveredElement, heatKey))
            }
          />
        )}
      </div>

      {selected && <ElementExplorer element={selected} onClose={closeDetail} />}
    </div>
  );
}