import { describe, test, expect, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import * as dfd from 'danfojs'
import type { TFunction } from 'i18next'

import type * as _Types from '@core/types'
import { DataFrameTransformAndEncoder } from '@core/dataframe/DataFrameUtils'
import { F_FILTER_Categorical, F_MAP_LabelEncoder } from '@core/nn-utils/utils'
import MODEL_CAR from '@pages/playground/0_TabularClassification/models/MODEL_CAR'
import MODEL_IRIS from '@pages/playground/0_TabularClassification/models/MODEL_IRIS'
import type { TabularInstance_t } from '@pages/playground/0_TabularClassification/models/_model'
import ModelReviewTabularClassificationPredictForm from '@pages/playground/0_TabularClassification/ModelReviewTabularClassificationPredictForm'
import ModelReviewRegressionPredictForm from '@pages/playground/1_Regression/ModelReviewRegressionPredictForm'
import RegressionPredictionInfo from '@pages/playground/1_Regression/RegressionPredictionInfo'
import { TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION } from '@pages/playground/1_Regression/utils'

const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>

describe('ModelReviewTabularClassificationPredictForm', () => {

  function TabularForm({ iModelInstance, onChange }: { iModelInstance: MODEL_CAR | MODEL_IRIS, onChange: (data: TabularInstance_t) => void }) {
    const [data, setData] = useState<TabularInstance_t>(iModelInstance.DATA_DEFAULT)
    return <ModelReviewTabularClassificationPredictForm iModelInstance={iModelInstance}
      dataToTest={data}
      setDataToTest={(action) => setData((prev) => {
        const next = typeof action === 'function' ? action(prev) : action
        onChange(next)
        return next
      })} />
  }

  test('cada campo con el nombre traducido del atributo, el del CSV y su tipo', () => {
    render(<TabularForm iModelInstance={new MODEL_CAR(t, () => {})} onChange={() => {}} />)
    // Etiqueta con la clave de TABLE_HEADER (el mock de i18n devuelve la clave) asociada a su desplegable
    const buying = screen.getByLabelText('00-tc.car.buying')
    expect(buying.tagName).toBe('SELECT')
    expect(buying).toHaveValue('vhigh')
    expect(buying.parentElement).toHaveTextContent('Buying · pages.playground.form.type-categorical')
  })

  test('los números se guardan como número y un campo vacío no muestra NaN', () => {
    const onChange = vi.fn()
    render(<TabularForm iModelInstance={new MODEL_IRIS(t, () => {})} onChange={onChange} />)
    const sepal = screen.getByLabelText('00-tc.iris.sepal_length')
    expect(sepal.parentElement).toHaveTextContent('pages.playground.form.type-decimal')
    fireEvent.change(sepal, { target: { value: '6.3' } })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ sepal_length: 6.3 }))
    fireEvent.change(sepal, { target: { value: '' } })
    expect(sepal).toHaveValue(null)
  })
})

