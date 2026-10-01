import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { TYPE_LOSSES } from '../../src/core/nn-utils/ArchitectureTypesHelper'

const readLocale = (language: string) => JSON.parse(readFileSync(`public/locales/${language}/translation.json`, 'utf-8'))

describe('Glosario de pérdidas', () => {
  test.each(['es', 'en', 'ja'])('cada pérdida del selector tiene descripción en %s', (language) => {
    const table = readLocale(language).pages.glossary['loss-functions'].table
    for (const { key } of TYPE_LOSSES) {
      expect(table[key]?.description, key).toBeTruthy()
    }
    // Y el glosario no describe pérdidas que ya no se pueden elegir
    expect(Object.keys(table).sort()).toStrictEqual(TYPE_LOSSES.map(({ key }) => key).sort())
  })
})
