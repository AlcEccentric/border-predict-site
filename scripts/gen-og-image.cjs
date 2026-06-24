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
const cta = '今すぐ予測をチェック →';

/** Escape text for safe embedding in SVG markup. */
function esc(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Split the title on whitespace and stack each part on its own line. This
// keeps the text within the centered "square-safe" zone, since some
// platforms (Discord, X) crop the 1200x630 card to a centered square and
// clip the left/right edges of a long single line.
const titleLines = title.split(/\s+/).filter(Boolean);
const lineHeight = 84;
const firstBaseline = titleLines.length <= 1 ? 270 : 215;
const titleSvg = titleLines
    .map((line, i) =>
        `<text x="600" y="${firstBaseline + i * lineHeight}" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="bold" fill="#ffffff">${esc(line)}</text>`)
    .join('\n  ');
const subtitleY = firstBaseline + (titleLines.length - 1) * lineHeight + 70;
const ctaRectY = subtitleY + 40;
const ctaTextY = ctaRectY + 49;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2A7B9B" />
      <stop offset="50%" stop-color="#57C785" />
      <stop offset="100%" stop-color="#EDDD53" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  ${titleSvg}
  <text x="600" y="${subtitleY}" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#ffffff" opacity="0.9">${esc(subtitle)}</text>
  <!-- Call-to-action pill -->
  <rect x="390" y="${ctaRectY}" width="420" height="74" rx="37" fill="#ffffff" />
  <text x="600" y="${ctaTextY}" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="bold" fill="#2A7B9B">${esc(cta)}</text>
</svg>`;

const outPath = path.join(root, 'public', 'og-image.png');
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
const png = resvg.render().asPng();
fs.writeFileSync(outPath, png);

// Cache-bust automatically: derive a short hash from the image bytes and
// write it into index.html's og:image / twitter:image URLs as ?v=<hash>.
// The hash only changes when the image changes, so crawlers (and the CDN)
// refetch exactly when they should — no manual version bumping.
const hash = require('crypto').createHash('sha256').update(png).digest('hex').slice(0, 8);
const indexPath = path.join(root, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
const before = indexHtml;
indexHtml = indexHtml.replace(/og-image\.png(?:\?v=[a-z0-9]+)?/g, `og-image.png?v=${hash}`);
if (indexHtml !== before) {
    fs.writeFileSync(indexPath, indexHtml);
}

console.log(`Wrote ${outPath} (${png.length} bytes)`);
console.log(`  title:    ${title}`);
console.log(`  subtitle: ${subtitle}`);
console.log(`  cache-bust: og-image.png?v=${hash} (index.html ${indexHtml !== before ? 'updated' : 'unchanged'})`);
