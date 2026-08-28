import gsap from "gsap";
import { prefersReducedMotion } from "./usePrefersReducedMotion";

export function correctFeedback(targets, scoreRef) {
  if (!targets || !targets.length) return null;
  const reduced = prefersReducedMotion();
  const tl = gsap.timeline({ defaults: { ease: "back.out(2)" } });
  targets.forEach((t) => {
    tl.to(t, { scale: 1.08, duration: 0.22 }, 0);
  });
  tl.to(targets[0], { boxShadow: "0 0 0 3px rgba(74,222,128,0.9), 0 0 26px rgba(74,222,128,0.5)", duration: 0.25 }, 0.02);
  if (!reduced) {
    tl.fromTo(
      targets,
      { y: -4 },
      { y: 0, duration: 0.3, stagger: 0.04 },
      0.1
    );
  }
  if (scoreRef && scoreRef.current) {
    tl.fromTo(
      scoreRef.current,
      { scale: 1.35, color: "#4ade80" },
      { scale: 1, color: "", duration: 0.6, ease: "power2.out" },
      0.05
    );
  }
  tl.to(targets[0], { boxShadow: "0 0 0 0 rgba(0,0,0,0)", duration: 0.4, ease: "power2.inOut" }, "+=0.35");
  return tl;
}

export function wrongFeedback(targets) {
  if (!targets || !targets.length) return null;
  const reduced = prefersReducedMotion();
  const tl = gsap.timeline();
  if (reduced) return tl;
  targets.forEach((t) => {
    const x = 7;
    tl.to(t, { x, duration: 0.045 })
      .to(t, { x: -x, duration: 0.09 })
      .to(t, { x: x * 0.6, duration: 0.06 })
      .to(t, { x: 0, duration: 0.1, ease: "power2.out" });
  });
  return tl;
}

export function revealCorrect(target) {
  if (!target) return null;
  return gsap.to(target, {
    boxShadow: "0 0 0 3px rgba(74,222,128,0.95), 0 0 30px rgba(74,222,128,0.55)",
    scale: 1.06,
    duration: 0.35,
    ease: "back.out(1.8)",
  });
}

export function clearCorrect(target) {
  if (!target) return null;
  return gsap.to(target, {
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
    scale: 1,
    duration: 0.4,
    ease: "power2.out",
  });
}

export function questionTransition(root) {
  const reduced = prefersReducedMotion();
  const tl = gsap.timeline();
  if (reduced) return tl;
  tl.to(root, { opacity: 0, y: -16, duration: 0.18, ease: "power2.in" })
    .to(root, { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" });
  return tl;
}

export function shakeEl(card) {
  const reduced = prefersReducedMotion();
  if (reduced || !card) return null;
  const tl = gsap.timeline();
  [14, -11, 8, -5, 0].forEach((x) => {
    tl.to(card, { x, duration: 0.05 });
  });
  tl.to(card, { x: 0, duration: 0.12, ease: "power2.out" });
  return tl;
}

export function timerBar(bar, durationSeconds, onComplete) {
  if (!bar) return null;
  const reduced = prefersReducedMotion();
  if (reduced) {
    if (onComplete) gsap.delayedCall(durationSeconds, onComplete);
    return null;
  }
  const tl = gsap.timeline();
  tl.set(bar, { scaleX: 1, transformOrigin: "left center" }).to(bar, {
    scaleX: 0,
    duration: durationSeconds,
    ease: "none",
    onComplete,
  });
  return tl;
}

export function popScore(scoreEl) {
  if (!scoreEl || prefersReducedMotion()) return null;
  return gsap.fromTo(
    scoreEl,
    { scale: 1.4 },
    { scale: 1, duration: 0.55, ease: "back.out(2.6)" }
  );
}

export function entrance(items) {
  if (!items || prefersReducedMotion()) return null;
  return gsap.from(items, {
    opacity: 0,
    y: 18,
    duration: 0.45,
    stagger: 0.06,
    ease: "power3.out",
  });
}