import { describe, test, expect, vi, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as tfjs from '@tensorflow/tfjs'
import type { TFunction } from 'i18next'

import MODEL_LYMPHOGRAPHY from '../../src/pages/playground/0_TabularClassification/models/MODEL_LYMPHOGRAPHY'
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

describe('MODEL_LYMPHOGRAPHY — el modelo preentrenado recibe la entrada con la que se entrenó', () => {
  const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>
  const iModelInstance = new MODEL_LYMPHOGRAPHY(t, () => {})
  let model: tfjs.LayersModel
  let dataset: DatasetProcessed_t

  // Misma preparación que ModelReviewTabularClassification: encoders del dataset, sin escalar
  const predictClass = (values: Record<string, string | number>) => {
    const vector = DataFrameApplyEncoders(dataset.data_processed!.encoders, values, iModelInstance.DATA_DEFAULT_KEYS)
      .map((item) => parseFloat(item.toString()))
    const output = (model.predict(tfjs.tensor2d(vector, [1, vector.length])) as tfjs.Tensor).dataSync()
    return iModelInstance.CLASSES[output.indexOf(Math.max(...output))]
  }

  beforeAll(async () => {
    vi.stubGlobal('fetch', async (input: string | URL | Request) => toResponse(input.toString()))
    await tfjs.setBackend('cpu')
    model = await iModelInstance.LOAD_LAYERS_MODEL({ onProgress: () => {} })
    dataset = (await iModelInstance.DATASETS())[0]
  }, 30_000)

  test('cada ejemplo del selector se clasifica con la clase que anuncia', () => {
    const expected = [
      '00-tc.lymphography.normal find',
      '00-tc.lymphography.metastases',
      '00-tc.lymphography.malign lymph',
      '00-tc.lymphography.fibrosis',
    ]
    expect(iModelInstance.LIST_EXAMPLES.map(predictClass)).toStrictEqual(expected)
  })

  test('acierta en casi todo el dataset (con la entrada equivocada no pasaba del 30 %)', () => {
    const { dataframe_original, data_processed } = dataset
    const columns = dataframe_original.columns
    const target = data_processed!.column_name_target
    const classKey: Record<string, string> = {
      1: '00-tc.lymphography.normal find',
      2: '00-tc.lymphography.metastases',
      3: '00-tc.lymphography.malign lymph',
      4: '00-tc.lymphography.fibrosis',
    }
    const rows = dataframe_original.values as Array<Array<string | number>>
    const hits = rows.filter((row) => {
      const values = Object.fromEntries(columns.map((column, index) => [column, row[index]]))
      return predictClass(values) === classKey[values[target]]
    }).length
    expect(hits / rows.length).toBeGreaterThan(0.9)
  })
})
