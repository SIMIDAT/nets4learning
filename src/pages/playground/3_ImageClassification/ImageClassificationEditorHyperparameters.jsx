import React from 'react'
import { Accordion, Card, Form, Button } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { TYPE_LOSSES, TYPE_METRICS, TYPE_OPTIMIZER } from '@core/nn-utils/ArchitectureTypesHelper'
import { VERBOSE } from '@/CONSTANTS'
import {
  DEFAULT_NUMBER_EPOCHS,
  DEFAULT_LEARNING_RATE,
  DEFAULT_ID_OPTIMIZATION,
  DEFAULT_ID_LOSS,
  DEFAULT_TEST_SIZE,
} from './CONSTANTS'
import { Link } from 'react-router-dom'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'

import alertHelper from '@utils/alertHelper'

export default function ImageClassificationEditorHyperparameters (props) {
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
  const handleChange_LearningRate = (e) => {
    setLearningRate(parseInt(e.target.value))
  }
  const handleChange_NumberEpochs = (e) => {
    setNumberEpochs(parseInt(e.target.value))
  }
  const handleChange_TestSize = (e) => {
    setTestSize(parseInt(e.target.value))
  }
  const handleChange_Loss = (e) => {
    setIdLoss(e.target.value)
  }
  const handleChange_Optimization = (e) => {
    setIdOptimizer(e.target.value)
  }

  const handlerClick_RemoveMetric = async (index) => {
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
  const handleChange_Metrics = (e, index) => {
    setIdMetricsList((prevState) => {
      const old_array = [...prevState]
      old_array[index] = e.target.value
      return old_array
    })
  }
  // endregion

  if (VERBOSE) console.debug('render ImageClassificationEditorHyperparameters')
  return <>
    <Card className={'sticky-top joyride-step-7-editor-trainer'} style={{ zIndex: 10 }}>
      <Card.Header><h3><Trans i18nKey={prefix + 'title'} /></h3></Card.Header>
      <Card.Body>
        {/* LEARNING RATE */}
        <Form.Group className="mb-3" controlId="formTrainRate">
          <Form.Label><Trans i18nKey={prefix + 'learning-rate'} /></Form.Label>
          <Form.Control type="number"
                        inputMode={'numeric'}
                        min={1}
                        max={100}
                        placeholder={t(prefix + 'learning-rate-placeholder')}
                        defaultValue={DEFAULT_LEARNING_RATE}
                        onChange={(e) => handleChange_LearningRate(e)} />
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'learning-rate-info'} />
          </Form.Text>
        </Form.Group>

        {/* NUMBER OF EPOCHS */}
        <Form.Group className="mb-3" controlId="FormNumberOfEpochs">
          <Form.Label><Trans i18nKey={prefix + 'number-of-epochs'} /></Form.Label>
          <Form.Control type="number"
                        min={1}
                        max={100}
                        placeholder={t(prefix + 'number-of-epochs-placeholder')}
                        defaultValue={DEFAULT_NUMBER_EPOCHS}
                        onChange={(e) => handleChange_NumberEpochs(e)}
          />
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'number-of-epochs-info'} />
          </Form.Text>
        </Form.Group>

        {/* TEST SIZE */}
        <Form.Group className="mb-3" controlId="FormTestSize">
          <Form.Label><Trans i18nKey={prefix + 'test-size'} /></Form.Label>
          <Form.Control type="number"
                        inputMode={'numeric'}
                        min={1}
                        max={100}
                        placeholder={t(prefix + 'test-size-placeholder')}
                        defaultValue={DEFAULT_TEST_SIZE}
                        onChange={(e) => handleChange_TestSize(e)}
          />
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'test-size-info'} />
          </Form.Text>
        </Form.Group>

        <hr />
        {/* OPTIMIZATION FUNCTION */}
        <Form.Group className="mb-3" controlId="FormOptimizer">
          <Form.Label><Trans i18nKey={prefix + 'optimizer-id'} /></Form.Label>
          <Form.Select aria-label={t(prefix + 'optimizer-id-info')}
                       defaultValue={DEFAULT_ID_OPTIMIZATION}
                       onChange={handleChange_Optimization}>
            {TYPE_OPTIMIZER.map(({ key, label }, _index) => {
              return (<option key={_index} value={key}>{label}</option>)
            })}
          </Form.Select>
          <Form.Text className="text-muted">
            <Trans i18nKey={prefix + 'optimizer-id-info'} />
          </Form.Text>
        </Form.Group>

        <hr />
        {/* LOSS FUNCTION */}
        <Form.Group className="mb-3" controlId="FormLoss">
          <Form.Label><Trans i18nKey={prefix + 'loss-id'} /></Form.Label>
          <Form.Select aria-label={t(prefix + 'loss-id-info')}
                       defaultValue={DEFAULT_ID_LOSS}
                       onChange={handleChange_Loss}>
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

        <hr />
        <Accordion className={'mt-2'}>
          {/* METRICS FUNCTION */}
          {idMetricsList.map((value, index) => {
            return <Accordion.Item key={index} eventKey={index.toString()}>
              <Accordion.Header>
                <Trans i18nKey={prefix + 'metric-id-__index__'}
                       values={{ index: index + 1 }} />
              </Accordion.Header>
              <Accordion.Body>
                <div className="d-grid gap-2">
                  <Button variant={'outline-danger'}
                          onClick={() => handlerClick_RemoveMetric(index)}>
                    <Trans i18nKey={prefix + 'delete-metric'}
                           values={{ index: index + 1 }} />
                  </Button>
                </div>

                <Form.Group className="mb-3" controlId={`FormMetrics_${index}`}>
                  <Form.Label><Trans i18nKey={prefix + 'metric-id-select'} /></Form.Label>
                  <Form.Select aria-label={t(prefix + 'metrics-id-info')}
                               value={value}
                               onChange={(e) => handleChange_Metrics(e, index)}>
                    {TYPE_METRICS.map(({ key, label }, _index) => {
                      return (<option key={_index} value={key}>{label}</option>)
                    })}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    <Trans i18nKey={prefix + 'metrics-id-info'} />
                  </Form.Text>
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
          })}
        </Accordion>

      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-link'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/glossary/',
                                  state   : {
                                    action: GLOSSARY_ACTIONS.IMAGE_CLASSIFICATION.STEP_4_HYPERPARAMETERS
                                  }
                                }}
                   />
                 }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-tutorial'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/manual/',
                                  state   : {
                                    action: MANUAL_ACTIONS.IMAGE_CLASSIFICATION.STEP_4_HYPERPARAMETERS
                                  }
                                }}
                   />
                 }} />
        </p>
      </Card.Footer>
    </Card>
  </>
}