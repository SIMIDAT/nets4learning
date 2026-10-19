import { useMemo } from 'react'
import { Line, Scatter } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'

import type { KMeansStep_t, Point_t } from '@core/clustering/kmeans'
import { useTheme } from '@hooks/useTheme'

import { chartColor, withAlpha } from '@core/chartColors'
import N4LChartData from '@components/chart/N4LChartData'

import { clusterColor } from './clusterColors'
import { prefersReducedMotion } from '@core/a11y/displaySettings'

const prefix = 'pages.playground.clustering.'

// Una forma de punto por grupo, además del color (WCAG 1.4.1); la cruz es de los centroides
const POINT_STYLES = ['circle', 'triangle', 'rect', 'rectRot', 'star', 'rectRounded', 'cross', 'dash', 'line', 'circle'] as const

type ScatterProps = {
  /** Los puntos ya proyectados a 2D */
  points   : [number, number][]
  step     : KMeansStep_t
  project  : (point: Point_t) => [number, number]
  /** Varianza que recoge cada eje (PCA) */
  explained: [number, number]
}

/** Los puntos en 2D (PCA), coloreados por grupo en una iteración, con sus centroides */
export function ClusterScatter({ points, step, project, explained }: ScatterProps) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  // Los centroides, del color del texto: negros en claro y casi blancos en oscuro
  const centroidColor = theme === 'dark' ? '#dee2e6' : '#000000'
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 0 }), [i18n.language])
  const k = step.centroids.length
  const datasets = [
    ...Array.from({ length: k }, (_value, cluster) => ({
      label          : t(prefix + 'cluster', { number: cluster + 1 }),
      data           : points.filter((_point, index) => step.assignments[index] === cluster).map(([x, y]) => ({ x, y })),
      backgroundColor: withAlpha(clusterColor(cluster, theme), 0.67),
      borderColor    : clusterColor(cluster, theme),
      pointStyle     : POINT_STYLES[cluster % POINT_STYLES.length],
      pointRadius    : 4,
    })),
    {
      label          : t(prefix + 'centroids'),
      data           : step.centroids.map((centroid) => project(centroid)).map(([x, y]) => ({ x, y })),
      backgroundColor: centroidColor,
      borderColor    : centroidColor,
      pointStyle     : 'crossRot' as const,
      pointRadius    : 9,
      borderWidth    : 3,
    },
  ]
  // Para quien no ve la gráfica: cuántas filas tiene cada grupo
  const description = Array.from({ length: k }, (_value, cluster) =>
    `${t(prefix + 'cluster', { number: cluster + 1 })}: ${t(prefix + 'rows', { count: step.assignments.filter((assigned) => assigned === cluster).length })}`).join(', ')
  const axis = (number: number) => t(prefix + 'axis', { number, variance: percent.format(explained[number - 1]) })
  return <>
    <Scatter role={'img'} aria-label={description} data={{ datasets }} options={{
      animation : prefersReducedMotion() ? false : { duration: 300 },
      responsive: true,
      // En la leyenda, la forma de cada grupo (no un cuadrado de color)
      plugins   : { legend: { labels: { usePointStyle: true } } },
      scales    : {
        x: { title: { display: true, text: axis(1) } },
        y: { title: { display: true, text: axis(2) } },
      },
    }} />
    {/* Los grupos con sus filas y dónde queda su centroide en la gráfica */}
    <N4LChartData caption={t(prefix + 'scatter-data')}
      columns={[t(prefix + 'group'), t(prefix + 'rows-column'), `${t(prefix + 'centroids')}, ${axis(1)}`, `${t(prefix + 'centroids')}, ${axis(2)}`]}
      rows={step.centroids.map((centroid, cluster) => {
        const [x, y] = project(centroid)
        return [t(prefix + 'cluster', { number: cluster + 1 }), step.assignments.filter((assigned) => assigned === cluster).length, x, y]
      })} />
  </>
}

/** El codo: la inercia para cada k, con la elegida resaltada */
export function ElbowChart({ values, k }: { values: { k: number, inertia: number }[], k: number }) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const number = new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 4 })
  const description = values.map((value) => `k = ${value.k}: ${number.format(value.inertia)}`).join(', ')
  return <>
    <Line role={'img'} aria-label={`${t(prefix + 'inertia')}. ${description}`} data={{
      labels  : values.map((value) => value.k),
      datasets: [{
        label          : t(prefix + 'inertia'),
        data           : values.map((value) => value.inertia),
        borderColor    : chartColor('blue', theme),
        backgroundColor: chartColor('blue', theme),
        pointRadius    : values.map((value) => (value.k === k ? 7 : 3)),
      }],
    }} options={{
      animation : false,
      responsive: true,
      scales    : { x: { title: { display: true, text: 'k' } }, y: { title: { display: true, text: t(prefix + 'inertia') } } },
    }} />
    <N4LChartData caption={t(prefix + 'inertia')} columns={['k', t(prefix + 'inertia')]} rows={values.map((value) => [value.k, value.inertia])} />
  </>
}
