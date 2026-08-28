import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

export function animateAtom(rings, center) {
  if (prefersReducedMotion()) return null;
  rings.forEach((ring, i) => {
    if (!ring) return;
    gsap.to(ring, {
      rotation: 360,
      svgOrigin: `${center} ${center}`,
      duration: 5 + i * 2.4,
      ease: "none",
      repeat: -1,
    });
  });
  return true;
}