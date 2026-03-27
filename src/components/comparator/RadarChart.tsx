import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { ComparisonScores } from '../../utils/comparisonCalculations';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  data: {
    label: string;
    scores: ComparisonScores;
    color: string;
  }[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const chartData = {
    labels: ['Acceso', 'Ef. Terminal', 'Titulación', 'Equidad', 'Escala'],
    datasets: data.map((item) => ({
      label: item.label,
      data: [
        item.scores.acceso,
        item.scores.eficiencia,
        item.scores.titulacion,
        item.scores.genero,
        item.scores.escala,
      ],
      backgroundColor: `${item.color}33`, // 20% opacity
      borderColor: item.color,
      borderWidth: 2,
      pointBackgroundColor: item.color,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: item.color,
    })),
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          display: false,
          stepSize: 20,
        },
        pointLabels: {
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          color: '#64748b',
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Disabling native legend as requested
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: true,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px]">
      <Radar data={chartData} options={options} />
    </div>
  );
};

export default RadarChart;
