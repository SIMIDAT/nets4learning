import { useEffect, useState } from 'react'
import type { Theme_t } from '@core/theme'

const readTheme = (): Theme_t => (document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light')

/** Tema activo de la aplicación; se actualiza cuando el usuario lo cambia (para lo que no se pinta con CSS) */
export function useTheme(): Theme_t {
  const [theme, setTheme] = useState<Theme_t>(readTheme)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}
