import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { FiSearch, FiArrowUp, FiArrowDown, FiChevronDown, FiCheck } from "react-icons/fi";
import { ELEMENTS } from "../data/elements";
import { CATEGORIES, categoryColors, FILTER_COLORS, DEFAULT_COLOR } from "../data/categories";
import { formatSig } from "../data/propertyScale";
import { entrance } from "../animations/gameAnimations";
import { openPopover, closePopover, positionPopover } from "../animations/toolbarAnimations";

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

export default function ListView({ onOpen }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("number");
  const [sortDir, setSortDir] = useState("asc");
  const [catKey, setCatKey] = useState(null);
  const [catOpen, setCatOpen] = useState(false);
  const rowsRef = useRef(null);
  const catBtnRef = useRef(null);
  const catPopRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ELEMENTS.filter((el) => {
      if (catKey) {
        const cat = CATEGORIES.find((c) => c.key === catKey);
        if (cat && !cat.match(el)) return false;
      }
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
  }, [query, sortKey, sortDir, catKey]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      entrance(rowsRef.current?.querySelectorAll(".list-row"));
    }, rowsRef);
    return () => ctx.revert();
  }, [filtered.length, catKey, query]);

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

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <div className="list-search">
          <FiSearch className="list-search__icon" />
          <input
            className="list-search__input"
            type="text"
            placeholder="Search name, symbol, or atomic number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search elements"
          />
        </div>

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
                    const [from, to] = c.key ? FILTER_COLORS[c.key] || DEFAULT_COLOR : [null, null];
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
            {filtered.map((el) => {
              const [from, to] = categoryColors(el.category);
              return (
                <tr key={el.number} className="list-row" onClick={() => onOpen(el)}>
                  <td>
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
                  <td>{el.symbol}</td>
                  <td>{el.number}</td>
                  <td>{displayValue(el, "atomicMass")}</td>
                  <td>{displayValue(el, "category")}</td>
                  <td>{displayValue(el, "phase")}</td>
                  <td>{displayValue(el, "density")}</td>
                  <td>{displayValue(el, "electronegativity")}</td>
                  <td>{displayValue(el, "melt")}</td>
                  <td>{displayValue(el, "boil")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="list-empty">No elements match your search.</p>
        )}
      </div>

      <p className="list-count">
        {filtered.length} of {ELEMENTS.length} elements shown
      </p>
    </div>
  );
}