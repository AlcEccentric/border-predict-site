/**
 * Regenerates the Open Graph share image at public/og-image.png.
 *
 * Usage:  npm run gen:og
 *
 * The title and subtitle are read from index.html's <meta og:title> and
 * <meta og:description> so those tags stay the single source of truth.
 * Edit index.html (and/or the gradient stops below), then re-run.
 *
 * Output is 1200x630, the standard OG / Twitter "summary_large_image" size.
 */
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/** Pull a meta tag's content by property (og:*) or name attribute. */
function meta(attr, key, fallback) {
    const re = new RegExp(`<meta\\s+${attr}=["']${key}["']\\s+content=["']([^"']*)["']`, 'i');
    const m = html.match(re);
    return m ? m[1] : fallback;
}

const title = meta('property', 'og:title', 'ミリシタ ボーダー予想');
const subtitle = meta('property', 'og:description', 'イベントボーダーをリアルタイムで予測');

/** Escape text for safe embedding in SVG markup. */
function esc(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2A7B9B" />
      <stop offset="50%" stop-color="#57C785" />
      <stop offset="100%" stop-color="#EDDD53" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <text x="600" y="290" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="bold" fill="#ffffff">${esc(title)}</text>
  <text x="600" y="380" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#ffffff" opacity="0.8">${esc(subtitle)}</text>
</svg>`;

const outPath = path.join(root, 'public', 'og-image.png');
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
fs.writeFileSync(outPath, resvg.render().asPng());
console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`);
console.log(`  title:    ${title}`);
console.log(`  subtitle: ${subtitle}`);
