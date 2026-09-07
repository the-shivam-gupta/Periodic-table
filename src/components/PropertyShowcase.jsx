import { memo, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";
import { formatSig } from "../data/propertyScale";

// PropertyShowcase renders the selected element as a compact, table-style
// tile with close annotation pointers. Atomic number and name are annotated
// on the left; atomic mass, symbol and the selected property are annotated
// on the right. Lines touch the tile directly (no dots, no gaps).
//
// Layout:
//   Atomic Number ── [ 17      35.45 ] ── Atomic Mass
//   Name         ── [       Cl       ] ── Symbol
//                    [     Chlorine   ]
//                    [     3.16       ] ── Electronegativity
const PropertyShowcase = memo(function PropertyShowcase({
  element,
  valueText,
  valueLabel,
  color,
  textColor,
  missing,
  featured,
}) {
  const rootRef = useRef(null);
  const valueRef = useRef(null);
  const propAnnRef = useRef(null);
  const annLineRefs = useRef([]);
  const prevValueRef = useRef(valueText);

  const massText =
    element && element.atomicMass != null
      ? formatSig(element.atomicMass, 5)
      : "";

  // Entrance on mount: fade/slide the whole compact show.
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const reduced = prefersReducedMotion();
    const d = reduced ? 0.01 : 0.4;
    gsap.fromTo(
      rootRef.current,
      { opacity: 0, scale: 0.97, y: 8 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: d,
        ease: "power2.out",
        overwrite: "auto",
      }
    );
  }, []);

  // Annotate connector lines growing in (width 0 → full) once on mount.
  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const d = reduced ? 0.01 : 0.45;
    annLineRefs.current.forEach((line) => {
      if (!line) return;
      gsap.set(line, { scaleX: 0 });
      gsap.to(line, {
        scaleX: 1,
        duration: d,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  }, []);

  // Element change: keep the tile completely still (no tilt/shift), just let
  // the color update. Value change: reflow the value and its right-side
  // property annotation with a subtle opacity fade only.
  useLayoutEffect(() => {
    if (!element) return;
    const reduced = prefersReducedMotion();
    const d = reduced ? 0.01 : 0.35;
    const valueChanged = prevValueRef.current !== valueText;

    if (valueChanged && valueRef.current) {
      gsap.fromTo(
        valueRef.current,
        { opacity: 0.3, y: 3 },
        { opacity: 1, y: 0, duration: d, ease: "power2.out", overwrite: "auto" }
      );
      if (propAnnRef.current) {
        gsap.fromTo(
          propAnnRef.current,
          { opacity: 0.3, y: 2 },
          { opacity: 1, y: 0, duration: d * 0.8, ease: "power2.out", overwrite: "auto" }
        );
      }
    }

    prevValueRef.current = valueText;
  }, [element, valueText]);

  if (!element) return null;

  // `color` is now a { from, to, angle } object (App.js builds it from the
  // theme-aware category/heat colors). The gradient is painted via the
  // --sc-from/--sc-to custom properties (registered & interpolatable) so a
  // theme switch crossfades the tile instead of snapping. --el-text is
  // ALWAYS set so the tile borders/labels stay right in both themes.
  const tileStyle = {
    ...(missing || !color
      ? {}
      : {
          "--sc-from": color.from,
          "--sc-to": color.to,
          background: `linear-gradient(${color.angle}deg, var(--sc-from), var(--sc-to))`,
        }),
    "--el-text": textColor || "var(--c-text-muted)",
  };

  return (
    <div
      className={`showcase${featured ? " is-featured" : ""}${
        missing ? " is-missing" : ""
      }`}
      ref={rootRef}
    >
      <div className="showcase__mid">
        {/* Left annotations: Atomic Number (top), Name (below) */}
        <div className="showcase__left">
          <div
            className="showcase-ann showcase-ann--left showcase-ann--num"
            aria-hidden="true"
          >
            <span className="showcase-ann__label">Atomic Number</span>
            <span
              className="showcase-ann__line"
              ref={(el) => (annLineRefs.current[0] = el)}
            />
          </div>
          <div
            className="showcase-ann showcase-ann--left showcase-ann--name"
            aria-hidden="true"
          >
            <span className="showcase-ann__label">Name</span>
            <span
              className="showcase-ann__line"
              ref={(el) => (annLineRefs.current[1] = el)}
            />
          </div>
        </div>

        {/* Center element tile */}
        <div className={`showcase__tile${missing ? " is-missing" : ""}`} style={tileStyle}>
          <span className="showcase__num">{element.number}</span>
          <span className="showcase__mass">{massText}</span>
          <span className="showcase__symbol">{element.symbol}</span>
          <span className="showcase__name">{element.name}</span>
          <span className="showcase__value" ref={valueRef}>
            {valueText}
          </span>
        </div>

        {/* Right annotations: Atomic Mass (top), Symbol, selected property */}
        <div className="showcase__right">
          <div
            className="showcase-ann showcase-ann--right showcase-ann--mass"
            aria-hidden="true"
          >
            <span
              className="showcase-ann__line"
              ref={(el) => (annLineRefs.current[2] = el)}
            />
            <span className="showcase-ann__label">Atomic Mass</span>
          </div>
          <div
            className="showcase-ann showcase-ann--right showcase-ann--sym"
            aria-hidden="true"
          >
            <span
              className="showcase-ann__line"
              ref={(el) => (annLineRefs.current[3] = el)}
            />
            <span className="showcase-ann__label">Symbol</span>
          </div>
          {!missing && (
            <div
              className="showcase-ann showcase-ann--right showcase-ann--prop"
              aria-hidden="true"
            >
              <span
                className="showcase-ann__line"
                ref={(el) => (annLineRefs.current[4] = el)}
              />
              <span className="showcase-ann__label" ref={propAnnRef}>
                {valueLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PropertyShowcase;
