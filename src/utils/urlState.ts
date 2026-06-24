/**
 * Tiny helpers for reflecting a little UI state in the URL query string so
 * views are shareable and survive a reload / back-button.
 *
 * We use `history.replaceState` (not `pushState`) so toggling a tab or
 * switching idols doesn't spam the browser history. Other query params
 * (demo flags, ?debug, ?preview, …) are always preserved.
 */

function currentParams(): URLSearchParams {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
}

/** Read a raw string param, or null if absent. */
export function getParam(key: string): string | null {
    return currentParams().get(key);
}

/**
 * Read an integer param constrained to [min, max]. Returns null if missing
 * or out of range so callers can fall back to other sources.
 */
export function getIntParam(key: string, min: number, max: number): number | null {
    const raw = currentParams().get(key);
    if (raw === null) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) return null;
    return n;
}

/**
 * Write (or, with value === null, delete) a single query param while
 * preserving everything else. No-op on the server. Does not reload.
 */
export function setParam(key: string, value: string | null): void {
    if (typeof window === 'undefined') return;
    const params = currentParams();
    if (value === null || value === '') {
        params.delete(key);
    } else {
        params.set(key, value);
    }
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
}
