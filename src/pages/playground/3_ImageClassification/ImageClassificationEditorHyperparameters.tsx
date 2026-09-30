import { Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { HyperparameterNumber, HyperparameterSelect, LossOptions, MetricsList, OptimizerOptions } from '@components/neural-network/N4LHyperparameterFields'
import { VERBOSE } from '@/CONSTANTS'
import {
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_LEARNING_RATE,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_TEST_SIZE,
} from './CONSTANTS'
import { Link } from 'react-router'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'

import alertHelper from '@utils/alertHelper'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'

type ImageClassificationEditorHyperparametersProps_t = {
  setLearningRate : React.Dispatch<React.SetStateAction<number>>
  setNumberEpochs : React.Dispatch<React.SetStateAction<number>>
  setTestSize     : React.Dispatch<React.SetStateAction<number>>
  setIdOptimizer  : React.Dispatch<React.SetStateAction<IdOptimizer_t>>
  setIdLoss       : React.Dispatch<React.SetStateAction<IdLoss_t | IdMetric_t>>
  idMetricsList   : (IdLoss_t | IdMetric_t)[]
  setIdMetricsList: React.Dispatch<React.SetStateAction<(IdLoss_t | IdMetric_t)[]>>
}

export default function ImageClassificationEditorHyperparameters(props: ImageClassificationEditorHyperparametersProps_t) {
  const {
    setLearningRate,
    setNumberEpochs,
    setTestSize,
    setIdOptimizer,
    setIdLoss,
    idMetricsList,
    setIdMetricsList,
  } = props

  const prefix = 'pages.playground.generator.general-parameters.'
  const { t } = useTranslation()

  // region PARÁMETROS GENERALES
  const handlerClick_RemoveMetric = async (index: number) => {
    if (idMetricsList.length > 1) {
      setIdMetricsList((prevState) => {
        const new_list_id_metrics = [...prevState]
        new_list_id_metrics.splice(index, 1)
        return new_list_id_metrics
      })
    } else {
      await alertHelper.alertWarning(t('error.metrics-length'))
    }
  }
  const handleChange_Metrics = (index: number, value: string) => {
    setIdMetricsList((prevState) => {
      const old_array = [...prevState]
      old_array[index] = value as IdLoss_t | IdMetric_t
      return old_array
    })
  }
  // endregion

  if (VERBOSE) console.debug('render ImageClassificationEditorHyperparameters')
  return <>
    <Card className={'sticky-top joyride-step-7-editor-trainer'} style={{ zIndex: 10 }}>
      <Card.Header><h3><Trans i18nKey={prefix + 'title'} /></h3></Card.Header>
      <Card.Body>
        <HyperparameterNumber controlId="formTrainRate" name="learning-rate" min={1} max={100}
          defaultValue={DEFAULT_LEARNING_RATE} onChange={setLearningRate} />
        <HyperparameterNumber controlId="FormNumberOfEpochs" name="number-of-epochs" min={1} max={100}
          defaultValue={DEFAULT_NUMBER_EPOCHS} onChange={setNumberEpochs} />
        <HyperparameterNumber controlId="FormTestSize" name="test-size" min={1} max={100}
          defaultValue={DEFAULT_TEST_SIZE} onChange={setTestSize} />
        <hr />
        <HyperparameterSelect controlId="FormOptimizer" label="optimizer-id" info="optimizer-id-info"
          defaultValue={DEFAULT_ID_OPTIMIZATION} onChange={(value) => setIdOptimizer(value as IdOptimizer_t)}>
          <OptimizerOptions />
        </HyperparameterSelect>
        <hr />
        <HyperparameterSelect controlId="FormLoss" label="loss-id" info="loss-id-info"
          defaultValue={DEFAULT_ID_LOSS} onChange={(value) => setIdLoss(value as IdLoss_t)}>
          <LossOptions withMetrics={true} />
        </HyperparameterSelect>
        <hr />
        <MetricsList
          metrics={idMetricsList}
          onChange={handleChange_Metrics}
          onRemove={handlerClick_RemoveMetric} />
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-link'}
            components={{
              link1: <Link
                className={'text-info'}
                state={{
                  action: GLOSSARY_ACTIONS.IMAGE_CLASSIFICATION.STEP_4_HYPERPARAMETERS
                }}
                to={{
                  pathname: '/glossary/',
                }}
              />
            }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-tutorial'}
            components={{
              link1: <Link
                className={'text-info'}
                state={{
                  action: MANUAL_ACTIONS.IMAGE_CLASSIFICATION.STEP_4_HYPERPARAMETERS
                }}
                to={{
                  pathname: '/manual/',
                }} />
            }} />
        </p>
      </Card.Footer>
    </Card>
  </>
}