import { Trans } from 'react-i18next'
import { Card } from 'react-bootstrap'

import { VERBOSE } from '@/CONSTANTS'
import { HyperparameterLearningRate, HyperparameterNumber, HyperparameterSelect, LossOptions, MetricOptions, OptimizerOptions } from '@components/neural-network/N4LHyperparameterFields'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'


export default function TabularClassificationEditorHyperparameters() {

    const {
    learningRate,
    numberEpochs,
    testSize,
    idOptimizer,
    idLoss,
    idMetrics,
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
        <HyperparameterLearningRate controlId="formLearningRate"
          defaultValue={learningRate} onChange={setLearningRate} />
        <HyperparameterNumber controlId="FormNumberOfEpochs" name="number-of-epochs" min={1} max={100}
          defaultValue={numberEpochs} onChange={setNumberEpochs} />
        <HyperparameterNumber controlId="formTrainRate" name="train-rate" min={1} max={100}
          defaultValue={testSize} onChange={setTestSize} />
        <HyperparameterSelect controlId="FormOptimizer" label="optimizer-id" info="optimizer-id-info"
          defaultValue={idOptimizer} onChange={(value) => setIdOptimizer(value as IdOptimizer_t)}>
          <OptimizerOptions />
        </HyperparameterSelect>
        <HyperparameterSelect controlId="FormLoss" label="loss-id" info="loss-id-info"
          defaultValue={idLoss} onChange={(value) => setIdLoss(value as IdLoss_t)}>
          <LossOptions task={'classification'} />
        </HyperparameterSelect>
        <HyperparameterSelect controlId="FormMetrics" label="metrics-id" info="metrics-id-info"
          defaultValue={idMetrics} onChange={(value) => setIdMetrics(value as IdMetric_t)}>
          <MetricOptions />
        </HyperparameterSelect>
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-link'}
            components={{
              link1: <N4LHelpLink page={'glossary'} action={GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_4_HYPERPARAMETERS} />,
            }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-tutorial'}
            components={{
              link1: <N4LHelpLink page={'manual'} action={MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_4_HYPERPARAMETERS} />,
            }} />
        </p>
      </Card.Footer>
    </Card>
  </>
}