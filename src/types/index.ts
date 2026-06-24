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
            // CI bounds — `upper` / `lower` can be either:
            //   - `number[]`: per-step series (normal events)
            //   - `number`:   final-time scalar only (Type 5 idol predictions
            //                 going forward — saves payload by 52x).
            // Use `getFinalBoundValue()` to read either shape uniformly,
            // and `getBoundSeries()` when you specifically need the array.
            bounds?: {
                75: { upper: number | number[]; lower: number | number[] };
                90: { upper: number | number[]; lower: number | number[] };
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