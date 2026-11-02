# Roadmap

Ideas for improving the existing challenges, the web app, and for new challenges and courses.

## Fixes for existing content

| Where | Issue |
| --- | --- |
| `html_css/05_tailwind/index.html` | References `./assets/logo.png`, but the folder has no `assets/` (the web app falls back to the logo from `02_basics`). |
| `.gitignore` | Ignores `*solutions/`, but `html_css/04_css-animations/solutions/` is tracked. Decide whether solutions are public. |
| `html_css/02_basics`, `05_tailwind` | `website-mobile.gif` and `website-styled-scrolling.gif` are 16–18 MB each. Converting them to MP4/WebM (`<video autoplay loop muted>`) would cut them to well under 1 MB. |
| `html_css/02_basics/README.md` | The pseudo-class section announces examples ("…können wir … ändern:") that are missing; `.link:visted` typo; the specificity example says `.content p` contains "zwei Elementnamen" (it is one class and one element); the cascading order mixes origin and source order (internal and external stylesheets have equal priority, order decides). `Ergänze den [] Doctype sowie den [] Head` renders broken checkboxes. |
| `react/01_make_it_count/README.md` | Two `# Challenge` headings and no real title; recommends Create React App, which is deprecated. |
| All READMEs | Typos: "Hirachie", "Challange", "Open-Meteao", "Gespühr", "Libaries", "Comunity". |

## Web app

- **Challenge metadata next to the content**: move titles, starter files and checks into each challenge folder (e.g. `challenge.ts`), so authors don't have to touch `web/src`.
- **In-app TypeScript**: type-check with the TypeScript compiler in a Web Worker and show diagnostics in the editor. This would allow TypeScript exercises inside the app instead of the external course.
- **Viewport switcher** in the preview (mobile / tablet / desktop) for the responsive challenges.
- **Visual comparison** for layout challenges (Newspaper, Basics): overlay or diff the learner's preview against the reference screenshot.
- **Progressive hints** per check (hint → stronger hint → solution snippet) instead of only the full reference solution.
- **Files**: add, rename and delete files in the workspace (e.g. own component files, the "make it yours" button).
- **Accessibility checks** with axe-core as an optional feedback group for every HTML challenge.
- **Share & backup**: export/import progress, share a solution via URL.
- **English translation** of the UI and challenges.

## New challenges

### HTML & CSS
- **Flexbox**: a series of small layout puzzles (navbar, card row, sticky footer, holy grail).
- **CSS Grid**: dashboard and magazine layouts, `grid-template-areas`, `auto-fit`/`minmax`.
- **Forms**: an accessible sign-up form with labels, native validation, `:user-invalid` styling.
- **Accessibility basics**: fix an inaccessible page (landmarks, alt texts, contrast, focus styles, keyboard navigation).
- **Responsive images**: `srcset`, `sizes`, `<picture>`, `object-fit`, `aspect-ratio`.
- **Custom properties & theming**: a light/dark theme switch with CSS variables.
- **Modern CSS**: container queries, `:has()`, nesting, `clamp()` for fluid typography.

### JavaScript
- **Array methods**: data transformation katas (`map`, `filter`, `reduce`, sorting, grouping), easy to check automatically.
- **Async JavaScript**: promises, `async/await`, `Promise.all`, error handling, timeouts.
- **Todo app**: DOM rendering, event delegation, `localStorage` persistence, filters.
- **Search with debounce**: live search against a public API with debouncing, loading and empty states.
- **Canvas game**: Snake or Breakout (game loop, keyboard input, collision).
- **ES modules & tooling**: split a script into modules and set up a Vite project.

### TypeScript (in-app)
- Type the existing JS challenges (tax calculator, weather API response), then generics, union types and narrowing, utility types.

### React
- **Lists & filtering**: a product list with search, sorting and keys.
- **Forms**: controlled inputs, validation, then the same with react-hook-form.
- **Context & reducer**: a shopping cart with `useReducer` and context.
- **Routing**: a multi-page app with React Router (list → detail).
- **Data fetching with a library**: rebuild the weather app with TanStack Query and compare it to the own `useFetch` hook.
- **Testing**: test components with Vitest and Testing Library.
- **Performance**: profiling, `memo`, `useMemo`, virtualized lists.

## Courses

1. **Web fundamentals**: HTML, CSS, Flexbox, Grid, responsive design, accessibility (existing HTML/CSS challenges plus the new ones above).
2. **JavaScript fundamentals**: language basics, DOM, async, APIs, modules.
3. **TypeScript**: from typing existing JS to generics.
4. **React**: components and state → hooks → forms → routing → data fetching → testing.
5. **Developer tooling**: Git workflow and pull requests, npm and Vite, ESLint/Prettier, debugging with DevTools, deploying to GitHub Pages.
6. **Capstone projects**: a portfolio site, a recipe app with an API, and a small team project with code review.
