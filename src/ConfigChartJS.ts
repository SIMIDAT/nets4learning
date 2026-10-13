import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  ScatterController,
} from 'chart.js'

import { prefersReducedMotion, subscribeDisplaySettings } from '@core/a11y/displaySettings'

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  ScatterController
)

// Sin animaciones si se pide menos movimiento (en /settings o en el sistema): las gráficas que se creen desde entonces
const DEFAULT_ANIMATION = ChartJS.defaults.animation
const syncAnimation = () => {
  ChartJS.defaults.animation = prefersReducedMotion() ? false : DEFAULT_ANIMATION
}
syncAnimation()
subscribeDisplaySettings(syncAnimation)
window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', syncAnimation)
