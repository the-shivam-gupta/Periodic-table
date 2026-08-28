import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import {
  FiFilter,
  FiDroplet,
  FiMoreHorizontal,
  FiChevronDown,
  FiCheck,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { FILTER_COLORS, DEFAULT_COLOR } from "../data/categories";
import { PROPERTIES, getPropertyConfig } from "../data/propertyScale";
import { openPopover, closePopover, positionPopover } from "../animations/toolbarAnimations";

const METAL_KEYS = [
  "alkali-metal",
  "alkaline-earth-metal",
  "transition-metal",
  "post-transition-metal",
];
const NONMETAL_KEYS = ["metalloid", "nonmetal", "halogen", "noble-gas"];
const SERIES_KEYS = ["lanthanide", "actinide"];

export default function TableToolbar({
  categories,
  counts,
  total,
  activeCategory,
  onCategoryChange,
  heatKey,
  onHeatChange,
  showNames,
  onToggleNames,
  showMass,
  onToggleMass,
  showCategories,
  onToggleCategories,
  reduceMotion,
  onToggleReduceMotion,
}) {
  const [open, setOpen] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");

  const btnEls = useRef({ filter: null, color: null, more: null });
  const popEls = useRef({ filter: null, color: null, more: null });

  const filterItems = (keys) =>
    categories.filter((c) => keys.includes(c.key));

  const groups = [
    { title: "Metals", items: filterItems(METAL_KEYS) },
    { title: "Nonmetals", items: filterItems(NONMETAL_KEYS) },
    { title: "Series", items: filterItems(SERIES_KEYS) },
  ];

  const q = filterQuery.trim().toLowerCase();
  const searching = q.length > 0;
  const visibleGroups = searching
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length)
    : groups;

  const filterLabel = activeCategory
    ? categories.find((c) => c.key === activeCategory)?.label ?? "All Elements"
    : "All Elements";
  const heatLabel = heatKey ? getPropertyConfig(heatKey)?.label ?? "None" : "None";

  const closeMenu = useCallback((key) => {
    const pop = popEls.current[key];
    if (pop) {
      closePopover(pop, () => setOpen((o) => (o === key ? null : o)));
    } else {
      setOpen((o) => (o === key ? null : o));
    }
  }, []);

  const openMenu = useCallback(
    (key) => {
      if (open && open !== key) {
        const prev = popEls.current[open];
        if (prev) gsap.set(prev, { opacity: 0 });
      }
      setOpen(key);
    },
    [open]
  );

  const toggleMenu = useCallback(
    (key) => {
      if (open === key) closeMenu(key);
      else openMenu(key);
    },
    [open, closeMenu, openMenu]
  );

  useLayoutEffect(() => {
    if (!open) return;
    const btn = btnEls.current[open];
    const pop = popEls.current[open];
    if (btn && pop) openPopover(btn, pop, open === "more" ? "right" : "left");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const pop = popEls.current[open];
      const btn = btnEls.current[open];
      if ((pop && pop.contains(e.target)) || (btn && btn.contains(e.target))) return;
      closeMenu(open);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeMenu(open);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, closeMenu]);

  // Keep the popover glued to its trigger button — the popover is portaled
  // to document.body and positioned with fixed coordinates computed at open
  // time, so without this it stays put while the page (and the button)
  // scrolls out from under it.
  useEffect(() => {
    if (!open) return;
    const reposition = (e) => {
      const btn = btnEls.current[open];
      const pop = popEls.current[open];
      if (!btn || !pop) return;
      // Ignore scroll events bubbling up from the popover's own scrollable
      // body — only an ancestor of the trigger button scrolling should move
      // the popover; reacting to the popover's internal scroll fights the
      // user's own scroll gesture and makes it take several attempts.
      if (pop.contains(e.target)) return;
      positionPopover(btn, pop, open === "more" ? "right" : "left");
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const selectFilter = (key) => {
    onCategoryChange(key);
    setFilterQuery("");
    closeMenu("filter");
  };

  const selectHeat = (key) => {
    onHeatChange(key);
    closeMenu("color");
  };

  const moreItems = [
    { key: "names", label: "Show Element Names", checked: showNames, onToggle: onToggleNames },
    { key: "mass", label: "Show Atomic Mass", checked: showMass, onToggle: onToggleMass },
    { key: "categories", label: "Show Categories", checked: showCategories, onToggle: onToggleCategories },
    { key: "motion", label: "Reduce Motion", checked: reduceMotion, onToggle: onToggleReduceMotion },
  ];

  const colorItems = [
    { key: null, label: "None" },
    ...PROPERTIES.filter((p) => p.key !== "atomicMass").map((p) => ({
      key: p.key,
      label: p.label,
    })),
  ];

  const renderCatItem = (key, label, count) => {
    const active = activeCategory === key;
    const hasSwatch = key !== null;
    const [from, to] = hasSwatch ? FILTER_COLORS[key] || DEFAULT_COLOR : [null, null];
    return (
      <button
        key={key ?? "all"}
        type="button"
        className={`td-item${active ? " is-active" : ""}`}
        role="menuitemradio"
        aria-checked={active}
        onClick={() => selectFilter(key)}
      >
        {hasSwatch ? (
          <span
            className="td-swatch"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          />
        ) : (
          <span className="td-swatch td-swatch--all" />
        )}
        <span className="td-item__label">{label}</span>
        <span className="td-item__count">{count}</span>
      </button>
    );
  };

  return (
    <div className="table-controlbar">
      <div className="toolbar" role="toolbar" aria-label="Table controls">
        {/* ---- Filter ---- */}
        <div className="toolbar-btn-wrap">
          <button
            type="button"
            ref={(el) => {
              btnEls.current.filter = el;
            }}
            className={`toolbar-btn${open === "filter" ? " is-open" : ""}`}
            aria-haspopup="true"
            aria-expanded={open === "filter"}
            onClick={() => toggleMenu("filter")}
          >
            <FiFilter className="toolbar-btn__icon" />
            <span className="toolbar-btn__label">
              Filter: <strong>{filterLabel}</strong>
            </span>
            <FiChevronDown className="toolbar-btn__chevron" />
          </button>

          {open === "filter" &&
            createPortal(
              <div
                className="td-popover td-popover--filter"
                ref={(el) => {
                  popEls.current.filter = el;
                }}
                role="menu"
              >
                <div className="td-popover__head">Filter Elements</div>
                <div className="td-search">
                  <FiSearch className="td-search__icon" />
                  <input
                    className="td-search-input"
                    placeholder="Search categories…"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    role="searchbox"
                  />
                  {filterQuery.length > 0 && (
                    <button
                      type="button"
                      className="td-search__clear"
                      aria-label="Clear search"
                      onClick={() => setFilterQuery("")}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <div className="td-popover__body">
                  {!searching && renderCatItem(null, "All Elements", total)}
                  {visibleGroups.map((g) => (
                    <div className="td-group" key={g.title}>
                      <div className="td-group__title">{g.title}</div>
                      {g.items.map((c) => renderCatItem(c.key, c.label, counts[c.key] ?? 0))}
                    </div>
                  ))}
                  {visibleGroups.length === 0 && !searching && (
                    <div className="td-empty">No categories</div>
                  )}
                  {searching && visibleGroups.length === 0 && (
                    <div className="td-empty">No matches for “{filterQuery}”</div>
                  )}
                </div>
                {activeCategory !== null && (
                  <div className="td-popover__foot">
                    <button
                      type="button"
                      className="td-foot-btn"
                      onClick={() => selectFilter(null)}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>,
              document.body
            )}
        </div>

        {/* ---- Color by ---- */}
        <div className="toolbar-btn-wrap">
          <button
            type="button"
            ref={(el) => {
              btnEls.current.color = el;
            }}
            className={`toolbar-btn${open === "color" ? " is-open" : ""}`}
            aria-haspopup="true"
            aria-expanded={open === "color"}
            onClick={() => toggleMenu("color")}
          >
            <FiDroplet className="toolbar-btn__icon" />
            <span className="toolbar-btn__label">
              Color by: <strong>{heatLabel}</strong>
            </span>
            <FiChevronDown className="toolbar-btn__chevron" />
          </button>

          {open === "color" &&
            createPortal(
              <div
                className="td-popover td-popover--color"
                ref={(el) => {
                  popEls.current.color = el;
                }}
                role="menu"
              >
                <div className="td-popover__head">Color Elements By</div>
                <div className="td-popover__body td-popover__body--plain">
                  {colorItems.map((it) => {
                    const active = heatKey === it.key;
                    return (
                      <button
                        key={it.key ?? "category"}
                        type="button"
                        className={`td-item${active ? " is-active" : ""}`}
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => selectHeat(it.key)}
                      >
                        <FiCheck className="td-item__check" />
                        <span className="td-item__label">{it.label}</span>
                        {it.key && <span className="td-item__heat" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* ---- More ---- */}
        <div className="toolbar-btn-wrap">
          <button
            type="button"
            ref={(el) => {
              btnEls.current.more = el;
            }}
            className={`toolbar-btn${open === "more" ? " is-open" : ""}`}
            aria-haspopup="true"
            aria-expanded={open === "more"}
            onClick={() => toggleMenu("more")}
            title="More options"
          >
            <FiMoreHorizontal className="toolbar-btn__icon" />
            <span className="toolbar-btn__label">More</span>
            <FiChevronDown className="toolbar-btn__chevron" />
          </button>

          {open === "more" &&
            createPortal(
              <div
                className="td-popover td-popover--more"
                ref={(el) => {
                  popEls.current.more = el;
                }}
                role="menu"
              >
                <div className="td-popover__head">More</div>
                <div className="td-popover__body td-popover__body--plain">
                  {moreItems.map((it) => (
                    <button
                      key={it.key}
                      type="button"
                      className={`td-item td-item--toggle${it.checked ? " is-active" : ""}`}
                      role="menuitemcheckbox"
                      aria-checked={it.checked}
                      onClick={() => it.onToggle?.()}
                    >
                      <span className={`td-check${it.checked ? " is-checked" : ""}`}>
                        {it.checked && <FiCheck />}
                      </span>
                      <span className="td-item__label">{it.label}</span>
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}