# Militheatre Border Predict

Web frontend for ミリシタ (MLTD) event border predictions. Built with React + Vite + TypeScript, styled with Tailwind and daisyUI, and reads prediction data from a CDN-backed JSON API.

## Prerequisites

- Node.js 18+ (for Vite 4 and the bundled toolchain)
- npm (ships with Node)

## Setup

```bash
npm install
```

## Running locally

### Normal mode

```bash
npm run dev
```

Starts the Vite dev server at http://localhost:3000. Fetches prediction data from the production CDN (`https://cdn.yuenimillion.live/data`), which may serve cached responses.

### Debug mode

```bash
npm run dev:debug
```

Same as `npm run dev`, but sets `VITE_DEBUG=1`. The app then appends `?debug` to every data fetch so the CDN bypasses its cache and returns the latest predictions. Useful when you need to verify freshly regenerated data without waiting for cache expiry.

Debug mode is env-driven and only applied at launch; it is never enabled in a production build.

## Building for production

```bash
npm run build
```

Type-checks with `tsc`, then emits a production bundle to `dist/`.

```bash
npm run preview
```

Serves the built `dist/` locally for smoke-testing the production bundle.

## Project layout

```
src/
  App.tsx            # Top-level app: loads event info + predictions, routes by event type
  components/        # Chart, modal, tabs, theme, FAQ, etc.
  contexts/          # React contexts (e.g. theme)
  types/             # Shared TypeScript interfaces
  utils/             # Date helpers, idol data, theme storage, daisyUI helpers
vite.config.ts       # Vite config (dev server, aliases, publicDir)
tailwind.config.js   # Tailwind + daisyUI config
```

## Environment variables

| Variable     | Used by   | Purpose                                                      |
|--------------|-----------|--------------------------------------------------------------|
| `VITE_DEBUG` | `App.tsx` | When `1`/`true`, appends `?debug` to CDN requests to bypass cache. Set automatically by `npm run dev:debug`. |

`.env` is gitignored. Do not commit secrets.
