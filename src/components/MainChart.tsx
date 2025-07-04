import React, { useRef, useState } from 'react';
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
  ChartData,
  ChartOptions,
  InteractionItem
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
  annotationPlugin
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
        id: number;  // Added this for the event ID
      };
    };
  };
  startAt: string;
  theme?: string; // Add theme prop to trigger re-renders when theme changes
}

const MainChart: React.FC<MainChartProps> = ({ data, startAt, theme }) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredData, setHoveredData] = useState<{ timePoint: string; value: number } | null>(null);

  const timePoints = Array.from(
    { length: data.data.raw.target.length },
    (_, i) => {
      const date = new Date(startAt);
      date.setMinutes(date.getMinutes() + i * 30);
      return date.toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  const chartData: ChartData<'line'> = {
    labels: timePoints,
    datasets: [{
      label: 'スコア',
      data: data.data.raw.target,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
      pointRadius: 0,
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
                  strokeStyle: 'rgba(69, 120, 129, 1)',
                  fontColor: textColor,
                  lineWidth: 1,
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
        text: 'スコア推移',
        color: textColor,
        padding: {
          bottom: 10
        }
      },
      tooltip: {
        enabled: false // Disable default tooltip since we're using custom crosshair
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
                top: 26,
                bottom: 80,
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
                  ? crosshairPosition.x - 130 
                  : crosshairPosition.x + 10,
                top: Math.max(crosshairPosition.y - 60, 10)
              }}
            >
              <div className="text-sm font-semibold mb-1">
                {hoveredData.timePoint}
              </div>
              <div className="text-xs">
                スコア: {hoveredData.value.toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MainChart;