import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { GuideTranslate_t } from '@components/guide/buildGuideSteps'
import { glossaryGuide } from '@pages/glossary/glossaryGuide'
import { GLOSSARY_SECTIONS } from '@pages/glossary/glossaryTerms'

const LANGUAGES = ['es', 'en', 'ja']
const translations = Object.fromEntries(LANGUAGES.map((language) => [language,
  JSON.parse(readFileSync(path.resolve(__dirname, `../../public/locales/${language}/translation.json`), 'utf8'))]))
const lookup = (language: string, key: string) =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], translations[language])

describe('guía del glosario', () => {
  test('cada paso señala un término que existe (o el buscador, el índice o un enlace) y tiene texto en todos los idiomas', () => {
    const termIds = new Set(GLOSSARY_SECTIONS.flatMap(({ groups }) => groups.flatMap(({ terms }) => terms.map(({ id }) => id))))
    for (const language of LANGUAGES) {
      const missing: string[] = []
      const t: GuideTranslate_t = (keys) => {
        const list = Array.isArray(keys) ? keys : [keys]
        const found = list.find((key) => typeof lookup(language, key) === 'string')
        if (found === undefined) missing.push(list.join(' | '))
        return found === undefined ? '' : lookup(language, found) as string
      }
      const steps = glossaryGuide(t)
      expect(missing, language).toEqual([])
      expect(steps.length).toBe(18)
      for (const { target } of steps) {
        const term = target.match(/^#glossary-([^\s]+)/)?.[1]
        if (term !== undefined) expect(termIds, target).toContain(term)
      }
    }
  })
})
