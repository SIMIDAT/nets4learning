import { useTranslation } from 'react-i18next'
import { Scatter } from 'react-chartjs-2'

import { beeswarmLayout, shapColor } from './beeswarmLayout'

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
  const prefix = 'pages.playground.0-tabular-classification.general.'
  const nFeatures = features.length
  const { points, order } = beeswarmLayout(shap, featureValues, featureDisplay, features)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '700px', height: `${Math.max(260, nFeatures * 64)}px` }}>
        <Scatter
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
                pointBorderWidth    : 0,
                pointRadius         : 3.5,
                pointHoverRadius    : 5,
              },
              // Línea vertical en SHAP = 0
              {
                data       : [{ x: 0, y: -0.5 }, { x: 0, y: nFeatures - 0.5 }],
                showLine   : true,
                pointRadius: 0,
                borderColor: 'rgba(108, 117, 125, 0.8)',
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
    </div>
  )
}
