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
| `npm run gen:og`     | Regenerate the social share image at `public/og-image.png`.        |

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

## Social share image (Open Graph)

When the site URL is shared on X, LINE, Discord, etc., crawlers read the
Open Graph / Twitter Card `<meta>` tags in `index.html` and show a preview
card with `public/og-image.png`.

To regenerate the image:

```bash
npm run gen:og
```

This runs `scripts/gen-og-image.cjs`, which renders a 1200×630 PNG (the
standard OG size) using [`@resvg/resvg-js`](https://github.com/yisibl/resvg-js).

- **Text** comes from `index.html`'s `og:title` (heading) and
  `og:description` (subtitle), so those meta tags stay the single source of
  truth. Edit them, then re-run `npm run gen:og`.
- **Gradient colors** live in the SVG markup inside the script; edit there.

Notes:

- Previews never render from `localhost` — crawlers fetch the URL from their
  own servers, which can't reach your machine. Test after deploying, or use a
  tunnel (e.g. `ngrok`).
- For maximum compatibility (notably LINE), `og:image` should be an absolute
  `https://…` URL in production rather than the relative `/og-image.png`.
- After deploying, prime the crawler cache via the
  [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) so
  stale (no-image) metadata doesn't linger.

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
