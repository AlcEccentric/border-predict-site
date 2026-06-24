import { IdolPredictionData, PredictionData } from '../types';

/**
 * Lazy-load utilities for Type 5 events.
 *
 * The loader treats prediction JSON as an opaque blob — it never inspects
 * fields inside the response. That keeps it compatible with future schema
 * changes; only the URL pattern below needs updating.
 *
 * Freshness gating: callers can pass an optional `freshAfter` cutoff. Any
 * file whose R2 `Last-Modified` is older than that timestamp is treated as
 * leftover data from a previous event and ignored. Passing `null`/`undefined`
 * disables the check (used by demo mode where stale data is the point).
 */

const BORDERS = ['100.0', '1000.0'] as const;
const TOTAL_IDOLS = 52;

// Data is expected to refresh roughly hourly; combined with up to ~1h of
// browser/CDN caching, displayed data can legitimately be ~2h old. Use a 3h
// threshold for the stale warning so normal caching doesn't trip it.
const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

function predictionUrl(baseUrl: string, idolId: number, border: string, debugSuffix: string): string {
    return `${baseUrl}/prediction/${idolId}/${border}/predictions.json${debugSuffix}`;
}

type BorderFreshness = 'insufficient' | 'stale' | 'fresh';

/**
 * Availability predicate used by discovery: a file counts as belonging to
 * the current event when its `Last-Modified` is at or after `eventStart`.
 * Missing/unparseable header or an older timestamp → false. `eventStart`
 * null/undefined disables the check (demo mode) → always true.
 */
function isFresh(response: Response, eventStart: Date | null | undefined): boolean {
    if (!eventStart) return true;
    const lastModifiedHeader = response.headers.get('Last-Modified');
    if (!lastModifiedHeader) return false;
    const lastModifiedMs = new Date(lastModifiedHeader).getTime();
    if (!Number.isFinite(lastModifiedMs)) return false;
    return lastModifiedMs >= eventStart.getTime();
}

/**
 * Classify a 200 response into one of three states relative to the event
 * start and the staleness window:
 *
 *   - `insufficient`: `Last-Modified` is older than `eventStart` — leftover
 *     data from a previous event, treated as "no data for this event".
 *   - `stale`: belongs to this event but hasn't refreshed within ~2h.
 *   - `fresh`: belongs to this event and recently updated.
 *
 * Throws when `Last-Modified` is missing or unparseable — that's a
 * retrieval-integrity failure (case 3), not a data-availability state.
 * When `eventStart` is null/undefined the check is disabled (demo) → fresh.
 */
function classifyFreshness(
    response: Response,
    eventStart: Date | null | undefined,
    now: number,
): BorderFreshness {
    if (!eventStart) return 'fresh';
    const lastModifiedHeader = response.headers.get('Last-Modified');
    if (!lastModifiedHeader) {
        throw new Error(
            `Freshness check failed: no readable Last-Modified header on ${response.url}.`,
        );
    }
    const lastModifiedMs = new Date(lastModifiedHeader).getTime();
    if (!Number.isFinite(lastModifiedMs)) {
        throw new Error(
            `Freshness check failed: unparseable Last-Modified "${lastModifiedHeader}" on ${response.url}.`,
        );
    }
    if (lastModifiedMs < eventStart.getTime()) return 'insufficient';
    if (lastModifiedMs < now - STALE_AFTER_MS) return 'stale';
    return 'fresh';
}

/**
 * Fan out HEAD requests to discover which idols have any prediction data.
 * An idol counts as "available" if at least one of its border files exists
 * AND is newer than `freshAfter` (when provided). HEAD requests are
 * body-less, so total bandwidth is tiny even with 104 of them.
 */
export async function discoverAvailableIdols(
    baseUrl: string,
    debugSuffix: string,
    freshAfter?: Date | null,
): Promise<Set<number>> {
    const probes: Array<Promise<{ idolId: number; ok: boolean }>> = [];
    for (let idolId = 1; idolId <= TOTAL_IDOLS; idolId++) {
        for (const border of BORDERS) {
            const url = predictionUrl(baseUrl, idolId, border, debugSuffix);
            probes.push(
                fetch(url, { method: 'HEAD' })
                    .then(r => ({ idolId, ok: r.ok && isFresh(r, freshAfter) }))
                    .catch(() => ({ idolId, ok: false })),
            );
        }
    }

    const results = await Promise.all(probes);
    const available = new Set<number>();
    for (const { idolId, ok } of results) {
        if (ok) available.add(idolId);
    }
    return available;
}

/**
 * Fetch the full prediction data for a single idol (both borders in
 * parallel). Per border:
 *   - 404 or `Last-Modified` older than the event start → that border comes
 *     back null (insufficient data — not an error).
 *   - belongs to the event → data is returned; flagged stale if older than
 *     the staleness window.
 * Throws on retrieval failures: network error, non-OK (non-404) status, or
 * a missing/unparseable `Last-Modified` on an otherwise OK response.
 *
 * Always returns an IdolPredictionData (borders may be null); never null.
 */
export async function loadIdolPrediction(
    idolId: number,
    baseUrl: string,
    debugSuffix: string,
    freshAfter?: Date | null,
): Promise<IdolPredictionData> {
    const fetchOne = async (
        border: string,
    ): Promise<{ data: PredictionData | null; lastModified: Date | null; stale: boolean }> => {
        // Network-level failures propagate (no catch) — case 3.
        const res = await fetch(predictionUrl(baseUrl, idolId, border, debugSuffix));

        // Missing file → insufficient data for this event (case 1, not an error).
        if (res.status === 404) {
            return { data: null, lastModified: null, stale: false };
        }
        // Any other non-OK status is a retrieval failure — case 3.
        if (!res.ok) {
            throw new Error(
                `Failed to load prediction (idol=${idolId}, border=${border}): HTTP ${res.status}`,
            );
        }

        // classifyFreshness throws on missing/unparseable Last-Modified (case 3).
        const freshness = classifyFreshness(res, freshAfter, Date.now());
        if (freshness === 'insufficient') {
            // Leftover data from a previous event — treat as no data (case 1).
            return { data: null, lastModified: null, stale: false };
        }

        const lastModifiedHeader = res.headers.get('Last-Modified');
        const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : null;
        const data = (await res.json()) as PredictionData;
        return { data, lastModified, stale: freshness === 'stale' };
    };

    const [r100, r1000] = await Promise.all(BORDERS.map(fetchOne));

    // Newest of the two timestamps (skipping nulls and invalid dates).
    const candidates = [r100.lastModified, r1000.lastModified].filter(
        (d): d is Date => d != null && !Number.isNaN(d.getTime()),
    );
    const lastModified = candidates.length > 0
        ? new Date(Math.max(...candidates.map(d => d.getTime())))
        : undefined;

    // Idol is stale if any border we're actually showing is stale.
    const stale = (r100.data != null && r100.stale) || (r1000.data != null && r1000.stale);

    return {
        idolId,
        prediction100: r100.data,
        prediction1000: r1000.data,
        lastModified,
        stale,
    };
}


