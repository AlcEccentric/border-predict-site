import { Chart as ChartJS, ChartOptions } from 'chart.js';
import React, { useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import { LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, InteractionItem } from 'chart.js';
import CardContainer from './CardContainer';
import { EventMetadata, NeighborMetadata } from '../types';
import { getDaisyUIColor, getColorWithAlpha } from '../utils/daisyui';
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
    // Percentage points for chart labels and zoom logic
    const percentagePoints = normalizedData.target.map((_, index) => 
        Math.round((index / (normalizedData.target.length - 1)) * 100)
    );
    const primaryColor = React.useMemo(() => getDaisyUIColor('bg-primary'), [getDaisyUIColor, theme]);
    // Helper to display normalization warning
    const renderNormalizationWarning = (length: number, popoverIndex: number | null, setPopoverIndex: (idx: number | null) => void, idx: number, currentLength?: number) => {
        // Only show for neighbors when their length differs from current event
        if (!currentLength || length === currentLength) return null;
        return (
            <span
                className="relative inline-flex items-center cursor-pointer select-none"
                onMouseEnter={() => setPopoverIndex(idx)}
                onMouseLeave={() => setPopoverIndex(null)}
            >
                <AlertTriangle size={12} className="text-warning" />
                <span className="ml-1 text-xs text-warning font-bold">正規化されたスコア</span>
                {popoverIndex === idx && (
                    <span className="absolute -left-8 top-full z-50 mt-2 w-56 sm:w-72 rounded bg-base-200 p-2 text-xs text-base-content shadow-lg border border-base-300">
                        <span className="text-error font-bold">このスコアは、現在のイベントの長さを基準に正規化されています。</span><br />
                        詳しくはページ下部の「解説」内「スコアの正規化方法について」をご覧ください。<br />
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

    // Zoom state for range selection
    const [zoomState, setZoomState] = useState<{ min: number; max: number } | null>(null);
    const isZoomed = !!zoomState;
    // Range selection state
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
    const [selectionRect, setSelectionRect] = useState<{ x: number; width: number } | null>(null);
    
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

    // Outlier detection: whether the current event's recent scores are
    // consistently higher or lower than all neighbor events at the same points.
    const [isOutlier, setIsOutlier] = useState(false);
    const [outlierDirection, setOutlierDirection] = useState<'high' | 'low' | null>(null);

    React.useEffect(() => {
        // Compare against all neighbors within a small window ending at lastKnownIndex.
        // This focuses the check on the most recent relevant steps used by prediction.
        try {
            const target = normalizedData.target;
            const neighborEntries = Object.entries(normalizedData.neighbors);
            if (!target || target.length === 0 || neighborEntries.length === 0 || typeof lastKnownIndex !== 'number') {
                setIsOutlier(false);
                setOutlierDirection(null);
                return;
            }

            // Window size (number of steps before and including lastKnownIndex) to check.
            // Use a small fixed window (3) to reflect recent behavior around the prediction point.
            const windowRadius = 2; // checks lastKnownIndex-2 .. lastKnownIndex (3 points)
            const startIdx = Math.max(0, lastKnownIndex - windowRadius);
            const endIdx = Math.min(target.length - 1, lastKnownIndex);

            let allAbove = true;
            let allBelow = true;
            let checkedCount = 0;

            for (let i = startIdx; i <= endIdx; i++) {
                const tVal = target[i];
                const neighborVals: number[] = [];
                neighborEntries.forEach(([, arr]) => {
                    const v = arr[i];
                    if (typeof v === 'number' && !isNaN(v)) neighborVals.push(v);
                });

                if (neighborVals.length === 0) {
                    // If neighbors don't have data at this index, skip this index
                    continue;
                }

                checkedCount++;
                const maxNeighbor = Math.max(...neighborVals);
                const minNeighbor = Math.min(...neighborVals);

                if (!(tVal > maxNeighbor)) allAbove = false;
                if (!(tVal < minNeighbor)) allBelow = false;

                // Early exit if neither condition can hold
                if (!allAbove && !allBelow) break;
            }

            // Require at least one checked index to avoid false positives
            if (checkedCount === 0) {
                setIsOutlier(false);
                setOutlierDirection(null);
                return;
            }

            if (allAbove) {
                setIsOutlier(true);
                setOutlierDirection('high');
            } else if (allBelow) {
                setIsOutlier(true);
                setOutlierDirection('low');
            } else {
                setIsOutlier(false);
                setOutlierDirection(null);
            }
        } catch (e) {
            setIsOutlier(false);
            setOutlierDirection(null);
        }
    }, [normalizedData, lastKnownIndex]);

    // Percentage points for chart labels and zoom logic

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
        const mouseX = event.native.clientX;
        const mouseY = event.native.clientY;

        // Hide crosshair if mouse is outside the visible chart area
        if (
            mouseX < rect.left ||
            mouseX > rect.right ||
            mouseY < rect.top ||
            mouseY > rect.bottom
        ) {
            setCrosshairPosition(prev => (prev !== null ? null : prev));
            setHoveredData(prev => (prev !== null ? null : prev));
            return;
        }

        const x = mouseX - rect.left;
        const relX = x - chart.chartArea.left;

        // Use zoomed range for tooltip
        const dataLength = zoomState ? zoomState.max - zoomState.min + 1 : percentagePoints.length;
        let dataIndex;
        if (relX >= chart.chartArea.width) {
            dataIndex = dataLength - 1;
        } else {
            dataIndex = Math.round((relX / chart.chartArea.width) * (dataLength - 1));
        }
        // Calculate the actual x position for the data point (snapped position)
        const snappedX = chart.chartArea.left + (dataIndex / (dataLength - 1)) * chart.chartArea.width;

        // Use zoomed slices for tooltip
        const targetData = zoomState
            ? normalizedData.target.slice(zoomState.min, zoomState.max + 1)
            : normalizedData.target;
        const neighborData = Object.entries(normalizedData.neighbors).map(([key, arr]) => [key, zoomState ? arr.slice(zoomState.min, zoomState.max + 1) : arr]);
        const percentPoints = zoomState
            ? percentagePoints.slice(zoomState.min, zoomState.max + 1)
            : percentagePoints;

        let values: Array<{ name: string; value: number; color: string; isTarget?: boolean }> = [];

        // Add target (current event) value
        if (visibleNeighbors.target && targetData[dataIndex] !== undefined) {
            values.push({
                name: '現在のイベント',
                value: targetData[dataIndex],
                color: COLORS.target,
                isTarget: true
            });
        }

        // Add neighbor values
        neighborData.forEach((entry, index) => {
            const key = entry[0] as string;
            const dataArr = entry[1] as number[];
            if (visibleNeighbors[key] && typeof dataArr[dataIndex] === 'number') {
                values.push({
                    name: `近傍${key}`,
                    value: dataArr[dataIndex],
                    color: COLORS.neighbors[index]
                });
            }
        });

        // Sort neighbors by value descending, keep target always on top
        const target = values.find(v => v.isTarget);
        const neighborsSorted = values.filter(v => !v.isTarget).sort((a, b) => b.value - a.value);
        values = target ? [target, ...neighborsSorted] : neighborsSorted;

        setCrosshairPosition({ x: snappedX, y: mouseY - rect.top });
        setHoveredData({
            percentagePoint: percentPoints[dataIndex],
            values
        });
    };

    const handleChartLeave = () => {
        setCrosshairPosition(null);
        setHoveredData(null);
    };

    // Range selection mouse handlers
    const handleMouseDown = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const chart = chartRef.current;
        if (!chart) return;
        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        // Convert pixel position to data index
        const relX = x - chart.chartArea.left;
        let dataIndex;
        if (relX >= chart.chartArea.width) {
            dataIndex = percentagePoints.length - 1;
        } else {
            dataIndex = Math.round((relX / chart.chartArea.width) * (percentagePoints.length - 1));
        }
        if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < percentagePoints.length) {
            setIsSelecting(true);
            setSelectionStart(dataIndex);
            setSelectionEnd(dataIndex);
            setSelectionRect({ x, width: 0 });
        }
    }, [percentagePoints]);

    const handleMouseMove = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const chart = chartRef.current;
        if (!chart || !isSelecting || selectionStart === null) return;
        const rect = chart.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        // Convert pixel position to data index
        const relX = x - chart.chartArea.left;
        let dataIndex;
        if (relX >= chart.chartArea.width) {
            dataIndex = percentagePoints.length - 1;
        } else {
            dataIndex = Math.round((relX / chart.chartArea.width) * (percentagePoints.length - 1));
        }
        if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < percentagePoints.length) {
            setSelectionEnd(dataIndex);
            // Update selection rectangle
            const startPixel = chart.chartArea.left + (selectionStart / (percentagePoints.length - 1)) * chart.chartArea.width;
            const endPixel = chart.chartArea.left + (dataIndex / (percentagePoints.length - 1)) * chart.chartArea.width;
            const leftPixel = Math.min(startPixel, endPixel);
            const rightPixel = Math.max(startPixel, endPixel);
            setSelectionRect({ x: leftPixel, width: rightPixel - leftPixel });
        }
    }, [isSelecting, selectionStart, percentagePoints]);

    const handleMouseUp = React.useCallback(() => {
        if (!isSelecting || selectionStart === null || selectionEnd === null) {
            setIsSelecting(false);
            setSelectionStart(null);
            setSelectionEnd(null);
            setSelectionRect(null);
            return;
        }
        // Clamp and round indices to valid integer range
        const minIndex = Math.max(0, Math.min(Math.round(selectionStart), Math.round(selectionEnd)));
        const maxIndex = Math.min(percentagePoints.length - 1, Math.max(Math.round(selectionStart), Math.round(selectionEnd)));
        // Only zoom if there's a meaningful selection (more than 1 data point)
        if (maxIndex - minIndex > 1) {
            setZoomState({ min: minIndex, max: maxIndex });
        }
        // Reset selection state
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setSelectionRect(null);
    }, [isSelecting, selectionStart, selectionEnd, percentagePoints]);

    // Global mouseup listener for range selection
    React.useEffect(() => {
        if (!isSelecting) return;
        const onMouseUp = () => { handleMouseUp(); };
        window.addEventListener('mouseup', onMouseUp);
        return () => { window.removeEventListener('mouseup', onMouseUp); };
    }, [isSelecting, handleMouseUp]);

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

    // Calculate crosshair index for dot placement (zoom-aware)
    const getCrosshairIndex = () => {
        if (crosshairPosition && chartRef.current) {
            const chart = chartRef.current;
            const chartArea = chart.chartArea;
            if (chartArea) {
                const relX = crosshairPosition.x - chartArea.left;
                // Use zoomed range for index calculation
                const dataLength = zoomState ? zoomState.max - zoomState.min + 1 : normalizedData.target.length;
                const percent = relX / chartArea.width;
                const idx = Math.round(percent * (dataLength - 1));
                if (idx >= 0 && idx < dataLength) {
                    return idx;
                }
            }
        }
        return null;
    };
    const crosshairIndex = getCrosshairIndex();

    const formatScore = (score: number): string => {
        return Math.round(score).toLocaleString();
    };

    // Apply zoom to chart data
    const chartLabels = percentagePoints.slice(zoomState ? zoomState.min : 0, (zoomState ? zoomState.max + 1 : percentagePoints.length));
    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: '現在のイベント',
                data: visibleNeighbors.target ? normalizedData.target.slice(zoomState ? zoomState.min : 0, (zoomState ? zoomState.max + 1 : percentagePoints.length)) : [],
                borderColor: COLORS.target,
                tension: 0.1,
                pointRadius: 0,
                pointBackgroundColor: COLORS.target,
                borderWidth: 3,
                borderDash: [],
                fill: false,
            },
            ...Object.entries(normalizedData.neighbors)
                .map(([key, data], index) => ({
                    label: `近傍${key}`,
                    data: visibleNeighbors[key]
                        ? data.slice(zoomState ? zoomState.min : 0, (zoomState ? zoomState.max + 1 : percentagePoints.length))
                        : [],
                    borderColor: COLORS.neighbors[index],
                    tension: 0.1,
                    pointRadius: 0,
                    pointBackgroundColor: COLORS.neighbors[index],
                    borderWidth: 1.5,
                    borderDash: [6, 4],
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

    
    // Adjust prediction range annotation for zoom
    const box1_xMin = zoomState ? Math.max(lastKnownIndex, zoomState.min) - (zoomState.min) : lastKnownIndex;
    const box1_xMax = zoomState ? zoomState.max - zoomState.min : normalizedData.target.length - 1;

    const options: ExtendedChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onHover: handleChartHover,
        animation: false, // Disable all chart animations
        plugins: {
            legend: {
                display: false
            },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        xMin: zoomState ? lastKnownIndex - zoomState.min : lastKnownIndex,
                        xMax: zoomState ? lastKnownIndex - zoomState.min : lastKnownIndex,
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                    },
                    box1: {
                        type: 'box',
                        xMin: box1_xMin,
                        xMax: box1_xMax,
                        backgroundColor: getColorWithAlpha(primaryColor, 0.1),
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
                min: zoomState ? 0 : undefined,
                max: zoomState ? chartData.labels.length - 1 : undefined,
                ticks: {
                    callback: (value: number | string) => {
                        const index = typeof value === 'string' ? parseInt(value) : value;
                        // Use chartData.labels for zoomed range
                        return `${chartData.labels[index]}%`;
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
                    <div
                        className="relative w-full h-full"
                        onMouseLeave={handleChartLeave}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        {/* Zoom note and zoom out button as floating badges at top-left, offset to avoid y axis */}
                        {!isZoomed && (
                            <div
                                className="absolute left-12 top-4 px-3 py-1 rounded-md bg-base-200 text-base-content/80 shadow text-xs z-30 hidden lg:block"
                                style={{ pointerEvents: 'none', fontWeight: 500 }}
                            >
                                範囲選択でズーム <span style={{ fontSize: '0.9em', opacity: 0.8 }}>(PCのみ)</span>
                            </div>
                        )}
                        {isZoomed && (
                            <button
                                onClick={() => { setZoomState(null); }}
                                className="absolute left-12 top-4 px-2 py-1 rounded-md bg-base-200 text-base-content shadow transition hover:bg-primary hover:text-white z-30 text-xs"
                                style={{ fontSize: '0.85rem', fontWeight: 500, padding: '0.25rem 0.5rem' }}
                            >
                                <span className="inline-block align-middle mr-1" style={{ fontSize: '1em' }}>⤺</span> 全体表示
                            </button>
                        )}
                        {/* Range selection rectangle */}
                        {selectionRect && isSelecting && (
                            <div
                                className="absolute pointer-events-none bg-primary/20 border border-primary"
                                style={{
                                    left: selectionRect.x,
                                    top: getTopPercent(),
                                    width: selectionRect.width,
                                    height: getHeightPercent(),
                                    zIndex: 5
                                }}
                            />
                        )}
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
                                                fillStyle: getColorWithAlpha(primaryColor, 0.2),
                                                strokeStyle: 'rgb(255, 99, 132)',
                                                fontColor: textColor,
                                                lineWidth: 2,
                                                lineDash: [5, 3],
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
                                {/* Custom crosshair dots */}
                                {hoveredData.values.map((item, index) => {
                                    const chart = chartRef.current;
                                    if (!chart || crosshairIndex === null) return null;
                                    
                                    const datasetIndex = item.isTarget ? 0 : Object.keys(normalizedData.neighbors).indexOf(item.name.replace('近傍', '')) + 1;
                                    const meta = chart.getDatasetMeta(datasetIndex);
                                    if (!meta || !meta.data[crosshairIndex]) return null;
                                    
                                    const point = meta.data[crosshairIndex];
                                    return (
                                        <div
                                            key={index}
                                            className="absolute pointer-events-none w-2 h-2 rounded-full"
                                            style={{
                                                left: point.x - 4,
                                                top: point.y - 4,
                                                backgroundColor: item.color,
                                                zIndex: 15
                                            }}
                                        />
                                    );
                                })}
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

                {/* Outlier warning: show when current event's recent scores are consistently
                    higher or lower than all neighbor events at the same points */}
                {isOutlier && (
                    <div className="mb-3 p-3 rounded-md bg-warning/20 border border-warning text-base-content">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={18} className="text-warning" />
                            <div className="text-sm">
                                <div className="font-semibold">予測精度に注意</div>
                                <div className="mt-1">
                                    {outlierDirection === 'low' ? (
                                        <>
                                            今回のイベントでは、このボーダーのスコアが、過去の近傍データと比べて全体的に
                                            低めとなっているため、予測値は実際より
                                            <span className="font-bold px-1">高め</span>
                                            になる可能性があります。あくまで参考程度にとどめてください。
                                        </>
                                    ) : (
                                        <>
                                            今回のイベントでは、このボーダーのスコアが、過去の近傍データと比べて全体的に
                                            高めとなっているため、予測値は実際より
                                            <span className="font-bold px-1">低め</span>
                                            になる可能性があります。あくまで参考程度にとどめてください。
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                                    {renderNormalizationWarning(neighbor.raw_length, popoverIndex, setPopoverIndex, index, eventMetadata.length)}
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