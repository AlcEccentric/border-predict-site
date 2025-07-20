import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import { getRelativePosition } from 'chart.js/helpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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
  annotationPlugin,
  zoomPlugin
);

interface MainChartProps {
  data: {
    data: {
      raw: {
        target: number[];
      };
    };
    metadata: {
      raw: {
        last_known_step_index: number;
        id: number;
        name: string;  // Add name property
      };
    };
  };
  startAt: string;
  theme?: string; // Add theme prop to trigger re-renders when theme changes
}

const MainChart: React.FC<MainChartProps> = ({ data, startAt, theme }) => {
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
  const [hoveredData, setHoveredData] = useState<{ timePoint: string; value: number } | null>(null);
  
  // Range selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; width: number } | null>(null);
  
  // Zoom state to persist across re-renders
  const [zoomState, setZoomState] = useState<{ min: number; max: number } | null>(null);

  // Apply zoom state when chart is ready
  React.useEffect(() => {
    if (chartRef.current && zoomState) {
      const chart = chartRef.current;
      console.log('Applying zoom state:', zoomState);
      
      // Set the scale limits directly
      chart.scales.x.min = zoomState.min;
      chart.scales.x.max = zoomState.max;
      chart.update('none'); // Update without animation
    }
  }, [zoomState, chartRef.current]);

  const timePoints = Array.from(
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

  const handleChartHover = (event: any) => {
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

    if (minDistance <= threshold) {
      setCrosshairPosition({
        x: dataPoints[closestIndex].x,
        y: dataPoints[closestIndex].y,
      });
      setHoveredData({
        timePoint: timePoints[closestIndex],
        value: data.data.raw.target[closestIndex],
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
  }, [timePoints.length]);

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
  }, [isSelecting, selectionStart, timePoints.length]);

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

  // Apply zoom state when it changes
  React.useEffect(() => {
    if (zoomState && chartRef.current) {
      const chart = chartRef.current;
      console.log('Applying zoom state:', zoomState);
      chart.scales.x.min = zoomState.min;
      chart.scales.x.max = zoomState.max;
      chart.update('none'); // Use 'none' to prevent animation and reduce re-renders
    }
  }, [zoomState]);

  const chartData: ChartData<'line'> = {
    labels: timePoints,
    datasets: [{
      label: 'スコア',
      data: data.data.raw.target,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
      pointRadius: 0,
      borderWidth: 1.5, // Make line thinner
    }]
  };

  // Get theme-appropriate text color
  const textColor = React.useMemo(() => {
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
        return color;
      } catch (e) {
        return 'rgb(75, 85, 99)'; // Default color as fallback
      }
    }
    return 'rgb(75, 85, 99)'; // Default color for SSR
  }, [theme]); // Add theme as dependency

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
              generateLabels: () => [{
                  text: '予測範囲',
                  fillStyle: 'rgba(103, 220, 209, 0.1)',
                  strokeStyle: 'rgba(103, 220, 209, 0.6)',
                  fontColor: textColor,
                  lineWidth: 2,
                  pointStyle: 'rect',
                  pointStyleWidth: 15,
                  pointStyleHeight: 15,
              }]
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
            backgroundColor: 'rgba(103, 220, 209, 0.1)',
            borderColor: 'rgba(200, 200, 200, 0.2)',
          }
        }
      },
      title: {
        display: true,
        text: data.metadata.raw.name ? `${data.metadata.raw.name} - スコア推移` : 'スコア推移',
        color: textColor,
        padding: {
          bottom: 10
        }
      },
      tooltip: {
        enabled: false // Disable default tooltip since we're using custom crosshair
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
            max: data.data.raw.target.length - 1,
            minRange: Math.ceil(data.data.raw.target.length * 0.1) // Minimum 10% of data range
          },
          y: {
            min: 'original',
            max: 'original'
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '時間',
          color: textColor
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        ticks: {
          color: textColor,
          // Only reduce number of ticks on mobile
          ...(window.innerWidth < 640 && { maxTicksLimit: 6, autoSkip: false }),
          minRotation: window.innerWidth < 640 ? 45 : 30,
          maxRotation: window.innerWidth < 640 ? 45 : 30,
          callback: function(value, index, values) {
            // Always show last tick
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
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'スコア',
          color: textColor
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        ticks: {
          color: textColor,
          callback: function(value) {
            // Format as "万" on mobile
            if (window.innerWidth < 640) {
              if (typeof value === 'number' && value >= 10000) {
                return Math.round(value / 10000) + '万';
              }
              return value;
            }
            // Default formatting with commas
            if (typeof value === 'number') {
              return value.toLocaleString();
            }
            return value;
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  return (
    <div className="relative w-full">
      <div 
        className="relative w-full h-[360px] sm:h-[400px] md:h-[600px]" 
        onMouseLeave={handleChartLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Line ref={chartRef} data={chartData} options={options} />
        
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
            
            {/* Custom tooltip */}
            <div
              className="absolute pointer-events-none bg-base-100 border border-base-300 text-base-content rounded-lg shadow-lg p-3 z-20 min-w-[180px] sm:min-w-[320px] max-w-[90vw]"
              style={{
                left: (() => {
                  const containerWidth = window.innerWidth;
                  const tooltipWidth = window.innerWidth < 640 ? 180 : 320;
                  
                  // On mobile, prefer left positioning when clicking on right half
                  if (window.innerWidth < 640) {
                    if (crosshairPosition.x > containerWidth * 0.5) {
                      return Math.max(10, crosshairPosition.x - tooltipWidth - 10);
                    } else {
                      return Math.min(crosshairPosition.x + 10, containerWidth - tooltipWidth - 10);
                    }
                  }

                  return crosshairPosition.x > containerWidth * 0.6 
                    ? crosshairPosition.x - tooltipWidth - 10
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MainChart;