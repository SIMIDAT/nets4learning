import { Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import { PREDICTIONS, setPrediction, usePrediction, type Prediction_t } from '@core/training/trainingPrediction'

/**
 * «Antes de entrenar, ¿qué crees que pasará?»: opcional y plegado, junto al botón Entrenar. Lo elegido se compara al
 * terminar con el diagnóstico del entrenamiento (N4LTrainingDiagnosis). `nextModel`: el número que tendrá en la tabla
 * de modelos el que se va a entrenar; `disabled`: mientras se entrena no se cambia
 */
export default function N4LTrainingPrediction({ nextModel, disabled = false }: { nextModel: number, disabled?: boolean }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const prefix = 'training-prediction.'
  const prediction = usePrediction(pathname, nextModel)
  const name = `training-prediction-${nextModel}`

  return (
    <details className={'n4l-training-prediction mb-2'} data-testid={'Test-TrainingPrediction'}>
      <summary className={'small'}>
        <span className={'fw-semibold'}>{t(prefix + 'title')}</span>{' '}
        <span className={'text-body-secondary'}>
          {prediction === null ? t(prefix + 'optional') : t(prefix + 'chosen', { prediction: t(prefix + 'options.' + prediction) })}
        </span>
      </summary>
      <fieldset className={'mt-2'} disabled={disabled}>
        <legend className={'small text-body-secondary mb-1'}>{t(prefix + 'help')}</legend>
        {PREDICTIONS.map((option) => (
          <Form.Check key={option} type={'radio'} id={`${name}-${option}`} name={name} className={'small'}
            label={t(prefix + 'options.' + option)}
            checked={prediction === option}
            onChange={() => setPrediction(pathname, nextModel, option as Prediction_t)} />
        ))}
        <Form.Check type={'radio'} id={`${name}-none`} name={name} className={'small'}
          label={t(prefix + 'none')}
          checked={prediction === null}
          onChange={() => setPrediction(pathname, nextModel, null)} />
      </fieldset>
    </details>
  )
}
