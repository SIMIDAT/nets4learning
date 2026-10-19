import React, { useState } from 'react'
import { Accordion, Button, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import N4LNumberField from '@components/form/N4LNumberField'
import N4LHelpTerm from '@components/helpLink/N4LHelpTerm'

import { TYPE_LOSSES_CLASSIFICATION, TYPE_LOSSES_REGRESSION, TYPE_METRICS, TYPE_OPTIMIZER } from '@core/nn-utils/ArchitectureTypesHelper'

// Campos comunes de los editores de hiperparámetros de las tareas que entrenan modelos
const prefix = 'pages.playground.generator.general-parameters.'

// Definición breve de cada campo (pages.playground.generator.help.*), según la clave de su etiqueta
const HELP_KEYS: Record<string, string> = {
  'learning-rate'   : 'learning-rate',
  'number-of-epochs': 'epochs',
  'batch-size'      : 'batch-size',
  'train-rate'      : 'test-size',
  'test-size'       : 'test-size',
  'optimizer-id'    : 'optimizer',
  'loss-id'         : 'loss',
  'metrics-id'      : 'metric',
  'metric-id-select': 'metric',
}

/** Lo que dice la etiqueta de un campo; si el término tiene definición, se ve al pasar el ratón o al llegar con el teclado */
function FieldLabelContent({ name }: { name: string }) {
  const { t } = useTranslation()
  const help = HELP_KEYS[name]
  if (help === undefined) return <Trans i18nKey={prefix + name} />
  return <N4LHelpTerm label={<Trans i18nKey={prefix + name} />} help={t('pages.playground.generator.help.' + help)} />
}

/** Etiqueta de un campo */
function FieldLabel({ name }: { name: string }) {
  return <Form.Label><FieldLabelContent name={name} /></Form.Label>
}

type HyperparameterNumberProps = {
  controlId   : string
  /** Clave de i18n del campo: se usan `<name>`, `<name>-placeholder` y `<name>-info` */
  name        : string
  min         : number
  max         : number
  defaultValue: number
  onChange    : (value: number) => void
}

/**
 * Campo numérico de un hiperparámetro, entre min y max. Lo que no vale se dice junto al campo (y se sigue usando el
 * último valor bueno) en vez de recortarlo en silencio
 */
export function HyperparameterNumber({ controlId, name, min, max, defaultValue, onChange }: HyperparameterNumberProps) {
  const [value, setValue] = useState(defaultValue)
  return (
    <N4LNumberField className={'mb-3'} controlId={controlId} guide={'hp-' + name} label={<FieldLabelContent name={name} />}
      help={<Trans i18nKey={prefix + name + '-info'} />} value={value} min={min} max={max}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }} />
  )
}

// Valores habituales de la tasa de aprendizaje, en escala logarítmica
const LEARNING_RATES = [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]

type HyperparameterLearningRateProps = {
  controlId   : string
  defaultValue: number
  onChange    : (value: number) => void
}

/** Selector de la tasa de aprendizaje con su valor real (0.01, no "1 %"). */
export function HyperparameterLearningRate({ controlId, defaultValue, onChange }: HyperparameterLearningRateProps) {
  return (
    <Form.Group className="mb-3" controlId={controlId} data-guide={'hp-learning-rate'}>
      <FieldLabel name={'learning-rate'} />
      <Form.Select
        aria-describedby={controlId + '-info'}
        defaultValue={defaultValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}>
        {LEARNING_RATES.map((value) => <option key={value} value={value}>{value}</option>)}
      </Form.Select>
      <Form.Text id={controlId + '-info'} className="text-muted"><Trans i18nKey={prefix + 'learning-rate-info'} /></Form.Text>
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
  // El nombre es la etiqueta que se ve (WCAG 2.5.3); la ayuda, su descripción
  return (
    <Form.Group className="mb-3" controlId={controlId} data-guide={'hp-' + label.replace(/-id$/, '')}>
      <FieldLabel name={label} />
      <Form.Select
        aria-describedby={controlId + '-info'}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}>
        {children}
      </Form.Select>
      <Form.Text id={controlId + '-info'} className="text-muted"><Trans i18nKey={prefix + info} /></Form.Text>
    </Form.Group>
  )
}

/** Opciones de optimizador. `valuePrefix` es el prefijo que espera cada tarea en el identificador (p. ej. "train-"). */
export function OptimizerOptions({ valuePrefix = '' }: { valuePrefix?: string }) {
  return <>{TYPE_OPTIMIZER.map(({ key, label }) => <option key={key} value={valuePrefix + key}>{label}</option>)}</>
}

/** Opciones de función de pérdida, agrupadas por tipo de tarea; primero va el grupo de `task`. */
export function LossOptions({ task }: { task: 'classification' | 'regression' }) {
  const { t } = useTranslation()
  const groups = [
    { name: 'classification', losses: TYPE_LOSSES_CLASSIFICATION },
    { name: 'regression', losses: TYPE_LOSSES_REGRESSION },
  ]
  if (task === 'regression') groups.reverse()
  return <>
    {groups.map(({ name, losses }) => (
      <optgroup key={name} label={t(prefix + 'loss-group-' + name)}>
        {losses.map(({ key, label }) => <option key={key} value={'losses-' + key}>{label}</option>)}
      </optgroup>
    ))}
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
    <Accordion className={'mt-2'} data-guide={'hp-metrics'}>
      {metrics.map((metric, index) => (
        <Accordion.Item key={index} eventKey={index.toString()}>
          <Accordion.Header as={'h4'}>
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
