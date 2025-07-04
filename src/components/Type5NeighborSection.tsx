import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions, InteractionItem } from 'chart.js';
import CardContainer from './CardContainer';
import { IdolPredictionData } from '../types';
import { getIdolName, getIdolColor } from '../utils/idolData';

interface Type5NeighborSectionProps {
    idolPredictions: Map<number, IdolPredictionData>;
    selectedIdol: number;
    theme: string; // Add theme prop to trigger re-renders when theme changes
}

const COLORS = {
    target: '#8884d8',
    neighbors: ['#82ca9d', '#ffc658', '#ff7300', '#0088fe']
};

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
                box1: {
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

const Type5NeighborSection: React.FC<Type5NeighborSectionProps> = ({
    idolPredictions,
    selectedIdol,
    theme
}) => {
    const chartRef = useRef<any>(null);
    const [activeBorder, setActiveBorder] = useState<'100' | '1000'>('100');
    const [visibleNeighbors, setVisibleNeighbors] = useState<{ [key: string]: boolean }>({
        target: false,
    });
    const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; dataIndex: number } | null>(null);
    const [hoveredData, setHoveredData] = useState<{ 
        percentagePoint: number; 
        values: Array<{ 
            name: string; 
            value: number; 
            color: string; 
            isTarget?: boolean;
        }> 
    } | null>(null);

    // Get current idol data
    const currentIdolData = idolPredictions.get(selectedIdol);
    if (!currentIdolData) return null;

    const currentPrediction = activeBorder === '100' 
        ? currentIdolData.prediction100 
        : currentIdolData.prediction1000;

    const formatScore = (score: number): string => {
        return score.toLocaleString();
    };

    if (!currentPrediction) return null;

    const percentagePoints = useMemo(() => 
        currentPrediction.data.normalized.target.map((_, index) => 
            Math.round((index / (currentPrediction.data.normalized.target.length - 1)) * 100)
        ),
        [currentPrediction]
    );

    // Initialize visible neighbors when component mounts or when switching idols/borders
    React.useEffect(() => {
        if (currentPrediction) {
            const initialVisibility = Object.keys(currentPrediction.data.normalized.neighbors).reduce((acc, key) => ({
                ...acc,
                [key]: true
            }), { target: true });
            setVisibleNeighbors(initialVisibility);
        } else {
            setVisibleNeighbors({ target: false }); // Ensure controlled state even if currentPrediction is undefined
        }
    }, [selectedIdol, activeBorder, currentPrediction]);

    const toggleNeighbor = (key: string) => {
        setVisibleNeighbors(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleChartHover = useCallback((event: any, _elements: InteractionItem[]) => {
        const chart = chartRef.current;
        if (!chart || !event.native) return;

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.native.clientX - rect.left;

        // Get the data index at this x position (snap to nearest data point)
        const dataIndex = Math.round((x - chart.chartArea.left) / (chart.chartArea.width) * (percentagePoints.length - 1));
        
        if (dataIndex >= 0 && dataIndex < percentagePoints.length) {
            // Calculate the actual x position for the data point (snapped position)
            const snappedX = chart.chartArea.left + (dataIndex / (percentagePoints.length - 1)) * chart.chartArea.width;
            
            setCrosshairPosition({ x: snappedX, dataIndex });
            
            // Collect all values at this point
            const values: Array<{ name: string; value: number; color: string; isTarget?: boolean }> = [];
            
            // Add target (current event) value
            if (visibleNeighbors.target && currentPrediction.data.normalized.target[dataIndex] !== undefined) {
                values.push({
                    name: `進行中 - ${currentPrediction.metadata.raw.name} - ${getIdolName(selectedIdol)}`,
                    value: currentPrediction.data.normalized.target[dataIndex],
                    color: getIdolColor(selectedIdol),
                    isTarget: true
                });
            }
            
            // Add neighbor values
            Object.entries(currentPrediction.data.normalized.neighbors).forEach(([key, data], index) => {
                if (visibleNeighbors[key] && data[dataIndex] !== undefined) {
                    const neighbor = currentPrediction.metadata.normalized.neighbors[key];
                    values.push({
                        name: `近傍${key} - ${neighbor.name} (${neighbor.idol_id ? getIdolName(neighbor.idol_id) : 'Unknown'})`,
                        value: data[dataIndex],
                        color: COLORS.neighbors[index]
                    });
                }
            });

            setHoveredData({
                percentagePoint: percentagePoints[dataIndex],
                values: values.sort((a, b) => b.value - a.value)
            });
        } else {
            setCrosshairPosition(null);
            setHoveredData(null);
        }
    }, [percentagePoints, visibleNeighbors, currentPrediction, selectedIdol]);

    const handleChartLeave = useCallback(() => {
        setCrosshairPosition(null);
        setHoveredData(null);
    }, []);

    if (!currentPrediction) return null;

    const chartData = useMemo(() => ({
        labels: percentagePoints,
        datasets: [
            {
                label: `進行中 - ${currentPrediction.metadata.raw.name} - ${getIdolName(selectedIdol)}`,
                data: visibleNeighbors.target ? currentPrediction.data.normalized.target : [],
                borderColor: getIdolColor(selectedIdol),
                tension: 0.1,
                pointRadius: 3,
                fill: false,
            },
            ...Object.entries(currentPrediction.data.normalized.neighbors)
                .map(([key, data], index) => ({
                    label: `近傍${key} - ${currentPrediction.metadata.normalized.neighbors[key].name} (${currentPrediction.metadata.normalized.neighbors[key].idol_id ? getIdolName(currentPrediction.metadata.normalized.neighbors[key].idol_id) : 'Unknown'})`,
                    data: visibleNeighbors[key] ? data : [],
                    borderColor: COLORS.neighbors[index],
                    tension: 0.1,
                    pointRadius: 3,
                    fill: false,
                }))
        ]
    }), [percentagePoints, selectedIdol, currentPrediction, visibleNeighbors, theme]); // Add theme to dependencies

    const options: ExtendedChartOptions = useMemo(() => {
        // Get the theme-appropriate text color
        const getTextColor = () => {
            if (typeof window !== 'undefined') {
                try {
                    const tempElement = document.createElement('div');
                    tempElement.className = 'text-base-content';
                    tempElement.style.position = 'absolute';
                    tempElement.style.visibility = 'hidden';
                    document.body.appendChild(tempElement);
                    
                    const computedStyle = getComputedStyle(tempElement);
                    const color = computedStyle.color;
                    
                    document.body.removeChild(tempElement);
                    
                    return color || '#000000'; // fallback to black
                } catch (error) {
                    console.warn('Failed to get computed text color:', error);
                    return '#000000'; // fallback to black
                }
            }
            return '#000000'; // fallback for SSR
        };

        return {
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
                            xMin: currentPrediction.metadata.normalized.last_known_step_index,
                            xMax: currentPrediction.metadata.normalized.last_known_step_index,
                            borderColor: 'rgb(255, 99, 132)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                        },
                        box1: {
                            type: 'box',
                            xMin: currentPrediction.metadata.normalized.last_known_step_index,
                            xMax: currentPrediction.data.normalized.target.length - 1,
                            backgroundColor: 'rgba(103, 220, 209, 0.1)',
                            borderColor: 'rgba(200, 200, 200, 0.2)',
                        }
                    }
                },
                title: {
                    display: true,
                    text: `${getIdolName(selectedIdol)} - ${activeBorder}位 正規化されたスコア推移`,
                    padding: {
                        bottom: 10
                    },
                    color: getTextColor() // Use theme-appropriate text color
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '正規化されたスコア',
                        color: getTextColor() // Use theme-appropriate text color
                    },
                    ticks: {
                        color: getTextColor() // Use theme-appropriate text color
                    }
                },
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'イベント進行度 (%)',
                        color: getTextColor() // Use theme-appropriate text color
                    },
                    ticks: {
                        color: getTextColor(), // Use theme-appropriate text color
                        callback: (value: number | string) => {
                            const index = typeof value === 'string' ? parseInt(value) : value;
                            return `${percentagePoints[index]}%`;
                        }
                    }
                }
            },
        };
    }, [selectedIdol, activeBorder, currentPrediction, percentagePoints, handleChartHover, theme]); // Add theme to dependencies

    return (
        <CardContainer className="mb-4">
            <div className="flex flex-col gap-4">
                {/* Controls */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Border Selector */}
                        <div className="flex-1 min-w-0">
                            <label className="label">
                                <span className="label-text">ボーダー選択</span>
                            </label>
                            <div className="join w-full">
                                <button
                                    className={`btn join-item flex-1 ${activeBorder === '100' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setActiveBorder('100')}
                                >
                                    100位
                                </button>
                                <button
                                    className={`btn join-item flex-1 ${activeBorder === '1000' ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setActiveBorder('1000')}
                                >
                                    1000位
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="relative h-[400px] w-full" onMouseLeave={handleChartLeave}>
                    <Line 
                        ref={chartRef}
                        data={chartData} 
                        options={options} 
                    />
                    
                    {/* Custom crosshair and tooltip */}
                    {crosshairPosition && hoveredData && (
                        <>
                            {/* Vertical crosshair line */}
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: crosshairPosition.x,
                                    top: '6%', // Adjusted to better align with chart area
                                    height: '81.5%', // Adjusted height to cover chart area properly
                                    width: 1,
                                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                    zIndex: 10
                                }}
                            />
                            
                            {/* Custom tooltip */}
                            <div
                                className="absolute pointer-events-none bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 z-20 min-w-[280px] max-w-sm" // Made wider
                                style={{
                                    left: crosshairPosition.x > (chartRef.current?.canvas?.width || 800) * 0.75 // Adjusted threshold
                                      ? crosshairPosition.x - 360  // Show further left when near right edge  
                                      : crosshairPosition.x + 10,  // Show on right normally
                                    top: 50
                                }}
                            >
                                <div className="text-sm font-semibold mb-2 text-center border-b border-base-300 pb-1">
                                    {hoveredData.percentagePoint}%進行時点
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
                                                {item.value.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Neighbors List */}
                <div className="bg-base-100 rounded-xl p-4">
                    <h3 className="text-lg font-bold mb-4">近傍イベント</h3>
                    <ul className="w-full p-0 gap-2">
                        <li>
                            <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-base-200">
                                <div className="w-12 h-12 rounded flex-shrink-0" style={{ backgroundColor: getIdolColor(selectedIdol) }} />
                                <div className="w-80">
                                    <span className="font-medium truncate block">進行中 - {currentPrediction.metadata.raw.name} - ({getIdolName(selectedIdol)})</span>
                                    <div className="flex gap-4 mt-1 text-sm text-base-content/70">
                                        <span>
                                            イベントID: {currentPrediction.metadata.raw.id}
                                        </span>
                                        <span>
                                            最終スコア: {formatScore(currentPrediction.data.normalized.target[currentPrediction.data.normalized.target.length - 1])}
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
                                    href={`https://mltd.matsurihi.me/events/${currentPrediction.metadata.raw.id}#chart-idol`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline btn-primary"
                                >
                                    実ボーダーを見る
                                </a>
                            </div>
                        </li>
                        {Object.entries(currentPrediction.metadata.normalized.neighbors).map(([key, neighbor], index) => (
                            <li key={key}>
                                <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-base-200">
                                    <div className="w-12 h-12 rounded flex-shrink-0" style={{ backgroundColor: COLORS.neighbors[index] }} />
                                    <div className="w-80">
                                        <span className="w-40 font-medium truncate">近傍{key} - {neighbor.name} ({neighbor.idol_id ? getIdolName(neighbor.idol_id) : 'Unknown'})</span>
                                        <div className="flex gap-4 mt-1 text-sm text-base-content/70">
                                            <span>
                                                イベントID: {neighbor.id}
                                            </span>
                                            <span>
                                                最終スコア: {formatScore(currentPrediction.data.normalized.neighbors[key][currentPrediction.data.normalized.neighbors[key].length - 1])}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <span className="flex-1" />
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-md"
                                        checked={visibleNeighbors[key] ?? true}
                                        onChange={() => toggleNeighbor(key)}
                                    />
                                    <a
                                        href={`https://mltd.matsurihi.me/events/${neighbor.id}#chart-idol`}
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

export default Type5NeighborSection;
