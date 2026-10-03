import { useMemo, useState } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as _tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { UPLOAD } from '@/TASKS'
import { VERBOSE } from '@/CONSTANTS'
import TabularClassificationPredictionForm from '@pages/playground/0_TabularClassification/TabularClassificationPredictionForm'
import TabularClassificationDatasetShowInfo from '@pages/playground/0_TabularClassification/TabularClassificationDatasetShowInfo'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LClassificationChart from '@components/neural-network/N4LClassificationChart'
import N4LVirtualSelect, { type VirtualSelectOption_t } from '@components/select/N4LVirtualSelect'
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
    setPredictionBar,
  } = useTabularClassificationContext()

  const prefix = 'pages.playground.generator.dynamic-form-dataset.'
  const { t } = useTranslation()
  // Fila del conjunto de datos cuyos valores se han copiado al formulario (null hasta elegir una)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedRowDataset, setSelectedRowDataset] = useState(datasets.index)
  // Otro conjunto de datos (al subir uno nuevo): la fila elegida era del anterior
  if (selectedRowDataset !== datasets.index) {
    setSelectedRowDataset(datasets.index)
    setSelectedRow(null)
  }

  const dataset_selected = datasets.datasets[datasets.index]

  // Una opción por fila: su número y su clase. Puede haber miles: el desplegable solo pinta las que se ven
  const rowOptions = useMemo<VirtualSelectOption_t[]>(() => {
    const data_processed = dataset_selected?.data_processed
    if (data_processed === undefined) return []
    const targets = dataset_selected.dataframe_original[data_processed.column_name_target].$data as Array<unknown>
    return targets.map((target, index) => ({ value: index, label: `#${index} · ${String(target)}` }))
  }, [dataset_selected])

  const handleChange_Row = (row_index: number) => {
    setSelectedRow(row_index)
    const dataset_processed = datasets.datasets[datasets.index]
    const { data_processed, dataframe_original, dataset_transforms } = dataset_processed
    if (data_processed === undefined) {
      console.error('Error, data_processed is undefined')
      return
    }
    // Solo esa fila y las columnas de entrada (sin la clase ni las descartadas): copiar el conjunto entero para leer una
    // fila era lento con miles de ejemplos
    const dropped = [data_processed.column_name_target, ...dataset_transforms.filter(({ column_transform }) => column_transform === 'drop').map(({ column_name }) => column_name)]
    const row = dataframe_original.iloc({ rows: [row_index] })
    const columns = row.columns.filter((column) => !dropped.includes(column))
    setInputDataToPredict(row.loc({ columns }).values[0] as _Types.N4LDataFrameType[])
  }

  const handleChange_Model = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index: number = parseInt(e.target.value)
    setModel(generatedModels[index].model)
    setGeneratedModelsIndex(index)
    // El resultado anterior era de otro modelo
    setPredictionBar({ classes: [], labels: [], data: [] })
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

  if (VERBOSE) console.debug('render TabularClassificationPrediction')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3>
          <Trans i18nKey={prefix + 'title'} />
          {generatedModelsIndex !== -1 &&
            <>{' '}| <Trans i18nKey={'model.__index__'} values={{ index: generatedModelsIndex + 1 }} /></>}
        </h3>
        <div className={'d-flex flex-wrap gap-2 n4l-card-header-controls'}>
          {(generatedModels.length !== 0 && dataset_selected && dataset_selected.is_dataset_processed) && <>
            <div className={'n4l-instance-select'}>
              <N4LVirtualSelect options={rowOptions}
                value={selectedRow}
                onChange={handleChange_Row}
                size={'sm'}
                placeholder={t(prefix + 'selector-entity')}
                searchPlaceholder={t(prefix + 'search-entity')}
                noResultsText={t(prefix + 'no-entity')}
                countText={(shown, total) => t(prefix + 'entity-count', { shown, total })} />
            </div>
          </>}
          {generatedModels.length !== 0 && <>
            <Form.Group controlId={'MODEL'}>
              <Form.Select
                aria-label={t('selector-model')}
                size={'sm'}
                value={generatedModelsIndex === -1 ? generatedModels.length - 1 : generatedModelsIndex}
                onChange={(e) => handleChange_Model(e)}>
                {generatedModels.map((_row, index) => {
                  return <option key={'option_' + index} value={index}>
                    <Trans i18nKey={'model.__index__'} values={{ index: index + 1 }} />
                  </option>
                })}
              </Form.Select>
            </Form.Group>
          </>}
        </div>
      </Card.Header>
      <Card.Body>

        {generatedModels.length === 0 && <>
          <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-models'} />
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
                <Trans i18nKey={prefix + 'classify-button'} />
              </Button>
            </div>
            <hr />

            <TabularClassificationDatasetShowInfo
              datasets={datasets}
            />
            <hr />
            {predictionBar.data.length === 0 && <N4LEmptyState i18nKey={'pages.playground.generator.classify.waiting'} />}
            {predictionBar.data.length > 0 && <N4LClassificationChart values={predictionBar.data} classLabels={predictionBar.labels} />}
          </Form>
        </>}
      </Card.Body>
    </Card>
  </>
}