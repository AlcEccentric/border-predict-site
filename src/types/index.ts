export interface EventInfo {
    EventId: number;
    EventType: number;
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
        };
        normalized: {
            target: number[];
            neighbors: {
                [key: string]: number[];
            };
        };
    };
}