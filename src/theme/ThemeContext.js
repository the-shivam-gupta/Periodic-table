import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Single source of truth for the app's light/dark theme. The theme is applied
// as a `data-theme` attribute on <html> (drives every `[data-theme="dark"]`
// rule in the SCSS) and persisted to localStorage. A tiny inline script in
// public/index.html applies the saved theme before React mounts so there's no
// flash of the wrong theme, and this provider just keeps it in sync.
const STORAGE_KEY = "pt-theme";
const LIGHT = "light";
const DARK = "dark";

// Kept in sync with the CSS token values (--c-page-bg) so the browser chrome
// matches the page while the theme is switched by the toggle.
const META_THEME_COLOR = { [LIGHT]: "#f3f5f8", [DARK]: "#0e1420" };

function readInitialTheme() {
  if (typeof document === "undefined") return LIGHT;
  return document.documentElement.getAttribute("data-theme") === DARK ? DARK : LIGHT;
}

const ThemeContext = createContext({
  theme: LIGHT,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", META_THEME_COLOR[theme]);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode / storage blocked — theme still works for this session */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === LIGHT ? DARK : LIGHT));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === DARK, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}