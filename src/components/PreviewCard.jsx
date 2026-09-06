import { categoryColors, categoryAccent, categoryText, darkenRgbForText, titleCategory } from "../data/categories";
import { formatSig } from "../data/propertyScale";

// Pulls the first rgb()/rgba() color out of a gradient string — matches the
// whole function call rather than splitting on commas, since the color
// itself contains commas (see Element.jsx's firstGradientColor for the bug
// that naive comma-splitting caused).
function firstColor(gradient) {
  const m = /rgba?\([^)]+\)/.exec(gradient || "");
  return m ? m[0] : null;
}

const PreviewCard = ({ element, className, innerRef, background, glowColor, missing }) => {
  if (!element) return null;

  // Match whatever color this element is actually showing on the table —
  // the active "Color by" heat color when one is selected, otherwise its
  // plain category gradient. When the element has no value for the active
  // property, match the grid cell's own "missing" treatment (transparent,
  // outlined) instead of falling back to a color.
  const [from, to] = categoryColors(element.category);
  const backgroundImage = background || `linear-gradient(160deg, ${from}, ${to})`;
  // The glow ring follows the same source as the fill — the active heat
  // color when one's selected, otherwise a saturated "ink" version of the
  // category color (the pastel fill itself is too pale for a visible glow).
  const glow = glowColor || categoryAccent(element.category);
  // Text is tinted a dark shade of whatever color the card is actually
  // showing — same treatment as a grid cell — instead of falling back to
  // flat black once a "Color by" property replaces the category color.
  const textColor = missing
    ? null
    : background
      ? darkenRgbForText(firstColor(background))
      : categoryText(element.category);
  const has = (v) => v !== null && v !== undefined;

  return (
    <div
      ref={innerRef}
      className={`preview-card${missing ? " is-missing" : ""} ${className || ""}`}
      style={
        missing
          ? undefined
          : {
              backgroundColor: "#ffffff",
              backgroundImage,
              "--preview-glow": glow,
              ...(textColor ? { "--el-text": textColor } : null),
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
