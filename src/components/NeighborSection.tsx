import { Chart as ChartJS, ChartOptions } from 'chart.js';
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import { LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip } from 'chart.js';
import CardContainer from './CardContainer';
import { EventMetadata } from '../types';
import { AlertTriangle } from 'lucide-react';

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
            length: number;
        };
    };
    currentEventMetadata: EventMetadata;
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
    currentEventMetadata
}) => {
    const [popoverIndex, setPopoverIndex] = useState<number | null>(null);
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
                            <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-base-200">
                                <div className="w-12 h-12 rounded flex-shrink-0" style={{ backgroundColor: COLORS.target }} />
                                <div className="w-80">
                                    <span className="font-medium truncate block">現在のイベント</span>
                                    <div className="flex gap-4 mt-1 text-sm text-base-content/70">
                                        <span>
                                            開催日数: {currentEventMetadata.length}日
                                        </span>
                                        <span>
                                            最終スコア: {formatScore(normalizedData.target[normalizedData.target.length - 1])}
                                        </span>
                                    </div>
                                </div>
                                <span className="flex-1" />
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-md"
                                    checked={visibleNeighbors.target}
                                    onChange={() => toggleNeighbor('target')}
                                />
                                <a
                                    href={`https://mltd.matsurihi.me/events/${currentEventMetadata.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline btn-primary"
                                >
                                    実ボーダーを見る
                                </a>
                            </div>
                        </li>
                        {Object.entries(neighborMetadata).map(([key, neighbor], index) => (
                            <li key={key}>
                                <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-base-200">
                                    <div className="w-12 h-12 rounded flex-shrink-0" style={{ backgroundColor: COLORS.neighbors[index] }} />
                                    <div className="w-80">
                                        <span className="w-40 font-medium truncate">近傍{key}：{neighbor.name}</span>
                                        <div className="flex gap-4 mt-1 text-sm text-base-content/70">
                                            <span>
                                                開催日数: {neighbor.length}日
                                            </span>
                                            <span>
                                                最終スコア: {formatScore(normalizedData.neighbors[key][normalizedData.neighbors[key].length - 1])}
                                                {neighbor.length !== currentEventMetadata.length && (
                                                    <span
                                                        className="relative inline-flex items-center cursor-pointer select-none ml-2"
                                                        onMouseEnter={() => setPopoverIndex(index)}
                                                        onMouseLeave={() => setPopoverIndex(null)}
                                                        onClick={() => setPopoverIndex(popoverIndex === index ? null : index)}
                                                    >
                                                        <AlertTriangle size={16} className="text-warning" />
                                                        <span className="ml-1 text-xs text-warning font-bold">注意</span>
                                                        {popoverIndex === index && (
                                                            <span className="absolute left-0 top-full z-50 mt-2 w-96 rounded bg-base-200 p-2 text-xs text-base-content shadow-lg border border-base-300">
                                                                このスコアは <b>正規化</b> されています。<br />
                                                                <span className="text-error font-bold">比較する場合は、同じ開催日数のイベントのデータがより参考になります。</span><br />
                                                                詳しくはページ下部の「解説」内「スコアの正規化方法について」をご覧ください。
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            
                                            </span>
                                        </div>
                                        
                                    </div>
                                    
                                    <span className="flex-1" /> {/* Spacer */}
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-md"
                                        checked={visibleNeighbors[key]}
                                        onChange={() => toggleNeighbor(key)}
                                    />
                                    <a
                                        href={`https://mltd.matsurihi.me/events/${neighbor.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline btn-primary"
                                    >
                                        実ボーダーを見る
                                    </a>
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