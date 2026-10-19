import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import type { GuideTranslate_t } from '@components/guide/buildGuideSteps'
import { timeSeriesTrainerGuide } from '@pages/playground/5_TimeSeries/trainerGuide'
import { TASK_DATASET_OPTIONS } from '@/TASK_OPTIONS'
import { TASKS, UPLOAD } from '@/TASKS'

const LANGUAGES = ['es', 'en', 'ja']
const translations = Object.fromEntries(LANGUAGES.map((language) => [language,
  JSON.parse(readFileSync(path.resolve(__dirname, `../../public/locales/${language}/translation.json`), 'utf8'))]))

const lookup = (language: string, key: string) =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], translations[language])

const keysOf = (node: unknown, prefix: string): string[] =>
  (typeof node === 'string' ? [prefix] : Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => keysOf(value, `${prefix}.${key}`)))

describe('guía de la página de entrenamiento de las series temporales', () => {
  test('cada paso tiene título y explicación en todos los idiomas, y no sobra ningún texto', () => {
    const datasets = TASK_DATASET_OPTIONS[TASKS.TIME_SERIES].map(({ value }) => value)
    expect(datasets).toContain(UPLOAD)
    for (const language of LANGUAGES) {
      const missing: string[] = []
      const used = new Set<string>()
      const t: GuideTranslate_t = (keys) => {
        const list = Array.isArray(keys) ? keys : [keys]
        const found = list.find((key) => typeof lookup(language, key) === 'string')
        if (found === undefined) missing.push(list.join(' | '))
        else used.add(found)
        return found ?? list[0]
      }
      for (const dataset of datasets) {
        const steps = timeSeriesTrainerGuide(t, dataset, dataset === UPLOAD)
        expect(steps[0].placement).toBe('center')
        expect(steps.at(-1)!.placement).toBe('center')
        // Con una serie propia, primero hay que subirla
        expect(steps.some(({ target }) => target === '[data-guide="process"]')).toBe(dataset === UPLOAD)
      }
      expect(missing, language).toEqual([])
      const all = keysOf(lookup(language, 'guide.train.5-time-series'), 'guide.train.5-time-series')
      expect(all.filter((key) => !used.has(key)), language).toEqual([])
    }
  })
})
