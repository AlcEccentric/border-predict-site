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
            bounds?: {
                50: { upper: number[]; lower: number[]; };
                75: { upper: number[]; lower: number[]; };
                90: { upper: number[]; lower: number[]; };
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