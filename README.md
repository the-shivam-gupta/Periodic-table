# Periodic Table of Elements — Interactive

A fast, animated, single-dataset periodic table built with React and GSAP. Explore all 118 elements as a classic grid, a sortable data table, or through five element-guessing game modes — all backed by one source of truth so the table, the list view, and the game never disagree.

## Features

### Table view

- **Classic 18-column layout** with the lanthanide/actinide block pulled out below into its own panel.
- **Filter** elements by category (alkali metals, halogens, noble gases, transition metals, and more), with a live count per category.
- **Color by** any property — Melting Point, Density, Electronegativity, Ionization Energy, Oxidation States, Electron Configuration, and others — rendered as either a numeric heat gradient or a categorical palette, with a legend that adapts to whichever is active.
- **More** menu for toggling element names, atomic mass, category labels, and reduced motion.
- **Property Showcase** — a live center readout that mirrors whatever element you're hovering or have selected, annotated with pointer lines back to the atomic number, symbol, name, and the active property.
- **Hover preview card** that follows your cursor and always matches the color the cell is actually showing.
- **Element Explorer** — click any element for a full detail modal: summary, atomic/physical properties, discovery history, a sample image, related molecules, and source attribution.

### List / Properties view

A sortable, searchable table of all 118 elements — search by name, symbol, or atomic number, filter by category, and sort any column (mass, density, electronegativity, melting/boiling point, and more).

### Game

Five quiz modes to test element recall, gated behind a "ready to play?" prompt so nothing starts until you choose to:

| Mode | What it asks |
| --- | --- |
| Find the Element | Click the matching cell on the live table |
| Find by Symbol | Identify the element from its symbol |
| Atomic Number | Identify the element from its atomic number |
| Property Challenge | Pick the highest/lowest/closest match for a random property |
| Element Rush | Type element names against a countdown timer |

Tracks score, streak, and best-of-session.

## Tech stack

- [React 18](https://react.dev/) (Create React App)
- [GSAP](https://gsap.com/) for all animation — hover states, transitions, the game feedback, and the atom/molecule visualizations
- [Sass](https://sass-lang.com/) (SCSS modules under `src/scss/`)
- [react-icons](https://react-icons.github.io/react-icons/) (Feather icon set)

No backend, no external API — every element and molecule comes from the JSON datasets bundled in `src/database/`.

## Getting started

```bash
git clone https://github.com/the-shivam-gupta/Periodic-table.git
cd Periodic-table
npm install
npm start
```

Opens [http://localhost:3000](http://localhost:3000) with hot reload.

### Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the dev server |
| `npm run build` | Production build to `build/` |
| `npm test` | Run tests in watch mode |
| `npm run eject` | Eject the Create React App config (irreversible) |

## Project structure

```
src/
  components/     UI components (PeriodicTable, ListView, Game, ElementExplorer, …)
  animations/     GSAP animation helpers, one module per feature area
  data/           Element/molecule datasets normalized into the app's data model,
                  category color definitions, property/color-scale config
  database/       Raw source JSON (periodic-table-lookup.json, periodic-table-data.json)
  pages/          App.js — top-level view/state orchestration
  scss/           Sass partials (utils, base, components) compiled via index.scss
```

`src/data/elements.js` is the single place raw dataset records get normalized into the shape every view consumes — element categories, properties, and derived fields (metallicity, standard state, etc.) all originate there.

## Data sources

Element data is merged from two bundled datasets (`src/database/periodic-table-lookup.json` and `periodic-table-data.json`) — the former supplies most atomic/physical properties and per-element imagery, the latter fills gaps (atomic radius, year discovered, oxidation states) and provides the authoritative category grouping. Nothing is fetched at runtime.
