import { useMemo } from 'react'
import { Button, Card, Spinner, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfvis from '@tensorflow/tfjs-vis'

import { formatEpochs } from '@core/history/trainingSummary'
import { nnLabel } from '@core/nn-utils/ArchitectureTypesHelper'
import { layersSummary } from '@components/neural-network/layerSummary'
import N4LTrainingCurves from '@components/neural-network/N4LTrainingCurves'
import { N4LBestBadge } from '@components/neural-network/N4LFinalMetrics'
import N4LEmptyState from '@components/loading/N4LEmptyState'

import { prefix, type TrainedSeriesModel_t } from './timeSeriesConfig'

type TimeSeriesModelsProps = {
  models  : TrainedSeriesModel_t[]
  selected: number
  onSelect: (index: number) => void
}

/** El que menos se equivoca con los datos de prueba (a un paso), si hay más de uno ya medido */
function bestSeriesModel(models: TrainedSeriesModel_t[]): number {
  let best = -1
  models.forEach(({ evaluation }, index) => {
    const mae = evaluation?.errors.oneStep.mae
    if (mae !== undefined && Number.isFinite(mae) && (best === -1 || mae < models[best].evaluation!.errors.oneStep.mae)) best = index
  })
  return models.length > 1 ? best : -1
}

/**
 * Los modelos entrenados: con qué se entrenó cada uno y cuánto se equivoca con los datos de prueba (en las unidades de
 * la serie), el que se enseña en «Predecir» y sus curvas de entrenamiento (para compararlas)
 */
export default function TimeSeriesModels({ models, selected, onSelect }: TimeSeriesModelsProps) {
  const { t, i18n } = useTranslation()
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumSignificantDigits: 4 }), [i18n.language])
  const best = bestSeriesModel(models)
  const parameters = models.map(({ hyper, layers, prep }) => ({
    'window'       : String(prep.window),
    'difference'   : t(prefix + (prep.difference ? 'models.yes' : 'models.no')),
    'test-size'    : prep.testSize + '%',
    'learning-rate': String(hyper.learningRate),
    'n-of-epochs'  : String(hyper.epochs),
    'batch-size'   : String(hyper.batchSize),
    'layers'       : layersSummary(t, layers),
    'id-optimizer' : nnLabel(hyper.optimizer),
    'id-loss'      : nnLabel(hyper.loss),
  }))

  return (
    <Card data-testid={'Test-TimeSeries-Models'}>
      <Card.Header className={'d-flex flex-wrap align-items-center justify-content-between gap-2'}>
        <h3 className={'mb-0'}><Trans i18nKey={'generator.table-models.list-models-generated'} /> | {models.length}</h3>
        <div className={'d-flex gap-1'}>
          <Button variant={'outline-primary'} size={'sm'} className={'text-nowrap'} onClick={() => tfvis.visor().open()}>
            <Trans i18nKey={'generator.table-models.open-visor'} />
          </Button>
          <Button variant={'outline-primary'} size={'sm'} className={'text-nowrap'} onClick={() => tfvis.visor().close()}>
            <Trans i18nKey={'generator.table-models.close-visor'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {models.length === 0 && <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-training'} />}
        {models.length > 0 && <>
          <Table size={'sm'} striped hover responsive className={'align-middle'}>
            <thead>
              <tr>
                <th scope={'col'}>ID</th>
                <th scope={'col'}>{t('generator.table-models.window')}</th>
                <th scope={'col'}>{t('generator.table-models.difference')}</th>
                <th scope={'col'}>{t('generator.table-models.layers')}</th>
                <th scope={'col'}>{t('generator.table-models.n-of-epochs')}</th>
                <th scope={'col'}>{t('generator.table-models.learning-rate')}</th>
                <th scope={'col'} className={'text-end'}>{t(prefix + 'models.mae-one-step')}</th>
                <th scope={'col'} className={'text-end'}>{t(prefix + 'models.mae-recursive')}</th>
                <th scope={'col'}><span className={'visually-hidden'}>{t(prefix + 'models.show')}</span></th>
              </tr>
            </thead>
            <tbody>
              {models.map((model, index) => (
                <tr key={index} className={index === selected ? 'table-active' : undefined} data-testid={'Test-TimeSeries-Model-' + (index + 1)}>
                  <th scope={'row'} className={'text-nowrap'}>{index + 1}{index === best && <N4LBestBadge />}</th>
                  <td>{model.prep.window}</td>
                  <td>{parameters[index].difference}</td>
                  <td className={'small'}>{parameters[index].layers}</td>
                  <td>{formatEpochs(model.history.epoch.length, model.hyper.epochs)}</td>
                  <td>{model.hyper.learningRate}</td>
                  {model.evaluation === null
                    ? <td colSpan={2} className={'text-end'}><Spinner size={'sm'} role={'status'} aria-label={t(prefix + 'models.evaluating')} /></td>
                    : <>
                      <td className={'text-end'}>{number.format(model.evaluation.errors.oneStep.mae)}</td>
                      <td className={'text-end'}>{number.format(model.evaluation.errors.recursive.mae)}</td>
                    </>}
                  <td className={'text-end'}>
                    <Button size={'sm'} variant={index === selected ? 'primary' : 'outline-primary'} className={'text-nowrap'}
                      aria-pressed={index === selected} onClick={() => onSelect(index)}>
                      {t(prefix + 'models.show')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className={'small text-body-secondary'}>{t(prefix + 'models.help')}</p>
          <N4LTrainingCurves histories={models.map(({ history }) => history.history)} parameters={parameters} />
        </>}
      </Card.Body>
    </Card>
  )
}
