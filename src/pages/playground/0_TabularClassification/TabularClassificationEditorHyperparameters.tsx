import { Link } from 'react-router'
import { Trans } from 'react-i18next'
import { Card } from 'react-bootstrap'

import {
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_TEST_SIZE,
} from './CONSTANTS'
import { VERBOSE } from '@/CONSTANTS'
import { HyperparameterNumber, HyperparameterSelect, LossOptions, MetricOptions, OptimizerOptions } from '@components/neural-network/N4LHyperparameterFields'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'


export default function TabularClassificationEditorHyperparameters() {

    const {
    setLearningRate,
    setNumberEpochs,
    setTestSize,
    setIdOptimizer,
    setIdLoss,
    setIdMetrics,
  } = useTabularClassificationContext()

  const prefix = 'pages.playground.generator.general-parameters.'


  if (VERBOSE) console.debug('render TabularClassificationEditorHyperparameters')
  return <>
    <Card className={'sticky-top'} style={{ zIndex: 10 }}>
      <Card.Header><h3><Trans i18nKey={prefix + 'title'} /></h3></Card.Header>
      <Card.Body>
        <HyperparameterNumber controlId="formLearningRate" name="learning-rate" min={1} max={100}
          defaultValue={DEFAULT_LEARNING_RATE} onChange={setLearningRate} />
        <HyperparameterNumber controlId="FormNumberOfEpochs" name="number-of-epochs" min={1} max={100}
          defaultValue={DEFAULT_NUMBER_EPOCHS} onChange={setNumberEpochs} />
        <HyperparameterNumber controlId="formTrainRate" name="train-rate" min={1} max={100}
          defaultValue={DEFAULT_TEST_SIZE} onChange={setTestSize} />
        <HyperparameterSelect controlId="FormOptimizer" label="optimizer-id" info="optimizer-id-info"
          defaultValue={DEFAULT_ID_OPTIMIZATION} onChange={(value) => setIdOptimizer(value as IdOptimizer_t)}>
          <OptimizerOptions />
        </HyperparameterSelect>
        <HyperparameterSelect controlId="FormLoss" label="loss-id" info="loss-id-info"
          defaultValue={DEFAULT_ID_LOSS} onChange={(value) => setIdLoss(value as IdLoss_t)}>
          <LossOptions withMetrics={true} />
        </HyperparameterSelect>
        <HyperparameterSelect controlId="FormMetrics" label="metrics-id" info="metrics-id-info"
          defaultValue={DEFAULT_ID_METRICS} disabled={true} onChange={(value) => setIdMetrics(value as IdMetric_t)}>
          <MetricOptions />
        </HyperparameterSelect>
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-link'}
            components={{
              link1: <Link className={'text-info'}
                state={{
                  action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_4_HYPERPARAMETERS,
                }}
                to={{
                  pathname: '/glossary/',
                }} />,
            }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-tutorial'}
            components={{
              link1: <Link
                className={'text-info'}
                state={{
                  action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_4_HYPERPARAMETERS,
                }}
                to={{
                  pathname: '/manual/',
                }} />,
            }} />
        </p>
      </Card.Footer>
    </Card>
  </>
}