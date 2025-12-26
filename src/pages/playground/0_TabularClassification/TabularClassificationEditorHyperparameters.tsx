import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Card, Form } from 'react-bootstrap'

import {
  DEFAULT_ID_LOSS,
  DEFAULT_ID_METRICS,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_LEARNING_RATE,
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_TEST_SIZE,
} from './CONSTANTS'
import { VERBOSE } from '@/CONSTANTS'
import { TYPE_LOSSES, TYPE_METRICS, TYPE_OPTIMIZER } from '@core/nn-utils/ArchitectureTypesHelper'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import type { IdLoss_t, IdMetric_t, IdOptimizer_t } from '@/types/nn-types'

type TabularClassificationEditorHyperparametersProps_t = {
  setLearningRate: React.Dispatch<React.SetStateAction<number>>,
  setNumberEpochs: React.Dispatch<React.SetStateAction<number>>,
  setTestSize    : React.Dispatch<React.SetStateAction<number>>,
  setIdOptimizer : React.Dispatch<React.SetStateAction<IdOptimizer_t>>,
  setIdLoss      : React.Dispatch<React.SetStateAction<IdLoss_t>>,
  setIdMetrics   : React.Dispatch<React.SetStateAction<IdMetric_t>>,
}

export default function TabularClassificationEditorHyperparameters(props: TabularClassificationEditorHyperparametersProps_t) {

  const {
    setLearningRate,
    setNumberEpochs,
    setTestSize,
    setIdOptimizer,
    setIdLoss,
    setIdMetrics,
  } = props

  const prefix = 'pages.playground.generator.general-parameters.'
  const { t } = useTranslation()

  // region HYPERPARAMETERS
  const handleChange_LearningRate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLearningRate(parseInt(e.target.value))
  }
  const handleChange_NumberEpochs = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumberEpochs(parseInt(e.target.value))
  }
  const handleChange_TestSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestSize(parseInt(e.target.value))
  }
  const handleChange_IdOptimizer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIdOptimizer(e.target.value as IdOptimizer_t)
  }
  const handleChange_IdLoss = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIdLoss(e.target.value as IdLoss_t)
  }
  const handleChange_IdMetrics = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIdMetrics(e.target.value as IdMetric_t)
  }
  // endregion

  if (VERBOSE) console.debug('render TabularClassificationEditorHyperparameters')
  return <>
    <Card className={'sticky-top'} style={{ zIndex: 10 }}>
      <Card.Header><h3><Trans i18nKey={prefix + 'title'} /></h3></Card.Header>
      <Card.Body>
        {/* LEARNING RATE */}
        <Form.Group className="mb-3" controlId="formLearningRate">
          <Form.Label>
            <Trans i18nKey={prefix + 'learning-rate'} />
          </Form.Label>
          <Form.Control
            type="number"
            min={1}
            max={100}
            required={true}
            placeholder={t(prefix + 'learning-rate-placeholder')}
            defaultValue={DEFAULT_LEARNING_RATE}
            onChange={handleChange_LearningRate} />
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'learning-rate-info'} />
          </Form.Text>
        </Form.Group>

        {/* NUMBER OT EPOCHS */}
        <Form.Group className="mb-3" controlId="FormNumberOfEpochs">
          <Form.Label>
            <Trans i18nKey={prefix + 'number-of-epochs'} />
          </Form.Label>
          <Form.Control
            type="number"
            min={1}
            max={100}
            required={true}
            placeholder={t(prefix + 'number-of-epochs')}
            defaultValue={DEFAULT_NUMBER_EPOCHS}
            onChange={handleChange_NumberEpochs} />
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'number-of-epochs-info'} />
          </Form.Text>
        </Form.Group>

        {/* TEST SIZE */}
        <Form.Group className="mb-3" controlId="formTrainRate">
          <Form.Label>
            <Trans i18nKey={prefix + 'train-rate'} />
          </Form.Label>
          <Form.Control
            type="number"
            min={1}
            max={100}
            required={true}
            placeholder={t(prefix + 'train-rate-placeholder')}
            defaultValue={DEFAULT_TEST_SIZE}
            onChange={handleChange_TestSize} />
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'train-rate-info'} />
          </Form.Text>
        </Form.Group>

        {/* OPTIMIZATION FUNCTION */}
        <Form.Group className="mb-3" controlId="FormOptimizer">
          <Form.Label>
            <Trans i18nKey={prefix + 'optimizer-id'} />
          </Form.Label>
          <Form.Select
            aria-label="Default select example"
            defaultValue={DEFAULT_ID_OPTIMIZATION}
            onChange={handleChange_IdOptimizer}>
            {TYPE_OPTIMIZER.map(({ key, label }, index) => {
              return (<option key={index} value={key}>{label}</option>)
            })}
          </Form.Select>
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'optimizer-id-info'} />
          </Form.Text>
        </Form.Group>

        {/* LOSS FUNCTION */}
        <Form.Group className="mb-3" controlId="FormLoss">
          <Form.Label>
            <Trans i18nKey={prefix + 'loss-id'} />
          </Form.Label>
          <Form.Select
            aria-label="Selecciona la función de pérdida"
            defaultValue={DEFAULT_ID_LOSS}
            onChange={handleChange_IdLoss}
          >
            <optgroup label={'Losses'}>
              {TYPE_LOSSES.map(({ key, label }, index) => {
                return (<option key={index} value={'losses-' + key}>{label}</option>)
              })}
            </optgroup>
            <optgroup label={'Metrics'}>
              {TYPE_METRICS.map(({ key, label }, index) => {
                return (<option key={index} value={'metrics-' + key}>{label}</option>)
              })}
            </optgroup>
          </Form.Select>
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'loss-id-info'} />
          </Form.Text>
        </Form.Group>

        {/* METRICS FUNCTION */}
        <Form.Group className="mb-3" controlId="FormMetrics">
          <Form.Label>
            <Trans i18nKey={prefix + 'metrics-id'} />
          </Form.Label>
          <Form.Select
            aria-label="Selecciona la métrica"
            defaultValue={DEFAULT_ID_METRICS}
            disabled={true}
            onChange={handleChange_IdMetrics}
          >
            {TYPE_METRICS.map(({ key, label }, index) => {
              return (<option key={index} value={key}>{label}</option>)
            })}
          </Form.Select>
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'metrics-id-info'} />
          </Form.Text>
        </Form.Group>
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