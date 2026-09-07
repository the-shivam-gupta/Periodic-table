import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { FiMenu, FiX, FiHelpCircle, FiSun, FiMoon } from "react-icons/fi";
import useScrollLock from "../hooks/useScrollLock";
import { prefersReducedMotion } from "../animations/usePrefersReducedMotion";
import { useTheme } from "../theme/ThemeContext";

// Sticky site header: brand on the left, the primary navigation in the
// center, and the theme toggle + Help entry + hamburger (on narrow screens)
// on the right. Collapses to a hamburger drawer on narrow screens instead of
// overflowing or wrapping onto a second row.
export default function Header({ views, view, onViewChange, onOpenHelp }) {
  const { isDark, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const linkRefs = useRef({});
  const drawerRef = useRef(null);
  const scrimRef = useRef(null);

  useScrollLock(drawerOpen);

  useEffect(() => {
    setDrawerOpen(false);
  }, [view]);

  // Active-tab underline: one shared indicator that slides/resizes into
  // place under whichever link is active, instead of each link popping its
  // own underline in and out abruptly.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    const activeLink = linkRefs.current[view];
    if (!nav || !indicator || !activeLink) return undefined;

    const move = (animate) => {
      const navRect = nav.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      const x = linkRect.left - navRect.left + 14;
      const width = Math.max(0, linkRect.width - 28);
      if (animate && !prefersReducedMotion()) {
        gsap.to(indicator, { x, width, duration: 0.35, ease: "power3.out", overwrite: "auto" });
      } else {
        gsap.set(indicator, { x, width });
      }
    };

    // First paint after mount (or a view neither ref existed for yet)
    // snaps into place; every subsequent move slides.
    move(indicator.dataset.placed === "1");
    indicator.dataset.placed = "1";

    const onResize = () => move(false);
    window.addEventListener("resize", onResize);

    // On a fresh load, the nav is measured before the web fonts (Space
    // Grotesk/Inter, loaded via <link>) finish swapping in — the fallback
    // font's metrics give each link a slightly different width, so the
    // indicator's initial size/position is off until something else
    // happens to re-measure it. Snap it into the correct spot the instant
    // fonts actually finish loading, with no animation (it's a correction,
    // not a user-triggered move).
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) move(false);
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [view, views]);

  // Mobile drawer: fade + slide in, matching the rest of the app's modal/
  // popover entrances instead of popping in with no transition at all.
  useLayoutEffect(() => {
    if (!drawerOpen) return;
    const reduced = prefersReducedMotion();
    if (scrimRef.current) {
      gsap.fromTo(
        scrimRef.current,
        { opacity: 0 },
        { opacity: 1, duration: reduced ? 0.01 : 0.22, ease: "power2.out" }
      );
    }
    if (drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: reduced ? 0.01 : 0.28, ease: "power3.out" }
      );
    }
  }, [drawerOpen]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#top" onClick={(e) => e.preventDefault()}>
          <span className="site-header__brand-mark" aria-hidden="true">
            Pt
          </span>
          <span className="site-header__brand-text">
            Periodic<span>Table.</span>
          </span>
        </a>

        <nav className="site-header__nav" aria-label="Primary" ref={navRef}>
          {views.map((v) => (
            <button
              key={v.key}
              type="button"
              ref={(el) => {
                linkRefs.current[v.key] = el;
              }}
              className={`site-header__link${view === v.key ? " is-active" : ""}`}
              onClick={() => onViewChange(v.key)}
            >
              {v.shortLabel || v.label}
            </button>
          ))}
          <span className="site-header__nav-indicator" ref={indicatorRef} aria-hidden="true" />
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className={`theme-toggle${isDark ? " is-dark" : ""}`}
            aria-pressed={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            <span className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
              <FiSun />
            </span>
            <span className="theme-toggle__thumb" aria-hidden="true" />
            <span className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
              <FiMoon />
            </span>
          </button>

          <button type="button" className="site-header__icon-btn site-header__help" aria-label="Help & about" onClick={onOpenHelp}>
            <FiHelpCircle />
          </button>

          <button
            type="button"
            className="site-header__icon-btn site-header__menu-btn"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((o) => !o)}
          >
            {drawerOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="site-header__scrim" ref={scrimRef} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="site-header__drawer" ref={drawerRef} role="dialog" aria-label="Menu">
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                className={`site-header__drawer-link${view === v.key ? " is-active" : ""}`}
                onClick={() => onViewChange(v.key)}
              >
                {v.label}
              </button>
            ))}
            <button
              type="button"
              className="site-header__drawer-link"
              onClick={() => {
                setDrawerOpen(false);
                onOpenHelp();
              }}
            >
              Help &amp; About
            </button>
          </div>
        </>
      )}
    </header>
  );
}
