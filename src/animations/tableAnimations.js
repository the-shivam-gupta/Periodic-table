import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

export function playPageEntrance(scope) {
  const q = gsap.utils.selector(scope);
  const reduced = prefersReducedMotion();

  const heroTargets = q(".hero__inner > *");
  const axisTargets = q(".group-num, .period-num, .lan-label, .lan-caption");
  const rows = q(".table-panel .table-row");
  const panels = q(".table-panel");

  // Safety: force every entrance target to its final visible state. Guards
  // against an interrupted entrance tween (e.g. a reload lifecycle hiccup)
  // leaving the table panels/cells stuck at opacity 0 while the separate
  // .table-center showcase remains visible.
  const forceVisible = () => {
    gsap.set(heroTargets, { opacity: 1, y: 0 });
    gsap.set(axisTargets, { opacity: 1 });
    gsap.set(panels, { opacity: 1, y: 0 });
    rows.forEach((row) =>
      gsap.set(row.querySelectorAll(".element-cell"), {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
      })
    );
  };

  try {
    if (reduced) {
      forceVisible();
      return;
    }

    gsap.from(heroTargets, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.09,
      delay: 0.1,
    });

    gsap.from(panels, { opacity: 0, y: 26, duration: 0.55, ease: "power2.out", delay: 0.5 });

    gsap.from(axisTargets, {
      opacity: 0,
      y: -8,
      duration: 0.4,
      ease: "power2.out",
      stagger: 0.012,
      delay: 0.62,
    });

    rows.forEach((row, i) => {
      gsap.from(row.querySelectorAll(".element-cell"), {
        opacity: 0,
        y: 34,
        scale: 0.72,
        rotation: i % 2 === 0 ? 4 : -4,
        duration: 0.5,
        ease: "back.out(1.7)",
        stagger: 0.02,
        delay: 0.58 + i * 0.07,
      });
    });

    // After the longest entrance finishes, force an explicit visible state so
    // the table can never remain blank.
    gsap.delayedCall(1.7, forceVisible);
  } catch {
    forceVisible();
  }
}

export function dimOthers(registry, keepNumber, target = 0.34, duration = 0.3, baseFor) {
  registry.forEach((node, num) => {
    if (num === keepNumber || !node) return;
    const base = baseFor ? baseFor(num) : 1;
    gsap.to(node, {
      opacity: Math.min(base, target),
      scale: 1,
      duration,
      ease: "power2.out",
      overwrite: "auto",
    });
  });
}

export function restoreAll(registry, baseFor, duration = 0.35) {
  registry.forEach((node, num) => {
    if (!node) return;
    gsap.to(node, {
      opacity: baseFor ? baseFor(num) : 1,
      scale: 1,
      duration,
      ease: "power2.out",
      overwrite: "auto",
    });
  });
}

export function pulseNodes(numbers, getNode, intensity = 0.45) {
  numbers.forEach((num) => {
    const node = getNode(num);
    if (!node) return;
    gsap.to(node, {
      boxShadow: `0 0 0 2px rgba(255,255,255,${intensity}), 0 0 20px rgba(255,255,255,${
        intensity * 0.5
      })`,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  });
}

export function clearPulse(numbers, getNode) {
  numbers.forEach((num) => {
    const node = getNode(num);
    if (!node) return;
    gsap.to(node, {
      boxShadow: "0 0 0 0 rgba(0,0,0,0)",
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });
  });
}

export function flashNode(node) {
  if (!node) return null;
  const tl = gsap.timeline();
  tl.to(node, {
    boxShadow: "0 0 0 3px rgba(255,255,255,0.95), 0 0 34px rgba(255,255,255,0.6)",
    scale: 1.22,
    duration: 0.4,
    ease: "back.out(2)",
  }).to(node, {
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
    scale: 1,
    duration: 0.5,
    ease: "power2.out",
  });
  return tl;
}