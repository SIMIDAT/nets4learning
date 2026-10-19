import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { TASK_DATASET_OPTIONS, type TaskOption_t } from '../../src/TASK_OPTIONS'

// Los CSV de los datasets no llevan comillas: basta con partir por comas
const readCsv = (path: string) => {
  const [head, ...body] = readFileSync(`public/${path}`, 'utf-8').split(/\r?\n/).filter((line) => line.trim() !== '')
  return { columns: head.split(','), rows: body.map((line) => line.split(',')) }
}

const csvOptions = Object.values(TASK_DATASET_OPTIONS as Record<string, TaskOption_t[]>)
  .flat()
  .filter((option) => option.info?.files !== undefined)
  .map((option) => [option.value, option.info!] as const)

describe('Datos de los datasets en la galería', () => {
  test.each(csvOptions)('%s coincide con sus CSV', (_value, info) => {
    const files = info.files!.map(readCsv)
    expect(files.map(({ rows }) => rows.length)).toStrictEqual(info.rows)
    if (info.features !== undefined) {
      for (const { columns } of files) expect(columns.length - 1).toBe(info.features)
    }
    const targetColumn = info.target ?? (info.classes !== undefined ? files[0].columns[files[0].columns.length - 1] : undefined)
    if (info.target !== undefined) {
      for (const { columns } of files) expect(columns).toContain(info.target)
    }
    if (info.classes !== undefined && targetColumn !== undefined) {
      const index = files[0].columns.indexOf(targetColumn)
      expect(new Set(files[0].rows.map((row) => row[index])).size).toBe(info.classes)
    }
  })
})
