import React, { useMemo, useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import AlertHelper from '@utils/alertHelper'
import { VERBOSE } from '@/CONSTANTS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import * as _Types from '@core/types'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'

// @formatter:off
const DEFAULT_OPTIONS = [
  { value: 'int32', i18n: 'int32' },
  { value: 'float32', i18n: 'float32' },
  { value: 'string', i18n: 'string' },
  { value: 'label-encoder', i18n: 'label-encoder' },
  { value: 'drop', i18n: 'drop' },
]
// @formatter:on

/** Fila del formulario: la transformación elegida para una columna y su dtype original (se muestra al lado) */
type ColumnTransformRow_t = {
  column_name     : string
  column_type     : _Types.DataFrameColumnType_t
  column_transform: _Types.ColumnTransform_t
}

/** Estado inicial del formulario para un dataframe: el objetivo en la última columna y los textos con label encoder. */
function getDefaultColumns(dataframe_original: _Types.DataFrame_t) {
  const _columns = dataframe_original.columns

  const _dtypes = dataframe_original.dtypes as _Types.DataFrameColumnType_t[]

  const _listColumnNameType: _Types.DataFrameColumnNameAndType_t[] = _columns.map((_, index) => {
    return { column_name: _columns[index], column_type: _dtypes[index] }
  })

  const _listTransformations: ColumnTransformRow_t[] = _listColumnNameType.map(({ column_name, column_type }) => {
    const _column_transform = ((column_type === 'string') ? 'label-encoder' : column_type) as _Types.ColumnTransform_t
    return {
      column_name     : column_name,
      column_type     : column_type,
      column_transform: _column_transform
    }
  })
  return {
    listColumnNameType           : _listColumnNameType,
    listColumnNameTransformations: _listTransformations,
    columnNameTarget             : _columns[_columns.length - 1],
  }
}

export default function TabularClassificationDatasetProcessForm() {
    const { datasets, setDatasets } = useTabularClassificationContext()
  /**
   * @type {ReturnType<typeof useState<_Types.DataFrameColumnNameAndType_t[]>>}
   */
  const dataframeOriginal = datasets.datasets[datasets.index].dataframe_original
  const [listColumnNameType, setListColumnNameType] = useState(() => getDefaultColumns(dataframeOriginal).listColumnNameType)
  /**
   * @type {ReturnType<typeof useState<_Types.DataFrameColumnTransform_t[]>>}
   */
  const [listColumnNameTransformations, setListColumnNameTransformations] = useState(() => getDefaultColumns(dataframeOriginal).listColumnNameTransformations)
  const [columnNameTarget, setColumnNameTarget] = useState<string>(() => getDefaultColumns(dataframeOriginal).columnNameTarget)

  // Al cambiar de dataset se reinicia el formulario. Se ajusta durante el render, no en un efecto:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevDataframeOriginal, setPrevDataframeOriginal] = useState(dataframeOriginal)
  if (dataframeOriginal !== prevDataframeOriginal) {
    const defaultColumns = getDefaultColumns(dataframeOriginal)
    setPrevDataframeOriginal(dataframeOriginal)
    setListColumnNameType(defaultColumns.listColumnNameType)
    setListColumnNameTransformations(defaultColumns.listColumnNameTransformations)
    setColumnNameTarget(defaultColumns.columnNameTarget)
  }
  const [typeScaler, setTypeScaler] = useState('min-max-scaler')
  const [showDetails, setShowDetails] = useState({
    show_dataframe_original : false,
    show_dataframe_form     : true,
    show_dataframe_processed: false,
  })

  const { t } = useTranslation()
  const prefix = 'form-dataframe.'


  // Lo procesado: cada columna con la transformación que se le aplicó
  const datasetSelected = datasets.datasets[datasets.index]
  const processedSubtitles = useMemo(() => Object.fromEntries(
    (datasetSelected.dataset_transforms ?? []).map(({ column_name, column_transform }) => [column_name, column_transform]),
  ), [datasetSelected.dataset_transforms])

  const handleChange_ColumnTransform = (e: React.ChangeEvent<HTMLSelectElement>, columnName: string) => {
    setListColumnNameTransformations((prevState) =>
      prevState.map((oldColumn) =>
        (oldColumn.column_name === columnName) ? { ...oldColumn, column_transform: e.target.value as _Types.ColumnTransform_t } : oldColumn,
      ),
    )
  }

  const handleChange_ColumnNameTarget = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const previousTarget = columnNameTarget
    setColumnNameTarget(e.target.value)
    // El nuevo objetivo se codifica con label encoder; el anterior vuelve a la transformación de su tipo
    setListColumnNameTransformations((prevState) =>
      prevState.map((oldColumn) => {
        if (oldColumn.column_name === e.target.value) return { ...oldColumn, column_transform: 'label-encoder' }
        if (oldColumn.column_name === previousTarget) {
          return { ...oldColumn, column_transform: (oldColumn.column_type === 'string' ? 'label-encoder' : oldColumn.column_type) as _Types.ColumnTransform_t }
        }
        return oldColumn
      }),
    )
  }

  /**
   *
   * @param event
   * @return {Promise<void>}
   */
  const handleSubmit_ProcessDataset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const dataframe_original = datasets.datasets[datasets.index].dataframe_original
    let dataframe_processed = DataFrameUtils.DataFrameDeepCopy(dataframe_original)

    const transforms: _Types.DataFrameColumnTransform_t[] = listColumnNameTransformations.map(({ column_name, column_transform }) => ({ column_name, column_transform }))
    const encoders_map = DataFrameUtils.DataFrameEncoder(dataframe_original, transforms)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, transforms)
    const dataframe_X = dataframe_processed.drop({ columns: [columnNameTarget] })
    const dataframe_y = dataframe_original[columnNameTarget]

    const labelEncoder = new dfd.LabelEncoder()
    const dataset_labelEncoder = labelEncoder.fit(dataframe_y.values)
    const classes = DataFrameUtils.LabelEncoderClasses(dataset_labelEncoder)

    let attributes = listColumnNameTransformations.map(({ column_name, column_transform }) => {
      if (column_transform === 'label-encoder') {
        // Con label-encoder, DataFrameEncoder crea siempre un LabelEncoder
        const encoder = encoders_map[column_name].encoder as dfd.LabelEncoder
        const _options = Object.keys(encoder.classes).map((label) => ({ value: label, text: label }))
        return { type: column_transform, name: column_name, options: _options }
      } else {
        return { type: column_transform, name: column_name }
      }
    })

    attributes = attributes.filter(v => v.type !== 'drop')
    attributes = attributes.filter(v => v.name !== columnNameTarget)

    const scaler = (typeScaler === 'min-max-scaler') ? new dfd.MinMaxScaler() : new dfd.StandardScaler()
    scaler.fit(dataframe_X)
    const X = scaler.transform(dataframe_X)

    const oneHotEncoder = new dfd.OneHotEncoder()
    oneHotEncoder.fit(dataframe_y)
    const y = oneHotEncoder.transform(dataframe_y)

    const data_processed: _Types.DataProcessed_t = {
      dataframe_X       : dataframe_X,
      dataframe_y       : dataframe_y,
      column_name_target: columnNameTarget,
      encoders          : encoders_map,
      scaler            : scaler,
      classes           : classes,
      attributes        : attributes,
      X                 : X,
      y                 : y,
    }

    setDatasets((prevDatasets) => {
      return {
        ...prevDatasets,
        datasets: prevDatasets.datasets.map((_dataset, _index) => {
          if (prevDatasets.index === _index) {
            return {
              ..._dataset,
              is_dataset_processed: true,
              dataframe_processed : dataframe_processed,
              dataset_transforms  : transforms,
              data_processed      : data_processed,
            }
          }
          return _dataset
        })
      }
    })

    setShowDetails(() => {
      return {
        show_dataframe_original : false,
        show_dataframe_form     : false,
        show_dataframe_processed: true,
      }
    })

    await AlertHelper.alertSuccess(t('preprocessing.title'), {
      text: t('alert.success')
    })
  }

  if (VERBOSE) console.debug('render TabularClassificationDatasetForm')
  return <>
    <Form onSubmit={handleSubmit_ProcessDataset}>
      <Row>
        <Col>
          <details className='border p-2 rounded-2' open={showDetails.show_dataframe_original}>
            <summary className="n4l-summary"><Trans i18nKey="dataframe-original" /></summary>
            <main>
              <Row>
                <Col>
                  <N4LDataFrameTable dataframe={datasetSelected.dataframe_original} target={columnNameTarget} subtitles={'dtype'} />
                </Col>
              </Row>
            </main>
          </details>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col>
          <details className='border p-2 rounded-2' open={showDetails.show_dataframe_form}>
            <summary className="n4l-summary"><Trans i18nKey="dataframe-form" /></summary>
            <hr />
            <Row>
              <Col><h4><Trans i18nKey="preprocessing.transformations-set-X" /></h4></Col>
            </Row>
            <Row>
              <Col>
                <Form.Group controlId="FormControl_Scaler">
                  <Form.Label><b><Trans i18nKey={'Scaler'} /></b> {typeScaler}</Form.Label>
                  <Form.Select aria-label={'FormControl_Scaler'}
                    size="sm"
                    value={typeScaler}
                    onChange={(e) => setTypeScaler(e.target.value)}
                  >
                    <option value="min-max-scaler">MinMaxScaler</option>
                    <option value="standard-scaler">StandardScaler</option>
                  </Form.Select>
                  <Form.Text className="text-muted">Scaler</Form.Text>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="FormControl_ColumnNameTarget">
                  <Form.Label><b><Trans i18nKey={'Column target'} /></b> {columnNameTarget}</Form.Label>
                  <Form.Select aria-label={'FormControl_ColumnNameTarget'}
                    size="sm"
                    value={columnNameTarget}
                    onChange={handleChange_ColumnNameTarget}>
                    <>
                      {listColumnNameType.map(({ column_name }, index) => {
                        return <option value={column_name} key={index}>{column_name}</option>
                      })}
                    </>
                  </Form.Select>
                  <Form.Text className="text-muted">{columnNameTarget}</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <Row>
              <Col><h4><Trans i18nKey="preprocessing.transformations-columns" /></h4></Col>
            </Row>
            <Row className="g-2" xs={1} sm={2} md={2} lg={3} xl={4} xxl={4}>
              {listColumnNameTransformations
                .map(({ column_name, column_transform, column_type }, index) => {
                  return <Col key={index}>
                    <div className={'border border-1 rounded p-2 ' + (column_name === columnNameTarget ? 'border-info' : '')} >
                      <Form.Group controlId={'FormControl_' + column_name} className="mt-2">
                        <Form.Label><b>{column_name}</b></Form.Label>
                        <Form.Select aria-label="select transform"
                          size="sm"
                          disabled={column_name === columnNameTarget}
                          value={column_transform}
                          onChange={(e) => handleChange_ColumnTransform(e, column_name)}>
                          <>
                            {DEFAULT_OPTIONS.map((optionValue, optionIndex) => {
                              return <option key={column_name + '_option_' + optionIndex} value={optionValue.value}>
                                <Trans i18nKey={prefix + optionValue.i18n} />
                              </option>
                            })}
                          </>
                        </Form.Select>
                        <Form.Text className="text-muted">Dtype: [{column_type}] -&gt; {column_transform}</Form.Text>
                      </Form.Group>
                    </div>
                  </Col>
                })}
            </Row>

            <hr />
            <Row>
              <Col>
                <div className="d-grid gap-2">
                  <Button type="submit" className="mt-3">
                    <Trans i18nKey={prefix + 'submit'} />
                  </Button>
                </div>
              </Col>
            </Row>
          </details>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col>
          <details className='border p-2 rounded-2' open={showDetails.show_dataframe_processed}>
            <summary className="n4l-summary"><Trans i18nKey="dataframe-processed" /></summary>
            <main>
              <Row>
                <Col>
                  {datasetSelected.is_dataset_processed &&
                    <N4LDataFrameTable dataframe={datasetSelected.dataframe_processed}
                      target={datasetSelected.data_processed?.column_name_target ?? null}
                      subtitles={processedSubtitles} />}
                </Col>
              </Row>
            </main>
          </details>
        </Col>
      </Row>
    </Form>
  </>
}
