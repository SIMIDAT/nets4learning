import React from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'
import * as _tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { UPLOAD } from '@/DATA_MODEL'
import { VERBOSE } from '@/CONSTANTS'
import { CHARTJS_CONFIG_DEFAULT } from '@/CONSTANTS_ChartsJs'
import TabularClassificationPredictionForm from '@pages/playground/0_TabularClassification/TabularClassificationPredictionForm'
import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import WaitingPlaceholder from '@/components/loading/WaitingPlaceholder'

/**
 * @typedef TabularClassificationPredictionProps_t
 * @property {string} dataset - KEY
 * @property {_Types.DatasetProcessed_t[]} datasets
 * @property {number} datasetIndex
 * @property {_Types.TabularClassificationGeneratedModel_t[]} generatedModels
 * @property {React.Dispatch<React.SetStateAction<_Types.TabularClassificationGeneratedModel_t[]>>} setGeneratedModels
 * @property {number} generatedModelsIndex
 * @property {React.Dispatch<React.SetStateAction<number>>} setGeneratedModelsIndex
 * @property {_tfjs.Sequential} Model
 * @property {React.Dispatch<React.SetStateAction<_tfjs.Sequential>>} setModel
 * @property {Array<any>} inputDataToPredict
 * @property {React.Dispatch<React.SetStateAction<Array<any>>>} setInputDataToPredict
 * @property {Array<any>} inputVectorToPredict
 * @property {React.Dispatch<React.SetStateAction<Array<any>>>} setInputVectorToPredict
 * @property {_Types.TabularClassificationPredictionBar_t} predictionBar
 * @property {(e: any) => Promise<void>} handleSubmit_PredictVector
 * 
 */

/**
 * 
 * @param {TabularClassificationPredictionProps_t} props 
 * @returns 
 */
export default function TabularClassificationPrediction (props) {
  const {
    dataset,

    datasets,
    datasetIndex,

    generatedModels,

    generatedModelsIndex,
    setGeneratedModelsIndex,

    Model,
    setModel,

    inputDataToPredict,
    setInputDataToPredict,

    inputVectorToPredict,
    setInputVectorToPredict,

    predictionBar,

    handleSubmit_PredictVector,
  } = props

  const prefix = 'pages.playground.generator.dynamic-form-dataset.'
  const { t } = useTranslation()
  const bar_options = {
    responsive: true,
    plugins   : {
      legend: {
        position: 'top',
        display : false,
      },
      title: {
        display: true,
        text   : t('prediction'),
      },
    },
  }

  const handleChange_ROW = (e) => {
    const dataset_processed = datasets[datasetIndex]
    const { data_processed, dataframe_original, dataset_transforms } = dataset_processed
    const { column_name_target } = data_processed
    const dataframe = DataFrameUtils.DataFrameDeepCopy(dataframe_original)
    dataframe.drop({ columns: [column_name_target], inplace: true })
    for (const { column_name, column_transform } of dataset_transforms) {
      if (column_transform === 'drop') {
        dataframe.drop({ columns: [column_name], inplace: true })
      }
    }
    const row_index = parseInt(e.target.value)
    setInputDataToPredict(dataframe.$data[row_index])
  }

  const handleChange_Model = (e) => {
    const index = e.target.value
    setModel(generatedModels[index].model)
    setGeneratedModelsIndex(index)
  }

  const canRender_PredictDynamicForm = () => {
    if (datasets.length === 0) return false
    if (datasetIndex < 0) return false

    if (dataset === UPLOAD) {
      return (datasets[datasetIndex] || datasets[datasetIndex].is_dataset_processed) && Model
    } else {
      return (datasets[datasetIndex]) && Model
    }
  }

  if (VERBOSE) console.debug('render TabularClassificationPrediction')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /> {generatedModelsIndex !== -1 && <>| <Trans i18nKey={'model.__index__'} values={{ index: generatedModelsIndex }} /></>}</h3>
        <div className={'d-flex'}>
          {(generatedModels.length !== 0 && datasets[datasetIndex].is_dataset_processed) && <>
            <Form.Group controlId={'DATA'} className={'joyride-step-select-instance'}>
              <Form.Select aria-label={t(prefix + 'selector-entity')}
                           size={'sm'}
                           onChange={(e) => handleChange_ROW(e)}>
                {((() => {
                  const { dataframe_original, data_processed } = datasets[datasetIndex]
                  const { column_name_target } = data_processed
                  return dataframe_original[column_name_target].$data
                })())
                  .map((target, index) => {
                    return <option key={'option_' + index} value={index}>
                      Id: {index.toString().padStart(3, '0')} - Target: {target}
                    </option>
                  })}
              </Form.Select>
            </Form.Group>
          </>}
          {generatedModels.length !== 0 && <>
            <Form.Group controlId={'MODEL'} className={'ms-3 joyride-step-select-model'}>
              <Form.Select aria-label={t('selector-model')}
                           size={'sm'}
                           onChange={(e) => handleChange_Model(e)}>
                {generatedModels.map((row, index) => {
                  return <option key={'option_' + index} value={index}>
                    <Trans i18nKey={'model.__index__'} values={{ index: index }} />
                  </option>
                })}
              </Form.Select>
            </Form.Group>
          </>}
        </div>
      </Card.Header>
      <Card.Body>

        {generatedModels.length === 0 && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-models'} />
        </>}


        {(canRender_PredictDynamicForm()) && <>
          <Form onSubmit={handleSubmit_PredictVector} noValidate={true}>
            <Card.Text>
              <Trans i18nKey={prefix + 'text-0-__column_name_target__'}
                     values={{ column_name_target: datasets[datasetIndex].data_processed.column_name_target }} />
              <br />
              <b>({datasets[datasetIndex].data_processed.attributes.map(att => att.name).join(', ')}).</b>
            </Card.Text>
            <TabularClassificationPredictionForm datasets={datasets}
                                                 datasetIndex={datasetIndex}
                                                 inputDataToPredict={inputDataToPredict}
                                                 setInputDataToPredict={setInputDataToPredict}
                                                 inputVectorToPredict={inputVectorToPredict}
                                                 setInputVectorToPredict={setInputVectorToPredict}

            />

            {/* SUBMIT BUTTON */}
            <hr />
            <div className={'d-grid gap-2'}>
              <Button variant={'primary'}
                      size={'lg'}
                      type={'submit'}>
                <Trans i18nKey={'Predict'} />
              </Button>
            </div>
            <hr />

            <TabularClassificationDatasetShowInfo datasets={datasets}
                                                  datasetIndex={datasetIndex} />
            <hr />
            <Bar options={bar_options}
                 data={{
                   labels  : predictionBar.labels,
                   datasets: [
                     {
                       data           : predictionBar.data,
                       label          : t('prediction'),
                       backgroundColor: CHARTJS_CONFIG_DEFAULT.BACKGROUND_COLOR,
                       borderColor    : CHARTJS_CONFIG_DEFAULT.BORDER_COLOR,
                       borderWidth    : 1,
                     },
                   ],
                 }} />
          </Form>
        </>}
      </Card.Body>
    </Card>
  </>
}