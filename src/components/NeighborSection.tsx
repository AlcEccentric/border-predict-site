import { Chart as ChartJS, ChartOptions } from 'chart.js';
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import { LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip } from 'chart.js';
import CardContainer from './CardContainer';

interface NeighborSectionProps {
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
        };
    };
    currentEventId: number;
}

const COLORS = {
    target: '#8884d8',
    neighbors: ['#82ca9d', '#ffc658', '#ff7300', '#0088fe']
};

ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Legend,
    Tooltip,
    annotationPlugin
);

type ExtendedChartOptions = ChartOptions<'line'> & {
    plugins: {
        annotation: {
            annotations: {
                line1: {
                    type: 'line';
                    xMin: number;
                    xMax: number;
                    borderColor: string;
                    borderWidth: number;
                    borderDash: number[];
                };
                box1: {  // Add this
                    type: 'box';
                    xMin: number;
                    xMax: number;
                    backgroundColor: string;
                    borderColor: string;
                };
            };
        };
    };
};

const NeighborSection: React.FC<NeighborSectionProps> = ({
    normalizedData,
    lastKnownIndex,
    neighborMetadata,
    currentEventId
}) => {
    const [visibleNeighbors, setVisibleNeighbors] = useState<{[key: string]: boolean}>(
        Object.keys(normalizedData.neighbors).reduce((acc, key) => ({
            ...acc,
            [key]: true
        }), { target: true })
    );

    const toggleNeighbor = (key: string) => {
        setVisibleNeighbors(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const formatScore = (score: number): string => {
        return score.toLocaleString();
    };

    const percentagePoints = normalizedData.target.map((_, index) => 
        Math.round((index / (normalizedData.target.length - 1)) * 100)
    );

    const chartData = {
        labels: percentagePoints,
        datasets: [
            {
                label: '現在のイベント',
                data: visibleNeighbors.target ? normalizedData.target : [],
                borderColor: COLORS.target,
                tension: 0.1,
                pointRadius: 3,
                fill: false,
            },
            ...Object.entries(normalizedData.neighbors)
                .map(([key, data], index) => ({
                    label: `近傍${key}`,
                    data: visibleNeighbors[key] ? data : [],
                    borderColor: COLORS.neighbors[index],
                    tension: 0.1,
                    pointRadius: 3,
                    fill: false,
                }))
        ]
    };

    const options: ExtendedChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        xMin: lastKnownIndex,
                        xMax: lastKnownIndex,
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                    },
                    box1: {
                        type: 'box',
                        xMin: lastKnownIndex,
                        xMax: normalizedData.target.length - 1,
                        backgroundColor: 'rgba(103, 220, 209, 0.1)',
                        borderColor: 'rgba(200, 200, 200, 0.2)',
                    }
                }
            },
            title: {
                display: true,
                text: '正規化されたスコア推移',
                padding: {
                    bottom: 10
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false
            },
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: 'イベント進行度 (%)'
                },
                ticks: {
                    callback: (value: number | string) => {
                        const index = typeof value === 'string' ? parseInt(value) : value;
                        return `${percentagePoints[index]}%`;
                    }
                }
            }
        },
    };

    return (
        <CardContainer className="mb-4">
            <div className="flex flex-col gap-4">
                <div className="h-[400px] w-full">
                    <Line data={chartData} options={{
                        ...options,
                        plugins: {
                            ...options.plugins,
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    generateLabels: () => [{
                                        text: '予測範囲',
                                        fillStyle: 'rgba(103, 220, 209, 0.1)',
                                        strokeStyle: 'rgba(69, 120, 129, 1)',
                                        fontColor: 'rgba(69, 120, 129, 1)',
                                        lineWidth: 1,
                                    }]
                                }
                            }
                        }
                    }} />
                </div>
                
                <div className="bg-base-100 rounded-xl p-4">
                    <h3 className="text-lg font-bold mb-4">近傍イベント</h3>
                    <ul className="w-full p-0 gap-2">
                        <li>
                            <div className="flex items-center gap-4 p-2 bg-base-200 rounded-lg hover:bg-base-200">
                                <div 
                                    className="w-12 h-12 rounded flex-shrink-0" 
                                    style={{ backgroundColor: COLORS.target }}
                                />
                                <div className="flex-1 flex flex-col min-w-0">
                                    <span className="font-medium">現在のイベント</span>
                                    <span className="text-sm text-base-content/70">
                                        予想最終スコア: {formatScore(normalizedData.target[normalizedData.target.length - 1])}
                                    </span>
                                </div>
                                <div className="flex-none flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-md"
                                        checked={visibleNeighbors.target}
                                        onChange={() => toggleNeighbor('target')}
                                    />
                                    <a
                                        href={`https://mltd.matsurihi.me/events/${currentEventId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline btn-primary"
                                    >
                                        実ボーダーを見る
                                    </a>
                                </div>
                            </div>
                        </li>
                        {Object.entries(neighborMetadata).map(([key, neighbor], index) => (
                            <li key={key}>
                                <div className="flex items-center gap-4 p-2 bg-base-200 rounded-lg hover:bg-base-200">
                                    <div 
                                        className="w-12 h-12 rounded flex-shrink-0" 
                                        style={{ backgroundColor: COLORS.neighbors[index] }}
                                    />
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <span className="font-medium">近傍{key}：{neighbor.name}</span>
                                        <span className="text-sm text-base-content/70">
                                            最終スコア: {formatScore(normalizedData.neighbors[key][normalizedData.neighbors[key].length - 1])}
                                        </span>
                                    </div>
                                    <div className="flex-none flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary toggle-md"
                                            checked={visibleNeighbors[key]}
                                            onChange={() => toggleNeighbor(key)}
                                        />
                                        <a
                                            href={`https://mltd.matsurihi.me/events/${neighbor.id}`}  // Fixed: use neighbor.id instead of currentEventId
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-outline btn-primary"
                                        >
                                            実ボーダーを見る
                                        </a>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </CardContainer>
    );
};

export default NeighborSection;