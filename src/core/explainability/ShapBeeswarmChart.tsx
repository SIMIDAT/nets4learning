import { useTranslation } from 'react-i18next'
import { Scatter } from 'react-chartjs-2'

import { beeswarmLayout, shapColor } from './beeswarmLayout'
import { chartColor } from '@core/chartColors'
import { useTheme } from '@hooks/useTheme'
import N4LChartData from '@components/chart/N4LChartData'

interface ShapBeeswarmChartProps {
  /** Matriz de valores SHAP: shap[instancia][feature] */
  shap           : number[][]
  /** Matriz de valores de las features: featureValues[instancia][feature] */
  featureValues  : number[][]
  /** Valores legibles para el tooltip (p. ej. antes del escalado), con la misma forma que `featureValues`. */
  featureDisplay?: Array<Array<string | number>>
  /** Nombres de las features */
  features       : string[]
}

// Puntos algo transparentes, para que se vea dónde se acumulan
const withAlpha = (rgb: string) => rgb.replace('rgb(', 'rgba(').replace(')', ', 0.7)')

/** Beeswarm de SHAP (summary plot): una fila por feature y un punto por instancia, coloreado por el valor */
export default function ShapBeeswarmChart({ shap, featureValues, featureDisplay, features }: ShapBeeswarmChartProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const prefix = 'pages.playground.0-tabular-classification.general.'
  const nFeatures = features.length
  const { points, order } = beeswarmLayout(shap, featureValues, featureDisplay, features)
  // Para quien no ve la gráfica: las variables de la que más influye a la que menos (media del valor absoluto de SHAP)
  const importance = features.map((name, f) => ({ name, mean: shap.reduce((sum, row) => sum + Math.abs(row[f] ?? 0), 0) / Math.max(1, shap.length) }))
  const description = t('ui.explain.beeswarm-description', {
    count   : shap.length,
    features: importance.sort((a, b) => b.mean - a.mean).map(({ name, mean }) => `${name} (${mean.toFixed(3)})`).join(', '),
  })

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '700px', height: `${Math.max(260, nFeatures * 64)}px` }}>
        <Scatter
          role={'img'}
          aria-label={description}
          options={{
            responsive         : true,
            maintainAspectRatio: false,
            animation          : false,
            plugins            : {
              legend : { display: false },
              tooltip: {
                // Solo los puntos, no la línea del cero
                filter   : (item) => item.datasetIndex === 0,
                callbacks: {
                  title: () => '',
                  label: (item) => {
                    const point = points[item.dataIndex]
                    return [`${point.feature} = ${point.value}`, `SHAP ${point.x >= 0 ? '+' : ''}${point.x.toFixed(4)}`]
                  },
                },
              },
            },
            scales: {
              x: { title: { display: true, text: t(prefix + 'beeswarm-shap-value', { defaultValue: 'SHAP value' }) } },
              y: {
                min            : -0.5,
                max            : nFeatures - 0.5,
                // Una marca por fila, con el nombre de su feature
                afterBuildTicks: (axis) => { axis.ticks = Array.from({ length: nFeatures }, (_, row) => ({ value: row })) },
                ticks          : { callback: (value) => features[order[Number(value)]] ?? '' },
              },
            },
          }}
          data={{
            datasets: [
              {
                data                : points.map(({ x, y }) => ({ x, y })),
                pointBackgroundColor: points.map(({ color }) => withAlpha(color)),
                // El borde, del color entero: el punto se distingue del fondo aunque el relleno sea translúcido
                pointBorderColor    : points.map(({ color }) => color),
                pointBorderWidth    : 1,
                pointRadius         : 3.5,
                pointHoverRadius    : 5,
              },
              // Línea vertical en SHAP = 0
              {
                data       : [{ x: 0, y: -0.5 }, { x: 0, y: nFeatures - 0.5 }],
                showLine   : true,
                pointRadius: 0,
                borderColor: chartColor('gray', theme),
                borderWidth: 1,
              },
            ],
          }}
        />
      </div>

      {/* Leyenda de color continua: valor de la feature de bajo (azul) a alto (rojo) */}
      <div className="d-flex align-items-center gap-2 mt-2" style={{ maxWidth: '700px' }}>
        <small className="text-muted">
          {t('pages.playground.0-tabular-classification.general.beeswarm-low', { defaultValue: 'Low' })}
        </small>
        <div
          style={{
            flex        : 1,
            height      : '10px',
            borderRadius: '5px',
            background  : `linear-gradient(to right, ${shapColor(0)}, ${shapColor(0.5)}, ${shapColor(1)})`,
          }}
        />
        <small className="text-muted">
          {t('pages.playground.0-tabular-classification.general.beeswarm-high', { defaultValue: 'High' })}
        </small>
        <small className="text-muted ms-2">
          {t('pages.playground.0-tabular-classification.general.beeswarm-feature-value', {
            defaultValue: 'Feature value',
          })}
        </small>
      </div>
      {/* Cada variable: cuánto influye de media y entre qué valores SHAP están sus puntos */}
      <N4LChartData caption={t('ui.explain.beeswarm-data', { count: shap.length })}
        columns={[t('ui.explain.variable'), t('ui.explain.mean-abs'), t('ui.explain.min'), t('ui.explain.max')]}
        rows={importance.map(({ name, mean }) => {
          const values = shap.map((row) => row[features.indexOf(name)] ?? 0)
          return [name, mean, Math.min(...values), Math.max(...values)]
        })} />
    </div>
  )
}
