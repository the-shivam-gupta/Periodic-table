import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import HelpModal from "../components/HelpModal";
import TableToolbar from "../components/TableToolbar";
import ElementExplorer from "../components/ElementExplorer";
import PreviewCard from "../components/PreviewCard";
import PeriodicTable from "../components/PeriodicTable";
import ElementsView from "../components/ElementsView";
import PropertyExplorer from "../components/PropertyExplorer";
import MoleculesView from "../components/MoleculesView";
import Game from "../components/Game";
import { ELEMENTS, NUMBER_MAP } from "../data/elements";
import {
  CATEGORIES,
  themeFillColor,
  themedCategoryColors,
  themedCategoryText,
  categoryShade,
  darkenRgbForText,
  lightenRgbForText,
  gradientStops,
  titleCategory,
} from "../data/categories";
import { useTheme } from "../theme/ThemeContext";
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
  isMissingValueFor,
  heatGradientStops,
} from "../data/propertyScale";

const VIEWS = [
  { key: "table", label: "Periodic Table", path: "/" },
  { key: "elements", label: "Elements", path: "/elements" },
  { key: "properties", label: "Properties", path: "/properties" },
  { key: "molecules", label: "Molecules", path: "/molecules" },
  { key: "games", label: "Games", path: "/games" },
];

const DEFAULT_VIEW = VIEWS[0];
const VIEW_BY_PATH = new Map(VIEWS.map((v) => [v.path, v.key]));
const PATH_BY_VIEW = new Map(VIEWS.map((v) => [v.key, v.path]));

const TITLE_BY_VIEW = {
  table: "PeriodicTable. — Interactive Periodic Table",
  elements: "Elements — PeriodicTable.",
  properties: "Properties — PeriodicTable.",
  molecules: "Molecules — PeriodicTable.",
  games: "Games — PeriodicTable.",
};

const DEFAULT_SHOWCASE_NUMBER = 6;

