import { describe, test, expect, vi, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as tfjs from '@tensorflow/tfjs'

import { DataFrameApplyEncoders } from '../../src/core/dataframe/DataFrameUtils'
import type { DatasetProcessed_t } from '../../src/core/types'
import type MODEL_N4L from '../../src/pages/playground/0_TabularClassification/models/MODEL_N4L'
import { n4lTabularModel, stubPublicFetch, toPublicPath } from '../helpers/n4l'

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

/** El modelo del paquete, su conjunto preparado y cómo predice la página del modelo (encoders del dataset, sin escalar) */
async function setup(key: string) {
  const iModelInstance = n4lTabularModel(key)
  const model = (await iModelInstance.LOAD_LAYERS_MODEL({ onProgress: () => {} }))!
  const dataset = (await iModelInstance.DATASETS())[0]
  const predictOutput = (values: Record<string, string | number>) => {
    const vector = DataFrameApplyEncoders(dataset.data_processed!.encoders, values, iModelInstance.DATA_DEFAULT_KEYS)
      .map((item) => parseFloat(item.toString()))
    const output = (model.predict(tfjs.tensor2d(vector, [1, vector.length])) as tfjs.Tensor).dataSync()
    return output.indexOf(Math.max(...output))
  }
  const { dataframe_original, data_processed } = dataset
  const rows = (dataframe_original.values as Array<Array<string | number>>).map((row) => {
    const values = Object.fromEntries(dataframe_original.columns.map((column, index) => [column, row[index]]))
    return { target: String(values[data_processed!.column_name_target]), output: predictOutput(values) }
  })
  return { iModelInstance, model, dataset, predictOutput, rows }
}

beforeAll(async () => {
  stubPublicFetch()
  await tfjs.setBackend('cpu')
})

describe.each(['IRIS', 'CAR', 'LYMPHOGRAPHY'])('paquete .n4l de clasificación tabular %s', (key) => {
  let context: Awaited<ReturnType<typeof setup>>
  beforeAll(async () => { context = await setup(key) }, 30_000)

  test('acierta en casi todo su conjunto, contando la clase real con CLASS_INDEX', () => {
    const { rows, iModelInstance } = context
    const hits = rows.filter((row) => row.output === iModelInstance.CLASS_INDEX(row.target)).length
    expect(hits / rows.length).toBeGreaterThan(0.9)
  })

  test('cada ejemplo del selector se clasifica con la clase que anuncia', () => {
    const { iModelInstance, predictOutput } = context
    const announced = iModelInstance.LIST_EXAMPLES_RESULTS.map((result) => iModelInstance.CLASS_INDEX(result))
    expect(announced.every((index) => index >= 0)).toBe(true)
    expect(iModelInstance.LIST_EXAMPLES.map(predictOutput)).toStrictEqual(announced)
  })

  test('la entrada son las columnas de entrada escaladas entre 0 y 1, y las clases siguen el one-hot de y', () => {
    const { dataset, iModelInstance } = context as { dataset: DatasetProcessed_t, iModelInstance: MODEL_N4L }
    const { X, y, dataframe_y, classes } = dataset.data_processed!
    expect(X.columns).toStrictEqual(iModelInstance.DATA_DEFAULT_KEYS)
    const values = (X.values as number[][]).flat()
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThanOrEqual(1)
    const decoded = (y.values as number[][]).map((row) => classes![row.indexOf(1)])
    expect(decoded).toStrictEqual((dataframe_y.values as Array<string | number>).map(String))
  })

  test('el formulario, los valores iniciales y la red por defecto salen del manifiesto', () => {
    const { iModelInstance, model } = context
    expect(iModelInstance.FORM.map(({ name }) => name)).toStrictEqual(iModelInstance.DATA_DEFAULT_KEYS)
    expect(Object.keys(iModelInstance.DATA_DEFAULT)).toStrictEqual(iModelInstance.DATA_DEFAULT_KEYS)
    const layers = iModelInstance.DEFAULT_LAYERS()
    expect(layers.at(-1)).toMatchObject({ _class: 'dense', activation: 'softmax' })
    expect(model.inputs[0].shape).toStrictEqual([null, iModelInstance.DATA_DEFAULT_KEYS.length])
  })
})

describe('las clases de cada paquete', () => {
  test('CAR: «good» no tiene salida en el modelo (tiene tres) y no se cambia por vgood', async () => {
    const { iModelInstance, model, rows } = await setup('CAR')
    expect(model.outputs[0].shape).toEqual([null, 3])
    expect(iModelInstance.CLASS_INDEX('good')).toBe(3)
    expect(rows.some((row) => row.output === 3)).toBe(false)
    for (const target of ['unacc', 'acc', 'vgood']) {
      const outputs = rows.filter((row) => row.target === target).map((row) => row.output)
      const counts = [0, 1, 2].map((output) => outputs.filter((value) => value === output).length)
      expect(counts.indexOf(Math.max(...counts))).toBe(iModelInstance.CLASS_INDEX(target))
    }
  }, 30_000)

  test('LYMPHOGRAPHY: el código del CSV y los nombres de cada clase llevan a su salida', () => {
    const iModelInstance = n4lTabularModel('LYMPHOGRAPHY')
    const keyOf = (target: unknown) => iModelInstance.CLASSES[iModelInstance.CLASS_INDEX(target)]
    const ns = 'n4l-lymphography:classes.'
    expect(['1', '2', '3', '4'].map(keyOf)).toStrictEqual(['1', '2', '3', '4'].map((code) => ns + code))
    expect(['normal', 'metastasis', 'malign lymph', 'fibrosis'].map(keyOf)).toStrictEqual(['1', '2', '3', '4'].map((code) => ns + code))
  })

  test('IRIS: la clase con o sin prefijo, y el nombre exacto gana a uno que termina igual', () => {
    const iris = n4lTabularModel('IRIS')
    expect(iris.CLASS_INDEX('Iris-virginica')).toBe(2)
    expect(iris.CLASS_INDEX('0 Iris-setosa')).toBe(0)
    expect(iris.CLASS_INDEX('Setosa')).toBe(0)
    expect(iris.CLASS_INDEX('rosa')).toBe(-1)
    const car = n4lTabularModel('CAR')
    expect(car.CLASS_INDEX('acc')).toBe(1)
    expect(car.CLASS_INDEX('unacc')).toBe(0)
  })
})
