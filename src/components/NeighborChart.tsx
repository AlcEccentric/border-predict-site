import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';

interface NeighborChartProps {
    normalizedData: {
        target: number[];
        neighbors: {
            [key: string]: number[];
        };
    };
    lastKnownIndex: number;
    neighborMetadata: {
        [key: string]: {
            name: string;
            id: number;
            length: number;
        };
    };
}

const NeighborChart: React.FC<NeighborChartProps> = ({
    normalizedData,
    lastKnownIndex,
    neighborMetadata,
}) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
    
    // Prepare chart data
    const chartData = normalizedData.target.map((value, index) => {
        const point: any = { index, target: value };
        Object.keys(normalizedData.neighbors).forEach((neighborKey) => {
            point[`neighbor${neighborKey}`] = normalizedData.neighbors[neighborKey][index];
        });
        return point;
    });

    // Create formatter function that safely handles undefined cases
    const legendFormatter = (value: string) => {
        if (value === 'target') return '現在のイベント';
        const neighborKey = value.replace('neighbor', '');
        return neighborMetadata[neighborKey] 
            ? `近傍${neighborKey} - ${neighborMetadata[neighborKey].name}`
            : value;
    };

    return (
        <LineChart
            width={800}
            height={400}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip />
            <Legend 
                formatter={legendFormatter}
                wrapperStyle={{ maxWidth: '500px' }}
            />
            <Line
                type="monotone"
                dataKey="target"
                stroke={colors[0]}
                dot={false}
                name="target"
            />
            {Object.keys(normalizedData.neighbors).map((neighborKey, index) => (
                <Line
                    key={neighborKey}
                    type="monotone"
                    dataKey={`neighbor${neighborKey}`}
                    stroke={colors[index + 1]}
                    dot={false}
                    name={`neighbor${neighborKey}`}
                />
            ))}
            <ReferenceLine
                x={lastKnownIndex}
                stroke="red"
                strokeDasharray="3 3"
            />
        </LineChart>
    );
};

export default NeighborChart;