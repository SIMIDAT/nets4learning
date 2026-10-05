import { describe, test, expect, vi, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as tfjs from '@tensorflow/tfjs'

import { builtinN4LPackage, N4L_CATALOG } from '@core/n4l/catalog'
import { DataFrameApplyEncoders } from '@core/dataframe/DataFrameUtils'
import MODEL_TABULAR from '@pages/playground/0_TabularClassification/models/MODEL_N4L'
import MODEL_REGRESSION from '@pages/playground/1_Regression/models/MODEL_N4L'
import { seededRandom } from '@core/clustering/kmeans'
import { isTableDataset, n4lLayersModels } from '@core/n4l/format'
import { keyT, stubPublicFetch, toPublicPath } from '../helpers/n4l'

// Cada modelo ya entrenado de los paquetes de public/n4l/, con su conjunto preparado según el manifiesto (como lo
// prepara la página del modelo: codificado y, si su «input» es «scaled», escalado). Así se comprueba a la vez que el
// modelo es bueno y que el paquete lo configura bien: un preprocesado o unas clases equivocadas lo hunden.

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

beforeAll(async () => {
  stubPublicFetch()
  await tfjs.setBackend('cpu')
})

const withTask = (task: string) => N4L_CATALOG.flatMap((entry) => entry.tasks
  .filter((section) => section.task === task && section.models.length > 0)
  .map((section) => ({ entry, section })))

/**
 * La partición de prueba de Scripts/train_regression_models.mjs (con su misma semilla y el mismo barajado): las filas
 * con las que no se entrenó cada modelo de regresión
 */
function testRows(count: number, seed = 1, testSize = 0.2) {
  const random = seededRandom(seed)
  const order = Array.from({ length: count }, (_, row) => row)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]]
  }
  return order.slice(0, Math.round(count * testSize))
}

describe('Paquetes .n4l: los modelos de clasificación tabular aciertan con la configuración del paquete', () => {
  test.each(withTask('tabular-classification').map(({ entry }) => [entry.id, entry] as const))('%s', async (_id, entry) => {
    const instance = new MODEL_TABULAR(keyT, () => {}, builtinN4LPackage(entry))
    const model = (await instance.LOAD_LAYERS_MODEL({}))!
    const [dataset] = await instance.DATASETS()
    const { encoders, scaler, column_name_target } = dataset.data_processed!
    const { dataframe_original } = dataset
    const rows = dataframe_original.values as Array<Array<string | number>>
    const hits = rows.filter((row) => {
      const values = Object.fromEntries(dataframe_original.columns.map((column, index) => [column, row[index]]))
      let vector = DataFrameApplyEncoders(encoders, values, instance.DATA_DEFAULT_KEYS).map((value) => parseFloat(value.toString()))
      if (instance.MODEL_INPUT() === 'scaled') vector = scaler.transform(vector) as number[]
      const output = (model.predict(tfjs.tensor2d([vector])) as tfjs.Tensor).dataSync()
      return output.indexOf(Math.max(...output)) === instance.CLASS_INDEX(values[column_name_target])
    }).length
    const accuracy = hits / rows.length
    console.info(`${entry.id}: ${(accuracy * 100).toFixed(1)} % de aciertos (${hits}/${rows.length})`)
    expect(accuracy).toBeGreaterThan(0.9)
  }, 60_000)
})

describe('Paquetes .n4l: los modelos de regresión dan, con la configuración del paquete, las métricas de su manifiesto', () => {
  const cases = withTask('regression').flatMap(({ entry, section }) => n4lLayersModels(section).map((model) => [`${entry.id}/${model.id}`, entry, model] as const))

  test('todos tienen sus métricas con datos que no vieron al entrenar', () => {
    expect(cases.length).toBeGreaterThan(0)
    for (const [name, , model] of cases) expect(Object.keys(model.metrics ?? {}), name).toEqual(['test_r2', 'test_mae', 'test_baseline_mae'])
  })

  test.each(cases)('%s', async (name, entry, entryModel) => {
    const instance = new MODEL_REGRESSION(keyT, () => {}, builtinN4LPackage(entry))
    const datasets = await instance.DATASETS()
    const file = entry.datasets.filter(isTableDataset).find(({ id }) => id === entryModel.dataset)!.file
    const dataset = datasets.find(({ csv }) => file.endsWith('/' + csv))!
    const [{ model }] = (await instance.MODELS(dataset.csv)).filter((item) => item.model_path!.includes(`/models/${entryModel.id}/`))
    const { X, y } = dataset.data_processed!
    // Las filas de prueba, preparadas por la aplicación (codificadas y escaladas según el manifiesto)
    const rows = testRows((y.values as unknown[]).length)
    const inputs = rows.map((row) => (X.values as number[][])[row])
    const actual = rows.map((row) => Number((y.values as unknown[])[row]))
    const predictions = Array.from((model!.predict(tfjs.tensor2d(inputs)) as tfjs.Tensor).dataSync())
    const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length
    const mae = actual.reduce((sum, value, index) => sum + Math.abs(value - predictions[index]), 0) / actual.length
    const residual = actual.reduce((sum, value, index) => sum + (value - predictions[index]) ** 2, 0)
    const total = actual.reduce((sum, value) => sum + (value - mean) ** 2, 0)
    const r2 = 1 - residual / total
    console.info(`${name}: con ${rows.length} filas que no vio, R² ${r2.toFixed(3)} y error medio ${mae.toFixed(3)} (manifiesto: ${entryModel.metrics!.test_r2}, ${entryModel.metrics!.test_mae})`)
    expect(predictions.every(Number.isFinite)).toBe(true)
    expect(r2).toBeCloseTo(entryModel.metrics!.test_r2, 2)
    expect(mae).toBeCloseTo(entryModel.metrics!.test_mae, 2)
  }, 60_000)
})
