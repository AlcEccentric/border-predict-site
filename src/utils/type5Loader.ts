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

function predictionUrl(baseUrl: string, idolId: number, border: string, debugSuffix: string): string {
    return `${baseUrl}/prediction/${idolId}/${border}/predictions.json${debugSuffix}`;
}

/**
 * Decide whether a probe response represents fresh-enough data. Cutoff is
 * compared against the response's `Last-Modified` header. A missing header
 * is treated as fresh (we have no way to know otherwise).
 */
function isFresh(response: Response, freshAfter: Date | null | undefined): boolean {
    if (!freshAfter) return true;
    const lastModifiedHeader = response.headers.get('Last-Modified');
    if (!lastModifiedHeader) return true;
    const lastModifiedMs = new Date(lastModifiedHeader).getTime();
    return Number.isFinite(lastModifiedMs) && lastModifiedMs >= freshAfter.getTime();
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
 * parallel). Each border is independently checked against `freshAfter`;
 * stale borders come back as null. Returns null for the whole idol only
 * if neither border is both present and fresh.
 */
export async function loadIdolPrediction(
    idolId: number,
    baseUrl: string,
    debugSuffix: string,
    freshAfter?: Date | null,
): Promise<IdolPredictionData | null> {
    const fetchOne = async (
        border: string,
    ): Promise<{ data: PredictionData | null; lastModified: Date | null }> => {
        try {
            const res = await fetch(predictionUrl(baseUrl, idolId, border, debugSuffix));
            if (!res.ok) return { data: null, lastModified: null };
            if (!isFresh(res, freshAfter)) return { data: null, lastModified: null };
            const lastModifiedHeader = res.headers.get('Last-Modified');
            const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : null;
            const data = (await res.json()) as PredictionData;
            return { data, lastModified };
        } catch {
            return { data: null, lastModified: null };
        }
    };

    const [r100, r1000] = await Promise.all(BORDERS.map(fetchOne));
    if (!r100.data && !r1000.data) return null;

    // Newest of the two timestamps (skipping nulls and invalid dates).
    const candidates = [r100.lastModified, r1000.lastModified].filter(
        (d): d is Date => d != null && !Number.isNaN(d.getTime()),
    );
    const lastModified = candidates.length > 0
        ? new Date(Math.max(...candidates.map(d => d.getTime())))
        : undefined;

    return {
        idolId,
        prediction100: r100.data,
        prediction1000: r1000.data,
        lastModified,
    };
}


