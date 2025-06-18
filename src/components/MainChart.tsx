import React from 'react';
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
  ChartOptions
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
}

const MainChart: React.FC<MainChartProps> = ({ data, startAt }) => {
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

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
          display: true,
          position: 'bottom',
          labels: {
              generateLabels: () => [{
                  text: '予測範囲',
                  fillStyle: 'rgba(103, 220, 209, 0.1)',
                  strokeStyle: 'rgba(69, 120, 129, 1)',
                  fontColor: 'rgba(69, 120, 129, 1)',
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
        padding: {
          bottom: 10
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '時間'
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'スコア'
        }
      }
    }
  };

  return (
    <div className="relative w-full aspect-[2/1]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MainChart;