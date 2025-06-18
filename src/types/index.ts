export interface EventInfo {
    Name: string;
    StartAt: string;
    EndAt: string;
}

export interface EventMetadata {
    name: string;
    id: number;
    length: number;
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
            basic: EventMetadata
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