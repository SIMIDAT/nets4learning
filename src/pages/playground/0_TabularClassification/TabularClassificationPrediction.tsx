import { Button, Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'
import * as _tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { UPLOAD } from '@/TASKS'
import { VERBOSE } from '@/CONSTANTS'
import { CHARTJS_CONFIG_DEFAULT } from '@/CONSTANTS_ChartsJs'
import TabularClassificationPredictionForm from '@pages/playground/0_TabularClassification/TabularClassificationPredictionForm'
import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import type { BarOptions_t } from '@/types/types'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'

type TabularClassificationPredictionProps_t = {
  dataset                   : string,
  handleSubmit_PredictVector: (e: React.FormEvent<HTMLFormElement>) => Promise<void>,
}

/**
 * 
 * @param {TabularClassificationPredictionProps_t} props 
 * @returns 
 */
export default function TabularClassificationPrediction(props: TabularClassificationPredictionProps_t) {
    const { dataset, handleSubmit_PredictVector } = props
  const {
    datasets,
    generatedModels,
    generatedModelsIndex,
    setGeneratedModelsIndex,
    model: Model,
    setModel,
    setInputDataToPredict,
    predictionBar,
  } = useTabularClassificationContext()

  const prefix = 'pages.playground.generator.dynamic-form-dataset.'
  const { t } = useTranslation()
  const bar_options: BarOptions_t = {
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

  const handleChange_ROW = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dataset_processed = datasets.datasets[datasets.index]
    const { data_processed, dataframe_original, dataset_transforms } = dataset_processed
    if (data_processed === undefined) {
      console.error('Error, data_processed is undefined')
      return
    }
    const { column_name_target } = data_processed
    const dataframe = DataFrameUtils.DataFrameDeepCopy(dataframe_original)
    dataframe.drop({ columns: [column_name_target], inplace: true })
    for (const { column_name, column_transform } of dataset_transforms) {
      if (column_transform === 'drop') {
        dataframe.drop({ columns: [column_name], inplace: true })
      }
    }
    const row_index = parseInt(e.target.value)

    const df = dataframe.iloc({ rows: [row_index] })
    const dataframe_row_default_data = df.values[0] as _Types.N4LDataFrameType[]
    setInputDataToPredict(dataframe_row_default_data)
  }

  const handleChange_Model = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index: number = parseInt(e.target.value)
    setModel(generatedModels[index].model)
    setGeneratedModelsIndex(index)
  }

  const canRender_PredictDynamicForm = () => {
    if (datasets.datasets.length === 0) return false
    if (datasets.index < 0) return false


    const _dataset_selected: _Types.DatasetProcessed_t = datasets.datasets[datasets.index]
    if (dataset === UPLOAD) {
      return (_dataset_selected && _dataset_selected.is_dataset_processed) && Model
    } else {
      return (_dataset_selected) && Model
    }
  }

  const dataset_selected = datasets.datasets[datasets.index]


  if (VERBOSE) console.debug('render TabularClassificationPrediction')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3>
          <Trans i18nKey={prefix + 'title'} />
          {generatedModelsIndex !== -1 &&
            <>| <Trans i18nKey={'model.__index__'} values={{ index: generatedModelsIndex }} /></>}
        </h3>
        <div className={'d-flex'}>
          {(generatedModels.length !== 0 && dataset_selected && dataset_selected.is_dataset_processed) && <>
            <Form.Group controlId={'DATA'} className={'joyride-step-select-instance'}>
              <Form.Select
                aria-label={t(prefix + 'selector-entity')}
                size={'sm'}
                onChange={(e) => handleChange_ROW(e)}>
                {((() => {
                  const { dataframe_original, data_processed } = dataset_selected
                  if (data_processed === undefined) {
                    console.error('Error, data_processed is undefined')
                    return []
                  }
                  const { column_name_target } = data_processed
                  return dataframe_original[column_name_target].$data as Array<any>
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
              <Form.Select
                aria-label={t('selector-model')}
                size={'sm'}
                onChange={(e) => handleChange_Model(e)}>
                {generatedModels.map((_row, index) => {
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
                values={{ column_name_target: dataset_selected?.data_processed?.column_name_target }} />
              <br />
              <b>({dataset_selected?.data_processed?.attributes?.map(att => att.name).join(', ')}).</b>
            </Card.Text>
            <TabularClassificationPredictionForm />

            {/* SUBMIT BUTTON */}
            <hr />
            <div className={'d-grid gap-2'}>
              <Button
                variant={'primary'}
                size={'lg'}
                type={'submit'}>
                <Trans i18nKey={'Predict'} />
              </Button>
            </div>
            <hr />

            <TabularClassificationDatasetShowInfo
              datasets={datasets}
            />
            <hr />
            <Bar
              options={bar_options}
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