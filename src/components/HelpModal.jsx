import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { FiX } from "react-icons/fi";
import useScrollLock from "../hooks/useScrollLock";
import { animateDetailIn, animateDetailOut } from "../animations/modalAnimations";

const SECTIONS = [
  {
    title: "Reading a cell",
    body:
      "Every cell shows an element's atomic number (top-left), symbol (center), name (below the symbol) and atomic mass (top-right). The atomic number is the count of protons in the nucleus — it's what makes an element that element. Atomic mass is the average weight of one atom, in atomic mass units (u).",
  },
  {
    title: "Color by Category",
    body:
      "By default every cell is tinted by its category — alkali metal, noble gas, halogen and so on. Categories group elements that behave similarly chemically. Use the Filter control to highlight just one category at a time.",
  },
  {
    title: "Color by Property",
    body:
      "Switch \"Color by\" to a property like Electronegativity or Density to recolor the whole table on a gradient from low to high. Elements with no recorded value for that property are left neutral and transparent instead of being guessed at.",
  },
  {
    title: "The center showcase",
    body:
      "The empty space in the middle of the table holds a compact preview of whichever element you're hovering, or the one you last opened. It always mirrors the same field you're coloring by.",
  },
  {
    title: "List / Properties",
    body:
      "A sortable, filterable table of all 118 elements, plus a Property Explorer for learning what each property means and how it's distributed across the periodic table.",
  },
  {
    title: "Games",
    body:
      "Six short games test recall of symbols, names, numbers, groups and properties. Every answer — right or wrong — is followed by a quick explanation, so playing doubles as revision.",
  },
];

export default function HelpModal({ onClose }) {
  const rootRef = useRef(null);

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
    if (!root) return undefined;
    const ctx = gsap.context(() => {
      animateDetailIn(
        root,
        root.querySelector(".detail-card"),
        root.querySelector(".detail-header"),
        [...root.querySelectorAll(".detail-section")]
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="detail-overlay help-overlay" role="dialog" aria-modal="true" aria-label="Help and about">
      <div className="detail-card help-card">
        <button type="button" className="detail-close" onClick={close} aria-label="Close help">
          <span className="detail-close__glyph detail-close__cross" aria-hidden="true">×</span>
        </button>

        <header className="detail-header help-header">
          <p className="help-eyebrow">Help &amp; About</p>
          <h2 className="help-title">How this table works</h2>
          <p className="help-subtitle">
            A quick guide to reading the table, coloring by property, and using the games —
            the same 118-element dataset powers every view.
          </p>
        </header>

        <div className="detail-body help-body">
          {SECTIONS.map((s) => (
            <section className="detail-section help-section" key={s.title}>
              <h3 className="help-section__title">{s.title}</h3>
              <p className="help-section__body">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
