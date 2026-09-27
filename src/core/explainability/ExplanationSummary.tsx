import { useTranslation } from 'react-i18next'

export type Contribution_t = {
  /** Nombre comprensible: "Petal width = 1.8", "Labios", "Zona 3"… */
  name : string
  value: number
}

type ExplanationSummaryProps = {
  /** Qué se explica: "perro", "Iris setosa", "MPG"… */
  target        : string
  /** Valor del modelo sin información (imagen tapada, media sobre el dataset…). */
  baseValue     : number
  /** Qué significa ese punto de partida, para el texto: "imagen tapada", "media del modelo"… */
  baseLabel     : string
  /** Valor predicho que se explica (= baseValue + suma de contribuciones). */
  predictedValue: number
  /** Contribuciones individuales; se muestran las que más empujan a favor y en contra. */
  contributions?: Contribution_t[]
  /** Formato de los valores (por defecto, 3 decimales). */
  format?       : (value: number) => string
  topN?         : number
}

const defaultFormat = (value: number) => value.toFixed(3)

/**
 * Resumen en lenguaje llano de una explicación aditiva (SHAP): de dónde parte el modelo, cuánto
 * suman las contribuciones y qué es lo que más empuja a favor y en contra de la predicción.
 */
export default function ExplanationSummary(props: ExplanationSummaryProps) {
  const { target, baseValue, baseLabel, predictedValue, contributions = [], format = defaultFormat, topN = 2 } = props
  const { t } = useTranslation()
  const signed = (value: number) => (value >= 0 ? '+' : '−') + format(Math.abs(value))

  const positive = contributions.filter((c) => c.value > 0).sort((a, b) => b.value - a.value).slice(0, topN)
  const negative = contributions.filter((c) => c.value < 0).sort((a, b) => a.value - b.value).slice(0, topN)
  const list = (items: Contribution_t[]) => items.map((c) => `${c.name} (${signed(c.value)})`).join(', ')

  return (
    <div className="small text-start bg-body-tertiary rounded p-2 mt-2">
      <div>
        <strong>{t('ui.explain.summary.equation-title', { target })}</strong>
      </div>
      <div className="font-monospace">
        {format(baseValue)} <span className="text-body-secondary">({baseLabel})</span>
        {' '}{signed(predictedValue - baseValue)} <span className="text-body-secondary">({t('ui.explain.summary.contributions')})</span>
        {' '}= <strong>{format(predictedValue)}</strong>
      </div>
      {positive.length > 0 && (
        <div className="text-danger-emphasis">▲ {t('ui.explain.summary.most-positive')}: {list(positive)}</div>
      )}
      {negative.length > 0 && (
        <div className="text-primary-emphasis">▼ {t('ui.explain.summary.most-negative')}: {list(negative)}</div>
      )}
    </div>
  )
}
