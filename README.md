# Militheatre Border Predict

Web frontend for ミリシタ (MLTD) event border predictions. React + Vite + TypeScript, Tailwind + daisyUI, reads JSON from a CDN.

## Prerequisites

Node.js 18+ and npm.

## Setup

```bash
npm install
```

## Run

| Command              | What it does                                                        |
|----------------------|---------------------------------------------------------------------|
| `npm run dev`        | Dev server at http://localhost:3000. Uses CDN cache.                |
| `npm run dev:debug`  | Same, with `VITE_DEBUG=1` so every fetch appends `?debug` (bypass). |
| `npm run build`      | Type-check + production bundle to `dist/`.                          |
| `npm run preview`    | Serve `dist/` locally.                                              |

## Preview screens during an active event

URL flags force the app into states that normally only appear at specific times:

- `http://localhost:3000/?preview=modal` — `EventModal` (no-event / invalid-data screen).
- `http://localhost:3000/?preview=pre-event` — the "first 36 hours" waiting card.

Combine with the banner's light/dark toggle to check both modes.

## Seasonal themes

A seasonal daisyUI theme can temporarily replace the default light/dark palette during a fixed time window. Two steps to add one:

1. **Register the theme** in `tailwind.config.js` under `daisyui.themes`. Only `primary`, `secondary`, `accent`, `base-100`, and `base-content` are required; daisyUI derives the rest.

   ```js
   {
     'my-theme': {
       'primary': '#D98452',
       'secondary': '#8C7288',
       'accent':    '#D9B26A',
       'base-100':  '#F2F2F2',
       'base-content': '#161526',
     },
   }
   ```

2. **Wire the window** in `src/utils/themes.ts` → `SEASONAL_WINDOWS`. `start` and `end` are ISO-8601 UTC.

   ```ts
   {
     lightTheme: 'my-theme',
     darkTheme:  'my-theme-dark',   // optional, falls back to default dark
     start: '2026-05-05T07:00:00Z',
     end:   '2026-05-18T14:59:59Z',
   }
   ```

During the window `useTheme()` swaps the active theme automatically. When the window closes the app reverts to `cupcake` / `dim` without a reload (a `setTimeout` wakes at the boundary).

To preview a seasonal theme outside its window, temporarily widen the `start`/`end` in `themes.ts`. Remember to revert before shipping.

## Environment variables

| Variable     | Purpose                                                                      |
|--------------|------------------------------------------------------------------------------|
| `VITE_DEBUG` | `1` or `true` makes fetches append `?debug` to bypass CDN cache. Set by `npm run dev:debug`. Not included in production builds. |

`.env` is gitignored.

## Project layout

```
src/
  App.tsx            Top-level routing by event type.
  components/        Chart, modal, banner, FAQ, etc.
  types/             Shared interfaces.
  utils/             Date helpers, idol data, daisyUI helpers, theme logic.
vite.config.ts
tailwind.config.js   Tailwind + daisyUI (incl. seasonal theme definitions).
```
