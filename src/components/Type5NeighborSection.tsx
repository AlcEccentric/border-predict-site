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
    eventName: string; // Add event name for subtitle
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
    theme,
    eventName
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
    
    // Track window width for responsive behavior
    const [isMobile, setIsMobile] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    
    React.useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            setIsMobile(width < 640);
            setWindowWidth(width); // Track window width for chart re-renders
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get current idol data
    const currentIdolData = idolPredictions.get(selectedIdol);
    if (!currentIdolData) return null;

    // Check which borders have data
    const hasBorder100 = !!currentIdolData.prediction100;
    const hasBorder1000 = !!currentIdolData.prediction1000;
    
    // If no data for any border, return null
    if (!hasBorder100 && !hasBorder1000) return null;
    
    // Set default active border to the first available one
    React.useEffect(() => {
        if (hasBorder100 && !hasBorder1000 && activeBorder === '1000') {
            setActiveBorder('100');
        } else if (!hasBorder100 && hasBorder1000 && activeBorder === '100') {
            setActiveBorder('1000');
        }
    }, [hasBorder100, hasBorder1000, activeBorder]);

    const currentPrediction = activeBorder === '100' 
        ? currentIdolData.prediction100 
        : currentIdolData.prediction1000;

    const formatScore = (score: number): string => {
        return Math.round(score).toLocaleString();
    };

    // Japanese number formatting function
    const formatJapaneseNumber = React.useCallback((value: number): string => {
        if (value >= 100000000) { // 1億以上
            return Math.round(value / 100000000) + '億';
        } else if (value >= 10000) { // 1万以上
            return Math.round(value / 10000) + '万';
        } else if (value >= 1000) { // 1000以上
            return Math.round(value / 1000) + '千';
        } else {
            return Math.round(value).toString();
        }
    }, []);

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
                pointRadius: 0, // Remove dots
                borderWidth: 1.5, // Make line thinner
                fill: false,
            },
            ...Object.entries(currentPrediction.data.normalized.neighbors)
                .map(([key, data], index) => ({
                    label: `近傍${key} - ${currentPrediction.metadata.normalized.neighbors[key].name} (${currentPrediction.metadata.normalized.neighbors[key].idol_id ? getIdolName(currentPrediction.metadata.normalized.neighbors[key].idol_id) : 'Unknown'})`,
                    data: visibleNeighbors[key] ? data : [],
                    borderColor: COLORS.neighbors[index],
                    tension: 0.1,
                    pointRadius: 0, // Remove dots
                    borderWidth: 1.5, // Make line thinner
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
                    text: `${eventName} - ${getIdolName(selectedIdol)} - ${activeBorder}位 正規化されたスコア推移`,
                    padding: {
                        bottom: 10
                    },
                    color: getTextColor(), // Use theme-appropriate text color
                    font: {
                        size: isMobile ? 12 : 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '正規化されたスコア',
                        color: getTextColor(), // Use theme-appropriate text color
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    ticks: {
                        color: getTextColor(), // Use theme-appropriate text color
                        font: {
                            size: isMobile ? 9 : 10
                        },
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
                        text: 'イベント進行度 (%)',
                        color: getTextColor(), // Use theme-appropriate text color
                        font: {
                            size: isMobile ? 10 : 12
                        }
                    },
                    ticks: {
                        color: getTextColor(), // Use theme-appropriate text color
                        font: {
                            size: isMobile ? 9 : 10
                        },
                        // Only reduce ticks on mobile
                        ...(isMobile && { maxTicksLimit: 6 }),
                        callback: (value: number | string) => {
                            const index = typeof value === 'string' ? parseInt(value) : value;
                            return `${percentagePoints[index]}%`;
                        }
                    }
                }
            },
        };
    }, [selectedIdol, activeBorder, currentPrediction, percentagePoints, handleChartHover, theme, isMobile, windowWidth]); // Add theme to dependencies

    return (
        <CardContainer className="mb-4">
            <div className="flex flex-col gap-4">
                {/* Controls */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Border Selector - Only show available borders */}
                        <div className="flex-1 min-w-0">
                            <label className="label">
                                <span className="label-text">ボーダー選択</span>
                            </label>
                            <div className="join w-full">
                                {hasBorder100 && (
                                    <button
                                        className={`btn join-item ${hasBorder1000 ? 'flex-1' : 'w-full'} ${activeBorder === '100' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setActiveBorder('100')}
                                    >
                                        100位
                                    </button>
                                )}
                                {hasBorder1000 && (
                                    <button
                                        className={`btn join-item ${hasBorder100 ? 'flex-1' : 'w-full'} ${activeBorder === '1000' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setActiveBorder('1000')}
                                    >
                                        1000位
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="relative h-[300px] sm:h-[500px] md:h-[600px] w-full" onMouseLeave={handleChartLeave}>
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
                                    top: (() => {
                                        if (window.innerWidth < 640) return '8%'; // h-[300px]
                                        if (window.innerWidth < 768) return '5.2%';  // sm:h-[500px] 
                                        return '4.5%'; // md:h-[600px]
                                    })(),
                                    height: (() => {
                                        if (window.innerWidth < 640) return '77%'; // h-[300px]
                                        if (window.innerWidth < 768) return '83%'; // sm:h-[500px]
                                        return '85.5%'; // md:h-[600px]
                                    })(),
                                    width: 1,
                                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                    zIndex: 10
                                }}
                            />
                            
                            {/* Intersection dots */}
                            {hoveredData.values.map((item, index) => {
                                const chart = chartRef.current;
                                if (!chart) return null;
                                
                                // Calculate the y position for this data point
                                const yValue = item.value;
                                const yMin = chart.scales.y.min;
                                const yMax = chart.scales.y.max;
                                const yPixel = chart.chartArea.bottom - ((yValue - yMin) / (yMax - yMin)) * chart.chartArea.height;
                                
                                return (
                                    <div
                                        key={index}
                                        className="absolute pointer-events-none rounded-full"
                                        style={{
                                            left: crosshairPosition.x - 8, // Center the 16px dot (larger than main chart)
                                            top: yPixel - 8, // Center the 16px dot
                                            width: 16, // Larger dot for neighbor view
                                            height: 16,
                                            backgroundColor: item.color,
                                            border: '3px solid white', // Thicker border
                                            zIndex: 15
                                        }}
                                    />
                                );
                            })}
                            
                            {/* Custom tooltip */}
                            <div
                                className="absolute pointer-events-none bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 z-20 min-w-[120px] sm:min-w-[280px] max-w-[90vw]"
                                style={{
                                    left: (() => {
                                        const tooltipWidth = isMobile ? 120 : 280;
                                        const chartWidth = chartRef.current?.chartArea?.right - chartRef.current?.chartArea?.left || 800;
                                        
                                        // Create more space between crosshair and tooltip
                                        if (isMobile) {
                                            // On mobile, be more aggressive about positioning
                                            const containerWidth = window.innerWidth;
                                            const spaceOnLeft = crosshairPosition.x;
                                            const spaceOnRight = containerWidth - crosshairPosition.x;
                                            
                                            // If there's enough space on the left, use it
                                            if (spaceOnLeft > tooltipWidth + 40) {
                                                return crosshairPosition.x - tooltipWidth - 30;
                                            }
                                            // If there's enough space on the right, use it
                                            else if (spaceOnRight > tooltipWidth + 40) {
                                                return crosshairPosition.x + 30;
                                            }
                                            // Otherwise, center it away from edges
                                            else {
                                                return Math.max(10, Math.min(
                                                    containerWidth - tooltipWidth - 10,
                                                    crosshairPosition.x - tooltipWidth / 2
                                                ));
                                            }
                                        }
                                        
                                        // On desktop, check if we're approaching the right end
                                        const chartAreaLeft = chartRef.current?.chartArea?.left || 0;
                                        const relativeX = crosshairPosition.x - chartAreaLeft;
                                        const isNearRightEnd = relativeX > chartWidth * 0.7; // If we're in the right 30% of the chart
                                        
                                        if (isNearRightEnd) {
                                            // Position tooltip to the left of crosshair
                                            return Math.max(10, crosshairPosition.x - tooltipWidth - 140);
                                        } else {
                                            // Position tooltip to the right of crosshair
                                            return crosshairPosition.x + 25;
                                        }
                                    })(),
                                    top: 50
                                }}
                            >
                                <div className="text-sm font-semibold mb-2 text-center border-b border-base-300 pb-1">
                                    {hoveredData.percentagePoint}%進行時点
                                </div>
                                <div className="space-y-1">
                                    {hoveredData.values.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className={`${item.isTarget ? 'font-semibold' : ''} truncate`}>
                                                    <span className="hidden sm:inline">{item.name}</span>
                                                    <span className="sm:hidden">
                                                        {item.isTarget ? '進行中' : `近傍${item.name.match(/近傍(\d+)/)?.[1] || ''}`}
                                                    </span>
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
                
                {/* Neighbors List */}
                <div className="bg-base-100 rounded-xl p-4">
                    <h3 className="text-lg font-bold mb-4">近傍イベント</h3>
                    <ul className="w-full p-0 gap-2 space-y-2">
                        <li>
                            <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg hover:bg-base-200">
                                <div className="flex-1 min-w-0">
                                    {/* Mobile layout */}
                                    <div className="block sm:hidden">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getIdolColor(selectedIdol) }} />
                                                <span>進行中 - {getIdolName(selectedIdol)}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary toggle-sm"
                                                checked={visibleNeighbors.target}
                                                onChange={() => toggleNeighbor('target')}
                                            />
                                        </div>
                                        <div className="text-sm text-base-content/70 mt-1 ml-5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{currentPrediction.metadata.raw.name}</span>
                                                <a
                                                    href={`https://mltd.matsurihi.me/events/${currentPrediction.metadata.raw.id}#chart-idol`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:text-primary-focus underline font-medium"
                                                >
                                                    実ボーダー
                                                </a>
                                            </div>
                                        </div>
                                        <div className="text-sm text-base-content/70 mt-1 ml-5">
                                            <span>最終予測スコア: {formatScore(currentPrediction.data.normalized.target[currentPrediction.data.normalized.target.length - 1])}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Desktop layout */}
                                    <div className="hidden sm:block">
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getIdolColor(selectedIdol) }} />
                                            進行中 - {currentPrediction.metadata.raw.name} ({getIdolName(selectedIdol)})
                                        </div>
                                        <div className="text-xs text-base-content/70 mt-1">
                                            最終予測スコア: {formatScore(currentPrediction.data.normalized.target[currentPrediction.data.normalized.target.length - 1])}
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 justify-end shrink-0">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-sm"
                                        checked={visibleNeighbors.target}
                                        onChange={() => toggleNeighbor('target')}
                                    />                                    
                                    <a
                                        href={`https://mltd.matsurihi.me/events/${currentPrediction.metadata.raw.id}#chart-idol`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-xs btn-outline btn-primary shrink-0"
                                    >
                                        実ボーダー
                                    </a>
                                </div>
                            </div>
                        </li>
                        {Object.entries(currentPrediction.metadata.normalized.neighbors).map(([key, neighbor], index) => (
                            <li key={key}>
                                <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg hover:bg-base-200">
                                    <div className="flex-1 min-w-0">
                                        {/* Mobile layout */}
                                        <div className="block sm:hidden">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.neighbors[index] }} />
                                                    <span>近傍{key} - {neighbor.idol_id ? getIdolName(neighbor.idol_id) : 'Unknown'}</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-primary toggle-sm"
                                                    checked={visibleNeighbors[key] ?? true}
                                                    onChange={() => toggleNeighbor(key)}
                                                />
                                            </div>
                                            <div className="text-sm text-base-content/70 mt-1 ml-5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{neighbor.name}</span>
                                                    <a
                                                        href={`https://mltd.matsurihi.me/events/${neighbor.id}#chart-idol`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:text-primary-focus underline font-medium"
                                                    >
                                                        実ボーダー
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="text-sm text-base-content/70 mt-1 ml-5">
                                                <span>最終スコア: {formatScore(currentPrediction.data.normalized.neighbors[key][currentPrediction.data.normalized.neighbors[key].length - 1])}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Desktop layout */}
                                        <div className="hidden sm:block">
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.neighbors[index] }} />
                                                近傍{key} - {neighbor.name} ({neighbor.idol_id ? getIdolName(neighbor.idol_id) : 'Unknown'})
                                            </div>
                                            <div className="text-xs text-base-content/70 mt-1">
                                                最終スコア: {formatScore(currentPrediction.data.normalized.neighbors[key][currentPrediction.data.normalized.neighbors[key].length - 1])}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden sm:flex items-center gap-2 justify-end shrink-0">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary toggle-sm"
                                            checked={visibleNeighbors[key] ?? true}
                                            onChange={() => toggleNeighbor(key)}
                                        />
                                        <a
                                            href={`https://mltd.matsurihi.me/events/${neighbor.id}#chart-idol`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-xs btn-outline btn-primary shrink-0"
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

export default Type5NeighborSection;