export default function App() {
  const { theme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const view = VIEW_BY_PATH.get(location.pathname) || DEFAULT_VIEW.key;
  const setView = useCallback(
    (key) => {
      const path = PATH_BY_VIEW.get(key) || DEFAULT_VIEW.path;
      if (path !== location.pathname) navigate(path);
    },
    [navigate, location.pathname]
  );
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [heatKey, setHeatKey] = useState(null);
  const [showcaseNumber, setShowcaseNumber] = useState(null);
  const [showcaseManual, setShowcaseManual] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [showMass, setShowMass] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const rootRef = useRef(null);
  const previewRef = useRef(null);
  const tableRef = useRef(null);
  const viewPanelRef = useRef(null);

  useEffect(() => {
    if (!VIEW_BY_PATH.has(location.pathname)) navigate(DEFAULT_VIEW.path, { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    document.title = TITLE_BY_VIEW[view] || TITLE_BY_VIEW[DEFAULT_VIEW.key];
  }, [view]);

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

  const heatBaseColor = useCallback(
    (el) => {
      if (!heatScale) return null;
      const v = propertyValue(el, heatKey);
      if (heatScale.missing(v)) return null;
      return heatConfig?.categoryShaded
        ? categoryShade(el.category, v, heatKey)
        : heatScale.color(v);
    },
    [heatScale, heatKey, heatConfig]
  );

  const heatStyleFor = useCallback(
    (el) => {
      const c = heatBaseColor(el);
      if (!c) return null;
      // Map the pastel heat color onto the active theme (mid-dark in dark
      // mode), then build the usual two lightness stops of the same hue.
      const themed = themeFillColor(c, theme);
      const [from, to] = heatGradientStops(themed, theme);
      return `linear-gradient(110deg, ${from}, ${to})`;
    },
    [heatBaseColor, theme]
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

  const showcaseEl = useMemo(() => {
    if (hoveredElement && hoveredElement.number != null) return hoveredElement;
    if (showcaseNumber != null) {
      const selected = NUMBER_MAP.get(showcaseNumber);
      if (selected) return selected;
    }
    if (heatKey && heatScale && autoShowcase) return autoShowcase;
    return NUMBER_MAP.get(DEFAULT_SHOWCASE_NUMBER) || null;
  }, [hoveredElement, showcaseNumber, heatKey, heatScale, autoShowcase]);

  const heatMode = heatKey !== null && heatScale !== null;
  const isFeatured =
    !!showcaseEl &&
    !!hoveredElement &&
    hoveredElement.number === showcaseEl.number;

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
      const [from, to] = gradientStops(heatStyleFor(showcaseEl));
      return from && to ? { from, to, angle: 110 } : undefined;
    }
    const [from, to] = themedCategoryColors(showcaseEl.category, theme);
    return from && to ? { from, to, angle: 180 } : undefined;
  })();

  const showcaseValueLabel = heatMode
    ? heatConfig
      ? heatConfig.label
      : ""
    : "Category";

  const showcaseTextColor = !showcaseEl
    ? null
    : heatMode
      ? showcaseMissing
        ? null
        : isDark
          ? lightenRgbForText(heatBaseColor(showcaseEl))
          : darkenRgbForText(heatBaseColor(showcaseEl))
      : themedCategoryText(showcaseEl.category, theme);

  const centerNode =
    showcaseEl ? (
      <PropertyShowcase
        element={showcaseEl}
        valueText={showcaseValueText}
        valueLabel={showcaseValueLabel}
        color={showcaseColor}
        textColor={showcaseTextColor}
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
    let side = "right"; // card sits to the right of the cell -> arrow on its left edge
    if (x + w > window.innerWidth - 10) {
      x = rect.left - w - gap;
      side = "left"; // card sits to the left of the cell -> arrow on its right edge
    }
    const y = Math.max(10, Math.min(rect.top, window.innerHeight - h - 10));
    pv.dataset.side = side;

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

  // Reduce-motion setting (user toggle overrides the OS preference)
  useEffect(() => {
    setForcedReducedMotion(reduceMotion);
    document.documentElement.classList.toggle("force-reduced-motion", reduceMotion);
  }, [reduceMotion]);

  const hasCenteredMobileTableRef = useRef(false);
  const tableBaselineScrollRef = useRef(null);
  const [tableSwiped, setTableSwiped] = useState(false);

  useEffect(() => {
    if (view !== "table") return;
    const scroller = rootRef.current?.querySelector(".table-scroll");
    if (!scroller) return;
    const isMobile = window.innerWidth <= 620;
    if (isMobile && !hasCenteredMobileTableRef.current) {
      scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
      scroller.scrollTop = 0;
      hasCenteredMobileTableRef.current = true;
      tableBaselineScrollRef.current = scroller.scrollLeft;
    } else if (!isMobile) {
      scroller.scrollLeft = 0;
      scroller.scrollTop = 0;
    }
  }, [view]);

  const handleTableScroll = useCallback((e) => {
    const baseline = tableBaselineScrollRef.current ?? 0;
    if (Math.abs(e.currentTarget.scrollLeft - baseline) > 8) setTableSwiped(true);
  }, []);

  return (
    <div className="app" ref={rootRef}>
      <Header
        views={VIEWS}
        view={view}
        onViewChange={setView}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <main className="app-shell" id="top">
        {view === "table" && (
          <div className="page-toolbar">
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
          </div>
        )}

        <div className="view-panel" ref={viewPanelRef}>
          {view === "table" && (
            <div className="view-entrance">
              <section className="table-section">
                {centerNode && <div className="table-center-mobile">{centerNode}</div>}

                {!tableSwiped && (
                  <p className="table-swipe-hint" aria-hidden="true">
                    Swipe horizontally to explore the periodic table →
                  </p>
                )}

                <div className="table-scroll" onScroll={handleTableScroll}>
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

          {view === "elements" && (
            <div className="view-entrance">
              <ElementsView onOpen={openDetail} />
            </div>
          )}

          {view === "properties" && (
            <div className="view-entrance">
              <PropertyExplorer onOpen={openDetail} />
            </div>
          )}

          {view === "molecules" && (
            <div className="view-entrance">
              <MoleculesView />
            </div>
          )}

          {view === "games" && (
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
            glowColor={heatMode ? heatBaseColor(hoveredElement) : null}
            missing={
              heatMode &&
              isMissingValueFor(heatConfig?.kind, propertyValue(hoveredElement, heatKey))
            }
          />
        )}
      </div>

      {selected && (
        <ElementExplorer
          element={selected}
          onClose={closeDetail}
          propertyKey={heatMode ? heatKey : null}
          accentColor={heatMode ? heatBaseColor(selected) : null}
          missing={
            heatMode && isMissingValueFor(heatConfig?.kind, propertyValue(selected, heatKey))
          }
        />
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}