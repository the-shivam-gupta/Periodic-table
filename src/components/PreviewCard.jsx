import { categoryColors, titleCategory } from "../data/categories";
import { formatSig } from "../data/propertyScale";

const PreviewCard = ({ element, className, innerRef, background, missing }) => {
  if (!element) return null;

  // Match whatever color this element is actually showing on the table —
  // the active "Color by" heat/shade color when one is selected, otherwise
  // its plain category gradient. The heat gradient's second stop is
  // intentionally semi-transparent (it's designed to sit over an opaque
  // grid cell), so pair it with an opaque backdrop color here rather than
  // letting the page behind the card show through. When the element has no
  // value for the active property, match the grid cell's own "missing"
  // treatment (transparent, outlined) instead of falling back to a color.
  const [from, to] = categoryColors(element.category);
  const backgroundImage = background || `linear-gradient(160deg, ${from}, ${to})`;
  const has = (v) => v !== null && v !== undefined;

  return (
    <div
      ref={innerRef}
      className={`preview-card${missing ? " is-missing" : ""} ${className || ""}`}
      style={missing ? undefined : { backgroundColor: "#151a26", backgroundImage }}
    >
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