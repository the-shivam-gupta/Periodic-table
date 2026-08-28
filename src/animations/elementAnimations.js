import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

export const HOVER_ENTER_DUR = 0.28;
export const HOVER_LEAVE_DUR = 0.3;
export const HOVER_SCALE = 1.05;

// Parses a "#rgb"/"#rrggbb" hex or an "rgb(a)(...)" string into [r, g, b].
function toRgbTuple(color) {
  if (typeof color === "string" && color[0] === "#") {
    let h = color.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const num = parseInt(h, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  const m = /rgba?\(([^)]+)\)/.exec(color || "");
  if (m) {
    const [r, g, b] = m[1].split(",").map((s) => parseFloat(s));
    if ([r, g, b].every((n) => Number.isFinite(n))) return [r, g, b];
  }
  return [255, 255, 255];
}

function hoverShadow(glowColor) {
  const [r, g, b] = toRgbTuple(glowColor);
  return `0 14px 30px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.55), 0 0 20px rgba(${r}, ${g}, ${b}, 0.45)`;
}

export function hoverEnter({ card, number, symbol, name, badge, glowColor }) {
  if (!card) return null;
  const reduced = prefersReducedMotion();
  // When "Show Categories" is off, the badge is only ever revealed here on
  // hover (hoverLeave fades it back out) — it was previously never animated
  // in at all, so the category label never actually appeared on hover.
  if (badge) {
    gsap.to(badge, {
      opacity: 0.95,
      scale: 1,
      duration: HOVER_ENTER_DUR,
      ease: "power2.out",
      overwrite: "auto",
    });
  }
  return gsap.to(card, {
    scale: reduced ? 1.03 : HOVER_SCALE,
    zIndex: 6,
    boxShadow: hoverShadow(glowColor),
    duration: HOVER_ENTER_DUR,
    ease: "power2.out",
    overwrite: "auto",
  });
}

export function hoverLeave({ card, number, symbol, name, badge }) {
  if (!card) return;
  gsap.killTweensOf([card, number, symbol, name, badge].filter(Boolean));
  gsap.to(card, {
    scale: 1,
    zIndex: 0,
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
    rotateX: 0,
    rotateY: 0,
    transformPerspective: 600,
    duration: HOVER_LEAVE_DUR,
    ease: "power2.out",
  });
  gsap.to([number, symbol, name].filter(Boolean), {
    y: 0,
    opacity: 1,
    scale: 1,
    duration: HOVER_LEAVE_DUR,
    ease: "power2.out",
  });
  if (badge) {
    gsap.to(badge, { opacity: 0, scale: 0.5, duration: 0.18, ease: "power2.in" });
  }
}