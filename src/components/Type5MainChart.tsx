import React, { useRef, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  InteractionItem
} from 'chart.js';
import { IdolPredictionData } from '../types';
import { getIdolName } from '../utils/idolData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface Type5MainChartProps {
  idolPredictions: Map<number, IdolPredictionData>;
  selectedIdol: number;
  startAt: string;
  eventName: string;
  theme: string; // Add theme prop to trigger re-renders when theme changes
}

const Type5MainChart: React.FC<Type5MainChartProps> = ({
  idolPredictions,
  selectedIdol,
  startAt,
  eventName,
  theme
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; dataIndex: number; isNearRightEdge?: boolean } | null>(null);
  const [hoveredData, setHoveredData] = useState<{ 
    timePoint: string; 
    values: Array<{ 
      idol: number; 
      border: string; 
      value: number; 
      color: string;
      predicted?: boolean;
      confidenceInterval?: { min: number; max: number };
    }> 
  } | null>(null);

  // Generate time points (memoized to prevent infinite re-renders)
  const timePoints = useMemo(() => {
    const idolData = idolPredictions.get(selectedIdol);
    if (!idolData) return [];

    const lengths = [];
    if (idolData.prediction100) {
      lengths.push(idolData.prediction100.data.raw.target.length);
    }
    if (idolData.prediction1000) {
      lengths.push(idolData.prediction1000.data.raw.target.length);
    }
    
    if (lengths.length === 0) return [];
    
    const maxLength = Math.max(...lengths);

    return Array.from({ length: maxLength }, (_, i) => {
      const date = new Date(startAt);
      date.setMinutes(date.getMinutes() + i * 30);
      return date.toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    });
  }, [idolPredictions, selectedIdol, startAt]);

  // Get idol data
  const idolData = idolPredictions.get(selectedIdol);
  if (!idolData || (!idolData.prediction100 && !idolData.prediction1000)) {
    return (
      <div className="bg-base-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-bold mb-2 text-warning">
          予測データが不足しています
        </h3>
        <p className="text-sm text-base-content/70">
          {getIdolName(selectedIdol)}の予測データがありません
        </p>
      </div>
    );
  }

  // Memoize chart data to prevent infinite re-renders
  const chartData = useMemo(() => {
    const idolName = getIdolName(selectedIdol);
    
    // Get computed theme colors from the DOM
    const getComputedThemeColor = (cssVar: string) => {
      if (typeof window !== 'undefined') {
        try {
          // Create a temporary element with the theme class to get computed color
          const tempElement = document.createElement('div');
          tempElement.className = cssVar === '--p' ? 'text-primary' : 'text-secondary';
          tempElement.style.position = 'absolute';
          tempElement.style.visibility = 'hidden';
          document.body.appendChild(tempElement);
          
          const computedStyle = getComputedStyle(tempElement);
          const color = computedStyle.color;
          
          document.body.removeChild(tempElement);
          
          return color || (cssVar === '--p' ? '#8b5cf6' : '#f59e0b'); // fallback colors
        } catch (error) {
          console.warn('Failed to get computed theme color:', error);
          return cssVar === '--p' ? '#8b5cf6' : '#f59e0b'; // fallback colors
        }
      }
      return cssVar === '--p' ? '#8b5cf6' : '#f59e0b'; // fallback for SSR
    };
    
    // Static colors for different borders (matching theme colors)
    const BORDER_COLORS = {
      '100': getComputedThemeColor('--p'), // Primary color for 100位
      '1000': getComputedThemeColor('--s')  // Secondary color for 1000位
    };

    const datasets = [];
    
    // Add 100位 dataset if data exists
    if (idolData.prediction100) {
      datasets.push({
        label: `${idolName} - 100位`,
        data: idolData.prediction100.data.raw.target,
        borderColor: BORDER_COLORS['100'],
        backgroundColor: BORDER_COLORS['100'] + '20',
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 1.5, // Make line thinner
        idolId: selectedIdol,
        borderType: '100'
      });
    }
    
    // Add 1000位 dataset if data exists
    if (idolData.prediction1000) {
      datasets.push({
        label: `${idolName} - 1000位`,
        data: idolData.prediction1000.data.raw.target,
        borderColor: BORDER_COLORS['1000'],
        backgroundColor: BORDER_COLORS['1000'] + '20',
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 1.5, // Make line thinner
        idolId: selectedIdol,
        borderType: '1000'
      });
    }

    return {
      labels: timePoints,
      datasets
    };
  }, [idolData, selectedIdol, timePoints, theme]); // Add theme to dependencies

  const handleChartHover = React.useCallback((event: any, _elements: InteractionItem[]) => {
    const chart = chartRef.current;
    if (!chart || !event.native) return;

    const rect = chart.canvas.getBoundingClientRect();
    const x = event.native.clientX - rect.left;

    // Get the data index at this x position (snap to nearest data point)
    const dataIndex = Math.round((x - chart.chartArea.left) / (chart.chartArea.width) * (timePoints.length - 1));
    
    if (dataIndex >= 0 && dataIndex < timePoints.length) {
      // Calculate the actual x position for the data point (snapped position)
      const snappedX = chart.chartArea.left + (dataIndex / (timePoints.length - 1)) * chart.chartArea.width;
      
      // Check if we're near the right edge of the chart area
      const isNearRightEdge = snappedX > chart.chartArea.left + (chart.chartArea.width * 0.7);
      
      setCrosshairPosition({ x: snappedX, dataIndex, isNearRightEdge } as any);
      
      // Collect all values at this time point
      const values: Array<{ 
        idol: number; 
        border: string; 
        value: number; 
        color: string;
        predicted?: boolean;
        confidenceInterval?: { min: number; max: number };
      }> = [];
      
      chartData.datasets.forEach((dataset) => {
        if (dataset.data[dataIndex] !== undefined && dataset.idolId && dataset.borderType) {
          // Check if this data point is in the prediction range
          const prediction = dataset.borderType === '100' ? idolData.prediction100 : idolData.prediction1000;
          if (!prediction) return; // Skip if prediction data doesn't exist
          
          const isPredicted = dataIndex >= prediction.metadata.raw.last_known_step_index;

          values.push({
            idol: dataset.idolId,
            border: dataset.borderType,
            value: dataset.data[dataIndex],
            color: dataset.borderColor as string,
            predicted: isPredicted
          });
        }
      });

      setHoveredData({
        timePoint: timePoints[dataIndex],
        values: values.sort((a, b) => b.value - a.value) // Sort by value descending
      });
    } else {
      setCrosshairPosition(null);
      setHoveredData(null);
    }
  }, [timePoints, chartData.datasets, idolData]);

  const handleChartLeave = React.useCallback(() => {
    setCrosshairPosition(null);
    setHoveredData(null);
  }, []);

  const options: ChartOptions<'line'> = useMemo(() => {
    const idolName = getIdolName(selectedIdol);
    
    // Get computed theme colors from the DOM
    const getComputedThemeColor = (cssVar: string) => {
      if (typeof window !== 'undefined') {
        try {
          // Create a temporary element with the theme class to get computed color
          const tempElement = document.createElement('div');
          tempElement.className = cssVar === '--p' ? 'text-primary' : 'text-secondary';
          tempElement.style.position = 'absolute';
          tempElement.style.visibility = 'hidden';
          document.body.appendChild(tempElement);
          
          const computedStyle = getComputedStyle(tempElement);
          const color = computedStyle.color;
          
          document.body.removeChild(tempElement);
          
          return color || (cssVar === '--p' ? '#8b5cf6' : '#f59e0b'); // fallback colors
        } catch (error) {
          console.warn('Failed to get computed theme color:', error);
          return cssVar === '--p' ? '#8b5cf6' : '#f59e0b'; // fallback colors
        }
      }
      return cssVar === '--p' ? '#8b5cf6' : '#f59e0b'; // fallback for SSR
    };
    
    const BORDER_COLORS = {
      '100': getComputedThemeColor('--p'), // Primary color for 100位
      '1000': getComputedThemeColor('--s')  // Secondary color for 1000位
    };

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
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            color: getTextColor(), // Use theme-appropriate text color
            generateLabels: (_chart) => {
              const labels = [];
              
              if (idolData.prediction100) {
                labels.push({
                  text: `${idolName} - 100位`,
                  fillStyle: BORDER_COLORS['100'],
                  strokeStyle: BORDER_COLORS['100'],
                  lineWidth: 2,
                  fontColor: getTextColor()
                });
              }
              
              if (idolData.prediction1000) {
                labels.push({
                  text: `${idolName} - 1000位`,
                  fillStyle: BORDER_COLORS['1000'],
                  strokeStyle: BORDER_COLORS['1000'],
                  lineWidth: 2,
                  fontColor: getTextColor()
                });
              }
              
              return labels;
            }
          }
        },
        title: {
          display: true,
          text: `${eventName} - ${idolName}`,
          padding: { bottom: 20 },
          color: getTextColor() // Use theme-appropriate text color
        },
        tooltip: {
          enabled: false // Disable default tooltip since we're using custom crosshair
        },
        annotation: {
          annotations: {
            // Only add annotations if we have prediction data
            ...(idolData.prediction100 || idolData.prediction1000 ? {
              // Prediction range background
              predictionRange: {
                type: 'box',
                xMin: Math.min(
                  ...[
                    idolData.prediction100?.metadata.raw.last_known_step_index,
                    idolData.prediction1000?.metadata.raw.last_known_step_index
                  ].filter(val => val !== undefined)
                ),
                xMax: Math.max(timePoints.length - 1, 0),
                backgroundColor: 'rgba(103, 220, 209, 0.1)',
                borderColor: 'rgba(200, 200, 200, 0.2)',
                borderWidth: 1
              },
              // Prediction start line
              predictionLine: {
                type: 'line',
                xMin: Math.min(
                  ...[
                    idolData.prediction100?.metadata.raw.last_known_step_index,
                    idolData.prediction1000?.metadata.raw.last_known_step_index
                  ].filter(val => val !== undefined)
                ),
                xMax: Math.min(
                  ...[
                    idolData.prediction100?.metadata.raw.last_known_step_index,
                    idolData.prediction1000?.metadata.raw.last_known_step_index
                  ].filter(val => val !== undefined)
                ),
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                borderDash: [5, 5]
              }
            } : {})
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '時間',
            color: getTextColor() // Use theme-appropriate text color
          },
          ticks: {
            color: getTextColor() // Use theme-appropriate text color
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'スコア',
            color: getTextColor() // Use theme-appropriate text color
          },
          ticks: {
            color: getTextColor() // Use theme-appropriate text color
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    };
  }, [selectedIdol, eventName, idolData, timePoints, handleChartHover, theme]); // Add theme to dependencies

  return (
    <div className="relative w-full">
      <div className="relative w-full aspect-[2/1]" onMouseLeave={handleChartLeave}>
        <Line ref={chartRef} data={chartData} options={options} />
        
        {/* Custom crosshair and tooltip */}
        {crosshairPosition && hoveredData && (
          <>
            {/* Vertical crosshair line */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: crosshairPosition.x,
                top: '4.6%',
                height: '79%',
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
                    left: crosshairPosition.x - 6, // Center the 12px dot
                    top: yPixel - 6, // Center the 12px dot
                    width: 12,
                    height: 12,
                    backgroundColor: item.color,
                    border: '2px solid white',
                    zIndex: 15
                  }}
                />
              );
            })}
            
            {/* Custom tooltip */}
            <div
              className="absolute pointer-events-none bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 z-20 min-w-[200px] max-w-xs"
              style={{
                left: crosshairPosition.isNearRightEdge 
                  ? crosshairPosition.x - 250  // Move further left when near right edge
                  : crosshairPosition.x + 10,  // Show on right normally
                top: 50
              }}
            >
              <div className="text-sm font-semibold mb-2 text-center border-b border-base-300 pb-1">
                {hoveredData.timePoint}
              </div>                  <div className="space-y-1">
                {hoveredData.values.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{getIdolName(item.idol)} - {item.border}位</span>
                      {item.predicted && <span className="text-yellow-600">（予測）</span>}
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
  );
};

export default Type5MainChart;
