import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;

function applyLock() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${savedScrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
  }
  lockCount += 1;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const { style } = document.body;
    style.position = "";
    style.top = "";
    style.left = "";
    style.right = "";
    style.width = "";
    window.scrollTo(0, savedScrollY);
  }
}

// Locks page scroll while `active` is true. Reference-counted so overlapping
// locks (e.g. a popover open while the element modal is also open) don't
// clobber each other's restore.
//
// Uses the `position: fixed` + saved-offset technique rather than toggling
// `overflow: hidden` on <body>. That alone isn't enough here: <html> also
// carries its own permanent `overflow-y: scroll` (kept to reserve the
// scrollbar gutter and avoid a different layout-shift bug), and per the CSS
// overflow-propagation rules that stops <body>'s overflow from having any
// effect on the page's actual scroll container — <html> is still scrollable
// regardless of what <body> is set to. Taking <body> out of the layout flow
// entirely with `position: fixed` sidesteps that, and works reliably on
// mobile Safari where naive `overflow: hidden` locks are well known to leak
// touch-scroll anyway.
export default function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    applyLock();
    return releaseLock;
  }, [active]);
}
