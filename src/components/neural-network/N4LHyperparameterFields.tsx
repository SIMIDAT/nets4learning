import React from 'react'
import { Accordion, Button, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { TYPE_LOSSES, TYPE_METRICS, TYPE_OPTIMIZER } from '@core/nn-utils/ArchitectureTypesHelper'

// Campos comunes de los editores de hiperparámetros de las tareas que entrenan modelos
const prefix = 'pages.playground.generator.general-parameters.'

type HyperparameterNumberProps = {
  controlId   : string
  /** Clave de i18n del campo: se usan `<name>`, `<name>-placeholder` y `<name>-info` */
  name        : string
  min         : number
  max         : number
  defaultValue: number
  onChange    : (value: number) => void
}

/** Campo numérico de un hiperparámetro. El valor se ajusta a [min, max] (vacío → min). */
export function HyperparameterNumber({ controlId, name, min, max, defaultValue, onChange }: HyperparameterNumberProps) {
  const { t } = useTranslation()
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label><Trans i18nKey={prefix + name} /></Form.Label>
      <Form.Control
        type="number"
        inputMode={'numeric'}
        min={min}
        max={max}
        step={1}
        required={true}
        placeholder={t(prefix + name + '-placeholder')}
        defaultValue={defaultValue}
        onChange={(e) => {
          const value = parseInt(e.target.value)
          onChange(Number.isNaN(value) ? min : Math.min(max, Math.max(min, value)))
        }} />
      <Form.Text className="text-muted"><Trans i18nKey={prefix + name + '-info'} /></Form.Text>
    </Form.Group>
  )
}

type HyperparameterSelectProps = {
  controlId    : string
  /** Claves de i18n de la etiqueta y del texto de ayuda */
  label        : string
  info         : string
  value?       : string
  defaultValue?: string
  disabled?    : boolean
  onChange     : (value: string) => void
  children     : React.ReactNode
}

export function HyperparameterSelect({ controlId, label, info, value, defaultValue, disabled, onChange, children }: HyperparameterSelectProps) {
  const { t } = useTranslation()
  return (
    <Form.Group className="mb-3" controlId={controlId}>
      <Form.Label><Trans i18nKey={prefix + label} /></Form.Label>
      <Form.Select
        aria-label={t(prefix + info)}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}>
        {children}
      </Form.Select>
      <Form.Text className="text-muted"><Trans i18nKey={prefix + info} /></Form.Text>
    </Form.Group>
  )
}

/** Opciones de optimizador. `valuePrefix` es el prefijo que espera cada tarea en el identificador (p. ej. "train-"). */
export function OptimizerOptions({ valuePrefix = '' }: { valuePrefix?: string }) {
  return <>{TYPE_OPTIMIZER.map(({ key, label }) => <option key={key} value={valuePrefix + key}>{label}</option>)}</>
}

/** Opciones de función de pérdida; con `withMetrics` también se pueden usar las métricas como pérdida. */
export function LossOptions({ withMetrics = false }: { withMetrics?: boolean }) {
  const losses = TYPE_LOSSES.map(({ key, label }) => <option key={key} value={'losses-' + key}>{label}</option>)
  if (!withMetrics) return <>{losses}</>
  return <>
    <optgroup label={'Losses'}>{losses}</optgroup>
    <optgroup label={'Metrics'}>
      {TYPE_METRICS.map(({ key, label }) => <option key={key} value={'metrics-' + key}>{label}</option>)}
    </optgroup>
  </>
}

export function MetricOptions({ valuePrefix = '' }: { valuePrefix?: string }) {
  return <>{TYPE_METRICS.map(({ key, label }) => <option key={key} value={valuePrefix + key}>{label}</option>)}</>
}

type MetricsListProps = {
  metrics     : string[]
  onChange    : (index: number, value: string) => void
  onRemove    : (index: number) => void
  valuePrefix?: string
}

/** Lista editable de métricas de entrenamiento: una por pestaña, cada una con su botón de borrar. */
export function MetricsList({ metrics, onChange, onRemove, valuePrefix = '' }: MetricsListProps) {
  return (
    <Accordion className={'mt-2'}>
      {metrics.map((metric, index) => (
        <Accordion.Item key={index} eventKey={index.toString()}>
          <Accordion.Header>
            <Trans i18nKey={prefix + 'metric-id-__index__'} values={{ index: index + 1 }} />
          </Accordion.Header>
          <Accordion.Body>
            <div className="d-grid gap-2">
              <Button variant={'outline-danger'} onClick={() => onRemove(index)}>
                <Trans i18nKey={prefix + 'delete-metric'} values={{ index: index + 1 }} />
              </Button>
            </div>
            <HyperparameterSelect
              controlId={`FormMetrics_${index}`}
              label={'metric-id-select'}
              info={'metric-id-info'}
              value={metric}
              onChange={(value) => onChange(index, value)}>
              <MetricOptions valuePrefix={valuePrefix} />
            </HyperparameterSelect>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  )
}
