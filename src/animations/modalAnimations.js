import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

export function animateDetailIn(overlay, card, header, bodyTargets, atom) {
  const reduced = prefersReducedMotion();

  if (reduced) {
    gsap.set(overlay, { opacity: 1 });
    gsap.set(card, { opacity: 1, scale: 1, y: 0 });
    gsap.set([header, atom, ...bodyTargets], { opacity: 1, y: 0 });
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
    .fromTo(atom, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6 }, 0.36)
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