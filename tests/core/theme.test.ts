import { describe, test, expect } from 'vitest'
import { detectTheme } from '../../src/core/theme'

describe('detectTheme', () => {

  test('manda el tema que eligió el usuario', () => {
    expect(detectTheme('light', true)).toBe('light')
    expect(detectTheme('dark', false)).toBe('dark')
  })

  test('sin elección guardada, el tema del sistema', () => {
    expect(detectTheme(null, true)).toBe('dark')
    expect(detectTheme(null, false)).toBe('light')
  })

  test('una elección guardada que no es un tema se ignora', () => {
    expect(detectTheme('sepia', true)).toBe('dark')
    expect(detectTheme('', false)).toBe('light')
  })
})
