import { useMemo } from 'react'
import { Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import alertHelper from '@utils/alertHelper'
import N4LEditorLayers from '@components/neural-network/N4LEditorLayers'
import N4LDenseLayerFields from '@components/neural-network/N4LDenseLayerFields'
import N4LLayerCheck from '@components/neural-network/N4LLayerCheck'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import { flaggedLayers } from '@components/neural-network/layerCheckText'
import { layerSummaryParts } from '@components/neural-network/layerSummary'
import { HyperparameterLearningRate, HyperparameterNumber, HyperparameterSelect, LossOptions, OptimizerOptions } from '@components/neural-network/N4LHyperparameterFields'
import { checkSeriesLayers } from '@core/nn-utils/checkLayers'
import { SERIES_LAYER_CLASSES, SERIES_LAYER_LABELS, type SeriesLayer_t, type SeriesLayerClass_t } from '@core/timeSeries/seriesLayers'
import type { IdLoss_t, IdOptimizer_t } from '@/types/nn-types'

import { prefix, type SeriesHyper_t } from './timeSeriesConfig'

const MAX_LAYERS = 10

type TimeSeriesEditorLayersProps = {
  layers  : SeriesLayer_t[]
  onChange: (layers: SeriesLayer_t[]) => void
  waiting : boolean
}

/**
 * Las capas de la red: Dense o recurrentes (SimpleRNN, LSTM, GRU), que leen la ventana valor a valor y van antes que
 * las Dense. La salida, una neurona lineal (el valor que se predice), no se cambia ni se borra
 */
export function TimeSeriesEditorLayers({ layers, onChange, waiting }: TimeSeriesEditorLayersProps) {
  const { t } = useTranslation()
  const issues = useMemo(() => checkSeriesLayers(layers), [layers])

  const add = async (layer: SeriesLayer_t, atStart: boolean) => {
    if (layers.length > MAX_LAYERS) {
      await alertHelper.alertWarning(t('error.layers-length'))
      return
    }
    // Al final, antes de la salida
    onChange(atStart ? [layer, ...layers] : [...layers.slice(0, -1), layer, ...layers.slice(-1)])
  }
  const change = (index: number, layer: SeriesLayer_t) => onChange(layers.map((item, i) => (i === index ? layer : item)))

  return (
    <N4LEditorLayers
      layers={layers}
      summary={(layer) => layerSummaryParts(t, layer).join(', ')}
      renderFields={(layer, index) => <>
        <Form.Group className={'mt-3'} controlId={'time-series-layer-class-' + index}>
          <Form.Label><Trans i18nKey={prefix + 'layers.class'} /></Form.Label>
          <Form.Select value={layer._class} disabled={layer.is_disabled}
            onChange={(event) => {
              const _class = event.target.value as SeriesLayerClass_t
              // Las recurrentes suelen usar tanh; al volver a Dense, ReLU
              const activation = _class === 'dense' ? 'relu' : 'tanh'
              change(index, { ...layer, _class, activation })
            }}>
            {SERIES_LAYER_CLASSES.map((value) => <option key={value} value={value}>{SERIES_LAYER_LABELS[value]}</option>)}
          </Form.Select>
          <Form.Text className={'text-muted'}><Trans i18nKey={prefix + 'layers.class-help'} /></Form.Text>
        </Form.Group>
        <N4LDenseLayerFields index={index} layer={layer}
          onChange={(changed, { units, activation }) => change(changed, { ...layers[changed], units, activation })} />
      </>}
      isLocked={(layer) => layer.is_disabled === true}
      check={<N4LLayerCheck issues={issues} onFix={onChange} />}
      flagged={flaggedLayers(issues)}
      onAddStart={() => add({ _class: 'dense', units: 16, activation: 'relu' }, true)}
      onAddEnd={() => add({ _class: 'dense', units: 16, activation: 'relu' }, false)}
      onRemove={(index) => onChange(layers.filter((_layer, i) => i !== index))}
      onRestore={onChange}
      waiting={waiting}
      titleAs={'h3'}
    />
  )
}

type TimeSeriesHyperparametersProps = {
  hyper   : SeriesHyper_t
  onChange: (hyper: SeriesHyper_t) => void
  waiting : boolean
}

/** Cómo se entrena: tasa de aprendizaje, épocas, tamaño del lote, optimizador y función de pérdida */
export function TimeSeriesHyperparameters({ hyper, onChange, waiting }: TimeSeriesHyperparametersProps) {
  const change = <K extends keyof SeriesHyper_t>(key: K, value: SeriesHyper_t[K]) => onChange({ ...hyper, [key]: value })
  return (
    <Card data-guide={'hyperparameters'}>
      <Card.Header><h3><Trans i18nKey={'pages.playground.generator.general-parameters.title'} /></h3></Card.Header>
      <Card.Body>
        {waiting && <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />}
        {!waiting && <>
          <HyperparameterLearningRate controlId={'time-series-learning-rate'} defaultValue={hyper.learningRate}
            onChange={(value) => change('learningRate', value)} />
          <HyperparameterNumber controlId={'time-series-epochs'} name={'number-of-epochs'} min={1} max={1000}
            defaultValue={hyper.epochs} onChange={(value) => change('epochs', value)} />
          <HyperparameterNumber controlId={'time-series-batch-size'} name={'batch-size'} min={1} max={512}
            defaultValue={hyper.batchSize} onChange={(value) => change('batchSize', value)} />
          <hr />
          <HyperparameterSelect controlId={'time-series-optimizer'} label={'optimizer-id'} info={'optimizer-id-info'}
            value={hyper.optimizer} onChange={(value) => change('optimizer', value as IdOptimizer_t)}>
            <OptimizerOptions valuePrefix={'train-'} />
          </HyperparameterSelect>
          <HyperparameterSelect controlId={'time-series-loss'} label={'loss-id'} info={'loss-id-info'}
            value={hyper.loss} onChange={(value) => change('loss', value as IdLoss_t)}>
            <LossOptions task={'regression'} />
          </HyperparameterSelect>
        </>}
      </Card.Body>
    </Card>
  )
}
