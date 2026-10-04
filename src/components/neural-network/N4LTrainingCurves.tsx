import React, { useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'

import { historyCurves, type ModelParameters_t, type TrainingLogs_t } from '@core/history/trainingSummary'
import N4LModelComparison from '@components/neural-network/N4LModelComparison'
import { trackEvent } from '@core/analytics'

// Mismos colores en todas las curvas: entrenamiento (línea continua) y validación (discontinua)
const TRAIN_COLOR = '#0d6efd'
const VALIDATION_COLOR = '#fd7e14'

type N4LTrainingCurvesProps = {
  /** Historial de cada modelo generado, en el orden de la tabla (el modelo 1 es el primero) */
  histories     : TrainingLogs_t[]
  /** Más información del modelo elegido debajo de las curvas (p. ej. su matriz de confusión) */
  renderDetails?: (index: number) => React.ReactNode
  /** Hiperparámetros de cada modelo (mismo orden): con ellos y dos modelos o más, se pueden comparar */
  parameters?   : ModelParameters_t[]
}

/** Curvas de pérdida y métricas por época del modelo elegido (por defecto, el último entrenado) */
export default function N4LTrainingCurves({ histories, renderDetails, parameters }: N4LTrainingCurvesProps) {
  const { t } = useTranslation()
  const prefix = 'pages.playground.generator.training.'
  // null: seguir siempre al último modelo entrenado
  const [selected, setSelected] = useState<number | null>(null)
  // Los modelos que se comparan; null, uno solo
  const [compared, setCompared] = useState<number[] | null>(null)

  if (histories.length === 0) return null
  const index = selected !== null && selected < histories.length ? selected : histories.length - 1
  const curves = historyCurves(histories[index])
  const canCompare = parameters !== undefined && parameters.length === histories.length && histories.length > 1
  const isComparing = canCompare && compared !== null

  return (
    <div className={'mt-3'} data-testid={'Test-TrainingCurves'}>
      <div className={'d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'}>
        <h4 className={'h6 mb-0'}><Trans i18nKey={prefix + 'curves-title'} /></h4>
        <div className={'d-flex flex-wrap align-items-center gap-2'}>
          {canCompare && (
            <Form.Check type={'switch'} id={'n4l-curves-compare'} className={'mb-0'}
              label={t(prefix + 'curves-compare')}
              checked={isComparing}
              data-testid={'Test-TrainingCurves-Compare'}
              // Al empezar, los dos últimos: lo normal es cambiar algo y volver a entrenar
              onChange={() => {
                if (!isComparing) trackEvent('models_compare', { models: histories.length })
                setCompared(isComparing ? null : [histories.length - 2, histories.length - 1])
              }} />
          )}
          {/* Con un solo modelo (el informe) no hay nada que elegir */}
          {!isComparing && histories.length > 1 && (
            <Form.Select size={'sm'} className={'w-auto'} aria-label={t(prefix + 'curves-model')}
              value={index}
              onChange={(e) => setSelected(Number(e.target.value))}>
              {histories.map((_logs, i) => <option key={i} value={i}>{t('model.__index__', { index: i + 1 })}</option>)}
            </Form.Select>
          )}
        </div>
      </div>
      {isComparing && parameters !== undefined && compared !== null && (
        <N4LModelComparison histories={histories} parameters={parameters} compared={compared} onChange={setCompared} />
      )}
      {!isComparing && <>
        <Row xs={1} lg={2} className={'g-3'}>
          {curves.map(({ name, train, validation }) => (
            <Col key={name}>
              <div className={'n4l-training-curve'}>
                <p className={'small fw-semibold mb-1'}>{name}</p>
                <Line
                  options={{
                    responsive : true,
                    animation  : false,
                    interaction: { mode: 'index', intersect: false },
                    scales     : { x: { title: { display: true, text: t(prefix + 'epoch-axis') } } },
                  }}
                  data={{
                    labels  : train.map((_value, epoch) => epoch + 1),
                    datasets: [
                      { label: t(prefix + 'train'), data: train, borderColor: TRAIN_COLOR, backgroundColor: TRAIN_COLOR, pointRadius: 2 },
                      ...(validation === null ? [] : [{
                        label          : t(prefix + 'validation'),
                        data           : validation,
                        borderColor    : VALIDATION_COLOR,
                        backgroundColor: VALIDATION_COLOR,
                        borderDash     : [6, 4],
                        pointRadius    : 2,
                      }]),
                    ],
                  }}
                />
              </div>
            </Col>
          ))}
        </Row>
        {renderDetails?.(index)}
      </>}
    </div>
  )
}
