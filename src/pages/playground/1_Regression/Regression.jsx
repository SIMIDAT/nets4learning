import React, { lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { useHistory, Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import ReactGA from 'react-ga4'
import * as tfjs from '@tensorflow/tfjs'

import { DEFAULT_SELECTOR_DATASET, VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS } from '@/CONSTANTS_ACTIONS'

import N4LDivider from '@components/divider/N4LDivider'
import N4LLayerDesign from '@components/neural-network/N4LLayerDesign'
import N4LJoyride from '@components/joyride/N4LJoyride'
import DebugJSON from '@components/debug/DebugJSON'

import { MAP_LR_CLASSES } from './models'

import * as _Types from '@/core/types'
// import LinearRegressionModelController_Simple from '@core/controller/01-regression/LinearRegressionModelController_Simple'
import { createRegressionCustomModel } from '@/core/controller/01-regression/RegressionModelController'
import RegressionContext from '@/context/RegressionContext'
import alertHelper from '@utils/alertHelper'
import { UPLOAD } from '@/DATA_MODEL'
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from './utils'

// Manual and datasets
const RegressionManual = lazy(() => import('./RegressionManual'))
const RegressionDataset = lazy(() => import('./RegressionDataset'))
const RegressionDatasetProcess = lazy(() => import('./RegressionDatasetProcess'))
const RegressionDatasetShow = lazy(() => import('./RegressionDatasetShow'))
// Editors
const RegressionEditorLayers = lazy(() => import('./RegressionEditorLayers'))
const RegressionEditorFeaturesSelector = lazy(() => import('./RegressionEditorFeaturesSelector'))
const RegressionEditorHyperparameters = lazy(() => import('./RegressionEditorHyperparameters'))
// const RegressionEditorVisor = lazy(() => import( './RegressionEditorVisor'))
// Models
const RegressionTableModels = lazy(() => import('./RegressionTableModels'))
const RegressionPrediction = lazy(() => import('./RegressionPrediction'))

/**
 * @typedef RegressionProps_t
 * @property {string} dataset
 */

/**
 * 
 * @param {RegressionProps_t} props 
 * @returns 
 */
export default function Regression(props) {
  const { dataset } = props
  /** @type {ReturnType<typeof useParams<{id: string}>>} */
  const { id: param_id } = useParams()
  const history = useHistory()

  // i18n
  const prefix = 'pages.playground.generator.'
  const { t } = useTranslation()

  const {
    modelRef,

    // prediction,
    setPrediction,

    datasets,
    setDatasets,

    params,
    setParams,

    isTraining,
    setIsTraining,

    setListModels,

    accordionActive,
    setAccordionActive,

    iModelInstance,
    setIModelInstance,
  } = useContext(RegressionContext)

  const [ready, setReady] = useState(false)
  /**
   * @type {ReturnType<typeof useRef<_Types.Joyride_t|_Types.Joyride_void_t>>}
   */
  const joyrideButton_ref = useRef({})

  
  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: `/Regression/${dataset}`, title: dataset })
  }, [dataset])

  useEffect(() => {
    setReady(datasets && datasets.data.length > 0 && datasets.index !== DEFAULT_SELECTOR_DATASET && datasets.index >= 0)
  }, [setReady, datasets])

  useEffect(() => {
    if (VERBOSE) console.debug('useEffect[init][ dataset, t, setIModelInstance, setAccordionActive, setDatasets, setParams, history ]')
    const init = async () => {
      await tfjs.ready()
      if (dataset === UPLOAD) {
        console.debug('ENABLE Upload csv | Regression')
      } else if (dataset in MAP_LR_CLASSES) {
        /** @type {_Types.I_MODEL_REGRESSION_t} */
        const _iModelInstance = new MAP_LR_CLASSES[dataset](t, setAccordionActive)
        const _datasets = await _iModelInstance.DATASETS()
        setIModelInstance(_iModelInstance)
        setDatasets(() => {
          return {
            data : _datasets,
            index: 0
          }
        })
      } else {
        await alertHelper.alertError('Error in selection of model')
        console.error('Error, option not valid', { ID: dataset })
        history.push('/404')
      }
    }
    init().then(() => undefined)
  }, [dataset, t, setIModelInstance, setAccordionActive, setDatasets, setParams, history])


  useEffect(() => {
    if (dataset === UPLOAD) {
      console.debug('Regression upload csv')
    } else if (dataset in MAP_LR_CLASSES) {
      if (iModelInstance
        && datasets 
        && datasets.data 
        && datasets.index != DEFAULT_SELECTOR_DATASET 
        && datasets.data[datasets.index] 
        && datasets.data[datasets.index].csv
      ) {
        setParams((prevState) => ({
          ...prevState,
          params_layers: iModelInstance.DEFAULT_LAYERS(datasets.data[datasets.index].csv)
        }))
      }
    }
  }, [dataset, iModelInstance, datasets, setParams])
  
  const TrainModel = async () => {
    const dataset_processed = datasets.data[datasets.index]
    const { model, history } = await createRegressionCustomModel({
      dataset_processed: dataset_processed,
      layerList        : params.params_layers,
      learningRate     : params.params_training.learning_rate / 100,
      numberOfEpoch    : params.params_training.n_of_epochs,
      testSize         : params.params_training.test_size / 100,
      idOptimizer      : params.params_training.id_optimizer,
      idLoss           : params.params_training.id_loss,
      idMetrics        : params.params_training.list_id_metrics,
    })
    modelRef.current.model = model

    /** @type {_Types.CustomModelGenerated_t} */
    const newModel = {
      model            : model,
      history          : history,
      params_layers    : [ ...params.params_layers ],
      params_training  : { ...params.params_training },
      params_features  : { ...params.params_features },
      dataset_processed: dataset_processed
    }
    setListModels((prevState) => {
      return {
        data : [ ...prevState.data, newModel ],
        index: prevState.data.length
      }
    })

    const newPredictionState = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset_processed, 0)
    setPrediction((prevState) => ({
      ...prevState,
      input_0_raw                : newPredictionState.input_0_raw,
      input_1_dataframe_original : newPredictionState.input_1_dataframe_original,
      input_1_dataframe_processed: newPredictionState.input_1_dataframe_processed,
      input_2_dataframe_encoding : newPredictionState.input_2_dataframe_encoding,
      input_3_dataframe_scaling  : newPredictionState.input_3_dataframe_scaling,
    }))

  }

  const handleSubmit_TrainModel = async (event) => {
    event.preventDefault()
    setIsTraining(true)

    try {
      await TrainModel() 
    } catch (error) {
      console.error('Error during model training:', error)
    } finally {
      setIsTraining(false) 
    }
  }

  const accordionToggle = (value) => {
    const copy = JSON.parse(JSON.stringify(accordionActive))
    let index = copy.indexOf(value)
    if (index === -1) {
      copy.push(value)
    } else {
      copy.splice(index, 1)
    }
    setAccordionActive(copy)
  }

  if (VERBOSE) console.debug('render Regression')
  return (
    <>
      <N4LJoyride joyrideButton_ref={joyrideButton_ref}
                  JOYRIDE_state={iModelInstance.JOYRIDE()}
                  TASK={'regression'}
                  KEY={'LinearRegression'}
      />

      <Container>
        <Row className={'mt-2 mb-3'}>
          <Col xl={12}>
            <div className="d-flex justify-content-between">
              <h1><Trans i18nKey={'modality.' + param_id} /></h1>
              <Button size={'sm'}
                      variant={'outline-primary'}
                      onClick={joyrideButton_ref.current.handleClick_StartJoyride}>
                <Trans i18nKey={'datasets-models.1-regression.joyride.title'} />
              </Button>
            </div>
          </Col>
        </Row>

        {/* INFORMATION */}
        <N4LDivider i18nKey={'hr.information'} />
        <Row>
          <Col>
            <Accordion defaultActiveKey={[]} activeKey={accordionActive}>
              <Accordion.Item className={'joyride-step-1-manual'} eventKey={'manual'}>
                <Accordion.Header onClick={() => accordionToggle('manual')}>
                  <h2><Trans i18nKey={'pages.playground.1-regression.generator.manual.title'} /></h2>
                </Accordion.Header>
                <Accordion.Body>
                  <Suspense fallback={<></>}><RegressionManual /></Suspense>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item className={'joyride-step-2-dataset-info'} eventKey={'dataset_info'}>
                <Accordion.Header onClick={() => accordionToggle('dataset_info')}>
                  <h2><Trans i18nKey={dataset !== UPLOAD ? iModelInstance.i18n_TITLE : prefix + 'dataset.upload-dataset'} /></h2>
                </Accordion.Header>
                <Accordion.Body id={'info-dataset'}>
                  <Suspense fallback={<></>}><RegressionDataset dataset={dataset} /></Suspense>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>

        {/* PROCESS DATASET */}
        {dataset === UPLOAD && <>
          <N4LDivider i18nKey={'hr.process-dataset'} />
          <Row className={'joyride-step-3-pre-process-dataset'}>
            <Col>
              <Suspense fallback={<></>}><RegressionDatasetProcess /></Suspense>
            </Col>
          </Row>
        </>}

        {/* SHOW DATASET */}
        <N4LDivider i18nKey={'hr.dataset'} />
        <Row className={'joyride-step-4-dataset'}>
          <Col>
            <Suspense fallback={<></>}><RegressionDatasetShow /></Suspense>
          </Col>
        </Row>

        {/* MODEL */}
        <N4LDivider i18nKey={'hr.model'} />
        <Row>
          <Col className={'joyride-step-5-layer'}>
            <N4LLayerDesign layers={params.params_layers}
                            show={ready}
                            actions={[
                              <>
                                <Trans i18nKey={'more-information-in-link'}
                                  components={{
                                    link1: <Link
                                      className={'text-info'}
                                      to={{
                                        pathname: '/glossary/',
                                        state   : {
                                          action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN,
                                        },
                                      }} />,
                                  }} />
                              </>
                            ]}
                          />
          </Col>
        </Row>

        <Form onSubmit={handleSubmit_TrainModel}>
          <Row className={'mt-3'}>
            <Col className={'mb-3'}>
              <div className={'joyride-step-6-editor-layers'}>
                <Suspense fallback={<></>}><RegressionEditorLayers /></Suspense>
              </div>
               
              <div className={'joyride-step-6-editor-selector-features'}>
                <Suspense fallback={<></>}><RegressionEditorFeaturesSelector /></Suspense>
              </div>
            </Col>

            <Col className={'joyride-step-7-editor-trainer'}>
              <Suspense fallback={<></>}><RegressionEditorHyperparameters /></Suspense>
            </Col>
          </Row>

          <Row className={'mt-3'}>
            <Col xl={12}>
              <div className={'d-grid gap-2'}>
                <Button type={'submit'}
                        size={'lg'}
                        disabled={!ready || isTraining || !datasets.data[datasets.index].is_dataset_processed}
                        variant="primary">
                  <Trans i18nKey={prefix + 'models.button-submit'} />
                </Button>
              </div>
            </Col>
          </Row>
        </Form>

        <hr />

        <Row className={'mt-3'}>
          <Col className={'joyride-step-8-list-of-models'}>
            <Suspense fallback={<></>}><RegressionTableModels /></Suspense>
          </Col>
        </Row>

        <N4LDivider i18nKey={'hr.predict'} />

        <Row className={'mt-3'}>
          <Col className={'joyride-step-9-predict-visualization'}>
            <Suspense fallback={<></>}>
              <RegressionPrediction />
            </Suspense>
          </Col>
        </Row>

        {process.env.REACT_APP_ENVIRONMENT === 'development' && ready &&
          <Row className={'mt-3'}>
            <Col>
              <Card>
                <Card.Header>
                  <h2>Debug</h2>
                </Card.Header>
                <Card.Body>
                  <Row lg={2}>
                    <Col>
                      <DebugJSON
                        obj={{
                          is_dataset_upload   : datasets.data[datasets.index].is_dataset_upload,
                          is_dataset_processed: datasets.data[datasets.index].is_dataset_processed,
                          container_info      : datasets.data[datasets.index].container_info,
                        }} />
                    </Col>
                    <Col>
                      <DebugJSON
                        obj={{
                          datasets      : datasets.data.length,
                          datasets_index: datasets.index
                        }} />
                    </Col>
                    <Col><DebugJSON obj={params.params_training} /></Col>
                    <Col><DebugJSON obj={params.params_visor} /></Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        }

      </Container>
    </>
  )
}
