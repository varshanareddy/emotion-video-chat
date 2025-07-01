import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { EmotionData } from '../types/emotion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EmotionChartProps {
  emotions: EmotionData[];
}

const EmotionChart: React.FC<EmotionChartProps> = ({ emotions }) => {
  const emotionColors = {
    happy: '#10B981',
    sad: '#3B82F6',
    angry: '#EF4444',
    surprised: '#F59E0B',
    neutral: '#6B7280',
  };

  // Prepare data for the chart
  const chartData = {
    labels: emotions.map((_, index) => `${index + 1}`),
    datasets: [
      {
        label: 'Emotion Confidence',
        data: emotions.map(emotion => ({
          x: emotions.indexOf(emotion),
          y: emotion.confidence,
          emotion: emotion.emotion,
        })),
        borderColor: emotions.map(emotion => emotionColors[emotion.emotion]),
        backgroundColor: emotions.map(emotion => emotionColors[emotion.emotion] + '20'),
        pointBackgroundColor: emotions.map(emotion => emotionColors[emotion.emotion]),
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const emotion = emotions[index];
            return `${emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1)} Emotion`;
          },
          label: (context: any) => {
            const confidence = (context.parsed.y * 100).toFixed(1);
            return `Confidence: ${confidence}%`;
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time Sequence',
          color: '#FFFFFF',
        },
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: 'Confidence',
          color: '#FFFFFF',
        },
        ticks: {
          color: '#9CA3AF',
          callback: (value: any) => `${(value * 100).toFixed(0)}%`,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  // Emotion distribution
  const emotionCounts = emotions.reduce((acc, emotion) => {
    acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEmotions = emotions.length;

  return (
    <div className="space-y-6">
      {/* Line Chart */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>

      {/* Emotion Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(emotionColors).map(([emotion, color]) => {
          const count = emotionCounts[emotion] || 0;
          const percentage = totalEmotions > 0 ? (count / totalEmotions) * 100 : 0;
          
          return (
            <div key={emotion} className="text-center">
              <div className="text-2xl mb-2">
                {emotion === 'happy' && '😊'}
                {emotion === 'sad' && '😢'}
                {emotion === 'angry' && '😠'}
                {emotion === 'surprised' && '😲'}
                {emotion === 'neutral' && '😐'}
              </div>
              <div className="text-white font-medium capitalize mb-1">{emotion}</div>
              <div className="text-sm text-slate-300 mb-2">
                {count} ({percentage.toFixed(1)}%)
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmotionChart;