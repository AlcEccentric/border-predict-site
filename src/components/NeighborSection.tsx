import { Chart as ChartJS, ChartOptions } from 'chart.js';
import React, { useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import { LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, InteractionItem } from 'chart.js';
import CardContainer from './CardContainer';
import { EventMetadata, NeighborMetadata } from '../types';
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
        [key: string]: NeighborMetadata;
    };
    currentEventMetadata: EventMetadata;
    theme?: string;
}

const COLORS = {
    target: '#8884d8',
    neighbors: [
        '#43a047', // 1st neighbor (green)
        '#fbc02d', // 2nd neighbor (yellow)
        '#e64a19', // 3rd neighbor (red-orange)
        '#0088fe', // 4th neighbor (blue)
        '#c2185b', // 5th neighbor (magenta)
        '#7b1fa2', // 6th neighbor (purple)
        '#00bcd4', // 7th neighbor (cyan)
        '#ff9800', // 8th neighbor (orange)
        '#d32f2f', // 9th neighbor (red)
        '#4caf50', // 10th neighbor (light green)
    ]
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
    // Helper to display normalization warning
    const renderNormalizationWarning = (length: number, popoverIndex: number | null, setPopoverIndex: (idx: number | null) => void, idx: number) => {
        if (Number(length) === 349) return null;
        return (
            <span
                className="relative inline-flex items-center cursor-pointer select-none"
                onMouseEnter={() => setPopoverIndex(idx)}
                onMouseLeave={() => setPopoverIndex(null)}
            >
                <AlertTriangle size={12} className="text-warning" />
                <span className="ml-1 text-xs text-warning font-bold">正規化された</span>
                {popoverIndex === idx && (
                    <span className="absolute -left-8 top-full z-50 mt-2 w-56 sm:w-72 rounded bg-base-200 p-2 text-xs text-base-content shadow-lg border border-base-300">
                        このスコアは <b>正規化</b> されています。<br />
                        <span className="text-error font-bold">7.25日（349区間）を基準に正規化しています。表示値はメインチャートの予測値とは異なります。予測はメインチャートをご利用ください。</span><br />
                        詳しくはページ下部の「解説」内「スコアの正規化方法について」をご覧ください。
                    </span>
                )}
            </span>
        );
    };
    function getTopPercent() {
        if (window.innerWidth < 640) return '7.2%';
        if (window.innerWidth < 768) return '4.8%';
        return '3.8%';
    }
    function getHeightPercent() {
        if (window.innerWidth < 640) return '62.5%';
        if (window.innerWidth < 768) return '75.7%';
        return '80.1%';
    }
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
            let values: Array<{ name: string; value: number; color: string; isTarget?: boolean }> = [];

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

            // Sort neighbors by value descending, keep target always on top
            const target = values.find(v => v.isTarget);
            const neighborsSorted = values.filter(v => !v.isTarget).sort((a, b) => b.value - a.value);
            values = target ? [target, ...neighborsSorted] : neighborsSorted;

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

    // Japanese number formatting function
    const formatJapaneseNumber = React.useCallback((value: number): string => {
        if (value >= 100000000) { // 1億以上
            return Math.round(value / 100000000) + '億';
        } else if (value >= 10000) { // 1万以上
            return Math.round(value / 10000) + '万';
        } else if (value >= 1000) { // 1000以上
            return Math.round(value / 1000) + 'K';
        } else {
            return Math.round(value).toString();
        }
    }, []);

    // Calculate crosshair index for dot placement
    let crosshairIndex: number | null = null;
    if (crosshairPosition && chartRef.current) {
        // Find closest index to crosshair x
        const chart = chartRef.current;
        const chartArea = chart.chartArea;
        if (chartArea) {
            const relX = crosshairPosition.x - chartArea.left;
            const percent = relX / chartArea.width;
            const idx = Math.round(percent * (normalizedData.target.length - 1));
            if (idx >= 0 && idx < normalizedData.target.length) {
                crosshairIndex = idx;
            }
        }
    }

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
                pointRadius: normalizedData.target.map((_, idx) => (crosshairIndex !== null && crosshairIndex === idx ? 4 : 0)), // Small dot for all
                pointBackgroundColor: COLORS.target,
                borderWidth: 3,
                borderDash: [], // Solid line for current
                fill: false,
            },
            ...Object.entries(normalizedData.neighbors)
                .map(([key, data], index) => ({
                    label: `近傍${key}`,
                    data: visibleNeighbors[key] ? data : [],
                    borderColor: COLORS.neighbors[index],
                    tension: 0.1,
                    pointRadius: data.map((_, idx) => (crosshairIndex !== null && crosshairIndex === idx ? 4 : 0)), // Small dot for all
                    pointBackgroundColor: COLORS.neighbors[index],
                    borderWidth: 1.5,
                    borderDash: [6, 4], // Dashed line for neighbors
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
                    callback: function(value: number | string) {
                        const numValue = typeof value === 'string' ? parseFloat(value) : value;
                        return formatJapaneseNumber(numValue);
                    }
                }
            },
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: 'イベント進行度',
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
                <div className="h-[320px] sm:h-[500px] md:h-[600px] w-full">
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
                                        top: getTopPercent(),
                                        height: getHeightPercent(),
                                        width: 1,
                                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                        zIndex: 10
                                    }}
                                />
                                
                                {/* Custom tooltip */}
                                <div
                                    className="absolute pointer-events-none bg-base-100 border border-base-300 text-base-content rounded-lg shadow-lg p-3 z-20 min-w-[160px] sm:min-w-[200px] max-w-[90vw]"
                                    style={{
                                        left: (() => {
                                            // Tooltip width for mobile and desktop
                                            const tooltipWidth = window.innerWidth < 640 ? 140 : 200;
                                            const containerWidth = window.innerWidth;
                                            // If cursor is near left edge, show tooltip on right
                                            if (crosshairPosition.x < tooltipWidth + 20) {
                                                return crosshairPosition.x + 20;
                                            }
                                            // If cursor is near right edge, show tooltip on left
                                            if (crosshairPosition.x > containerWidth - tooltipWidth - 20) {
                                                return crosshairPosition.x - tooltipWidth - 30;
                                            }
                                            // Otherwise, default to left of crosshair
                                            return crosshairPosition.x - tooltipWidth - 30;
                                        })(),
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
                                                    <span className={`${item.isTarget ? 'font-semibold' : ''} truncate`}>
                                                        {item.isTarget ? '現在' : item.name}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-xs">
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
                    <ul className="w-full p-0 gap-2 space-y-2">
                        <li>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-base-200 rounded-lg hover:bg-base-200">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.target }} />
                                        <span className="sm:hidden">現在のイベント</span>
                                        <span className="hidden sm:inline">現在のイベント：{eventMetadata.name}</span>
                                    </div>
                                    <div className="text-sm text-base-content/70 sm:hidden ml-5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            maxWidth: '100%',
                                            whiteSpace: 'normal',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            verticalAlign: 'bottom',
                                        }}>{eventMetadata.name}</span>
                                    </div>
                                    <div className="text-sm text-base-content/70 mt-1 sm:ml-0 ml-5">
                                        <div className="flex flex-wrap gap-2">
                                            <span>開催日数: {((eventMetadata.length - 1) * 30 / (24 * 60)).toFixed(2)}日</span>
                                            <span className="flex flex-row flex-wrap items-center gap-1 min-w-0">
                                                <span className="truncate block max-w-full">最終スコア: {formatScore(normalizedData.target[normalizedData.target.length - 1])}</span>
                                                {renderNormalizationWarning(eventMetadata.length, popoverIndex, setPopoverIndex, -1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-sm"
                                        checked={visibleNeighbors.target}
                                        onChange={() => toggleNeighbor('target')}
                                    />
                                    <a
                                        href={`https://mltd.matsurihi.me/events/${eventMetadata.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-xs btn-outline btn-primary"
                                    >
                                        実ボーダー
                                    </a>
                                </div>
                            </div>
                        </li>
                        {Object.entries(neighborMetadata).map(([key, neighbor], index) => (
                            <li key={key}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-base-200 rounded-lg hover:bg-base-200">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.neighbors[index] }} />
                                            <span className="sm:hidden">近傍{key}</span>
                                            <span className="hidden sm:inline">近傍{key}：{neighbor.name}</span>
                                        </div>
                                        <div className="text-sm text-base-content/70 sm:hidden ml-5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                maxWidth: '100%',
                                                whiteSpace: 'normal',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                verticalAlign: 'bottom',
                                            }}>{neighbor.name}</span>
                                        </div>
                                        <div className="text-sm text-base-content/70 mt-1 sm:ml-0 ml-5">
                                            <div className="flex flex-wrap gap-2">
                                                <span>開催日数: {((neighbor.raw_length - 1) * 30 / (24 * 60)).toFixed(2)}日</span>
                                                <span className="flex flex-row flex-wrap items-center gap-1 min-w-0">
                                                    <span className="truncate block max-w-full">最終スコア: {formatScore(normalizedData.neighbors[key][normalizedData.neighbors[key].length - 1])}</span>
                                                    {renderNormalizationWarning(neighbor.raw_length, popoverIndex, setPopoverIndex, index)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary toggle-sm"
                                            checked={visibleNeighbors[key]}
                                            onChange={() => toggleNeighbor(key)}
                                        />
                                        <a
                                            href={`https://mltd.matsurihi.me/events/${neighbor.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-xs btn-outline btn-primary"
                                        >
                                            実ボーダー
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