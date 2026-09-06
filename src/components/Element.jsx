import { memo, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { hoverEnter, hoverLeave } from "../animations/elementAnimations";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";
import { formatSig } from "../data/propertyScale";
import { categoryAccent, categoryText, darkenRgbForText } from "../data/categories";

// Pulls the first rgb()/rgba() color out of a "linear-gradient(160deg, C1,
// C2)" string (as produced by heatStyleFor) so the hover glow and cell text
// can match it. Matches the whole rgb(...)/rgba(...) function call rather
// than splitting on commas — the color itself contains commas (e.g.
// "rgb(163, 230, 214)"), so a naive comma-split only ever captured a
// truncated fragment like "rgb(163".
function firstGradientColor(gradient) {
  const m = /rgba?\([^)]+\)/.exec(gradient || "");
  return m ? m[0] : null;
}

function Element({
  data,
  color,
  dimmed,
  heat,
  badgeText,
  valueText = null,
  missing = false,
  heatLabel = "",
  heatUnit = "",
  showNames = true,
  showCategories = false,
  showMass = true,
  onHoverEnter,
  onHoverLeave,
  onSelect,
  registerNode,
  unregisterNode,
}) {
  const cardRef = useRef(null);
  const numberRef = useRef(null);
  const symbolRef = useRef(null);
  const nameRef = useRef(null);
  const badgeRef = useRef(null);
  const heatRef = useRef(null);
  const prevHeatRef = useRef(null);
  const canHoverRef = useRef(false);

  const tip =
    valueText != null
      ? `${heatLabel || "Property"}: ${valueText}${heatUnit ? ` ${heatUnit}` : ""}`
      : data.name;

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      canHoverRef.current = window.matchMedia("(hover: hover)").matches;
    }

    const node = cardRef.current;
    if (node) registerNode(data.number, node);

    return () => {
      unregisterNode(data.number);
      if (node) {
        gsap.killTweensOf(node);
        node.style.transform = "";
      }
    };
  }, [data.number, registerNode, unregisterNode]);

  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    gsap.to(node, {
      opacity: dimmed ? 0.3 : 1,
      scale: 1,
      duration: 0.4,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  }, [dimmed]);

  useLayoutEffect(() => {
    const node = heatRef.current;
    if (!node) return;
    const prev = prevHeatRef.current;
    if (heat === prev) return;
    prevHeatRef.current = heat;
    const reduced = prefersReducedMotion();
    const duration = reduced ? 0.01 : 0.5;
    if (heat && prev) {
      node.style.background = heat;
      gsap.fromTo(
        node,
        { opacity: 0.35 },
        { opacity: 1, duration, ease: "power2.out", overwrite: "auto" }
      );
    } else {
      node.style.background = heat || "";
      gsap.to(node, {
        opacity: heat ? 1 : 0,
        duration,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  }, [heat]);

  // The hover glow matches whatever this cell is actually showing — the
  // active heat color when "Color by" is on, otherwise a saturated "ink"
  // version of its category color (the pastel fill itself is too pale to
  // make a visible glow ring) — instead of one flat color shared by every
  // element.
  const glowColor = useMemo(
    () => firstGradientColor(heat) || categoryAccent(data.category),
    [heat, data.category]
  );

  // The category badge only reveals itself on hover as a little bonus hint
  // when it isn't already persistently shown — but that hint shares the same
  // bottom-of-cell slot as a "Color by" property's value, so it must stay
  // suppressed whenever this cell is actually showing one (regardless of the
  // separate "Show Categories" toggle), or the two render on top of each
  // other on hover.
  const suppressBadge = showCategories || valueText != null;

  const handleEnter = () => {
    if (!canHoverRef.current) return;
    onHoverEnter(data.number, cardRef.current);
    hoverEnter({
      card: cardRef.current,
      number: numberRef.current,
      symbol: symbolRef.current,
      name: nameRef.current,
      badge: suppressBadge ? null : badgeRef.current,
      glowColor,
    });
  };

  const handleLeave = () => {
    if (!canHoverRef.current) return;
    onHoverLeave(data.number);
    hoverLeave({
      card: cardRef.current,
      number: numberRef.current,
      symbol: symbolRef.current,
      name: nameRef.current,
      badge: suppressBadge ? null : badgeRef.current,
    });
  };

  // Cell text is tinted a dark shade of whatever color the cell is actually
  // showing — the category's own hue by default, or a dark shade of the
  // exact point on the "Color by" gradient once a property is active — so
  // text never falls back to flat black just because a property replaced
  // the category color.
  const textColor = missing
    ? null
    : heat
      ? darkenRgbForText(firstGradientColor(heat))
      : categoryText(data.category);

  return (
    <div
      ref={cardRef}
      className={`element-cell ${color}${dimmed ? " is-dimmed" : ""}${
        missing ? " is-missing" : ""
      }`}
      style={textColor ? { "--el-text": textColor } : undefined}
      title={tip}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => onSelect(data, cardRef.current)}
    >
      <span className="el-heat" ref={heatRef} aria-hidden="true" />
      <span className="el-number" ref={numberRef}>
        {data.number}
      </span>
      <span className="el-mass">
        {showMass && data.atomicMass != null ? formatSig(data.atomicMass, 5) : ""}
      </span>
      <span className="el-symbol" ref={symbolRef}>
        {data.symbol}
      </span>
      <span className={`el-name${showNames ? "" : " is-hidden"}`} ref={nameRef}>
        {data.name}
      </span>
      {valueText != null && <span className="el-value">{valueText}</span>}
      <span className={`el-badge${showCategories ? " is-shown" : ""}`} ref={badgeRef}>
        {badgeText || data.category}
      </span>
    </div>
  );
}

export default memo(Element);