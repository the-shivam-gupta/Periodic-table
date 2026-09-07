import { useTheme } from "../theme/ThemeContext";
import {
  categoryAccent,
  categoryAccentDark,
  themedCategoryColors,
  themedCategoryText,
  darkenRgbForText,
  lightenRgbForText,
  titleCategory,
} from "../data/categories";
import { formatSig } from "../data/propertyScale";

// Pulls the first rgb()/rgba() color out of a gradient string — matches the
// whole function call rather than splitting on commas, since the color
// itself contains commas (see Element.jsx for the bug that naive
// comma-splitting caused).
function firstColor(gradient) {
  const m = /rgba?\([^)]+\)/.exec(gradient || "");
  return m ? m[0] : null;
}

const PreviewCard = ({ element, className, innerRef, background, glowColor, missing }) => {
  const { theme, isDark } = useTheme();
  if (!element) return null;

  // Match whatever color this element is actually showing on the table —
  // the active "Color by" heat color when one is selected, otherwise its
  // plain category gradient (theme-aware). When the element has no value for
  // the active property, match the grid cell's own "missing" treatment
  // (transparent, outlined) instead of falling back to a color.
  const [catFrom, catTo] = themedCategoryColors(element.category, theme);
  const backgroundImage = background || `linear-gradient(160deg, ${catFrom}, ${catTo})`;
  // The glow ring follows the same source as the fill — the active heat
  // color when one's selected, otherwise a saturated "ink" version of the
  // category color (the pastel fill itself is too pale for a visible glow).
  // In dark mode both become their light tints so the ring reads on the
  // dark page.
  const glow = glowColor
    ? isDark
      ? lightenRgbForText(glowColor) || glowColor
      : glowColor
    : isDark
      ? categoryAccentDark(element.category)
      : categoryAccent(element.category);
  // Text is tinted a shade of whatever color the card is actually showing —
  // same treatment as a grid cell — light tints in dark mode, dark shades in
  // light mode. --el-text is always set so the registered property behaves
  // in both themes.
  const textColor = missing
    ? "var(--c-text-muted)"
    : background
      ? isDark
        ? lightenRgbForText(firstColor(background))
        : darkenRgbForText(firstColor(background))
      : themedCategoryText(element.category, theme);
  const has = (v) => v !== null && v !== undefined;

  return (
    <div
      ref={innerRef}
      className={`preview-card${missing ? " is-missing" : ""} ${className || ""}`}
      style={
        missing
          ? { "--el-text": "var(--c-text-muted)" }
          : {
              backgroundColor: "var(--c-card-bg)",
              backgroundImage,
              "--preview-glow": glow,
              "--el-text": textColor,
            }
      }
    >
      <span className="preview-card__arrow" />

      <div className="preview-top">
        <span>{element.number}</span>
        <span>{has(element.atomicMass) ? formatSig(element.atomicMass, 5) : ""}</span>
      </div>

      <div className="preview-symbol">{element.symbol}</div>

      <div>
        <div className="preview-name">{element.name}</div>
        <div className="preview-category">{titleCategory(element.category)}</div>
        {has(element.phase) && element.phase && (
          <div className="preview-phase">{element.phase}</div>
        )}
        {has(element.group) && (
          <div className="preview-meta">
            Group {element.group} · Period {element.period}
          </div>
        )}
      </div>

      <div className="preview-block">{element.block ? element.block.toUpperCase() : ""}</div>
    </div>
  );
};

export default PreviewCard;
