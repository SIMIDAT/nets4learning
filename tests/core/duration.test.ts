import { describe, test, expect } from 'vitest'

import { formatDuration } from '@core/format/duration'

// Intl separa el número y la unidad con un espacio normal o uno que no se parte, según el idioma
const plain = (text: string) => text.replace(/\s/g, ' ')

describe('formatDuration: cuánto tarda, en palabras', () => {
  test.each([
    [400, '0,4 segundos'],
    [45_000, '45 segundos'],
    [180_000, '3 minutos'],
    [5_400_000, '1,5 horas'],
  ])('%i ms → %s', (ms, text) => {
    expect(plain(formatDuration(ms, 'es'))).toBe(text)
  })

  test('en inglés', () => {
    expect(plain(formatDuration(45_000, 'en'))).toBe('45 seconds')
  })
})
