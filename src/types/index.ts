export interface EventInfo {
    EventId: number;
    EventType: number;
    InternalEventType: number;
    EventName: string;
    StartAt: string;
    EndAt: string;
}

export interface EventMetadata {
    name: string;
    id: number;
    length: number;
    idol_id?: number;
}

export interface NeighborMetadata {
    idol_id: any;
    name: string;
    id: number;
    raw_length: number;
}

export interface IdolInfo {
    id: number;
    name: string;
}

export interface IdolPredictionData {
    idolId: number;
    prediction100: PredictionData | null;
    prediction1000: PredictionData | null;
    /** Newest `Last-Modified` from the two border responses, if available. */
    lastModified?: Date;
    /**
     * True when the shown data is for the current event but hasn't been
     * refreshed within the staleness window (~2h). The data is still
     * rendered; this just flags that it may be out of date.
     */
    stale?: boolean;
}

export interface Type5EventData {
    eventInfo: EventInfo;
    idolPredictions: Map<number, IdolPredictionData>;
    selectedIdols: number[];
}

export interface PredictionData {
    metadata: {
        raw: {
            id: number;
            name: string;
            last_known_step_index: number;
            sla: {
                [key: number]: string
            };
        };
        normalized: {
            last_known_step_index: number;
            neighbors: {
                [key: string]: NeighborMetadata;
            };
        };
    };
    data: {
        raw: {
            target: number[];
            // CI bounds. Two shapes are supported:
            //   - Normal events: `upper` / `lower` are per-step `number[]`
            //     series (used for the shaded chart bands).
            //   - Type 5 idol predictions: only the final-time scalar is
            //     shipped, as `upper_final` / `lower_final` (saves ~52x
            //     payload since there's no per-step series).
            // Use `getFinalCI()` to read the final-time interval uniformly,
            // and `getBoundSeries()` when you specifically need the array.
            bounds?: {
                75: BoundEntry;
                90: BoundEntry;
            };
        };
        normalized: {
            target: number[];
            neighbors: {
                [key: string]: number[];
            };
        };
    };
}

/** One confidence-interval bound, in either the series or final-scalar shape. */
export interface BoundEntry {
    /** Per-step upper series (normal events). */
    upper?: number | number[];
    /** Per-step lower series (normal events). */
    lower?: number | number[];
    /** Final-time upper scalar (Type 5 idol predictions). */
    upper_final?: number;
    /** Final-time lower scalar (Type 5 idol predictions). */
    lower_final?: number;
}

/**
 * Returns the final-time {lower, upper} for a CI bound, reading either the
 * `*_final` scalars (Type 5) or the last element of the `upper`/`lower`
 * series (normal events). Returns null if neither is present.
 */
export function getFinalCI(
    entry: BoundEntry | undefined,
): { lower: number; upper: number } | null {
    if (!entry) return null;
    const upper = entry.upper_final ?? getFinalBoundValue(entry.upper);
    const lower = entry.lower_final ?? getFinalBoundValue(entry.lower);
    if (upper === undefined || lower === undefined) return null;
    return { lower, upper };
}

/**
 * Returns the final-time value for one side of a CI bound, regardless of
 * whether the underlying field is a per-step array (normal events) or a
 * single scalar (Type 5 idol predictions).
 */
export function getFinalBoundValue(
    field: number | number[] | undefined,
): number | undefined {
    if (typeof field === 'number') return field;
    if (Array.isArray(field) && field.length > 0) return field[field.length - 1];
    return undefined;
}

/**
 * Returns the per-step CI series, or null if the bound is a scalar (no
 * series). Use this for chart bands that need every time step.
 */
export function getBoundSeries(
    field: number | number[] | undefined,
): number[] | null {
    return Array.isArray(field) ? field : null;
}