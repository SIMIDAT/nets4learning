import { useMemo, useState } from 'react'
import { Button, Form, Row, Col } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import * as dfd from 'danfojs'

import * as _Types from '@core/types'
import { DEFAULT_SCALER, DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import { useRegressionContext } from '@context/useRegressionContext'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'
import * as DataFrameUtils from '@core/dataframe/DataFrameUtils'
import { LIST_TRANSFORMATIONS } from './CONSTANTS'


/** Transformación por defecto de una columna: las de texto se codifican con label encoder y el resto se queda igual */
const defaultTransform = (column_type: _Types.DataFrameColumnType_t) => ((column_type === 'string') ? 'label-encoder' : column_type) as _Types.ColumnTransform_t

/** Estado inicial del formulario para un dataframe: todas las columnas activas y el objetivo en la última. */
function getDefaultColumns(dataframe_original: _Types.DataFrame_t) {
  /** 
   * @type {_Types.DataFrameColumnNameTypeEnable_t[]}
   */
  const _listColumnNameType: _Types.DataFrameColumnNameTypeEnable_t[] = dataframe_original.columns.map((_, index) => {
    return {
      column_enable   : true,
      column_name     : dataframe_original.columns[index],
      column_type     : dataframe_original.dtypes[index] as _Types.DataFrameColumnType_t,
      // FIX TypeScript
      column_transform: dataframe_original.dtypes[index],
    }
  })
  const _listTransformations: _Types.DataFrameColumnTransformEnable_t[] = _listColumnNameType.map(({ column_name, column_type, column_enable }) => {
    const _column_transform = defaultTransform(column_type)
    return {
      column_name     : column_name,
      column_type     : column_type,
      column_enable   : column_enable,
      column_transform: _column_transform,
    }
  })
  return {
    listColumnNameType           : _listColumnNameType,
    listColumnNameTransformations: _listTransformations,
    columnNameTarget             : dataframe_original.columns[dataframe_original.columns.length - 1],
  }
}

export default function RegressionDatasetProcessForm() {

  const prefix = 'form-dataframe.'

  const {
    datasets,
    setDatasets,
  } = useRegressionContext()

  /**
   * @type {ReturnType<typeof useState<Array<_Types.DataFrameColumnNameTypeEnable_t>>>}
   */
  const { dataframe_original: dataframeOriginal } = datasets.data[datasets.index as number]
  const [listColumnNameType, setListColumnNameTypes] = useState<_Types.DataFrameColumnNameTypeEnable_t[]>(() => getDefaultColumns(dataframeOriginal).listColumnNameType)
  /**
   * @type {ReturnType<typeof useState<_Types.DataFrameColumnTransformEnable_t[]>>}
   */
  const [listColumnNameTransformations, setListColumnNameTransformations] = useState<_Types.DataFrameColumnTransformEnable_t[]>(() => getDefaultColumns(dataframeOriginal).listColumnNameTransformations)
  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [columnNameTarget, setColumnNameTarget] = useState<string>(() => getDefaultColumns(dataframeOriginal).columnNameTarget)

  // Al cambiar de dataset se reinicia el formulario. Se ajusta durante el render, no en un efecto:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevDataframeOriginal, setPrevDataframeOriginal] = useState(dataframeOriginal)
  if (dataframeOriginal !== prevDataframeOriginal) {
    const defaultColumns = getDefaultColumns(dataframeOriginal)
    setPrevDataframeOriginal(dataframeOriginal)
    setListColumnNameTypes(defaultColumns.listColumnNameType)
    setListColumnNameTransformations(defaultColumns.listColumnNameTransformations)
    setColumnNameTarget(defaultColumns.columnNameTarget)
  }

  /**
   * @type {ReturnType<typeof useState<_Types.ScalerKey_t>>}
   */
  const [typeScaler, setTypeScaler] = useState<_Types.ScalerKey_t>(DEFAULT_SCALER)


  const [showDetails, setShowDetails] = useState({
    show_dataframe_original : false,
    show_dataframe_form     : true,
    show_dataframe_processed: false,
  })

  const handleSubmit_ProcessDataset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (datasets.index === DEFAULT_SELECTOR_DATASET_INDEX) {
      console.error('DEFAULT_SELECTOR_DATASET_INDEX')
      return
    }
    const _index: number = datasets.index as number

    const { dataframe_original } = datasets.data[_index]
    let { dataframe_processed } = datasets.data[_index]

    // Lo elegido en el formulario (antes se ignoraba y solo se codificaban las columnas de texto): las columnas
    // desactivadas se descartan; las de texto que se usan, se codifican con label encoder porque el modelo solo recibe
    // números; el objetivo nunca se descarta
    const transformOf = ({ column_name, column_type, column_enable, column_transform }: _Types.DataFrameColumnTransformEnable_t): _Types.ColumnTransform_t => {
      const isTarget = column_name === columnNameTarget
      if (!isTarget && (!column_enable || column_transform === 'drop')) return 'drop'
      if (column_type === 'string') return 'label-encoder'
      return column_transform === 'drop' ? defaultTransform(column_type) : column_transform
    }
    const new_dataset_transforms: _Types.DataFrameColumnTransform_t[] = listColumnNameTransformations.map((column) => ({
      column_name     : column.column_name,
      column_transform: transformOf(column),
    }))
    const keptColumns = new Set(new_dataset_transforms.filter(({ column_transform }) => column_transform !== 'drop').map(({ column_name }) => column_name))

    /**
     * @type {_Types.DatasetColumn_t[]}
     */
    const new_dataset: _Types.DatasetColumn_t[] = dataframe_original.columns
      .map((column_name, index) => ({
        column_name,
        column_type          : DataFrameUtils.DataFrameColumnType_To_DatasetColumnType(dataframe_original.dtypes[index]),
        column_role          : column_name === columnNameTarget ? 'Target' : 'Feature',
        column_missing_values: false,
      } as _Types.DatasetColumn_t))
      .filter(({ column_name }) => keptColumns.has(column_name))

    const dataframe_encoder = DataFrameUtils.DataFrameTransformAndEncoder(dataframe_processed, new_dataset_transforms)
    const new_encoders_map = dataframe_encoder.encoder_map
    dataframe_processed = dataframe_encoder.dataframe_processed

    const new_column_name_target = columnNameTarget
    const new_dataframe_X = dataframe_processed.drop({ columns: [new_column_name_target] }).copy()
    const new_dataframe_y = dataframe_original[new_column_name_target]

    const scalers = {
      'standard-scaler': () => new dfd.StandardScaler(),
      'min-max-scaler' : () => new dfd.MinMaxScaler()
    }
    const scaler = scalers[typeScaler]()
    const new_scaler = scaler.fit(new_dataframe_X)
    const new_X = new_scaler.transform(new_dataframe_X)
    const new_y = new_dataframe_y

    setDatasets((prevState) => {
      if (prevState.index === DEFAULT_SELECTOR_DATASET_INDEX) {
        console.error('DEFAULT_SELECTOR_DATASET_INDEX')
        return prevState
      }
      const _index: number = prevState.index as number

      const new_path = prevState.data[_index].path
      const new_csv = prevState.data[_index].csv
      const new_info = prevState.data[_index].info
      const new_container_info = prevState.data[_index].container_info

      /**
       * @type {_Types.DatasetProcessed_t}
       */
      const newDatasetProcessed = {
        is_dataset_upload   : true,
        is_dataset_processed: true,
        dataframe_original  : dataframe_original,
        dataframe_processed : dataframe_processed,
        dataset             : new_dataset,
        dataset_transforms  : new_dataset_transforms,
        path                : new_path,
        csv                 : new_csv,
        info                : new_info,
        container_info      : new_container_info,
        data_processed      : {
          dataframe_X       : new_dataframe_X,
          dataframe_y       : new_dataframe_y,
          X                 : new_X,
          y                 : new_y,
          encoders          : new_encoders_map,
          scaler            : new_scaler,
          column_name_target: new_column_name_target,
        }
      }

      return {
        ...prevState,
        data: [
          ...prevState.data,
          newDatasetProcessed
        ],
        index: prevState.data.length
      }
    })

    setShowDetails({
      show_dataframe_original : false,
      show_dataframe_form     : false,
      show_dataframe_processed: true,
    })
  }



  // Lo procesado: cada columna con la transformación que se le aplicó
  const datasetSelected = datasets.index === DEFAULT_SELECTOR_DATASET_INDEX ? undefined : datasets.data[datasets.index as number]
  const processedSubtitles = useMemo(() => Object.fromEntries(
    (datasetSelected?.dataset_transforms ?? []).map(({ column_name, column_transform }) => [column_name, column_transform]),
  ), [datasetSelected?.dataset_transforms])

  const handleChange_Scaler = (e: React.ChangeEvent<HTMLSelectElement>) => {
    /**
     * @type {_Types.ScalerKey_t}
     */
    const newTypeScaler: _Types.ScalerKey_t = e.target.value as _Types.ScalerKey_t
    setTypeScaler(newTypeScaler)
  }

  const handleChange_ColumnTransformEnable = (e: React.ChangeEvent<HTMLInputElement>, column_name: string) => {
    setListColumnNameTransformations((prevState) => {
      return prevState.map((oldColumn) => {
        if (oldColumn.column_name === column_name) {
          // Al volver a activarla recupera la transformación de su tipo (antes se quedaba en "drop")
          return {
            ...oldColumn,
            column_enable   : e.target.checked,
            column_transform: e.target.checked ? defaultTransform(oldColumn.column_type) : 'drop'
          }
        }
        return { ...oldColumn }
      })
    })
  }

  const handleChange_ColumnTransform = (e: React.ChangeEvent<HTMLSelectElement>, column_name: string) => {
    setListColumnNameTransformations((prevState) => {
      return prevState.map((oldColumn) => {
        const newColumn = {
          ...oldColumn,
          column_transform: e.target.value as _Types.ColumnTransform_t
        }
        return (oldColumn.column_name === column_name) ? newColumn : oldColumn
      })
    }
    )
  }

  const handleChange_ColumnNameTarget = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const target = e.target.value
    setColumnNameTarget(target)
    // Antes pasaba todas las columnas a label encoder. El objetivo de una regresión es un número y se queda como
    // está; si estaba desactivado, vuelve a usarse
    setListColumnNameTransformations((prevState) => prevState.map((oldColumn) => (
      oldColumn.column_name === target && !oldColumn.column_enable
        ? { ...oldColumn, column_enable: true, column_transform: defaultTransform(oldColumn.column_type) }
        : oldColumn
    )))
  }

  if (VERBOSE) console.debug('render RegressionDatasetProcessForm')
  return <>
    <Row>
      <Col>
        <details className='border p-2 rounded-2' open={showDetails.show_dataframe_original}>
          <summary className="n4l-summary">
            <Trans i18nKey="dataframe-original" />
          </summary>
          <main>
            <Row>
              <Col>
                <N4LDataFrameTable dataframe={dataframeOriginal} target={columnNameTarget} subtitles={'dtype'} />
              </Col>
            </Row>
          </main>
        </details>
      </Col>
    </Row>
    <hr />
    <Row>
      <Col>
        <Form onSubmit={handleSubmit_ProcessDataset}>
          <details className='border p-2 rounded-2' open={showDetails.show_dataframe_form}>
            <summary className="n4l-summary">
              <Trans i18nKey="dataframe-form" />
            </summary>
            <hr />
            <Row>
              <Col><h4><Trans i18nKey="preprocessing.transformations-set-X" /></h4></Col>
            </Row>
            <Row>
              <Col>
                <Form.Group controlId="FormControl_Scaler">
                  <Form.Label><b><Trans i18nKey={'Scaler'} /></b> {typeScaler}</Form.Label>
                  <Form.Select
                    aria-label={'Type Scaler'}
                    size="sm"
                    value={typeScaler}
                    onChange={handleChange_Scaler}>
                    <>
                      <option value={'min-max-scaler'}>MinMaxScaler</option>
                      <option value={'standard-scaler'}>StandardScaler</option>
                    </>
                  </Form.Select>
                  <Form.Text className="text-muted"><Trans i18nKey={'Scaler'} /></Form.Text>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="FormControl_ColumnNameTarget">
                  <Form.Label><b><Trans i18nKey={'Column target'} /></b> {columnNameTarget}</Form.Label>
                  <Form.Select
                    aria-label={'Column target'}
                    size={'sm'}
                    value={columnNameTarget}
                    onChange={handleChange_ColumnNameTarget}>
                    <>
                      {listColumnNameType.map(({ column_name, column_enable }, index) => {
                        return <option
                          value={column_name}
                          disabled={!column_enable}
                          key={index}>
                          {column_name}
                        </option>
                      })}
                    </>
                  </Form.Select>
                  <Form.Text className="text-muted"><Trans i18nKey={'Column target'} /></Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <hr />
            <Row>
              <Col><h4><Trans i18nKey="preprocessing.transformations-columns" /></h4></Col>
            </Row>
            <Row xs={1} sm={2} md={3} lg={3} xl={4} xxl={4} className='g-2'>
              {listColumnNameTransformations.map(({ column_enable, column_name, column_type, column_transform, }, index) => {
                return <Col key={'listColumnNameTransformations_' + index} >
                  <div className={'border border-1 rounded p-2 ' + (column_name === columnNameTarget ? 'border-info' : '')} >
                    <Form.Check
                      type="switch"
                      id={'column-switch-' + column_name}
                      reverse={false}
                      name={'column-switch-' + column_name}
                      label={column_enable ? 'Enable' : 'Disabled'}
                      checked={column_enable}
                      disabled={column_name === columnNameTarget}
                      onChange={(e) => handleChange_ColumnTransformEnable(e, column_name)}
                    />
                    <Form.Group controlId={'FormControl_' + column_name} className="mt-2">
                      <Form.Label><b>{column_name}</b></Form.Label>
                      <Form.Select
                        aria-label={'Select Transform'}
                        size={'sm'}
                        disabled={column_enable === false}
                        value={column_transform}
                        onChange={(e) => handleChange_ColumnTransform(e, column_name)}>
                        <>
                          {LIST_TRANSFORMATIONS.map((optionValue, optionIndex) => {
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
        </Form>
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
                {datasetSelected?.is_dataset_processed &&
                  <N4LDataFrameTable dataframe={datasetSelected.dataframe_processed}
                    target={datasetSelected.data_processed?.column_name_target ?? null}
                    subtitles={processedSubtitles} />}
              </Col>
            </Row>
          </main>
        </details>
      </Col>
    </Row>
  </>
}