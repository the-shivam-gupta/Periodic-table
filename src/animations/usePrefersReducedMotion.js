import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

let forcedReduced = false;

function matchQuery() {
  if (typeof window === "undefined") return null;
  try {
    return window.matchMedia(QUERY);
  } catch {
    return null;
  }
}

export function setForcedReducedMotion(value) {
  forcedReduced = !!value;
}

export function prefersReducedMotion() {
  if (forcedReduced) return true;
  const mq = matchQuery();
  return mq ? mq.matches : false;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const mq = matchQuery();
    if (!mq) return undefined;

    const update = () => setReduced(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  return reduced;
}