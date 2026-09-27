import { useTranslation } from 'react-i18next'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

interface ShapBeeswarmChartProps {
  /** Matriz de valores SHAP: shap[instancia][feature] */
  shap: number[][]
  /** Matriz de valores de las features: featureValues[instancia][feature] */
  featureValues: number[][]
  /** Nombres de las features */
  features: string[]
}

/** Color SHAP: t=0 (valor bajo) azul → t=1 (valor alto) rojo. */
function shapColor(t: number): string {
  const low = [0, 139, 251] // #008bfb
  const high = [255, 0, 81] // #ff0051
  const r = Math.round(low[0] + (high[0] - low[0]) * t)
  const g = Math.round(low[1] + (high[1] - low[1]) * t)
  const b = Math.round(low[2] + (high[2] - low[2]) * t)
  return `rgb(${r}, ${g}, ${b})`
}

interface Point {
  x: number // valor SHAP (eje horizontal)
  y: number // fila de la feature + desplazamiento dodge (eje vertical)
  color: string // color según el valor de la feature
  feature: string
  value: number
}

export default function ShapBeeswarmChart({ shap, featureValues, features }: ShapBeeswarmChartProps) {
  const { t } = useTranslation()

  const nFeatures = features.length
  const nInstances = shap.length

  // Importancia (mean|SHAP|) de cada feature, para ordenar las filas.
  const importance = features.map((_, f) => {
    let s = 0
    for (let i = 0; i < nInstances; i++) s += Math.abs(shap[i]?.[f] ?? 0)
    return nInstances > 0 ? s / nInstances : 0
  })

  // Orden de filas: ascendente por importancia → la más importante queda con el índice
  // de fila más alto, es decir, arriba del todo (convención del summary plot de SHAP).
  const order = [...features.keys()].sort((a, b) => importance[a] - importance[b])

  // --- Preparativos para el "dodge" (apilado tipo beeswarm) ---
  // Rango global de los valores SHAP: define cómo de anchos son los grupos (bins) en X.
  let xMin = Infinity
  let xMax = -Infinity
  for (let i = 0; i < nInstances; i++) {
    for (let f = 0; f < nFeatures; f++) {
      const v = shap[i]?.[f] ?? 0
      if (v < xMin) xMin = v
      if (v > xMax) xMax = v
    }
  }
  // 40 grupos (bins) a lo ancho del eje X.
  const binWidth = (xMax - xMin) / 40 || 1
  // Semi-altura máxima del abanico: los puntos de una fila nunca pasan de ±maxSpread,
  // así no invaden la fila de al lado.
  const maxSpread = 0.42

  // Construimos todos los puntos. Por cada feature, un punto por instancia, con:
  //   x = valor SHAP, y = fila + desplazamiento (dodge), color = valor de la feature.
  const points: Point[] = []
  for (let row = 0; row < nFeatures; row++) {
    const f = order[row]
    // min/max de la feature para normalizar el color a [0,1].
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < nInstances; i++) {
      const v = featureValues[i]?.[f] ?? 0
      if (v < min) min = v
      if (v > max) max = v
    }

    // Pasada 1: contar puntos por bin para saber cuál es la pila más alta de esta fila.
    const binCounts = new Map<number, number>()
    for (let i = 0; i < nInstances; i++) {
      const bin = Math.round((shap[i]?.[f] ?? 0) / binWidth)
      binCounts.set(bin, (binCounts.get(bin) ?? 0) + 1)
    }
    let maxCount = 0
    for (const c of binCounts.values()) if (c > maxCount) maxCount = c
    // step adaptativo: la pila más alta debe caber justo en ±maxSpread (tope de 0.09 para
    // que las filas poco densas no queden con los puntos pegados).
    const maxMagnitude = Math.ceil((maxCount - 1) / 2)
    const step = maxMagnitude > 0 ? Math.min(0.09, maxSpread / maxMagnitude) : 0

    // Pasada 2: colocar cada punto apilándolo en su bin.
    const placed = new Map<number, number>()
    for (let i = 0; i < nInstances; i++) {
      const shapVal = shap[i]?.[f] ?? 0
      const featVal = featureValues[i]?.[f] ?? 0
      const norm = max > min ? (featVal - min) / (max - min) : 0.5

      const bin = Math.round(shapVal / binWidth)
      const k = placed.get(bin) ?? 0
      placed.set(bin, k + 1)
      // apilado simétrico: 0 centro, luego -1,+1,-2,+2... (k par→arriba, impar→abajo)
      const offset = (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * step

      points.push({
        x: shapVal,
        y: row + offset,
        color: shapColor(norm),
        feature: features[f],
        value: featVal,
      })
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '700px', height: `${Math.max(260, nFeatures * 64)}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={t('pages.playground.0-tabular-classification.general.beeswarm-shap-value', {
                defaultValue: 'SHAP value',
              })}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-0.5, nFeatures - 0.5]}
              ticks={Array.from({ length: nFeatures }, (_, r) => r)}
              interval={0}
              tickFormatter={(r: number) => features[order[r]] ?? ''}
              width={110}
            />
            <ZAxis range={[40, 40]} />
            <ReferenceLine x={0} stroke="#888" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(_value, _name, item) => {
                const p = item?.payload as Point
                return [`SHAP ${p.x.toFixed(4)} · ${p.feature} = ${p.value}`, '']
              }}
            />
            <Scatter data={points} fillOpacity={0.7}>
              {points.map((p, i) => (
                <Cell key={`pt_${i}`} fill={p.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda de color continua: valor de la feature de bajo (azul) a alto (rojo) */}
      <div className="d-flex align-items-center gap-2 mt-2" style={{ maxWidth: '700px' }}>
        <small className="text-muted">
          {t('pages.playground.0-tabular-classification.general.beeswarm-low', { defaultValue: 'Low' })}
        </small>
        <div
          style={{
            flex: 1,
            height: '10px',
            borderRadius: '5px',
            background: `linear-gradient(to right, ${shapColor(0)}, ${shapColor(0.5)}, ${shapColor(1)})`,
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
