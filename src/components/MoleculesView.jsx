import { useEffect, useMemo, useState } from "react";
import { FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  MOLECULES,
  MOLECULE_CATEGORIES,
  formulaPlain,
  moleculeElementSymbols,
} from "../data/molecules";
import MoleculeVisualization from "./MoleculeVisualization";

const PAGE_SIZE = 12;
const FILTERS = ["All", ...MOLECULE_CATEGORIES];

// Molecules — a gallery of the same small structural diagrams used inside
// an element's "Compounds" tab, browsable on their own as a dedicated view.
//
// With 60+ entries, rendering the whole dataset at once was both a real DOM/
// SVG workload (every card's MoleculeVisualization mounts its own <svg>,
// gradients, and a gsap draw-in timeline) and visually overwhelming, so this
// view now searches + category-filters + paginates *before* rendering
// anything: `paginated` below is the only array ever mapped into JSX, so a
// molecule that isn't on the current page is never mounted — no
// CSS-hidden-but-present cards, no off-page MoleculeVisualization instances.
export default function MoleculesView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOLECULES.filter((m) => {
      if (category !== "All" && m.category !== category) return false;
      if (!q) return true;
      const nameMatch = m.name.toLowerCase().includes(q);
      const formulaMatch = formulaPlain(m.formula).toLowerCase().includes(q);
      const symbolMatch = moleculeElementSymbols(m).some((sym) =>
        sym.toLowerCase().startsWith(q)
      );
      return nameMatch || formulaMatch || symbolMatch;
    });
  }, [query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // A new search or category invalidates the current page — jump back to
  // page 1 rather than risk landing on a now-empty (or now out-of-range) page.
  useEffect(() => {
    setPage(1);
  }, [query, category]);

  // Belt-and-suspenders: also clamp if `totalPages` itself shrinks for any
  // other reason while already past it.
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const paginated = useMemo(
    () => filtered.slice(pageStart, pageStart + PAGE_SIZE),
    [filtered, pageStart]
  );

  const goToPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="molecules-view">
      <div className="molecules-view__head">
        <p className="molecules-view__eyebrow">Molecules</p>
        <h2 className="molecules-view__title">Common Molecules</h2>
        <p className="molecules-view__subtitle">
          Simple structural drawings of {MOLECULES.length} molecules built from the same
          118-element dataset — atom colors match each element's own category.
        </p>
      </div>

      {/* Same bordered "Filter" toolbar treatment as the Elements list view's
          .list-toolbar — a rectangular strip housing a "Filter" label and a
          seamless (borderless, transparent) text input — rather than this
          view's own separate pill-shaped search box. */}
      <div className="molecules-toolbar">
        <span className="molecules-toolbar__label">
          <FiFilter aria-hidden="true" />
          Filter
        </span>

        <div className="molecules-search">
          <input
            className="molecules-search__input"
            type="text"
            placeholder="By name, formula, or element…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search molecules by name, formula, or element"
          />
        </div>

        <div className="molecules-filters" role="group" aria-label="Filter by category">
          {FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              className={`molecules-filter-chip${category === c ? " is-active" : ""}`}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="molecules-count">
        {filtered.length === 0
          ? "No molecules found."
          : `Showing ${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filtered.length)} of ${filtered.length} molecules`}
      </p>

      {filtered.length === 0 ? (
        <p className="molecules-empty">No molecules found. Try a different search or category.</p>
      ) : (
        <div className="molecules-grid">
          {paginated.map((m) => (
            <div className="molecule-card" key={m.key}>
              <MoleculeVisualization molecule={m} />
              {m.tagline && <p className="molecule-card__tagline">{m.tagline}</p>}
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && totalPages > 1 && (
        <nav className="molecules-pagination" aria-label="Molecule gallery pagination">
          <button
            type="button"
            className="molecules-page-btn"
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
              className={`molecules-page-num${p === page ? " is-active" : ""}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => goToPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            className="molecules-page-btn"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <FiChevronRight />
          </button>
        </nav>
      )}
    </div>
  );
}
