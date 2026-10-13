import { describe, test, expect, beforeEach } from 'vitest'

import {
  DEFAULT_DISPLAY_SETTINGS,
  DISPLAY_SETTINGS_STORAGE_KEY,
  getDisplaySettings,
  parseDisplaySettings,
  prefersReducedMotion,
  resetDisplaySettings,
  shouldOpenVisor,
  updateDisplaySettings,
} from '@core/a11y/displaySettings'

describe('displaySettings: los ajustes de accesibilidad', () => {
  beforeEach(() => resetDisplaySettings())

  test('lo guardado que no vale (o nada) se queda en los valores por defecto', () => {
    expect(parseDisplaySettings(null)).toEqual(DEFAULT_DISPLAY_SETTINGS)
    expect(parseDisplaySettings('no es JSON')).toEqual(DEFAULT_DISPLAY_SETTINGS)
    expect(parseDisplaySettings(JSON.stringify({ textSize: 175, spacing: 'sí', underlineLinks: true })))
      .toEqual({ ...DEFAULT_DISPLAY_SETTINGS, underlineLinks: true })
  })

  test('al cambiarlos se aplican en <html> y se recuerdan', () => {
    const root = document.documentElement
    updateDisplaySettings({ textSize: 150, spacing: true, highContrast: true, reduceMotion: true, underlineLinks: true, strongFocus: true, openVisor: false })
    expect(root).toHaveAttribute('data-n4l-text-size', '150')
    for (const name of ['n4l-text-spacing', 'n4l-high-contrast', 'n4l-reduce-motion', 'n4l-underline-links', 'n4l-strong-focus']) {
      expect(root.classList.contains(name), name).toBe(true)
    }
    expect(prefersReducedMotion()).toBe(true)
    expect(shouldOpenVisor()).toBe(false)
    expect(JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY)!)).toEqual(getDisplaySettings())
  })

  test('restablecerlos los quita y los olvida', () => {
    updateDisplaySettings({ textSize: 200, underlineLinks: true })
    resetDisplaySettings()
    expect(document.documentElement).not.toHaveAttribute('data-n4l-text-size')
    expect(document.documentElement.classList.contains('n4l-underline-links')).toBe(false)
    expect(localStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY)).toBeNull()
    expect(getDisplaySettings()).toEqual(DEFAULT_DISPLAY_SETTINGS)
  })
})
