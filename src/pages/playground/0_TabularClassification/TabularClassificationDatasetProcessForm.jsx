// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import AlertHelper from '@utils/alertHelper'
import { VERBOSE } from '@/CONSTANTS'
import { TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_1, TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2 } from '@/CONSTANTS_DanfoJS'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import * as _Types from '@core/types'

// @formatter:off
const DEFAULT_OPTIONS = [
  { value: 'int32', i18n: 'int32' },
  { value: 'float32', i18n: 'float32' },
  { value: 'string', i18n: 'string' },
  { value: 'label-encoder', i18n: 'label-encoder' },
  { value: 'drop', i18n: 'drop' },
]
// @formatter:on

/**
 * @typedef TabularClassificationDatasetProcessFormProps_t
 * @property {_Types.DatasetProcessed_t[]} datasets
 * @property {React.Dispatch<React.SetStateAction<_Types.DatasetProcessed_t[]>>} setDatasets
 * @property {number} datasetIndex
 */
/**
 * 
 * @param {TabularClassificationDatasetProcessFormProps_t} props 
 * @returns 
 */
export default function TabularClassificationDatasetProcessForm(props) {
  const {
    datasets,
    setDatasets,
    datasetIndex,
  } = props
  /**
   * @type {ReturnType<typeof useState<_Types.DataFrameColumnNameAndType_t[]>>}
   */
  const [listColumnNameType, setListColumnNameType] = useState([])
  /**
   * @type {ReturnType<typeof useState<_Types.DataFrameColumnTransform_t[]>>}
   */
  const [listColumnNameTransformations, setListColumnNameTransformations] = useState([])
  const [columnNameTarget, setColumnNameTarget] = useState('')
  const [typeScaler, setTypeScaler] = useState('min-max-scaler')
  const [showDetails, setShowDetails] = useState({
    show_dataframe_original : false,
    show_dataframe_form     : true,
    show_dataframe_processed: false,
  })

  const { t } = useTranslation()
  const prefix = 'form-dataframe.'

  useEffect(() => {
    const _columns = datasets[datasetIndex].dataframe_original.columns

    const _dtypes = /** @type {_Types.DataFrameColumnType_t[]} */ (datasets[datasetIndex].dataframe_original.dtypes)

    /**
     * @type {_Types.DataFrameColumnNameAndType_t[]}
     */
    const _listColumnNameType = _columns.map((_, index) => {
      return { column_name: _columns[index], column_type: _dtypes[index] }
    })

    const _listTransformations = _listColumnNameType.map(({ column_name, column_type }) => {
      const _column_transform = (column_type === 'string') ? 'label-encoder' : column_type
      return { 
        column_name     : column_name, 
        column_type     : column_type, 
        column_transform: _column_transform
      }
    })
    setColumnNameTarget(_columns[_columns.length - 1])
    setListColumnNameType(_listColumnNameType)
    setListColumnNameTransformations(_listTransformations)
  }, [datasets, datasetIndex])

  useEffect(() => {
    datasets[datasetIndex]
      .dataframe_original
      .plot('plot_original')
      .table({
        config: TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_1,
        layout: {
          title: t('dataframe-original'),
        },
      })
  }, [datasets, datasetIndex, t])

  const handleChange_ColumnTransform = (e, columnName) => {
    setListColumnNameTransformations((prevState) =>
      prevState.map((oldColumn) =>
        (oldColumn.column_name === columnName) ? { ...oldColumn, column_transform: e.target.value } : oldColumn,
      ),
    )
  }

  const handleChange_ColumnNameTarget = (e) => {
    setColumnNameTarget(e.target.value)
    setListColumnNameTransformations((prevState) =>
      prevState.map((oldColumn) =>
        (oldColumn.column_name === e.target.value) ? { ...oldColumn, column_transform: 'label-encoder' } : oldColumn,
      ),
    )
  }

  /**
   *
   * @param event
   * @return {Promise<void>}
   */
  const handleSubmit_ProcessDataset = async (event) => {
    event.preventDefault()
    const dataframe_original = datasets[datasetIndex].dataframe_original
    let dataframe_processed = DataFrameUtils.DataFrameDeepCopy(dataframe_original)

    const encoders_map = DataFrameUtils.DataFrameEncoder(dataframe_original, listColumnNameTransformations)
    dataframe_processed = DataFrameUtils.DataFrameTransform(dataframe_processed, listColumnNameTransformations)
    const dataframe_X = dataframe_processed.drop({ columns: [columnNameTarget] })
    const dataframe_y = dataframe_original[columnNameTarget]

    const labelEncoder = new dfd.LabelEncoder()
    const dataset_labelEncoder = labelEncoder.fit(dataframe_y.values)
    // @ts-ignore
    const classes = Object.keys(dataset_labelEncoder.$labels)

    let attributes = listColumnNameTransformations.map(({ column_name, column_transform }) => {
      if (column_transform === 'label-encoder') {
        // @ts-ignore
        const _options = Object.keys(encoders_map[column_name].encoder.$labels).map((label) => ({ value: label, text: label }))
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

    const data_processed = {
      column_name_target: columnNameTarget,
      encoders          : encoders_map,
      scaler            : scaler,
      classes           : classes,
      attributes        : attributes,
      X                 : X,
      y                 : y,
    }

    dataframe_processed
      .plot('plot_processed')
      .table({
        config: TABLE_PLOT_STYLE_CONFIG__STYLE_N4L_2,
        layout: {
          title: t('dataframe-processed'),
        },
      })

    // @ts-ignore
    setDatasets((prevDatasets) => {
      return prevDatasets.map((_dataset, _datasetIndex) => {
        if (datasetIndex === _datasetIndex) {
          return {
            ..._dataset,
            is_dataset_processed: true,
            dataframe_processed : dataframe_processed,
            dataset_transforms  : [...listColumnNameTransformations],
            data_processed      : data_processed,
          }
        }
        return _dataset
      })
    })

    setShowDetails(() => {
      return {
        show_dataframe_original : false,
        show_dataframe_form     : false,
        show_dataframe_processed: true,
      }
    })

    await AlertHelper.alertSuccess(t('preprocessing.title'), { text: t('alert.success') })
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
                  <div id="plot_original" />
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
                  <div id="plot_processed" />
                </Col>
              </Row>
            </main>
          </details>
        </Col>
      </Row>
    </Form>
  </>
}