describe('ModelReviewRegressionPredictForm', () => {

  // Un conjunto de datos mínimo con un atributo entero, uno decimal, uno categórico, una columna que el modelo no usa
  // y la variable objetivo
  /** dropId: la columna "id" se descarta al procesar (el procesado tiene menos columnas que el original) */
  function makeDataset({ dropId = false } = {}): _Types.DatasetProcessed_t {
    const dataframe_original = new dfd.DataFrame({
      rooms: [2, 3, 5],
      area : [55.5, 80.25, 120],
      city : ['Jaén', 'Granada', 'Jaén'],
      id   : [101, 102, 103],
      price: [100, 150, 300],
    })
    const dataset: _Types.Dataset_t = [
      { column_name: 'rooms', column_role: 'Feature', column_type: 'Integer', column_missing_values: false },
      { column_name: 'area', column_role: 'Feature', column_type: 'Continuous', column_missing_values: false },
      { column_name: 'city', column_role: 'Feature', column_type: 'Categorical', column_missing_values: false },
      { column_name: 'price', column_role: 'Target', column_type: 'Continuous', column_missing_values: false },
    ]
    const dataset_transforms = dataset.filter(F_FILTER_Categorical).map(F_MAP_LabelEncoder)
    // Como en los modelos, el dataframe procesado tiene las mismas columnas que el original
    const transforms: _Types.DataFrameColumnTransform_t[] = dropId ? [...dataset_transforms, { column_name: 'id', column_transform: 'drop' }] : dataset_transforms
    const { dataframe_processed, encoder_map } = DataFrameTransformAndEncoder(dataframe_original, transforms)
    const dataframe_X = dataframe_processed.drop({ columns: dropId ? ['price'] : ['id', 'price'] })
    const scaler = new dfd.MinMaxScaler().fit(dataframe_X)
    return {
      is_dataset_upload   : false,
      is_dataset_processed: true,
      path                : '',
      csv                 : 'test.csv',
      info                : '',
      container_info      : '',
      dataset,
      dataset_transforms,
      dataframe_original,
      dataframe_processed,
      data_processed      : {
        dataframe_X,
        dataframe_y       : dataframe_original['price'],
        X                 : scaler.transform(dataframe_X),
        y                 : dataframe_original['price'],
        scaler,
        encoders          : encoder_map,
        column_name_target: 'price',
      },
    }
  }

  function RegressionForm({ dataset, onChange }: { dataset: _Types.DatasetProcessed_t, onChange: (prediction: _Types.StatePrediction_t) => void }) {
    const [prediction, setPrediction] = useState<_Types.StatePrediction_t>(TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset, 0))
    return <ModelReviewRegressionPredictForm customModel={{ model: {} as never }}
      dataset={dataset}
      prediction={prediction}
      setPrediction={(action) => setPrediction((prev) => {
        const next = typeof action === 'function' ? action(prev) : action
        onChange(next)
        return next
      })} />
  }

  test('solo los atributos del modelo, con su tipo y el rango que toman en los datos', () => {
    render(<RegressionForm dataset={makeDataset()} onChange={() => {}} />)
    expect(screen.getAllByRole('spinbutton').length + screen.getAllByRole('combobox').length).toBe(3)
    // La variable objetivo es lo que se predice y "id" no lo usa el modelo
    expect(screen.queryByLabelText('price')).toBeNull()
    expect(screen.queryByLabelText('id')).toBeNull()
    expect(screen.getByLabelText('rooms').parentElement).toHaveTextContent('pages.playground.form.type-integer · pages.playground.form.range')
    expect(screen.getByLabelText('area')).toHaveValue(55.5)
    expect(screen.getByLabelText('city').parentElement).toHaveTextContent('pages.playground.form.type-categorical')
  })

  test('con columnas descartadas al procesar, la instancia se prepara igual y el formulario no las pide', () => {
    // Antes el dataframe procesado se creaba con los tipos del original y fallaba si tenían distinto número de columnas
    const dataset = makeDataset({ dropId: true })
    const state = TRANSFORM_DATASET_PROCESSED_TO_STATE_PREDICTION(dataset, 2)
    expect(state.input_1_dataframe_processed.columns).not.toContain('id')
    expect(state.input_1_dataframe_original['id'].values[0]).toBe(103)
    render(<RegressionForm dataset={dataset} onChange={() => {}} />)
    expect(screen.queryByLabelText('id')).toBeNull()
    expect(screen.getByLabelText('rooms')).toHaveValue(2)
  })

  test('al cambiar un valor se codifica y se escala la entrada del modelo', () => {
    const onChange = vi.fn()
    render(<RegressionForm dataset={makeDataset()} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('rooms'), { target: { value: '5' } })
    const afterRooms: _Types.StatePrediction_t = onChange.mock.lastCall![0]
    expect(afterRooms.input_1_dataframe_original['rooms'].values[0]).toBe(5)
    // rooms va de 2 a 5: 5 escalado es 1
    expect((afterRooms.input_3_dataframe_scaling.values[0] as number[])[0]).toBeCloseTo(1)
    fireEvent.change(screen.getByLabelText('city'), { target: { value: 'Granada' } })
    const afterCity: _Types.StatePrediction_t = onChange.mock.lastCall![0]
    expect(afterCity.input_1_dataframe_original['city'].values[0]).toBe('Granada')
    expect(typeof afterCity.input_2_dataframe_encoding['city'].values[0]).toBe('number')
  })
})

describe('RegressionPredictionInfo', () => {

  const prediction = (result: number[]): _Types.StatePrediction_t => ({
    input_0_raw                : [4, 113, 24],
    input_1_dataframe_original : new dfd.DataFrame([[4, 113, 24]], { columns: ['cylinders', 'displacement', 'mpg'] }),
    input_1_dataframe_processed: new dfd.DataFrame([[4, 113, 24]], { columns: ['cylinders', 'displacement', 'mpg'] }),
    input_2_dataframe_encoding : new dfd.DataFrame([[4, 113]], { columns: ['cylinders', 'displacement'] }),
    input_3_dataframe_scaling  : new dfd.DataFrame([[0.2, 0.116]], { columns: ['cylinders', 'displacement'] }),
    result,
  })

  test('sin predicción, la espera', () => {
    render(<RegressionPredictionInfo prediction={prediction([])} />)
    expect(screen.getByText('pages.playground.generator.waiting-for-prediction')).toBeInTheDocument()
  })

  test('el valor predicho de la variable objetivo y, con el valor real, el error', () => {
    const { rerender } = render(<RegressionPredictionInfo prediction={prediction([24.1937])} targetName={'mpg'} actual={24} />)
    expect(screen.getByTestId('Test-RegressionPrediction-value').textContent).toMatch(/^24[.,]194$/)
    expect(screen.getByText('pages.playground.1-regression.predict.predicted-value')).toBeInTheDocument()
    expect(screen.getByTestId('Test-RegressionPrediction-actual')).toBeInTheDocument()
    expect(screen.getByTestId('Test-RegressionPrediction-error')).toBeInTheDocument()
    rerender(<RegressionPredictionInfo prediction={prediction([24.1937])} targetName={'mpg'} />)
    expect(screen.queryByTestId('Test-RegressionPrediction-actual')).toBeNull()
    expect(screen.queryByTestId('Test-RegressionPrediction-error')).toBeNull()
  })
})
