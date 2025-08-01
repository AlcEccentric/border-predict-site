import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions, InteractionItem } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart as ChartJS } from 'chart.js';
import { getRelativePosition } from 'chart.js/helpers';
import CardContainer from './CardContainer';
import { IdolPredictionData } from '../types';
import { getIdolName, getIdolColor } from '../utils/idolData';

// Register the zoom plugin
ChartJS.register(zoomPlugin);

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
    const [isPanning, setIsPanning] = useState(false);
    
    // Range selection state
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
    const [selectionRect, setSelectionRect] = useState<{ x: number; width: number } | null>(null);
    
    // Zoom state to persist across re-renders
    const [zoomState, setZoomState] = useState<{ min: number; max: number } | null>(null);
    
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

    // Apply zoom state when chart is ready
    React.useEffect(() => {
        if (chartRef.current && zoomState) {
            const chart = chartRef.current;
            console.log('Applying zoom state:', zoomState);
            
            // Use the chartjs-plugin-zoom's zoomScale method
            try {
                console.log('Attempting to use zoomScale method');
                (chart as any).zoomScale('x', { min: zoomState.min, max: zoomState.max }, 'none');
                console.log('zoomScale method succeeded');
            } catch (error) {
                console.log('zoomScale method failed:', error);
                
                // Fallback: Direct scale manipulation with forced update
                console.log('Falling back to direct scale manipulation');
                chart.scales.x.min = zoomState.min;
                chart.scales.x.max = zoomState.max;
                chart.update('resize'); // Force a complete update
            }
        }
    }, [zoomState]); // Remove chartRef.current dependency

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
        if (!chart || !event.native || isPanning || isSelecting) return; // Hide crosshair during panning or selection

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.native.clientX - rect.left;

        // Use Chart.js built-in methods to get the data index from pixel position
        const rawDataIndex = chart.scales.x.getValueForPixel(x);
        if (rawDataIndex === undefined) return;
        
        const dataIndex = Math.round(rawDataIndex);
        
        if (dataIndex >= 0 && dataIndex < percentagePoints.length) {
            // Get the actual x pixel position for this data index using Chart.js scale
            const snappedX = chart.scales.x.getPixelForValue(dataIndex);
            
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
    }, [percentagePoints, visibleNeighbors, currentPrediction, selectedIdol, isPanning]);

    const handleChartLeave = useCallback(() => {
        setCrosshairPosition(null);
        setHoveredData(null);
    }, []);

    // Range selection mouse handlers
    const handleMouseDown = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const chart = chartRef.current;
        if (!chart) return;

        // Get the chart canvas bounds
        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        
        // Convert pixel position to data index
        const canvasPosition = getRelativePosition(event.nativeEvent, chart);
        const dataIndex = chart.scales.x.getValueForPixel(canvasPosition.x);
        
        if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < percentagePoints.length) {
            setIsSelecting(true);
            setSelectionStart(dataIndex);
            setSelectionEnd(dataIndex);
            setSelectionRect({ x, width: 0 });
        }
    }, [percentagePoints.length]);

    const handleMouseMove = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const chart = chartRef.current;
        if (!chart || !isSelecting || selectionStart === null) return;

        // Convert pixel position to data index
        const canvasPosition = getRelativePosition(event.nativeEvent, chart);
        const dataIndex = chart.scales.x.getValueForPixel(canvasPosition.x);
        
        if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < percentagePoints.length) {
            setSelectionEnd(dataIndex);
            
            // Update selection rectangle
            const startPixel = chart.scales.x.getPixelForValue(selectionStart);
            const endPixel = chart.scales.x.getPixelForValue(dataIndex);
            const leftPixel = Math.min(startPixel, endPixel);
            const rightPixel = Math.max(startPixel, endPixel);
            
            setSelectionRect({
                x: leftPixel,
                width: rightPixel - leftPixel
            });
        }
    }, [isSelecting, selectionStart, percentagePoints.length]);

    const handleMouseUp = React.useCallback(() => {
        if (!isSelecting || selectionStart === null || selectionEnd === null) {
            setIsSelecting(false);
            setSelectionStart(null);
            setSelectionEnd(null);
            setSelectionRect(null);
            return;
        }

        const chart = chartRef.current;
        if (!chart) return;

        const minIndex = Math.round(Math.min(selectionStart, selectionEnd));
        const maxIndex = Math.round(Math.max(selectionStart, selectionEnd));
        
        console.log('Range selection:', { minIndex, maxIndex, selectionStart, selectionEnd });
        
        // Only zoom if there's a meaningful selection (more than 1 data point)
        if (maxIndex - minIndex > 1) {
            console.log('Setting zoom state:', { min: minIndex, max: maxIndex });
            setZoomState({ min: minIndex, max: maxIndex });
        } else {
            console.log('Selection too small, not zooming');
        }

        // Reset selection state
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setSelectionRect(null);
    }, [isSelecting, selectionStart, selectionEnd]);

    // Add global mouse event listeners to handle mouse up outside the chart
    React.useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isSelecting) {
                handleMouseUp();
            }
        };

        const handleGlobalMouseMove = (event: MouseEvent) => {
            if (isSelecting && chartRef.current) {
                const chart = chartRef.current;
                const rect = chart.canvas.getBoundingClientRect();
                
                // Only update if mouse is still over the chart area
                if (event.clientX >= rect.left && event.clientX <= rect.right &&
                    event.clientY >= rect.top && event.clientY <= rect.bottom) {
                    // Convert global mouse event to React mouse event format
                    const syntheticEvent = {
                        nativeEvent: event,
                        clientX: event.clientX,
                        clientY: event.clientY
                    } as React.MouseEvent<HTMLDivElement>;
                    
                    handleMouseMove(syntheticEvent);
                }
            }
        };

        if (isSelecting) {
            document.addEventListener('mouseup', handleGlobalMouseUp);
            document.addEventListener('mousemove', handleGlobalMouseMove);
            
            return () => {
                document.removeEventListener('mouseup', handleGlobalMouseUp);
                document.removeEventListener('mousemove', handleGlobalMouseMove);
            };
        }
    }, [isSelecting, handleMouseUp, handleMouseMove]);

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
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: false // Disable wheel zoom in favor of range selection
                        },
                        pinch: {
                            enabled: false // Disable pinch zoom in favor of range selection
                        },
                        mode: 'x'
                    },
                    pan: {
                        enabled: false // Disable pan so drag only means range selection
                    },
                    limits: {
                        x: {
                            min: 0,
                            max: percentagePoints.length - 1,
                            minRange: Math.ceil(percentagePoints.length * 0.1) // Minimum 10% of data range
                        },
                        y: {
                            min: 'original',
                            max: 'original'
                        }
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
    }, [selectedIdol, activeBorder, currentPrediction, percentagePoints, handleChartHover, theme, isMobile, windowWidth, setIsPanning]); // Add theme to dependencies

    const resetZoom = () => {
        if (chartRef.current) {
            chartRef.current.resetZoom();
            setZoomState(null); // Clear the zoom state
        }
    };

    return (
        <CardContainer className="mb-4">
            <div className="flex flex-col gap-4">
                {/* Controls */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Border Selector - Only show available borders */}
                        <div className="flex-1 min-w-0">
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
                    
                    {/* Zoom Controls */}
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-base-content/70">
                            <span className="hidden sm:inline">ドラッグでズーム</span>
                            <span className="sm:hidden">ドラッグでズーム</span>
                        </div>
                        <div className="flex gap-2">
                            {/* Only show reset button when zoomed in */}
                            {zoomState && (
                                <button
                                    onClick={resetZoom}
                                    className="btn btn-xs btn-outline btn-secondary"
                                    title="ズームリセット"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    リセット
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div 
                    className="relative h-[300px] sm:h-[500px] md:h-[600px] w-full" 
                    onMouseLeave={handleChartLeave}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <Line 
                        ref={chartRef}
                        data={chartData} 
                        options={options} 
                    />
                    
                    {/* Range selection rectangle */}
                    {selectionRect && isSelecting && (
                        <div
                            className="absolute pointer-events-none bg-primary/20 border border-primary"
                            style={{
                                left: selectionRect.x,
                                top: (() => {
                                    if (window.innerWidth < 640) return '8%'; // h-[300px]
                                    if (window.innerWidth < 768) return '5.2%';  // sm:h-[500px] 
                                    return '4.5%'; // md:h-[600px]
                                })(),
                                width: selectionRect.width,
                                height: (() => {
                                    if (window.innerWidth < 640) return '77%'; // h-[300px]
                                    if (window.innerWidth < 768) return '83%'; // sm:h-[500px]
                                    return '85.5%'; // md:h-[600px]
                                })(),
                                zIndex: 5
                            }}
                        />
                    )}
                    
                    {/* Custom crosshair and tooltip */}
                    {crosshairPosition && hoveredData && !isPanning && !isSelecting && (
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
                                
                                // Use Chart.js built-in method to get accurate pixel position
                                const yPixel = chart.scales.y.getPixelForValue(item.value);
                                
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
