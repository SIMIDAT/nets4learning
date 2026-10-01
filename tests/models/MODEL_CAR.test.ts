import { describe, test, expect, vi, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as tfjs from '@tensorflow/tfjs'
import type { TFunction } from 'i18next'

import MODEL_CAR from '../../src/pages/playground/0_TabularClassification/models/MODEL_CAR'
import MODEL_IRIS from '../../src/pages/playground/0_TabularClassification/models/MODEL_IRIS'
import { DataFrameApplyEncoders } from '../../src/core/dataframe/DataFrameUtils'
import type { DatasetProcessed_t } from '../../src/core/types'

// Las URLs de la app (VITE_PATH + /models/...) se sirven desde public/
const toPublicPath = (url: string) => 'public' + url.replace(import.meta.env.VITE_PATH, '')

// En jsdom danfo descarga los CSV por XHR: se leen del disco
vi.mock('danfojs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('danfojs')>()
  return {
    ...actual,
    readCSV: (source: string | File, options?: object) => actual.readCSV(
      typeof source === 'string' ? new File([fs.readFileSync(toPublicPath(source))], 'data.csv', { type: 'text/csv' }) : source,
      options,
    ),
  }
})

const toResponse = (url: string) => {
  const body = fs.readFileSync(toPublicPath(url.split('?')[0]))
  return new Response(body, { headers: { 'content-type': url.endsWith('.json') ? 'application/json' : 'application/octet-stream' } })
}

const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>

describe('MODEL_CAR — cada salida del modelo con el nombre de su clase', () => {
  const iModelInstance = new MODEL_CAR(t, () => {})
  let model: tfjs.LayersModel
  let dataset: DatasetProcessed_t
  let rows: Array<{ target: string, output: number }>

  // Misma preparación que ModelReviewTabularClassification: encoders del dataset, sin escalar
  const predictOutput = (values: Record<string, string | number>) => {
    const vector = DataFrameApplyEncoders(dataset.data_processed!.encoders, values, iModelInstance.DATA_DEFAULT_KEYS)
      .map((item) => parseFloat(item.toString()))
    const output = (model.predict(tfjs.tensor2d(vector, [1, vector.length])) as tfjs.Tensor).dataSync()
    return output.indexOf(Math.max(...output))
  }

  beforeAll(async () => {
    vi.stubGlobal('fetch', async (input: string | URL | Request) => toResponse(input.toString()))
    await tfjs.setBackend('cpu')
    model = (await iModelInstance.LOAD_LAYERS_MODEL({ onProgress: () => {} }))!
    dataset = (await iModelInstance.DATASETS())[0]
    const { dataframe_original, data_processed } = dataset
    const columns = dataframe_original.columns
    rows = (dataframe_original.values as Array<Array<string | number>>).map((row) => {
      const values = Object.fromEntries(columns.map((column, index) => [column, row[index]]))
      return { target: String(values[data_processed!.column_name_target]), output: predictOutput(values) }
    })
  }, 30_000)

  test('la salida que el modelo da a cada clase del CSV es la que CLASS_INDEX le asigna', () => {
    // Antes «good» y «vgood» estaban cambiados: la página llamaba «good» a lo que el modelo predice como vgood
    for (const target of ['unacc', 'acc', 'vgood']) {
      const outputs = rows.filter((row) => row.target === target).map((row) => row.output)
      const counts = [0, 1, 2].map((output) => outputs.filter((value) => value === output).length)
      expect(counts.indexOf(Math.max(...counts))).toBe(iModelInstance.CLASS_INDEX(target))
    }
  })

  test('el modelo solo tiene tres salidas: «good» no tiene ninguna', () => {
    expect(model.outputs[0].shape).toEqual([null, 3])
    expect(iModelInstance.CLASS_INDEX('good')).toBe(3)
    expect(rows.some((row) => row.output === 3)).toBe(false)
  })

  test('acierta en casi todo el dataset contando la clase real con CLASS_INDEX', () => {
    const hits = rows.filter((row) => row.output === iModelInstance.CLASS_INDEX(row.target)).length
    expect(hits / rows.length).toBeGreaterThan(0.9)
  })

  test('cada ejemplo del selector se clasifica con la clase que anuncia', () => {
    const announced = iModelInstance.LIST_EXAMPLES_RESULTS.map((result) => iModelInstance.CLASS_INDEX(result))
    expect(iModelInstance.LIST_EXAMPLES.map(predictOutput)).toStrictEqual(announced)
  })
})

describe('CLASS_INDEX', () => {

  test('reconoce el nombre de la clase con o sin prefijo', () => {
    const iris = new MODEL_IRIS(t, () => {})
    expect(iris.CLASS_INDEX('Iris-virginica')).toBe(2)
    expect(iris.CLASS_INDEX('0 Iris-setosa')).toBe(0)
    expect(iris.CLASS_INDEX('Setosa')).toBe(0)
    expect(iris.CLASS_INDEX('rosa')).toBe(-1)
  })

  test('el nombre exacto gana a uno que termina igual', () => {
    const car = new MODEL_CAR(t, () => {})
    expect(car.CLASS_INDEX('acc')).toBe(1)
    expect(car.CLASS_INDEX('unacc')).toBe(0)
  })
})
