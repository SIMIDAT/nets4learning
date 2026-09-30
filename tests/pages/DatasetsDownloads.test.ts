import { describe, test, expect } from 'vitest'
import * as fs from 'fs'

// Los enlaces de descarga de la página de datasets apuntan a ficheros de public/datasets
describe('Datasets — enlaces de descarga', () => {
  const source = fs.readFileSync('src/pages/datasets/Datasets.tsx', 'utf8')
  const block = (from: string, to: string) => source.slice(source.indexOf(from), source.indexOf(to))
  const downloads = (text: string) => [...text.matchAll(/url_download: "([^"]+)"/g)].map((m) => m[1])

  test.each([
    ['clasificación tabular', block('tabular_classification_datasets_list', 'regression_datasets_list'), 'public/datasets/'],
    ['regresión', block('regression_datasets_list', '// @formatter:on'), 'public/datasets/01-regression/'],
  ])('%s: todos los ficheros existen', (_task, text, base) => {
    const files = downloads(text)
    expect(files.length).toBeGreaterThan(0)
    expect(files.filter((file) => !fs.existsSync(base + file))).toStrictEqual([])
  })
})
