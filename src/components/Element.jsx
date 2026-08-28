import { memo, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { hoverEnter, hoverLeave } from "../animations/elementAnimations";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";
import { formatSig } from "../data/propertyScale";
import { categoryColors } from "../data/categories";

// Pulls the first color out of a "linear-gradient(160deg, C1, C2)" string
// (as produced by heatStyleFor) so the hover glow can match it.
function firstGradientColor(gradient) {
  const m = /linear-gradient\([^,]+,\s*([^,]+),/.exec(gradient || "");
  return m ? m[1].trim() : null;
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

  // The hover glow matches whatever color this cell is actually showing —
  // the active heat color when "Color by" is on, otherwise its own category
  // color — instead of one flat color shared by every element.
  const glowColor = useMemo(
    () => firstGradientColor(heat) || categoryColors(data.category)[0],
    [heat, data.category]
  );

  const handleEnter = () => {
    if (!canHoverRef.current) return;
    onHoverEnter(data.number, cardRef.current);
    hoverEnter({
      card: cardRef.current,
      number: numberRef.current,
      symbol: symbolRef.current,
      name: nameRef.current,
      badge: showCategories ? null : badgeRef.current,
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
      badge: showCategories ? null : badgeRef.current,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`element-cell ${color}${dimmed ? " is-dimmed" : ""}${
        missing ? " is-missing" : ""
      }`}
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