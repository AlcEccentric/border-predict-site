export interface EventInfo {
    EventId: number;
    EventType: number;
    Name: string;
    StartAt: string;
    EndAt: string;
}

export interface EventMetadata {
    name: string;
    id: number;
    length: number;
    idol_id?: number;
}

export interface IdolInfo {
    id: number;
    name: string;
}

export interface IdolPredictionData {
    idolId: number;
    prediction100: PredictionData;
    prediction1000: PredictionData;
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
                [key: string]: EventMetadata;
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