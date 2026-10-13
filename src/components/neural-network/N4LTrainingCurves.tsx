import React, { useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'

import { historyCurves, type ModelParameters_t, type TrainingLogs_t } from '@core/history/trainingSummary'
import N4LModelComparison from '@components/neural-network/N4LModelComparison'
import N4LChartData from '@components/chart/N4LChartData'
import { trackEvent } from '@core/analytics'
import { chartColor } from '@core/chartColors'
import { useTheme } from '@hooks/useTheme'

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
  const { t, i18n } = useTranslation()
  const prefix = 'pages.playground.generator.training.'
  // Mismos colores en todas las curvas: entrenamiento (línea continua) y validación (discontinua)
  const theme = useTheme()
  const trainColor = chartColor('blue', theme)
  const validationColor = chartColor('orange', theme)
  // null: seguir siempre al último modelo entrenado
  const [selected, setSelected] = useState<number | null>(null)
  // Los modelos que se comparan; null, uno solo
  const [compared, setCompared] = useState<number[] | null>(null)

  if (histories.length === 0) return null
  const number = new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 3 })
  const curveDescription = (name: string, train: number[], validation: number[] | null) => {
    const range = (values: number[]) => ({ first: number.format(values[0]), last: number.format(values[values.length - 1]) })
    return [
      t(prefix + 'curve-description', { name, epochs: train.length, ...range(train) }),
      ...(validation === null || validation.length === 0 ? [] : [t(prefix + 'curve-description-validation', range(validation))]),
    ].join(' ')
  }
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
                {/* Lo que enseña la gráfica está en el texto de debajo (la tendencia) y en «Ver los datos» (todo) */}
                <Line
                  aria-hidden={true}
                  options={{
                    responsive : true,
                    animation  : false,
                    interaction: { mode: 'index', intersect: false },
                    scales     : { x: { title: { display: true, text: t(prefix + 'epoch-axis') } } },
                  }}
                  data={{
                    labels  : train.map((_value, epoch) => epoch + 1),
                    datasets: [
                      { label: t(prefix + 'train'), data: train, borderColor: trainColor, backgroundColor: trainColor, pointRadius: 2 },
                      ...(validation === null ? [] : [{
                        label          : t(prefix + 'validation'),
                        data           : validation,
                        borderColor    : validationColor,
                        backgroundColor: validationColor,
                        borderDash     : [6, 4],
                        pointRadius    : 2,
                      }]),
                    ],
                  }}
                />
                <p className={'small text-body-secondary mt-1 mb-0'} data-testid={'Test-TrainingCurves-Trend'}>{curveDescription(name, train, validation)}</p>
                <N4LChartData caption={t(prefix + 'curve-data', { name })}
                  columns={[t(prefix + 'epoch-axis'), t(prefix + 'train'), ...(validation === null ? [] : [t(prefix + 'validation')])]}
                  rows={train.map((value, epoch) => [epoch + 1, value, ...(validation === null ? [] : [validation[epoch]])])} />
              </div>
            </Col>
          ))}
        </Row>
        {renderDetails?.(index)}
      </>}
    </div>
  )
}
