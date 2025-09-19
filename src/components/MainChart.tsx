import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import { getRelativePosition } from 'chart.js/helpers';
import { getDaisyUIColor, getColorWithAlpha } from '../utils/daisyui';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
  zoomPlugin
);

import { PredictionData } from '../types';

interface MainChartProps {
  data: PredictionData;
  startAt: string;
  theme?: string;
}

const MainChart: React.FC<MainChartProps> = ({ data, startAt, theme }) => {
  // Zoom state to persist across re-renders
  const [zoomState, setZoomState] = useState<{ min: string; max: string } | null>(null);
  const isZoomed = !!zoomState;

  // ...existing code...
  function getTopPercent() {
    if (window.innerWidth < 640) return '6.7%';
    if (window.innerWidth < 768) return '6.2%';
    return '3.8%';
  }
  function getHeightPercent() {
    if (window.innerWidth < 640) return '60.6%';
    if (window.innerWidth < 768) return '66.6%';
    return '78%';
  }
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredData, setHoveredData] = useState<{ timePoint: string; value: number; bounds?: { upper50: number; lower50: number; upper75: number; lower75: number; upper90: number; lower90: number; } } | null>(null);
  
  // Range selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; width: number } | null>(null);

  const primaryColor = React.useMemo(() => getDaisyUIColor('bg-primary'), [theme]);
  const secondaryColor = React.useMemo(() => getDaisyUIColor('bg-secondary'), [theme]);

  const timePoints = React.useMemo(() => {
    return Array.from(
      { length: data.data.raw.target.length },
      (_, i) => {
        const date = new Date(startAt);
        date.setMinutes(date.getMinutes() + i * 30);
        return date.toLocaleString('ja-JP', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Tokyo'
        });
      }
    );
  }, [startAt, data.data.raw.target.length]);

  const handleChartHover = React.useCallback((event: any) => {
    const chart = chartRef.current;
    if (!chart || !event.native) return;

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.native.clientX - rect.left;

    const meta = chart.getDatasetMeta(0);
    const dataPoints = meta.data;

    if (!dataPoints || dataPoints.length === 0) return;

    // Find the closest point by X distance
    let closestIndex = -1;
    let minDistance = Infinity;

    dataPoints.forEach((point, index) => {
      const distance = Math.abs(point.x - x);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    // Compute dynamic threshold: half of the distance to neighbor
    const threshold = (() => {
      if (closestIndex === 0 && dataPoints.length > 1) {
        return Math.abs(dataPoints[1].x - dataPoints[0].x) / 2;
      }
      if (closestIndex === dataPoints.length - 1 && dataPoints.length > 1) {
        return Math.abs(dataPoints[dataPoints.length - 1].x - dataPoints[dataPoints.length - 2].x) / 2;
      }
      if (closestIndex > 0) {
        const prevX = dataPoints[closestIndex - 1].x;
        const currX = dataPoints[closestIndex].x;
        return Math.abs(currX - prevX) / 2;
      }
      return 20; // Fallback default
    })();

    // Show crosshair at last tick if mouse is within 5px to the right of the last tick position
    const lastTickX = dataPoints[dataPoints.length - 1].x;
    if (x > lastTickX && x <= lastTickX + 5) {
      setCrosshairPosition(prev => {
        const newCrosshair = {
          x: lastTickX,
          y: dataPoints[dataPoints.length - 1].y,
        };
        if (!prev || prev.x !== newCrosshair.x || prev.y !== newCrosshair.y) {
          return newCrosshair;
        }
        return prev;
      });
      setHoveredData(prev => {
      const idx = dataPoints.length - 1;
        const newHovered = {
        timePoint: timePoints[idx],
        value: data.data.raw.target[idx],
        bounds: idx > data.metadata.raw.last_known_step_index && data.data.raw.bounds ? {
          upper50: data.data.raw.bounds[50].upper[idx],
          lower50: data.data.raw.bounds[50].lower[idx],
          upper75: data.data.raw.bounds[75].upper[idx],
          lower75: data.data.raw.bounds[75].lower[idx],
          upper90: data.data.raw.bounds[90].upper[idx],
          lower90: data.data.raw.bounds[90].lower[idx],
        } : undefined,
        };
        if (!prev || prev.timePoint !== newHovered.timePoint || prev.value !== newHovered.value) {
          return newHovered;
        }
        return prev;
      });
      return;
    }

    if (minDistance <= threshold) {
      setCrosshairPosition(prev => {
        const newCrosshair = {
          x: dataPoints[closestIndex].x,
          y: dataPoints[closestIndex].y,
        };
        if (!prev || prev.x !== newCrosshair.x || prev.y !== newCrosshair.y) {
          return newCrosshair;
        }
        return prev;
      });
      setHoveredData(prev => {
        const newHovered = {
        timePoint: timePoints[closestIndex],
        value: data.data.raw.target[closestIndex],
        bounds: closestIndex > data.metadata.raw.last_known_step_index && data.data.raw.bounds ? {
          upper50: data.data.raw.bounds[50].upper[closestIndex],
          lower50: data.data.raw.bounds[50].lower[closestIndex],
          upper75: data.data.raw.bounds[75].upper[closestIndex],
          lower75: data.data.raw.bounds[75].lower[closestIndex],
          upper90: data.data.raw.bounds[90].upper[closestIndex],
          lower90: data.data.raw.bounds[90].lower[closestIndex],
        } : undefined,
        };
        if (!prev || prev.timePoint !== newHovered.timePoint || prev.value !== newHovered.value) {
          return newHovered;
        }
        return prev;
      });
    } else {
      setCrosshairPosition(prev => (prev !== null ? null : prev));
      setHoveredData(prev => (prev !== null ? null : prev));
    }
  }, [timePoints, data]);


  const handleChartLeave = () => {
    setCrosshairPosition(null);
    setHoveredData(null);
  };


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

    if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < timePoints.length) {
      setIsSelecting(true);
      setSelectionStart(dataIndex);
      setSelectionEnd(dataIndex);
      setSelectionRect({ x, width: 0 });
    }
  }, [timePoints]);

  const handleMouseMove = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const chart = chartRef.current;
    if (!chart || !isSelecting || selectionStart === null) return;

    // Convert pixel position to data index
    const canvasPosition = getRelativePosition(event.nativeEvent, chart);
    const dataIndex = chart.scales.x.getValueForPixel(canvasPosition.x);

    if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < timePoints.length) {
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
  }, [isSelecting, selectionStart, timePoints]);

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
    const maxIndex = Math.min(timePoints.length - 1, Math.max(Math.round(selectionStart), Math.round(selectionEnd)));

    // Only zoom if there's a meaningful selection (more than 1 data point)
    if (maxIndex - minIndex > 1) {
      setZoomState({ min: timePoints[minIndex], max: timePoints[maxIndex] });
    }

    // Reset selection state
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionRect(null);
  }, [isSelecting, selectionStart, selectionEnd, timePoints]);

  // Global mouseup listener for range selection
  React.useEffect(() => {
    if (!isSelecting) return;
    const onMouseUp = () => {
      handleMouseUp();
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isSelecting, handleMouseUp]);

  const ci75Alpha = 0.3;
  const ci90Alpha = 0.25;
  const ciColor = secondaryColor;
  
  const chartData: ChartData<'line'> = React.useMemo(() => {
    const datasets = [
      {
        label: 'スコア',
        data: data.data.raw.target,
        borderColor: getColorWithAlpha(primaryColor, 1),
        tension: 0.1,
        borderWidth: 3.5,
        borderDash: [5, 2],
        pointStyle: 'circle',
        pointRadius: 0,
        pointBorderColor: getColorWithAlpha(primaryColor, 1),
        pointBackgroundColor: getColorWithAlpha(primaryColor, 1),
        pointHoverRadius: 5,
      },
      // 90% confidence interval
      {
        label: '90% 信頼区間下限',
        data: data.data.raw.bounds?.[90]?.lower.map((val, idx) => 
          idx <= data.metadata.raw.last_known_step_index ? null : val
        ) || [],
        borderColor: 'transparent',
        backgroundColor: getColorWithAlpha(ciColor, ci90Alpha),
        tension: 0.1,
        borderWidth: 0,
        pointStyle: 'circle',
        pointRadius: 0,
        pointBorderColor: getColorWithAlpha(ciColor, 0.5),
        pointBackgroundColor: getColorWithAlpha(ciColor, 0.5),
        pointHoverRadius: 4,
      },
      {
        label: '90% 信頼区間上限',
        data: data.data.raw.bounds?.[90]?.upper.map((val, idx) => 
          idx <= data.metadata.raw.last_known_step_index ? null : val
        ) || [],
        borderColor: 'transparent',
        backgroundColor: getColorWithAlpha(ciColor, ci90Alpha),
        tension: 0.1,
        borderWidth: 0,
        fill: '-1',
        pointStyle: 'circle',
        pointRadius: 0,
        pointBorderColor: getColorWithAlpha(ciColor, 0.5),
        pointBackgroundColor: getColorWithAlpha(ciColor, 0.5),
        pointHoverRadius: 4,
      },
      // 75% confidence interval
      {
        label: '75% 信頼区間下限',
        data: data.data.raw.bounds?.[75]?.lower.map((val, idx) => 
          idx <= data.metadata.raw.last_known_step_index ? null : val
        ) || [],
        borderColor: 'transparent',
        backgroundColor: getColorWithAlpha(ciColor, ci75Alpha),
        tension: 0.1,
        borderWidth: 0,
        pointStyle: 'circle',
        pointRadius: 0,
        pointBorderColor: getColorWithAlpha(ciColor, 0.8),
        pointBackgroundColor: getColorWithAlpha(ciColor, 0.8),
        pointHoverRadius: 4,
      },
      {
        label: '75% 信頼区間上限',
        data: data.data.raw.bounds?.[75]?.upper.map((val, idx) => 
          idx <= data.metadata.raw.last_known_step_index ? null : val
        ) || [],
        borderColor: 'transparent',
        backgroundColor: getColorWithAlpha(ciColor, ci75Alpha),
        tension: 0.1,
        borderWidth: 0,
        fill: '-1',
        pointStyle: 'circle',
        pointRadius: 0,
        pointBorderColor: getColorWithAlpha(ciColor, 0.8),
        pointBackgroundColor: getColorWithAlpha(ciColor, 0.8),
        pointHoverRadius: 4,
      },
    ];
    
    return {
      labels: timePoints,
      datasets
    };
  }, [timePoints, data, primaryColor]);

  const chartOptions = React.useMemo<ChartOptions<'line'>>(() => {
    const textColor = (() => {
      try {
        const tempElement = document.createElement('div');
        tempElement.className = 'text-base-content';
        tempElement.style.position = 'absolute';
        tempElement.style.visibility = 'hidden';
        document.body.appendChild(tempElement);
        const computedStyle = getComputedStyle(tempElement);
        const color = computedStyle.color;
        document.body.removeChild(tempElement);
        return color;
      } catch {
        return 'rgb(75, 85, 99)';
      }
    })();

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      onHover: handleChartHover,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: textColor,
            generateLabels: () => [
              {
                text: 'スコア',
                fillStyle: getColorWithAlpha(primaryColor, 1),
                strokeStyle: getColorWithAlpha(primaryColor, 1),
                fontColor: textColor,
                lineWidth: 2,
              },
              {
                text: '75% 信頼区間',
                fillStyle: getColorWithAlpha(ciColor, 0.5),
                strokeStyle: getColorWithAlpha(secondaryColor, 1),
                fontColor: textColor,
                lineWidth: 2,
              },
              {
                text: '90% 信頼区間',
                fillStyle: getColorWithAlpha(ciColor, 0.3),
                strokeStyle: getColorWithAlpha(secondaryColor, 1),
                fontColor: textColor,
                lineWidth: 2,
              },
              {
                text: '予測範囲',
                fillStyle: getColorWithAlpha(primaryColor, 0.2),
                strokeStyle: 'rgb(255, 99, 132)',
                fontColor: textColor,
                lineWidth: 2,
                pointStyle: 'rect',
                pointStyleWidth: 15,
                pointStyleHeight: 15,
                lineDash: [5, 3],
              }
            ]
          }
        },
        annotation: {
          annotations: {
            verticalLine: {
              type: 'line',
              scaleID: 'x',
              value: timePoints[data.metadata.raw.last_known_step_index],
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 2,
              borderDash: [5, 5],
            },
            predictionArea: {
              type: 'box',
              xMin: timePoints[data.metadata.raw.last_known_step_index],
              xMax: timePoints[timePoints.length - 1],
              backgroundColor: getColorWithAlpha(primaryColor, 0.1),
              borderColor: 'rgba(200, 200, 200, 0.2)',
            }
          }
        },
        title: {
          display: true,
          text:　'スコア推移予測',
          color: textColor,
          padding: {
            bottom: 10
          }
        },
        tooltip: {
          enabled: false
        },
        zoom: {
          zoom: {
            wheel: { enabled: false },
            pinch: { enabled: false },
            mode: 'x'
          },
          pan: { enabled: false },
          limits: {
            x: {
              min: 0,
              max: data.data.raw.target.length - 1,
              minRange: Math.ceil(data.data.raw.target.length * 0.1)
            },
            y: { min: 'original', max: 'original' }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: '時間', color: textColor },
          grid: { color: 'rgba(200, 200, 200, 0.2)' },
          ticks: {
            color: textColor,
            ...(window.innerWidth < 640 && { maxTicksLimit: 6, autoSkip: false }),
            minRotation: window.innerWidth < 640 ? 45 : 30,
            maxRotation: window.innerWidth < 640 ? 45 : 30,
            callback: function(value, index, values) {
              const isLast = index === values.length - 1;
              if (window.innerWidth < 640) {
                const step = Math.ceil(values.length / 6);
                if (index % step === 0 || isLast) {
                  return this.getLabelForValue(Number(value));
                }
                return '';
              }
              return this.getLabelForValue(Number(value));
            }
          },
          // min/max will be set below
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: 'スコア', color: textColor },
          grid: { color: 'rgba(200, 200, 200, 0.2)' },
          ticks: {
            color: textColor,
            callback: function(value) {
              if (window.innerWidth < 640) {
                if (typeof value === 'number' && value >= 10000) {
                  return Math.round(value / 10000) + '万';
                }
                return value;
              }
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return value;
            }
          }
        }
      },
      interaction: { mode: 'index', intersect: false },
      elements: {
        line: {
          tension: 0.1,
        }
      },
    };

    if (zoomState) {
      (options.scales!.x!.min as any) = zoomState.min;
      (options.scales!.x!.max as any) = zoomState.max;
    } else {
      options.scales!.x!.min = undefined;
      options.scales!.x!.max = undefined;
    }

    return options;
  }, [zoomState, startAt, data.data.raw.target.length, theme, timePoints, data.metadata.raw.last_known_step_index, data.metadata.raw.name, primaryColor]);

  return (
    <div className="relative w-full">
      {/* Zoom note and zoom out button as floating badges at top-left, avoiding y axis */}
      {!isZoomed && (
        <div
          className="absolute left-24 top-4 px-3 py-1 rounded-md bg-base-200 text-base-content/80 shadow text-xs z-30"
          style={{ pointerEvents: 'none', fontWeight: 500 }}
        >
          <span style={{ fontSize: '1.1em', verticalAlign: 'middle', marginRight: '0.3em' }}>🔍</span>範囲選択でズーム
        </div>
      )}
      {isZoomed && (
        <button
          onClick={() => {
            setZoomState(null);
          }}
          className="absolute left-24 top-4 px-2 py-1 rounded-md bg-base-200 text-base-content shadow transition hover:bg-primary hover:text-white z-30 text-xs"
          style={{ fontSize: '0.85rem', fontWeight: 500, padding: '0.25rem 0.5rem' }}
        >
          <span className="inline-block align-middle mr-1" style={{ fontSize: '1em' }}>⤺</span> 全体表示
        </button>
      )}
      <div 
        className="relative w-full h-[360px] sm:h-[400px] md:h-[600px]" 
        onMouseLeave={handleChartLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Line ref={chartRef} data={chartData} options={chartOptions} />
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
        {/* Custom crosshair and tooltip */}
        {crosshairPosition && hoveredData && !isSelecting && (
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
            {/* Custom crosshair dots for all datasets */}
            {(() => {
              const chart = chartRef.current;
              if (!chart) return null;
              
              const dots = [];
              const meta0 = chart.getDatasetMeta(0); // Main line
              const dataPoints0 = meta0.data;
              
              // Find closest data point index
              let closestIndex = -1;
              let minDistance = Infinity;
              dataPoints0.forEach((point, index) => {
                const distance = Math.abs(point.x - crosshairPosition.x);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestIndex = index;
                }
              });
              
              if (closestIndex === -1) return null;
              
              // Add dot for main trajectory
              if (dataPoints0[closestIndex]) {
                const point = dataPoints0[closestIndex];
                dots.push(
                  <div
                    key="main"
                    className="absolute pointer-events-none w-2 h-2 rounded-full"
                    style={{
                      left: point.x - 4,
                      top: point.y - 4,
                      backgroundColor: getColorWithAlpha(primaryColor, 1),
                      zIndex: 15
                    }}
                  />
                );
              }
              
              // Add dots for confidence interval lines (if they have data at this index)
              for (let i = 1; i < chart.data.datasets.length; i++) {
                const meta = chart.getDatasetMeta(i);
                if (meta && meta.data[closestIndex] && chart.data.datasets[i].data[closestIndex] !== null) {
                  const point = meta.data[closestIndex];
                  dots.push(
                    <div
                      key={i}
                      className="absolute pointer-events-none w-2 h-2 rounded-full"
                      style={{
                        left: point.x - 4,
                        top: point.y - 4,
                        backgroundColor: getColorWithAlpha(secondaryColor, 0.8),
                        zIndex: 15
                      }}
                    />
                  );
                }
              }
              
              return dots;
            })()}
            {/* Custom tooltip */}
            <div
              className="absolute pointer-events-none bg-base-100 border border-base-300 text-base-content rounded-lg shadow-lg p-3 z-20 min-w-[180px] sm:min-w-[220px] max-w-[70vw]"
              style={{
                left: (() => {
                  const containerWidth = window.innerWidth;
                  const tooltipWidth = window.innerWidth < 640 ? 180 : 220;
                  if (window.innerWidth < 640) {
                    if (crosshairPosition.x > containerWidth * 0.4) {
                      return Math.max(10, crosshairPosition.x - tooltipWidth - 10);
                    } else {
                      return Math.min(crosshairPosition.x + 10, containerWidth - tooltipWidth - 10);
                    }
                  }
                  return crosshairPosition.x > containerWidth * 0.5 
                    ? crosshairPosition.x - tooltipWidth - 20
                    : crosshairPosition.x + 10;
                })(),
                top: Math.max(crosshairPosition.y - 60, 10)
              }}
            >
              <div className="text-sm font-semibold mb-1">
                {hoveredData.timePoint}
              </div>
              <div className="text-xs">
                <span className="hidden sm:inline">スコア: </span>
                <span className="sm:hidden">スコア:</span>
                <br className="sm:hidden" />
                <span className="font-mono">{Math.round(hoveredData.value).toLocaleString()}</span>
                {hoveredData.bounds && (
                  <>
                    <div className="mt-2 text-xs">
                      <div>75%信頼区間: {Math.round(hoveredData.bounds.lower75).toLocaleString()} - {Math.round(hoveredData.bounds.upper75).toLocaleString()}</div>
                      <div>90%信頼区間: {Math.round(hoveredData.bounds.lower90).toLocaleString()} - {Math.round(hoveredData.bounds.upper90).toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MainChart;