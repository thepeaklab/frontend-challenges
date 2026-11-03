# the peaklab academy – Web App

A static React app (Vite + TypeScript, no server-side rendering) that turns the challenges of this repository into an interactive learning platform:

- **Overview** of all challenges with locally stored progress
- **Task description** rendered from each challenge's `README.md` (images, links and code blocks resolved)
- **Editor** (CodeMirror) with the starter files of the challenge, saved in `localStorage`
- **Live preview** in a sandboxed iframe, plus the **console output** of the learner's code
- **Goal view** with the README visuals and, where available, a live reference solution
- **Automated feedback**: every challenge defines checks that run against the learner's code in a hidden frame

The challenge content stays where it is (`html_css/`, `js/`, `react/`) and is bundled at build time, so the repository keeps working as before.

## Development (Docker)

Everything runs in Docker; use the wrapper script in the repository root:

```sh
./dev.sh setup     # build the image, install dependencies
./dev.sh start     # dev server on http://localhost:5173
./dev.sh test      # unit tests (vitest)
./dev.sh typecheck # TypeScript
./dev.sh e2e       # production build + Playwright tests (all reference solutions must pass)
./dev.sh build     # production build into web/dist
./dev.sh stop
```

Run `./dev.sh help` for all commands. If file changes aren't picked up on your machine, start with `CHOKIDAR_USEPOLLING=true ./dev.sh start`.

## How it works

| Part | Location |
| --- | --- |
| Challenge definitions (metadata, starter files, checks) | `src/challenges/` |
| Reference solutions | `reference/<category>/<challenge>/` |
| Repo content access (READMEs, images, starter files) | `src/content/repo.ts` |
| Preview document builder | `src/preview/build.ts` |
| Check runner and helpers | `src/checks/` |

**HTML/CSS/JS challenges**: the entry `index.html` is parsed, local stylesheets (including `@import`s) and scripts are inlined, and images are mapped to bundled assets. The result is rendered via `srcdoc`.

**React challenges**: TS/TSX files are transpiled in the browser with [sucrase](https://github.com/alangpierce/sucrase) to CommonJS and wired together by a tiny module loader. `react`, `react-dom` and `react/jsx-runtime` come from `public/runtime/react-runtime.js`, which is built by `vite.runtime.config.ts`.

**Checks** run in a hidden, same-origin iframe. They can inspect the DOM, computed styles and the CSSOM, simulate user input, and read `window.__fc`, where the bootstrap script records console output, errors, `fetch` calls and geolocation usage. Challenges can install mocks via `testBootstrap` (e.g. the weather challenges get a fixed position and a fixture API response, see `src/checks/weather-fixture.ts`).

## Adding a challenge

1. Add the challenge folder with a `README.md` (and images) to the repository as before.
2. Add a definition in `src/challenges/<category>.ts`: metadata, `kind` (`web`, `react` or `external`), starter `files`, and `checks`. Mark nice-to-have checks as `optional`.
3. Add a reference solution under `reference/<category>/<slug>/` and register it in `e2e/challenges.spec.ts`. The e2e tests make sure the reference passes and the starter doesn't.

## Deployment

`.github/workflows/web.yml` tests and builds the app on every push and deploys `web/dist` to GitHub Pages from the default branch. Enable it once under *Settings → Pages → Source: GitHub Actions*. Routing uses URL hashes, so no server configuration is needed.
