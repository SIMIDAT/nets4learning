import { useMemo } from 'react'
import { Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { diagnoseTraining } from '@core/training/diagnoseTraining'

type N4LTrainingDiagnosisProps = {
  /**
   * El historial del modelo (pérdida de cada época y, si la hay, la de prueba); sin él no se enseña nada. El de TF.js
   * tipa sus valores como número o tensor: tras entrenar son números
   */
  history?: Record<string, ReadonlyArray<unknown>>
  /** Su número en la tabla de modelos (desde 1) */
  model   : number
}

/**
 * Cómo ha ido el último entrenamiento, en palabras: si la pérdida se disparó, si apenas aprendió, si se aprendió los
 * datos de memoria (sobreajuste), si seguía mejorando o si aprendió bien, con qué probar a continuación.
 */
export default function N4LTrainingDiagnosis({ history, model }: N4LTrainingDiagnosisProps) {
  const { t, i18n } = useTranslation()
  const prefix = 'training-diagnosis.'
  const findings = useMemo(() => (history === undefined
    ? []
    : diagnoseTraining(Object.fromEntries(Object.entries(history).map(([name, values]) => [name, values.map(Number)])))), [history])
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 3 }), [i18n.language])
  if (findings.length === 0) return null

  return (
    <section className={'mt-3'} aria-label={t(prefix + 'title', { model })} data-testid={'Test-TrainingDiagnosis'}>
      <h4 className={'h6'}>{t(prefix + 'title', { model })}</h4>
      {findings.map(({ kind, severity, values }) => {
        const formatted = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, key === 'epoch' || key === 'epochs' ? value : number.format(value)]))
        return (
          <Alert key={kind} variant={severity} className={'py-2 mb-2'} data-testid={'Test-TrainingDiagnosis-' + kind}>
            <p className={'fw-semibold mb-1'}>{t(prefix + kind + '.title')}</p>
            <p className={'small mb-1'}>{t(prefix + kind + '.text', formatted)}</p>
            <p className={'small mb-0'}>{t(prefix + kind + '.tip', formatted)}</p>
          </Alert>
        )
      })}
    </section>
  )
}
