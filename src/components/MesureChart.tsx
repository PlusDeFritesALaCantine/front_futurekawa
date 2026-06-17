import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
  type ChartData, type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { Mesure } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

type MesureType = 'temperature' | 'humidity'

const CONFIG: Record<MesureType, { ideal: number; min: number; max: number; unit: string; color: string }> = {
  temperature: { ideal: 29, min: 26, max: 32, unit: '°C', color: '#3b82f6' },
  humidity:    { ideal: 55, min: 53, max: 57, unit: '%',  color: '#8b5cf6' },
}

interface MesureChartProps {
  mesures: Mesure[]
  type: MesureType
}

export default function MesureChart({ mesures, type }: MesureChartProps) {
  const { ideal, min, max, unit, color } = CONFIG[type]
  const n = mesures.length

  const labels = mesures.map(m =>
    new Date(m.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  )

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: type === 'temperature' ? 'Température' : 'Humidité',
        data: mesures.map(m => m[type]),
        borderColor: color,
        backgroundColor: color + '18',
        fill: true,
        tension: 0.35,
        pointRadius: n > 30 ? 2 : 4,
        pointHoverRadius: 5,
        borderWidth: 2,
        order: 1,
      },
      {
        label: `Max (${max}${unit})`,
        data: Array(n).fill(max),
        borderColor: '#ef4444',
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 2,
      },
      {
        label: `Idéal (${ideal}${unit})`,
        data: Array(n).fill(ideal),
        borderColor: '#22c55e',
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 3,
      },
      {
        label: `Min (${min}${unit})`,
        data: Array(n).fill(min),
        borderColor: '#ef4444',
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 4,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 8, font: { size: 10 } },
        grid: { color: '#f1f5f9' },
      },
      y: {
        min: type === 'temperature' ? 20 : 45,
        max: type === 'temperature' ? 40 : 65,
        ticks: { font: { size: 10 } },
        grid: { color: '#f1f5f9' },
      },
    },
  }

  return <Line data={data} options={options} />
}
