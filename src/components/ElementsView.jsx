import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import {
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiChevronDown,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { ELEMENTS } from "../data/elements";
import { CATEGORIES, themedCategoryColors } from "../data/categories";
import { useTheme } from "../theme/ThemeContext";
import { formatSig } from "../data/propertyScale";
import { entrance } from "../animations/gameAnimations";
import { openPopover, closePopover, positionPopover } from "../animations/toolbarAnimations";
import useScrollLock from "../hooks/useScrollLock";
import FilterDropdown from "./FilterDropdown";

const COLUMNS = [
  { key: "name", label: "Element", sortable: true },
  { key: "symbol", label: "Symbol", sortable: true },
  { key: "number", label: "Atomic #", sortable: true },
  { key: "atomicMass", label: "Atomic Mass", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "phase", label: "Phase", sortable: true },
  { key: "density", label: "Density", sortable: true },
  { key: "electronegativity", label: "Electronegativity", sortable: true },
  { key: "melt", label: "Melting Point", sortable: true },
  { key: "boil", label: "Boiling Point", sortable: true },
];

const accessValue = (el, key) => {
  if (key === "category") return el.category || "";
  if (key === "phase") return el.phase || "";
  if (key === "symbol") return el.symbol || "";
  const v = el[key];
  return v === null || v === undefined ? "" : v;
};

const displayValue = (el, key) => {
  if (key === "name") return el.name;
  if (key === "category") return el.category;
  if (key === "phase") return el.phase;
  const v = el[key];
  if (v === null || v === undefined) return "N/A";
  return formatSig(v, 5);
};

const PAGE_SIZE_OPTIONS = [
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: ELEMENTS.length, label: "All" },
];
const PAGE_SIZES = PAGE_SIZE_OPTIONS.map((o) => o.value);

const PHASES = Array.from(new Set(ELEMENTS.map((e) => e.phase).filter(Boolean))).sort();
const GROUPS = Array.from(new Set(ELEMENTS.map((e) => e.group).filter((g) => g != null))).sort(
  (a, b) => a - b
);
const PERIODS = Array.from(new Set(ELEMENTS.map((e) => e.period).filter((p) => p != null))).sort(
  (a, b) => a - b
);

