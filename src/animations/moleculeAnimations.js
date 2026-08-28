import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

// Self-drawing molecule animation:
// 1. Bonds draw themselves (stroke-dashoffset).
// 2. Atoms pop in.
// 3. Symbols fade in.
// 4. The molecule settles.
// 5. A very subtle idle bob.
export function drawMolecule(root, options = {}) {
  if (!root) return null;

  const reduced = prefersReducedMotion();
  const bonds = Array.from(root.querySelectorAll(".mol-bond__line") || []);
  const atoms = Array.from(root.querySelectorAll(".mol-atom") || []);
  const symbols = Array.from(root.querySelectorAll(".mol-symbol") || []);
  const stage = root.querySelector(".mol-stage");
  const group = root.querySelector(".mol-group");

  if (reduced) {
    gsap.set(bonds, { opacity: 1, strokeDashoffset: 0 });
    gsap.set([atoms, symbols, stage], { opacity: 1 });
    return gsap.timeline();
  }

  bonds.forEach((line) => {
    let len = 60;
    try {
      len = line.getTotalLength ? line.getTotalLength() : 60;
    } catch {
      len = 60;
    }
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
  });
  gsap.set(atoms, { scale: 0, opacity: 0, transformOrigin: "50% 50%" });
  gsap.set(symbols, { opacity: 0, y: 6 });
  gsap.set(stage, { y: 16, opacity: 0.4 });

  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  tl.to(bonds, {
    strokeDashoffset: 0,
    duration: 0.85,
    stagger: 0.08,
    ease: "power1.inOut",
  }, 0.1)
    .to(
      atoms,
      { scale: 1, opacity: 1, duration: 0.45, stagger: 0.05, ease: "back.out(2.2)" },
      0.55
    )
    .to(symbols, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 }, 0.8)
    .to(stage, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.35)
    .add(() => {
      if (options.loop !== false && group) {
        gsap.to(group, {
          y: -3,
          rotation: 0.5,
          transformOrigin: "50% 50%",
          duration: 3.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 0.6,
        });
      }
    }, "+=0.25");

  return tl;
}

export function animateMoleculeSwap(root) {
  if (!root) return null;
  const reduced = prefersReducedMotion();
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  if (reduced) return tl;
  tl.to(root, { opacity: 0, scale: 0.94, y: -8, duration: 0.16 })
    .add(() => {
      if (root._killIdle) root._killIdle();
    })
    .to(root, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.6)" });
  return tl;
}