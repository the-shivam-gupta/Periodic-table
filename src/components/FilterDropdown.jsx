import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { openPopover, closePopover, positionPopover } from "../animations/toolbarAnimations";
import useScrollLock from "../hooks/useScrollLock";

// A themed dropdown filter — same trigger/popover treatment as the Category
// filter (list-cat-select + td-popover), just generalized to any flat list
// of {value, label} options. Used for State / Group / Period so every filter
// in the toolbar looks and behaves the same way instead of some being native
// <select> elements (unthemeable, and visually inconsistent with the rest).
export default function FilterDropdown({ label, value, options, onChange, align = "left" }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useScrollLock(open);

  const close = () => {
    if (popRef.current) closePopover(popRef.current, () => setOpen(false));
    else setOpen(false);
  };

  const select = (v) => {
    onChange(v);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    if (btnRef.current && popRef.current) openPopover(btnRef.current, popRef.current, align);
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const pop = popRef.current;
      const btn = btnRef.current;
      if ((pop && pop.contains(e.target)) || (btn && btn.contains(e.target))) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const reposition = (e) => {
      const btn = btnRef.current;
      const pop = popRef.current;
      if (!btn || !pop) return;
      if (pop.contains(e.target)) return;
      positionPopover(btn, pop, align);
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
  }, [open]);

  const activeLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? "";

  return (
    <div className="list-cat-select-wrap">
      <button
        type="button"
        ref={btnRef}
        className={`list-cat-select${open ? " is-open" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="list-cat-select__label">
          <span className="list-cat-select__prefix">{label}</span> {activeLabel}
        </span>
        <FiChevronDown className="list-cat-select__chevron" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div className="td-popover td-popover--list-cat" ref={popRef} role="menu">
            <div className="td-popover__head">{label}</div>
            <div className="td-popover__body">
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value || "all"}
                    type="button"
                    className={`td-item${active ? " is-active" : ""}`}
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => select(o.value)}
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
  );
}
