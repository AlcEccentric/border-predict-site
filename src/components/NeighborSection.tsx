import { Chart as ChartJS, ChartOptions } from 'chart.js';
import React, { useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import { LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, InteractionItem } from 'chart.js';
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
    theme?: string;
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
    currentEventMetadata,
    theme
}) => {
    const chartRef = useRef<ChartJS<'line'>>(null);
    const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
    const [hoveredData, setHoveredData] = useState<{ 
        percentagePoint: number; 
        values: Array<{ 
            name: string; 
            value: number; 
            color: string; 
            isTarget?: boolean;
        }> 
    } | null>(null);
    
    // Create default event metadata if it's not provided
    const eventMetadata = currentEventMetadata || {
        name: "現在のイベント",
        id: 0,
        length: normalizedData.target.length,
    };
    
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

    const handleChartHover = (event: any, _elements: InteractionItem[]) => {
        const chart = chartRef.current;
        if (!chart || !event.native) return;

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.native.clientX - rect.left;

        // Get the data index at this x position (snap to nearest data point)
        const dataIndex = Math.round((x - chart.chartArea.left) / (chart.chartArea.width) * (percentagePoints.length - 1));
        
        if (dataIndex >= 0 && dataIndex < percentagePoints.length) {
            // Calculate the actual x position for the data point (snapped position)
            const snappedX = chart.chartArea.left + (dataIndex / (percentagePoints.length - 1)) * chart.chartArea.width;
            
            setCrosshairPosition({ x: snappedX, y: event.native.clientY - rect.top });
            
            // Collect all values at this point
            const values: Array<{ name: string; value: number; color: string; isTarget?: boolean }> = [];
            
            // Add target (current event) value
            if (visibleNeighbors.target && normalizedData.target[dataIndex] !== undefined) {
                values.push({
                    name: '現在のイベント',
                    value: normalizedData.target[dataIndex],
                    color: COLORS.target,
                    isTarget: true
                });
            }
            
            // Add neighbor values
            Object.entries(normalizedData.neighbors).forEach(([key, data], index) => {
                if (visibleNeighbors[key] && data[dataIndex] !== undefined) {
                    values.push({
                        name: `近傍${key}`,
                        value: data[dataIndex],
                        color: COLORS.neighbors[index]
                    });
                }
            });
            
            setHoveredData({
                percentagePoint: percentagePoints[dataIndex],
                values
            });
        } else {
            setCrosshairPosition(null);
            setHoveredData(null);
        }
    };

    const handleChartLeave = () => {
        setCrosshairPosition(null);
        setHoveredData(null);
    };

    const formatScore = (score: number): string => {
        return Math.round(score).toLocaleString();
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
                pointRadius: 0, // Remove dots
                borderWidth: 1.5, // Make line thinner
                fill: false,
            },
            ...Object.entries(normalizedData.neighbors)
                .map(([key, data], index) => ({
                    label: `近傍${key}`,
                    data: visibleNeighbors[key] ? data : [],
                    borderColor: COLORS.neighbors[index],
                    tension: 0.1,
                    pointRadius: 0, // Remove dots
                    borderWidth: 1.5, // Make line thinner
                    fill: false,
                }))
        ]
    };

    const [textColor, setTextColor] = useState('rgb(75, 85, 99)');

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const tempElement = document.createElement('div');
            tempElement.className = 'text-base-content';
            tempElement.style.position = 'absolute';
            tempElement.style.visibility = 'hidden';
            document.body.appendChild(tempElement);

            const computedStyle = getComputedStyle(tempElement);
            const color = computedStyle.color;

            document.body.removeChild(tempElement);
            setTextColor(color);
        }
    }, [theme]);

    
    const options: ExtendedChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onHover: handleChartHover,
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
                beginAtZero: false,
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
                },
                ticks: {
                    color: textColor,
                }
            },
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: 'イベント進行度 (%)',
                    color: textColor,
                },
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
                },
                ticks: {
                    callback: (value: number | string) => {
                        const index = typeof value === 'string' ? parseInt(value) : value;
                        return `${percentagePoints[index]}%`;
                    },
                    color: textColor,
                }
            }
        },
    };

    return (
        <CardContainer className="mb-4">
            <div className="flex flex-col gap-4">
                <div className="h-[600px] w-full">
                    <div className="relative w-full h-full" onMouseLeave={handleChartLeave}>
                        <Line 
                            ref={chartRef}
                            data={chartData} 
                            options={{
                                ...options,
                                plugins: {
                                    ...options.plugins,
                                    title: {
                                        ...options.plugins.title,
                                        color: textColor,
                                    },
                                    legend: {
                                        display: true,
                                        position: 'bottom',
                                        labels: {
                                            color: textColor,
                                            generateLabels: () => [{
                                                text: '予測範囲',
                                                fillStyle: 'rgba(103, 220, 209, 0.1)',
                                                strokeStyle: 'rgba(69, 120, 129, 1)',
                                                fontColor: textColor,
                                                lineWidth: 1,
                                            }]
                                        }
                                    }
                                }
                            }} 
                        />
                        
                        {/* Custom crosshair and tooltip */}
                        {crosshairPosition && hoveredData && (
                            <>
                                {/* Vertical crosshair line */}
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: crosshairPosition.x,
                                        top: 0,
                                        bottom: 90,
                                        width: 1,
                                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                        zIndex: 10
                                    }}
                                />
                                
                                {/* Custom tooltip */}
                                <div
                                    className="absolute pointer-events-none bg-base-100 border border-base-300 text-base-content rounded-lg shadow-lg p-3 z-20"
                                    style={{
                                        left: crosshairPosition.x > window.innerWidth * 0.7 
                                            ? crosshairPosition.x - 210 
                                            : crosshairPosition.x + 10,
                                        top: Math.max(crosshairPosition.y - 60, 10)
                                    }}
                                >
                                    <div className="text-sm font-semibold mb-2">
                                        {hoveredData.percentagePoint}%
                                    </div>
                                    <div className="space-y-1">
                                        {hoveredData.values.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className={item.isTarget ? 'font-semibold' : ''}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span className="font-mono">
                                                    {Math.round(item.value).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
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
                                            開催日数: {eventMetadata.length}日
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
                                    href={`https://mltd.matsurihi.me/events/${eventMetadata.id}`}
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
                                                {neighbor.length !== eventMetadata.length && (
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