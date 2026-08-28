import { CATEGORIES } from "../data/categories";

export function categoryMatches(element, activeKey) {
  if (!activeKey) return true;
  const cat = CATEGORIES.find((c) => c.key === activeKey);
  return cat ? cat.match(element) : true;
}

export function categoryBaseOpacity(element, activeKey) {
  return categoryMatches(element, activeKey) ? 1 : 0.3;
}

export function buildCategoryCounts(elements) {
  const counts = {};
  CATEGORIES.forEach((c) => {
    counts[c.key] = elements.filter(c.match).length;
  });
  return counts;
}