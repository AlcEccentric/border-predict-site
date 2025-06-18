export interface EventInfo {
    Name: string;
    StartAt: string;
    EndAt: string;
}

export interface NeighborMetadata {
    name: string;
    id: number;
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