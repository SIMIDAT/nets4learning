import { describe, test, expect } from 'vitest'

import { CHART_PALETTE, categoryColor, CLASS_ORDER, withAlpha } from '@core/chartColors'

// Contraste de WCAG entre dos colores #rrggbb
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// Donde van las gráficas: la tarjeta, el fondo terciario y el de la página
const BACKGROUNDS = {
  light: ['#ffffff', '#f8f9fa', '#e8eaed'],
  dark : ['#212529', '#2b3035', '#343a40'],
}

describe('chartColors', () => {
  test.each(Object.entries(CHART_PALETTE))('%s tiene al menos 3:1 sobre los fondos de los dos temas (WCAG 1.4.11)', (_name, tones) => {
    for (const theme of ['light', 'dark'] as const) {
      for (const background of BACKGROUNDS[theme]) {
        expect(contrast(tones[theme], background), `${tones[theme]} sobre ${background}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  test('cada categoría tiene siempre el mismo color y se repiten al acabarse', () => {
    expect(categoryColor(CLASS_ORDER, 0, 'light')).toBe(CHART_PALETTE.blue.light)
    expect(categoryColor(CLASS_ORDER, 1, 'dark')).toBe(CHART_PALETTE.orange.dark)
    expect(categoryColor(CLASS_ORDER, CLASS_ORDER.length, 'light')).toBe(categoryColor(CLASS_ORDER, 0, 'light'))
  })

  test('withAlpha da el mismo color con transparencia', () => {
    expect(withAlpha('#0d6efd', 0.5)).toBe('rgba(13, 110, 253, 0.5)')
  })
})
