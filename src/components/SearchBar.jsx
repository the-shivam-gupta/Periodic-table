import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { themedCategoryColors } from "../data/categories";
import { useTheme } from "../theme/ThemeContext";

export default function SearchBar({
  index,
  onSelect,
  placeholder = "Search by name, symbol, or number…",
}) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter(({ element }) => {
        const name = element.name.toLowerCase();
        const symbol = String(element.symbol).toLowerCase();
        const number = String(element.number);
        return (
          number.startsWith(q) ||
          name.startsWith(q) ||
          name.includes(q) ||
          symbol.startsWith(q)
        );
      })
      .slice(0, 8);
  }, [query, index]);

  useEffect(() => {
    setActiveIndex(results.length ? 0 : -1);
  }, [results]);

  const pick = (element) => {
    setOpen(false);
    setQuery("");
    if (onSelect) onSelect(element);
  };

  const handleKeyDown = (e) => {
    const count = Math.max(results.length, 1);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % count);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + count) % count);
    } else if (e.key === "Enter") {
      if (results[activeIndex]) pick(results[activeIndex].element);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showList = open && results.length > 0;

  return (
    <div className="search">
      <FiSearch className="search__icon" />
      <input
        ref={inputRef}
        className="search__input"
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-controls="search-results-list"
        aria-expanded={showList}
        autoComplete="off"
        spellCheck="false"
      />
      {query && (
        <button
          type="button"
          className="search__clear"
          aria-label="Clear search"
          onMouseDown={(e) => {
            e.preventDefault();
            setQuery("");
            inputRef.current?.focus();
          }}
        >
          <FiX />
        </button>
      )}
      {showList && (
        <ul className="search__results" role="listbox" id="search-results-list">
          {results.map(({ element }, i) => {
            const [from, to] = themedCategoryColors(element.category, theme);
            return (
              <li key={element.number}>
                <button
                  type="button"
                  className={`search__result${i === activeIndex ? " is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(element);
                  }}
                  role="option"
                  aria-selected={i === activeIndex}
                >
                  <span
                    className="search__symbol"
                    style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
                  >
                    {element.symbol}
                  </span>
                  <span className="search__name">{element.name}</span>
                  <span className="search__number">#{element.number}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}