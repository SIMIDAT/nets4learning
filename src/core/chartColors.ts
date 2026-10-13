import type { Theme_t } from '@core/theme'

/**
 * Los colores de las gráficas (líneas, puntos, barras y sus muestras en las leyendas y las tablas), con un tono para cada
 * tema: todos tienen al menos 3:1 sobre el fondo de la página y de las tarjetas de su tema (WCAG 1.4.11). Los de
 * Bootstrap tal cual no llegaban: en el claro, el naranja, el turquesa, el amarillo y el cian (de 1,6 a 2,6:1 sobre
 * blanco); en el oscuro, el morado (2,4:1). En el claro, los tonos 600–700 de Bootstrap; en el oscuro, los 300.
 */
export const CHART_PALETTE = {
  blue  : { light: '#0d6efd', dark: '#6ea8fe' },
  orange: { light: '#ca6510', dark: '#feb272' },
  green : { light: '#198754', dark: '#75b798' },
  pink  : { light: '#d63384', dark: '#e685b5' },
  purple: { light: '#6f42c1', dark: '#a98eda' },
  teal  : { light: '#13795b', dark: '#79dfc1' },
  red   : { light: '#dc3545', dark: '#ea868f' },
  yellow: { light: '#997404', dark: '#ffda6a' },
  cyan  : { light: '#087990', dark: '#6edff6' },
  gray  : { light: '#6c757d', dark: '#adb5bd' },
} as const satisfies Record<string, Record<Theme_t, string>>

export type ChartColor_t = keyof typeof CHART_PALETTE

/** Un color de la paleta en el tema dado */
export const chartColor = (name: ChartColor_t, theme: Theme_t): string => CHART_PALETTE[name][theme]

/**
 * El color de cada categoría (clases, grupos, modelos…) según su posición, siempre en el mismo orden para que una clase
 * tenga el mismo color en todas las gráficas. Cada parte de la aplicación tiene su orden (`order`)
 */
export const categoryColor = (order: readonly ChartColor_t[], index: number, theme: Theme_t): string =>
  CHART_PALETTE[order[index % order.length]][theme]

/** El orden de las clases en los gráficos del análisis de datos */
export const CLASS_ORDER: readonly ChartColor_t[] = ['blue', 'orange', 'green', 'purple', 'red', 'teal', 'pink', 'cyan', 'yellow', 'gray']

/** Con transparencia (`alpha` entre 0 y 1), para rellenos que dejan ver lo de debajo; el borde va sin ella */
export function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}
