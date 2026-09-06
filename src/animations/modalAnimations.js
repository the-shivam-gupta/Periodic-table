import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

export function animateDetailIn(overlay, card, header, bodyTargets) {
  const reduced = prefersReducedMotion();

  if (reduced) {
    gsap.set(overlay, { opacity: 1 });
    gsap.set(card, { opacity: 1, scale: 1, y: 0 });
    gsap.set([header, ...bodyTargets], { opacity: 1, y: 0 });
    return gsap.timeline();
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
    .fromTo(
      card,
      { opacity: 0, scale: 0.8, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "back.out(1.3)" },
      0.06
    )
    .fromTo(header, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, 0.28)
    .fromTo(
      bodyTargets,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 },
      0.42
    );
  return tl;
}

export function animateDetailOut(overlay, card) {
  return gsap
    .timeline({ defaults: { ease: "power3.in" } })
    .to(card, { opacity: 0, scale: 0.94, y: 24, duration: 0.22 })
    .to(overlay, { opacity: 0, duration: 0.28 }, 0.08);
}

// Matches the `tablet` breakpoint in _variables/mixins.scss (768px), where
// _detail-panel.scss's own @include media('tablet') turns .explorer-card
// from a right-pinned panel into a full-width bottom sheet — the slide
// direction below needs to agree with whichever shape is actually on
// screen, not always assume the desktop right-panel layout.
function isDrawerBottomSheet() {
  return typeof window !== "undefined" && window.innerWidth <= 768;
}

// Slide-in variant, used by the element detail drawer (a side panel, not a
// centered dialog) — animates x (from the right, desktop) or y (from the
// bottom, once _detail-panel.scss turns it into a bottom sheet) instead of
// scale, so it reads as a panel sliding into place rather than a dialog
// popping up.
export function animateDrawerIn(overlay, card, header, bodyTargets) {
  const reduced = prefersReducedMotion();
  const axis = isDrawerBottomSheet() ? "y" : "x";

  if (reduced) {
    gsap.set(overlay, { opacity: 1 });
    gsap.set(card, { opacity: 1, x: 0, y: 0 });
    gsap.set([header, ...bodyTargets], { opacity: 1, y: 0 });
    return gsap.timeline();
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
    .fromTo(card, { [axis]: "100%" }, { [axis]: 0, duration: 0.45, ease: "power3.out" }, 0)
    .fromTo(header, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 }, 0.2)
    .fromTo(
      bodyTargets,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 },
      0.3
    );
  return tl;
}

export function animateDrawerOut(overlay, card) {
  const reduced = prefersReducedMotion();
  const axis = isDrawerBottomSheet() ? "y" : "x";
  if (reduced) {
    return gsap.timeline().set(overlay, { opacity: 0 }).set(card, { [axis]: "100%" });
  }
  return gsap
    .timeline({ defaults: { ease: "power3.in" } })
    .to(card, { [axis]: "100%", duration: 0.32 })
    .to(overlay, { opacity: 0, duration: 0.24 }, 0.06);
}