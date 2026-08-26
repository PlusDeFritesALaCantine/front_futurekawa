import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
  type ChartData, type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { Mesure, Pays } from '../types'
import { getSeuil, type MesureType } from '../config/seuils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface MesureChartProps {
  mesures: Mesure[]
  type: MesureType
  pays: Pays
}

export default function MesureChart({ mesures, type, pays }: MesureChartProps) {
  const { ideal, min, max } = getSeuil(pays, type)
  const unit = type === 'temperature' ? '°C' : '%'
  const color = type === 'temperature' ? '#5b8ec4' : '#c99a4b'
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
        borderColor: '#d1604a',
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 2,
      },
      {
        label: `Idéal (${ideal}${unit})`,
        data: Array(n).fill(ideal),
        borderColor: '#5fa374',
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 3,
      },
      {
        label: `Min (${min}${unit})`,
        data: Array(n).fill(min),
        borderColor: '#d1604a',
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 4,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1712',
        titleColor: '#f1e9dc',
        bodyColor: '#a89881',
        borderColor: '#392f23',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 8, font: { size: 10 }, color: '#6f6151' },
        grid: { color: '#241d16' },
      },
      y: {
        min: type === 'temperature' ? min - 6 : min - 8,
        max: max + 8,
        ticks: { font: { size: 10 }, color: '#6f6151' },
        grid: { color: '#241d16' },
      },
    },
  }

  return <Line data={data} options={options} />
}