// Element List / Explorer — a sortable, filterable, paginated table of all
// 118 elements. The "Properties" nav item has its own dedicated view
// (PropertyExplorer) for learning about and visualizing one property at a
// time; this view is purely about browsing and finding elements.
export default function ElementsView({ onOpen }) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("number");
  const [sortDir, setSortDir] = useState("asc");
  const [catKey, setCatKey] = useState(null);
  const [stateKey, setStateKey] = useState("");
  const [groupKey, setGroupKey] = useState("");
  const [periodKey, setPeriodKey] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const rowsRef = useRef(null);
  const catBtnRef = useRef(null);
  const catPopRef = useRef(null);
  const pageSizeBtnRef = useRef(null);
  const pageSizePopRef = useRef(null);

  // Lock background scroll while either popover is open. Both are
  // `position: fixed`, positioned once at open time — letting the page
  // scroll behind them (especially on mobile, where the browser's own
  // address-bar show/hide during a scroll also changes viewport height
  // mid-gesture) makes them visibly drift/jump instead of staying glued to
  // their trigger button.
  useScrollLock(catOpen || pageSizeOpen);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ELEMENTS.filter((el) => {
      if (catKey) {
        const cat = CATEGORIES.find((c) => c.key === catKey);
        if (cat && !cat.match(el)) return false;
      }
      if (stateKey && el.phase !== stateKey) return false;
      if (groupKey && String(el.group) !== groupKey) return false;
      if (periodKey && String(el.period) !== periodKey) return false;
      if (!q) return true;
      return (
        el.name.toLowerCase().includes(q) ||
        String(el.symbol).toLowerCase().startsWith(q) ||
        String(el.number).startsWith(q)
      );
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = accessValue(a, sortKey);
      const bv = accessValue(b, sortKey);
      if (av === "" || av === null) return 1;
      if (bv === "" || bv === null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [query, sortKey, sortDir, catKey, stateKey, groupKey, periodKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Filtering/searching or changing page size invalidates the current page —
  // jump back to page 1 rather than risk landing on a now-empty page.
  useEffect(() => {
    setPage(1);
  }, [query, catKey, stateKey, groupKey, periodKey, pageSize]);

  // Sorting can also leave the page out of range (e.g. fewer results after a
  // filter change lands `page` past the new last page) — clamp instead.
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageStart = (page - 1) * pageSize;
  const paginated = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize]
  );

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      entrance(rowsRef.current?.querySelectorAll(".list-row"));
    }, rowsRef);
    return () => ctx.revert();
  }, [paginated]);

  const goToPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const closeCatMenu = () => {
    if (catPopRef.current) {
      closePopover(catPopRef.current, () => setCatOpen(false));
    } else {
      setCatOpen(false);
    }
  };

  const selectCat = (key) => {
    setCatKey(key);
    closeCatMenu();
  };

  useLayoutEffect(() => {
    if (!catOpen) return;
    if (catBtnRef.current && catPopRef.current) {
      openPopover(catBtnRef.current, catPopRef.current, "left");
    }
  }, [catOpen]);

  useEffect(() => {
    if (!catOpen) return;
    const onDown = (e) => {
      const pop = catPopRef.current;
      const btn = catBtnRef.current;
      if ((pop && pop.contains(e.target)) || (btn && btn.contains(e.target))) return;
      closeCatMenu();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeCatMenu();
      }
    };
    const reposition = (e) => {
      const btn = catBtnRef.current;
      const pop = catPopRef.current;
      if (!btn || !pop) return;
      // Ignore scroll events bubbling up from the popover's own scrollable
      // body — only reposition for an ancestor of the button scrolling.
      if (pop.contains(e.target)) return;
      positionPopover(btn, pop, "left");
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catOpen]);

  const activeCatLabel = catKey
    ? CATEGORIES.find((c) => c.key === catKey)?.label ?? "All categories"
    : "All categories";

  // Rows-per-page dropdown — same custom popover as the category filter
  // (not a native <select>, whose popup can't be themed to match the app).
  const closePageSizeMenu = () => {
    if (pageSizePopRef.current) {
      closePopover(pageSizePopRef.current, () => setPageSizeOpen(false));
    } else {
      setPageSizeOpen(false);
    }
  };

  const selectPageSize = (size) => {
    setPageSize(size);
    closePageSizeMenu();
  };

  useLayoutEffect(() => {
    if (!pageSizeOpen) return;
    if (pageSizeBtnRef.current && pageSizePopRef.current) {
      openPopover(pageSizeBtnRef.current, pageSizePopRef.current, "right");
    }
  }, [pageSizeOpen]);

  useEffect(() => {
    if (!pageSizeOpen) return;
    const onDown = (e) => {
      const pop = pageSizePopRef.current;
      const btn = pageSizeBtnRef.current;
      if ((pop && pop.contains(e.target)) || (btn && btn.contains(e.target))) return;
      closePageSizeMenu();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePageSizeMenu();
      }
    };
    const reposition = (e) => {
      const btn = pageSizeBtnRef.current;
      const pop = pageSizePopRef.current;
      if (!btn || !pop) return;
      if (pop.contains(e.target)) return;
      positionPopover(btn, pop, "right");
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSizeOpen]);

  const activePageSizeLabel =
    PAGE_SIZE_OPTIONS.find((o) => o.value === pageSize)?.label ?? String(pageSize);

  return (
    <div className="list-view">
      {/* One bordered "Filter" toolbar (icon label + text + category/state/
          group/period selects), styled as a table control rather than a
          second copy of the page's global jump-to-element search — it
          narrows the rows below, it doesn't navigate anywhere. */}
      <div className="list-toolbar">
        <span className="list-toolbar__label">
          <FiFilter aria-hidden="true" />
          Filter
        </span>

        <div className="list-search">
          <input
            className="list-search__input"
            type="text"
            placeholder="By name, symbol, or atomic number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter elements shown in the table below"
          />
        </div>

        <span className="list-toolbar__divider" aria-hidden="true" />

        <div className="list-cat-select-wrap">
          <button
            type="button"
            ref={catBtnRef}
            className={`list-cat-select${catOpen ? " is-open" : ""}`}
            aria-haspopup="true"
            aria-expanded={catOpen}
            aria-label="Filter by category"
            onClick={() => setCatOpen((o) => !o)}
          >
            <span className="list-cat-select__label">{activeCatLabel}</span>
            <FiChevronDown className="list-cat-select__chevron" aria-hidden="true" />
          </button>

          {catOpen &&
            createPortal(
              <div className="td-popover td-popover--list-cat" ref={catPopRef} role="menu">
                <div className="td-popover__head">Filter by Category</div>
                <div className="td-popover__body">
                  {[{ key: null, label: "All categories" }, ...CATEGORIES].map((c) => {
                    const active = catKey === c.key;
                    const [from, to] = c.key ? themedCategoryColors(c.key.replace(/-/g, " "), theme) : [null, null];
                    return (
                      <button
                        key={c.key ?? "all"}
                        type="button"
                        className={`td-item${active ? " is-active" : ""}`}
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => selectCat(c.key)}
                      >
                        {c.key ? (
                          <span
                            className="td-swatch"
                            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                          />
                        ) : (
                          <span className="td-swatch td-swatch--all" />
                        )}
                        <span className="td-item__label">{c.label}</span>
                        <FiCheck className="td-item__check" />
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
        </div>

        <FilterDropdown
          label="State"
          value={stateKey}
          onChange={setStateKey}
          options={[{ value: "", label: "All states" }, ...PHASES.map((p) => ({ value: p, label: p }))]}
        />

        <FilterDropdown
          label="Group"
          value={groupKey}
          onChange={setGroupKey}
          options={[{ value: "", label: "All groups" }, ...GROUPS.map((g) => ({ value: String(g), label: String(g) }))]}
        />

        <FilterDropdown
          label="Period"
          value={periodKey}
          onChange={setPeriodKey}
          options={[{ value: "", label: "All periods" }, ...PERIODS.map((p) => ({ value: String(p), label: String(p) }))]}
          align="right"
        />
      </div>

      <div className="list-scroll">
        <table className="list-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>
                  {col.sortable ? (
                    <button
                      type="button"
                      className={`list-head${sortKey === col.key ? " is-sorted" : ""}`}
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key &&
                        (sortDir === "asc" ? <FiArrowUp /> : <FiArrowDown />)}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={rowsRef}>
            {paginated.map((el) => {
              const [from, to] = themedCategoryColors(el.category, theme);
              return (
                <tr key={el.number} className="list-row" onClick={() => onOpen(el)}>
                  <td className="list-cell--name">
                    <span className="list-name-cell">
                      <span
                        className="list-swatch"
                        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                      >
                        {el.symbol}
                      </span>
                      {el.name}
                    </span>
                  </td>
                  <td data-label="Symbol">{el.symbol}</td>
                  <td data-label="Atomic #">{el.number}</td>
                  <td data-label="Atomic Mass">{displayValue(el, "atomicMass")}</td>
                  <td data-label="Category">{displayValue(el, "category")}</td>
                  <td data-label="Phase">{displayValue(el, "phase")}</td>
                  <td data-label="Density">{displayValue(el, "density")}</td>
                  <td data-label="Electronegativity">{displayValue(el, "electronegativity")}</td>
                  <td data-label="Melting Point">{displayValue(el, "melt")}</td>
                  <td data-label="Boiling Point">{displayValue(el, "boil")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="list-empty">No elements match your search.</p>
        )}
      </div>

      <div className="list-footer">
        <p className="list-count">
          {filtered.length === 0
            ? "0 elements"
            : `Showing ${pageStart + 1}–${Math.min(pageStart + pageSize, filtered.length)} of ${filtered.length} elements`}
        </p>

        {totalPages > 1 && (
          <nav className="list-pagination" aria-label="Table pagination">
            <button
              type="button"
              className="list-page-btn"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <FiChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`list-page-num${p === page ? " is-active" : ""}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="list-page-btn"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <FiChevronRight />
            </button>
          </nav>
        )}

        <div className="list-page-size">
          <span className="list-page-size__label">Rows</span>
          <button
            type="button"
            ref={pageSizeBtnRef}
            className={`list-page-size__btn${pageSizeOpen ? " is-open" : ""}`}
            aria-haspopup="true"
            aria-expanded={pageSizeOpen}
            aria-label="Rows per page"
            onClick={() => setPageSizeOpen((o) => !o)}
          >
            {activePageSizeLabel}
            <FiChevronDown aria-hidden="true" />
          </button>

          {pageSizeOpen &&
            createPortal(
              <div className="td-popover td-popover--page-size" ref={pageSizePopRef} role="menu">
                <div className="td-popover__body td-popover__body--plain">
                  {PAGE_SIZE_OPTIONS.map((o) => {
                    const active = pageSize === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        className={`td-item${active ? " is-active" : ""}`}
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => selectPageSize(o.value)}
                      >
                        <span className="td-item__label">{o.label}</span>
                        <FiCheck className="td-item__check" />
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}
