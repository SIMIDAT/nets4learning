import { useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Row, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'

import { DEFAULT_SELECTOR_INSTANCE, DEFAULT_SELECTOR_MODEL, DEFAULT_SELECTOR_MODEL_INDEX, VERBOSE } from '@/CONSTANTS'
import N4LSummary from '@components/summary/N4LSummary'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import RegressionContext from '@context/RegressionContext'
import RegressionPredictionForm from '@pages/playground/1_Regression/RegressionPredictionForm'
import RegressionPredictionInfo from '@pages/playground/1_Regression/RegressionPredictionInfo'
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from './utils'

export default function RegressionPrediction() {
  const prefix = 'pages.playground.1-regression.predict.'
  const { t } = useTranslation()

  const {
    prediction,
    setPrediction,

    listModels,
    setListModels,
  } = useContext(RegressionContext)

  const [showPrediction, setShowPrediction] = useState(false)

  /**
   * @type {ReturnType<typeof useState<string|number>>}
   */
  const [indexInstance, setIndexInstance] = useState<string | number>(DEFAULT_SELECTOR_INSTANCE)

  const handleSubmit_Predict = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const vector = prediction.input_3_dataframe_scaling.values[0]
    // @ts-ignore
    const tensor = tfjs.tensor2d([vector])
    const _indexModel: number = listModels.index as number
    const model = (/**@type {tfjs.LayersModel}*/(listModels.data[_indexModel].model))
    const predictTensor = (/**@type {tfjs.Tensor}*/(model.predict(tensor)) as tfjs.Tensor)

    const result = [predictTensor.dataSync()]

    setPrediction((prevState) => ({
      ...prevState,
      result: result
    }))

  }

  const handleChange_Model_Index = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setListModels((prevState) => ({
      ...prevState,
      index: parseInt(e.target.value)
    }))
  }

  const handleChange_Instance_Index = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault()
    const _indexInstance: number = parseInt(e.target.value)
    setIndexInstance(_indexInstance)
    const _indexModel: number = listModels.index as number
    const dataset_processed = listModels.data[_indexModel].dataset_processed
    const newPredictionState = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset_processed, _indexInstance)

    setPrediction((prevState) => ({
      ...prevState,
      input_0_raw                : newPredictionState.input_0_raw,
      input_1_dataframe_original : newPredictionState.input_1_dataframe_original,
      input_1_dataframe_processed: newPredictionState.input_1_dataframe_processed,
      input_2_dataframe_encoding : newPredictionState.input_2_dataframe_encoding,
      input_3_dataframe_scaling  : newPredictionState.input_3_dataframe_scaling,
    }))
  }

  useEffect(() => {
    // setShowPrediction((listModels.data.length > 0 && listModels.index !== DEFAULT_SELECTOR_MODEL && listModels.index >= 0))
    // eslint-disable-next-line
    setShowPrediction(() => {
      if (listModels.data.length > 0 && listModels.index !== DEFAULT_SELECTOR_MODEL_INDEX) {
        const isNumber = Number.isInteger(listModels.index)
        if (isNumber) {
          const _index: number = listModels.index as number
          if (_index >= 0) {
            return true
          }
        }
      }
      return false
    })
  }, [listModels, listModels.data, listModels.index, setShowPrediction])

  const _indexModel: number = listModels.index as number

  if (VERBOSE) console.debug('render RegressionPrediction')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={prefix + 'title'} /></h2>
        <div className="d-flex">
          <div>
            <Form.Group controlId={'instance-selector'}>
              <Form.Select aria-label={'instance-selector'}
                size={'sm'}
                defaultValue={indexInstance}
                disabled={!showPrediction}
                onChange={(e) => handleChange_Instance_Index(e)}>
                <option disabled={true} value={DEFAULT_SELECTOR_INSTANCE}><Trans i18nKey={prefix + 'list-instances'} /></option>
                <>
                  {showPrediction && <>
                    {Array(listModels.data[_indexModel].dataset_processed?.data_processed?.dataframe_X.values.length)
                      .fill(0)
                      .map((_value, index) => {
                        const index_format = index.toString().padStart(3, '0')
                        return <option key={index} value={index}>
                          <Trans i18nKey={prefix + 'instance.__index__'} values={{ index: index_format }} />
                        </option>
                      })}
                  </>}
                </>
              </Form.Select>
            </Form.Group>
          </div>
          <div className={'ms-3'}>
            <Form.Group controlId={'model-selector'}>
              <Form.Select
                aria-label={'model-selector'}
                size={'sm'}
                data-value={listModels.index}
                value={listModels.index}
                disabled={!showPrediction}
                onChange={(e) => handleChange_Model_Index(e)}
              >
                <option disabled={true} value={DEFAULT_SELECTOR_MODEL}>
                  <Trans i18nKey={prefix + 'list-models'} />
                </option>
                <>
                  {listModels
                    .data
                    .map((_, index) => {
                      const index_format = index.toString()
                      return <option key={index} value={index}>
                        <Trans i18nKey={'model.__index__'} values={{ index: index_format }} />
                      </option>
                    })}
                </>
              </Form.Select>
            </Form.Group>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {!showPrediction && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-models'} />
        </>}
        {showPrediction && <>
          <Row>
            <Col>
              <N4LSummary title={t('Features')}>
                <ol>
                  {Array
                    .from(listModels.data[_indexModel]?.params_features.X_features ?? [])
                    .map((value, index) => {
                      return <li key={index}>{value}</li>
                    })
                  }
                </ol>
              </N4LSummary>
            </Col>
            <Col>
              <N4LSummary title={t('Target')}>
                <ol>
                  <li>{listModels.data[_indexModel]?.params_features.Y_target}</li>
                </ol>
              </N4LSummary>
            </Col>
          </Row>
          <hr />
          <Form onSubmit={handleSubmit_Predict} noValidate>

            <RegressionPredictionForm
              generatedModel={listModels.data[_indexModel]}
            />

            <hr />

            <Row>
              <div className="d-grid gap-2">
                <Button
                  variant={'primary'}
                  size={'lg'}
                  type={'submit'}>
                  <Trans i18nKey={prefix + 'button-submit'} />
                </Button>
              </div>
            </Row>

            <hr />

            <RegressionPredictionInfo prediction={prediction} />

          </Form>
        </>}
      </Card.Body>
    </Card>
  </>
}
