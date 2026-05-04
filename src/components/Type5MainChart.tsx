import React, { useRef, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
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
import { getRelativePosition } from 'chart.js/helpers';
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
  annotationPlugin,
  zoomPlugin
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
  // console.log('🎨 Type5MainChart rendering with:', { selectedIdol, eventName, theme });
  
  const chartRef = useRef<ChartJS<'line'> & { 
    resetZoom?: () => void; 
    zoom?: (factor: number) => void; 
  }>(null);
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
  
  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply zoom state when chart is ready
  React.useEffect(() => {
    if (chartRef.current && zoomState) {
      const chart = chartRef.current;
      // console.log('Applying zoom state:', zoomState);
      
      // Set the scale limits directly
      chart.scales.x.min = zoomState.min;
      chart.scales.x.max = zoomState.max;
      chart.update('none'); // Update without animation
    }
  }, [zoomState]); // Remove chartRef.current dependency

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

  // Generate time points for chart display (memoized to prevent infinite re-renders)
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
      
      // Show date only on mobile, full date & time on desktop for X-axis
      if (isMobile) {
        return date.toLocaleDateString('ja-JP', {
          month: 'numeric',
          day: 'numeric',
          timeZone: 'Asia/Tokyo'
        });
      } else {
        return date.toLocaleString('ja-JP', {
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Asia/Tokyo'
        });
      }
    });
  }, [idolPredictions, selectedIdol, startAt, isMobile]);

  // Generate full date time points for tooltips (always show full date & time)
  const fullTimePoints = useMemo(() => {
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
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
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
  }, [idolData, selectedIdol, timePoints, theme]);

  const handleChartLeave = React.useCallback(() => {
    setCrosshairPosition(null);
    setHoveredData(null);
    // Also clear Chart.js's own hover state so its canvas-drawn hover dots
    // (hoverRadius) don't linger after our React state is cleared.
    const chart = chartRef.current;
    if (chart) {
      chart.setActiveElements([]);
      chart.update('none');
    }
  }, []);

  // Touch scrubbing: drag a finger to move the crosshair. We dispatch a
  // synthetic MouseEvent on the canvas so Chart.js's own event pipeline
  // runs `onHover` with the latest captured state, avoiding any duplication
  // of hover logic. Must be attached via a non-passive native listener so
  // we can preventDefault to stop the page from scrolling while scrubbing.
  // Tooltip persists after touchend so the user can read it without their
  // finger in the way; `mouseleave` still clears it on desktop.
  const chartContainerRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const forwardToChart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const canvas = chartRef.current?.canvas;
      if (!touch || !canvas) return;
      if (e.cancelable) e.preventDefault();
      canvas.dispatchEvent(new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
      }));
    };
    el.addEventListener('touchstart', forwardToChart, { passive: false });
    el.addEventListener('touchmove', forwardToChart, { passive: false });
    return () => {
      el.removeEventListener('touchstart', forwardToChart);
      el.removeEventListener('touchmove', forwardToChart);
    };
  }, []);

  // Dismiss the crosshair when the pointer moves or taps outside the plot
  // rectangle. `mousemove` covers desktop hover (Chart.js's own onHover
  // doesn't reliably fire in every pixel of the axis/legend margins);
  // `click` + `touchend` cover touch taps (iOS Safari suppresses `click`
  // on non-interactive targets, so `touchend` is the reliable path there).
  React.useEffect(() => {
    const isOutsidePlot = (clientX: number, clientY: number) => {
      const chart = chartRef.current;
      const area = chart?.chartArea;
      if (!chart || !area) return false;
      const canvasRect = chart.canvas.getBoundingClientRect();
      return (
        clientX < canvasRect.left + area.left ||
        clientX > canvasRect.left + area.right ||
        clientY < canvasRect.top + area.top ||
        clientY > canvasRect.top + area.bottom
      );
    };
    const onMove = (e: MouseEvent) => {
      if (isOutsidePlot(e.clientX, e.clientY)) handleChartLeave();
    };
    const onClick = (e: MouseEvent) => {
      if (isOutsidePlot(e.clientX, e.clientY)) handleChartLeave();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch && isOutsidePlot(touch.clientX, touch.clientY)) handleChartLeave();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Range selection mouse handlers
  const handleMouseDown = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // console.log('Mouse down triggered');
    const chart = chartRef.current;
    if (!chart) return;

    // Get the chart canvas bounds
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Convert pixel position to data index
    const canvasPosition = getRelativePosition(event.nativeEvent, chart);
    const dataIndex = chart.scales.x.getValueForPixel(canvasPosition.x);
    
    // console.log('Mouse down - dataIndex:', dataIndex, 'timePoints.length:', timePoints.length);
    
    if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < timePoints.length) {
      // console.log('Starting selection at index:', dataIndex);
      setIsSelecting(true);
      setSelectionStart(dataIndex);
      setSelectionEnd(dataIndex);
      setSelectionRect({ x, width: 0 });
    }
  }, [timePoints.length]);

  const handleMouseMove = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const chart = chartRef.current;
    if (!chart || !isSelecting || selectionStart === null) return;

    // console.log('🖱️ Mouse move during selection - isSelecting:', isSelecting, 'selectionStart:', selectionStart);
    
    // Convert pixel position to data index
    const canvasPosition = getRelativePosition(event.nativeEvent, chart);
    const dataIndex = chart.scales.x.getValueForPixel(canvasPosition.x);
    
    // console.log('🎯 Mouse move - dataIndex:', dataIndex, 'timePoints.length:', timePoints.length);
    
    if (typeof dataIndex === 'number' && dataIndex >= 0 && dataIndex < timePoints.length) {
      // console.log('📏 Updating selection end to:', dataIndex);
      setSelectionEnd(dataIndex);
      
      // Update selection rectangle
      const startPixel = chart.scales.x.getPixelForValue(selectionStart);
      const endPixel = chart.scales.x.getPixelForValue(dataIndex);
      const leftPixel = Math.min(startPixel, endPixel);
      const rightPixel = Math.max(startPixel, endPixel);
      
      // console.log('🔲 Selection rectangle pixels:', { startPixel, endPixel, leftPixel, rightPixel });
      
      setSelectionRect({
        x: leftPixel,
        width: rightPixel - leftPixel
      });
    }
  }, [isSelecting, selectionStart, timePoints.length]);

  const handleMouseUp = React.useCallback(() => {
    console.log('🖱️ Mouse up triggered - isSelecting:', isSelecting, 'selectionStart:', selectionStart, 'selectionEnd:', selectionEnd);
    
    if (!isSelecting || selectionStart === null || selectionEnd === null) {
      console.log('❌ No active selection, resetting state');
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectionRect(null);
      return;
    }

    const chart = chartRef.current;
    if (!chart) {
      console.log('❌ No chart ref available');
      return;
    }

    const minIndex = Math.round(Math.min(selectionStart, selectionEnd));
    const maxIndex = Math.round(Math.max(selectionStart, selectionEnd));
    
    console.log('📊 Range selection completed:', { 
      originalStart: selectionStart, 
      originalEnd: selectionEnd, 
      minIndex, 
      maxIndex, 
      range: maxIndex - minIndex,
      timePointsLength: timePoints.length
    });
    
    // Only zoom if there's a meaningful selection (more than 1 data point)
    if (maxIndex - minIndex > 1) {
      console.log('✅ Setting zoom state:', { min: minIndex, max: maxIndex });
      setZoomState({ min: minIndex, max: maxIndex });
    } else {
      console.log('❌ Selection too small, not zooming. Range:', maxIndex - minIndex);
    }

    // Reset selection state
    console.log('🔄 Resetting selection state');
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionRect(null);
  }, [isSelecting, selectionStart, selectionEnd, timePoints.length]);

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

  // Apply zoom state when it changes
  React.useEffect(() => {
    console.log('🔄 Zoom state useEffect triggered - zoomState:', zoomState, 'chartRef.current:', !!chartRef.current);
    
    if (zoomState && chartRef.current) {
      const chart = chartRef.current;
      console.log('🔍 Applying zoom state:', zoomState);
      console.log('📊 Current chart scales before zoom:', { 
        xMin: chart.scales.x.min, 
        xMax: chart.scales.x.max,
        dataLength: timePoints.length
      });
      
      // Use the chartjs-plugin-zoom's zoomScale method
      try {
        console.log('🔍 Attempting to use zoomScale method');
        (chart as any).zoomScale('x', { min: zoomState.min, max: zoomState.max }, 'none');
        console.log('✅ zoomScale method succeeded');
      } catch (error) {
        console.log('❌ zoomScale method failed:', error);
        
        // Fallback: Direct scale manipulation with forced update
        console.log('🔍 Falling back to direct scale manipulation');
        chart.scales.x.min = zoomState.min;
        chart.scales.x.max = zoomState.max;
        chart.update('resize'); // Force a complete update
      }
      
      console.log('📊 Chart scales after zoom:', { 
        xMin: chart.scales.x.min, 
        xMax: chart.scales.x.max 
      });
    } else if (zoomState && !chartRef.current) {
      console.log('❌ Zoom state exists but no chart ref');
    } else {
      console.log('ℹ️ No zoom state to apply');
    }
  }, [zoomState, timePoints.length]);

  // Debug logging for state changes
  React.useEffect(() => {
    // console.log('🔄 Component state changed:', {
    //   isSelecting,
    //   selectionStart,
    //   selectionEnd,
    //   hasSelectionRect: !!selectionRect,
    //   zoomState
    // });
  }, [isSelecting, selectionStart, selectionEnd, selectionRect, zoomState]);

  // Set up chart pan handlers after chart is created to avoid re-render loops
  React.useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      
      // Set up pan handlers if zoom plugin is available
      if (chart.options.plugins?.zoom?.pan) {
        chart.options.plugins.zoom.pan.onPanStart = function() {
          setIsPanning(true);
          return false;
        };
        chart.options.plugins.zoom.pan.onPanComplete = function(_context: any) {
          // console.log('Pan completed:', context);
          setIsPanning(false);
          return false;
        };
      }
      
      // console.log('📊 Chart event handlers set up');
    }
  }, []); // Empty dependency array to prevent re-render loops

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
      interaction: {
        mode: 'index',
        intersect: false
      },
      // onHover handler inline to ensure it always has current state
      onHover: (event: any, _elements: InteractionItem[]) => {
        const chart = chartRef.current;
        if (!chart || !event.native || isPanning || isSelecting) return; // Hide crosshair during panning or selection

        const rect = chart.canvas.getBoundingClientRect();
        const x = event.native.clientX - rect.left;
        const y = event.native.clientY - rect.top;

        // Ignore events outside the plot rectangle so edges/margins don't
        // snap to the first/last data point.
        const area = chart.chartArea;
        if (area && (x < area.left || x > area.right || y < area.top || y > area.bottom)) {
          // Sync-clear React state and Chart.js's own hover state.
          setCrosshairPosition(prev => (prev !== null ? null : prev));
          setHoveredData(prev => (prev !== null ? null : prev));
          if (chart.getActiveElements().length > 0) {
            chart.setActiveElements([]);
            chart.update('none');
          }
          return;
        }

        // Use Chart.js built-in methods to get the data index from pixel position
        const rawDataIndex = chart.scales.x.getValueForPixel(x);
        if (rawDataIndex === undefined) return;
        
        const dataIndex = Math.round(rawDataIndex);
        
        if (dataIndex >= 0 && dataIndex < timePoints.length) {
          // Get the actual x pixel position for this data index using Chart.js scale
          const snappedX = chart.scales.x.getPixelForValue(dataIndex);
          
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
            timePoint: fullTimePoints[dataIndex],
            values: values.sort((a, b) => b.value - a.value) // Sort by value descending
          });
        } else {
          setCrosshairPosition(null);
          setHoveredData(null);
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            color: getTextColor(), // Use theme-appropriate text color
            font: {
              size: isMobile ? 11 : 12
            },
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
              
              // Add prediction range legend
              labels.push({
                text: '予測範囲',
                fillStyle: 'rgba(103, 220, 209, 0.1)',
                strokeStyle: 'rgba(103, 220, 209, 0.6)',
                lineWidth: 2,
                pointStyle: 'rect' as const,
                fontColor: getTextColor()
              });
              
              return labels;
            }
          }
        },
        title: {
          display: true,
          text: `${eventName} - ${idolName}`,
          padding: { bottom: 20 },
          color: getTextColor(), // Use theme-appropriate text color
          font: {
            size: isMobile ? 14 : 16
          }
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
                xMin: (() => {
                  return Math.min(
                    ...[
                      idolData.prediction100?.metadata.raw.last_known_step_index,
                      idolData.prediction1000?.metadata.raw.last_known_step_index
                    ].filter(val => val !== undefined)
                  );
                })(),
                xMax: timePoints.length - 1,
                backgroundColor: 'rgba(103, 220, 209, 0.1)',
                borderColor: 'rgba(200, 200, 200, 0.2)',
                borderWidth: 1
              },
              // Prediction start line
              predictionLine: {
                type: 'line',
                xMin: (() => {
                  return Math.min(
                    ...[
                      idolData.prediction100?.metadata.raw.last_known_step_index,
                      idolData.prediction1000?.metadata.raw.last_known_step_index
                    ].filter(val => val !== undefined)
                  );
                })(),
                xMax: (() => {
                  return Math.min(
                    ...[
                      idolData.prediction100?.metadata.raw.last_known_step_index,
                      idolData.prediction1000?.metadata.raw.last_known_step_index
                    ].filter(val => val !== undefined)
                  );
                })(),
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                borderDash: [5, 5]
              }
            } : {})
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
            enabled: false // Disable pan to prevent conflicts with range selection
          },
          limits: {
            x: {
              min: 0,
              max: timePoints.length - 1,
              minRange: Math.max(1, Math.ceil(timePoints.length * 0.1))
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
            color: getTextColor(), // Use theme-appropriate text color
            font: {
              size: isMobile ? 11 : 12
            }
          },
          ticks: {
            color: getTextColor(), // Use theme-appropriate text color
            font: {
              size: isMobile ? 10 : 11
            },
            // Only reduce number of ticks on mobile
            ...(isMobile && { maxTicksLimit: 6 }),
            // Split "mm/dd hh:mm" into two rows so labels stay compact.
            // Mobile labels are already mm/dd only, so the split is a no-op there.
            callback: function(value: number | string) {
              const raw = (this as any).getLabelForValue(Number(value));
              const parts = typeof raw === 'string' ? raw.split(' ') : [raw];
              return parts.length === 2 ? parts : raw;
            }
          }
        },
        y: {
          beginAtZero: false,
          // On mobile we mirror the y-axis ticks inside the plot to widen
          // the usable chart area; the title would just eat space there.
          title: {
            display: !isMobile,
            text: 'スコア',
            color: getTextColor(),
            font: {
              size: isMobile ? 11 : 12
            }
          },
          ticks: {
            color: getTextColor(), // Use theme-appropriate text color
            font: {
              size: isMobile ? 10 : 11
            },
            mirror: true,
            padding: 4,
            z: 1,
            callback: function(value: number | string) {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              return formatJapaneseNumber(numValue);
            }
          }
        }
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: isMobile ? 6 : 4,
          hitRadius: isMobile ? 20 : 10
        },
        line: {
          borderWidth: isMobile ? 2 : 1.5,
          tension: 0.1
        }
      }
    };
  }, [selectedIdol, eventName, idolData, timePoints, theme, isMobile]);

  const resetZoom = () => {
    if (chartRef.current) {
      // console.log('Resetting zoom...');
      chartRef.current.resetZoom();
      setZoomState(null); // Clear the zoom state
    } else {
      // console.log('Chart ref not available');
    }
  };

  return (
    <div className="relative w-full">
      {/* Zoom Controls */}
      <div className="flex justify-between items-center mb-2">
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
      
      <div 
        ref={chartContainerRef}
        className="relative w-full h-[60vh] min-h-[360px] sm:h-[400px] md:h-[600px]" 
        onMouseLeave={handleChartLeave}
        onMouseDown={(e) => {
          // console.log('📍 DIV Mouse Down Event:', { 
          //   clientX: e.clientX, 
          //   clientY: e.clientY,
          //   target: e.target,
          //   currentTarget: e.currentTarget
          // });
          handleMouseDown(e);
        }}
        onMouseMove={(e) => {
          // Only log if selecting to avoid spam
          // if (isSelecting) {
          //   console.log('📍 DIV Mouse Move Event during selection');
          // }
          handleMouseMove(e);
        }}
        onMouseUp={() => {
          // console.log('📍 DIV Mouse Up Event');
          handleMouseUp();
        }}
      >
        <Line ref={chartRef} data={chartData} options={options} />
        
        {/* Range selection rectangle — capped to the plot rectangle so it
            tracks the real grid on zoom/resize. */}
        {selectionRect && isSelecting && (() => {
          const area = chartRef.current?.chartArea;
          if (!area) return null;
          return (
            <div
              className="absolute pointer-events-none bg-primary/20 border border-primary"
              style={{
                left: selectionRect.x,
                top: area.top,
                width: selectionRect.width,
                height: area.bottom - area.top,
                zIndex: 5
              }}
            />
          );
        })()}
        
        {/* Custom crosshair and tooltip */}
        {crosshairPosition && hoveredData && (
          <>
            {/* Vertical crosshair line, capped to the plot rectangle */}
            {(() => {
              const area = chartRef.current?.chartArea;
              if (!area) return null;
              return (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: crosshairPosition.x,
                    top: area.top,
                    height: area.bottom - area.top,
                    width: 1,
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    zIndex: 10
                  }}
                />
              );
            })()}
            
            {/* Intersection dots */}
            {hoveredData.values.map((item, index) => {
              const chart = chartRef.current;
              if (!chart) return null;
              
              // Use the chart's getPixelForValue method to get accurate pixel position
              const yPixel = chart.scales.y.getPixelForValue(item.value);
              
              return (
                <div
                  key={index}
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: crosshairPosition.x - 6,
                    top: yPixel - 6,
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
              className="absolute pointer-events-none bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 z-20 min-w-[160px] sm:min-w-[320px] max-w-[90vw]"
              style={{
                left: (() => {
                  const containerWidth = window.innerWidth;
                  const tooltipWidth = isMobile ? 160 : 320;
                  
                  if (isMobile) {
                    if (crosshairPosition.x > containerWidth * 0.5) {
                      return Math.max(10, crosshairPosition.x - tooltipWidth - 10);
                    } else {
                      return Math.min(crosshairPosition.x + 10, containerWidth - tooltipWidth - 10);
                    }
                  }
                  
                  return crosshairPosition.isNearRightEdge 
                    ? crosshairPosition.x - tooltipWidth - 10
                    : crosshairPosition.x + 10;
                })(),
                top: 50
              }}
            >
              <div className="text-sm font-semibold mb-2 text-center border-b border-base-300 pb-1">
                {hoveredData.timePoint}
              </div>
              <div className="space-y-1">
                {hoveredData.values.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">
                        <span className="hidden sm:inline">{getIdolName(item.idol)} - </span>
                        {item.border}位
                      </span>
                      {item.predicted && <span className="text-yellow-600 hidden sm:inline">（予測）</span>}
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
  );
};

export default Type5MainChart;
