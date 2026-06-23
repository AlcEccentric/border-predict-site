import { IdolPredictionData, PredictionData } from '../types';

/**
 * Lazy-load utilities for Type 5 events.
 *
 * The loader treats prediction JSON as an opaque blob — it never inspects
 * fields inside the response. That keeps it compatible with future schema
 * changes; only the URL pattern below needs updating.
 */

const BORDERS = ['100.0', '1000.0'] as const;
const TOTAL_IDOLS = 52;

function predictionUrl(baseUrl: string, idolId: number, border: string, debugSuffix: string): string {
    return `${baseUrl}/prediction/${idolId}/${border}/predictions.json${debugSuffix}`;
}

/**
 * Fan out HEAD requests to discover which idols have any prediction data.
 * An idol counts as "available" if at least one of its border files responds
 * with 2xx. HEAD requests are body-less, so total bandwidth is tiny even
 * though we issue 104 of them (52 idols x 2 borders).
 */
export async function discoverAvailableIdols(
    baseUrl: string,
    debugSuffix: string,
): Promise<Set<number>> {
    const probes: Array<Promise<{ idolId: number; ok: boolean }>> = [];
    for (let idolId = 1; idolId <= TOTAL_IDOLS; idolId++) {
        for (const border of BORDERS) {
            const url = predictionUrl(baseUrl, idolId, border, debugSuffix);
            probes.push(
                fetch(url, { method: 'HEAD' })
                    .then(r => ({ idolId, ok: r.ok }))
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
 * parallel). Returns null if neither border returned data — the caller
 * should treat that idol as effectively unavailable.
 */
export async function loadIdolPrediction(
    idolId: number,
    baseUrl: string,
    debugSuffix: string,
): Promise<IdolPredictionData | null> {
    const fetchOne = async (border: string): Promise<PredictionData | null> => {
        try {
            const res = await fetch(predictionUrl(baseUrl, idolId, border, debugSuffix));
            if (!res.ok) return null;
            return (await res.json()) as PredictionData;
        } catch {
            return null;
        }
    };

    const [pred100, pred1000] = await Promise.all(BORDERS.map(fetchOne));
    if (!pred100 && !pred1000) return null;
    return { idolId, prediction100: pred100, prediction1000: pred1000 };
}
