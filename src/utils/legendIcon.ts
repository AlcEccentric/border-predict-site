/**
 * Builds a small canvas used as a Chart.js legend `pointStyle`: a filled
 * circle with a short line on each side ( ―●― ). The "node on a line" glyph
 * reads as an interactive series marker, hinting that legend items can be
 * clicked to toggle their line — without needing a separate caption.
 *
 * Pass the series colour; returns a canvas sized in CSS pixels so Chart.js
 * draws it at a sensible legend size.
 */
export function makeSeriesLegendIcon(color: string): HTMLCanvasElement {
    const w = 24;
    const h = 12;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const cy = h / 2;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        // Short line segments either side of the centre node.
        ctx.beginPath();
        ctx.moveTo(1, cy);
        ctx.lineTo(8, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(16, cy);
        ctx.lineTo(23, cy);
        ctx.stroke();
        // Centre filled circle.
        ctx.beginPath();
        ctx.arc(12, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    return canvas;
}
