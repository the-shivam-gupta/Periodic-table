import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

export const POPOVER_DUR = 0.28;
export const BOTTOM_SHEET_BP = 640;

function fitInViewport(left, top, pop, margin = 8) {
  const pw = pop.offsetWidth;
  const ph = pop.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  left = Math.max(margin, Math.min(left, vw - pw - margin));
  if (top + ph > vh - margin) top = Math.max(margin, vh - ph - margin);
  return { left, top };
}

export function positionPopover(anchor, pop, align = "left") {
  const r = anchor.getBoundingClientRect();
  const pw = pop.offsetWidth || 300;
  const ph = pop.offsetHeight || 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isSheet = vw <= BOTTOM_SHEET_BP;

  let left;
  let top;
  let origin;
  if (isSheet) {
    left = Math.round((vw - pw) / 2);
    top = vh - ph - 14;
    origin = "bottom center";
  } else {
    left = align === "right" ? r.right - pw : r.left;
    const clamped = fitInViewport(left, r.bottom + 8, pop);
    left = clamped.left;
    top = clamped.top;
    origin = align === "right" ? "top right" : "top left";
  }

  gsap.set(pop, { left, top, transformOrigin: origin });
  return { isSheet };
}

export function openPopover(anchor, pop, align = "left") {
  if (!pop) return;
  const reduced = prefersReducedMotion();
  const { isSheet } = positionPopover(anchor, pop, align);

  gsap.killTweensOf(pop);
  if (reduced) {
    gsap.set(pop, { opacity: 1, scale: 1 });
  } else {
    gsap.fromTo(
      pop,
      { opacity: 0, scale: isSheet ? 0.96 : 0.94, y: isSheet ? 16 : 0 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: POPOVER_DUR,
        ease: "power2.out",
        clearProps: "y",
      }
    );
  }

  const groups = pop.querySelectorAll(".td-group");
  if (groups.length && !reduced) {
    gsap.fromTo(
      groups,
      { opacity: 0, y: 6 },
      {
        opacity: 1,
        y: 0,
        duration: 0.22,
        ease: "power2.out",
        stagger: 0.03,
        clearProps: "y",
      }
    );
  }

  if (!reduced) {
    const search = pop.querySelector(".td-search-input");
    if (search) {
      window.setTimeout(() => {
        if (document.body.contains(search)) search.focus();
      }, POPOVER_DUR * 1000);
    }
  }
}

export function closePopover(pop, onComplete) {
  if (!pop) {
    onComplete?.();
    return;
  }
  const reduced = prefersReducedMotion();
  gsap.killTweensOf(pop);
  if (reduced) {
    gsap.set(pop, { opacity: 0 });
    onComplete?.();
    return;
  }
  gsap.to(pop, {
    opacity: 0,
    scale: 0.94,
    y: 0,
    duration: 0.16,
    ease: "power2.in",
    overwrite: true,
    onComplete,
  });
}