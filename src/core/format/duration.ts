/**
 * Una duración en palabras, redondeada a lo que importa: «0,4 segundos», «45 segundos», «3 minutos», «1,5 horas» (con
 * las unidades de Intl, en el idioma de la aplicación)
 */
export function formatDuration(ms: number, language: string): string {
  const format = (value: number, unit: 'second' | 'minute' | 'hour', digits = 0) =>
    new Intl.NumberFormat(language, { style: 'unit', unit, unitDisplay: 'long', maximumFractionDigits: digits }).format(value)
  if (ms < 10_000) return format(Math.max(0.1, ms / 1000), 'second', 1)
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return format(seconds, 'second')
  if (seconds < 3600) return format(Math.round(seconds / 60), 'minute')
  return format(seconds / 3600, 'hour', 1)
}
