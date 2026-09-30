import { describe, test, expect } from 'vitest'
import { detectLanguage } from '../../src/core/i18n/language'

describe('detectLanguage', () => {

  test('manda el idioma que eligió el usuario', () => {
    expect(detectLanguage('ja', ['es-ES', 'en'])).toBe('ja')
  })

  test('sin elección guardada, el primer idioma del navegador que tengamos traducido', () => {
    expect(detectLanguage(null, ['es-ES', 'en-US'])).toBe('es')
    expect(detectLanguage(null, ['fr-FR', 'de', 'ja-JP'])).toBe('ja')
    expect(detectLanguage(null, ['EN-gb'])).toBe('en')
  })

  test('si ninguno está traducido, inglés', () => {
    expect(detectLanguage(null, ['fr-FR', 'de-DE'])).toBe('en')
    expect(detectLanguage(null, [])).toBe('en')
  })

  test('una elección guardada que ya no existe se ignora', () => {
    expect(detectLanguage('fr', ['es'])).toBe('es')
    expect(detectLanguage('', [])).toBe('en')
  })
})
