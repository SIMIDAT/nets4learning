import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { setUserProperties, trackEvent, trackPageView } from '@core/analytics'
import { clickTargetName, pageContextFromPath } from '@core/analyticsPage'
import { getActiveTFBackend, subscribeActiveTFBackend } from '@core/tfBackend'
import { useTheme } from '@hooks/useTheme'

const BASENAME = import.meta.env.VITE_PATH ?? ''
// Errores distintos que se envían como mucho en una visita: un error en bucle no llena las analíticas
const MAX_EXCEPTIONS = 10

/** Cuenta el tiempo con la pestaña visible; `send` envía lo contado desde la última vez (si llega a un segundo) */
function createPageTimer() {
  let accumulated = 0
  let visibleSince: number | null = document.visibilityState === 'visible' ? performance.now() : null
  return {
    pause() {
      if (visibleSince !== null) accumulated += performance.now() - visibleSince
      visibleSince = null
    },
    resume() {
      visibleSince ??= performance.now()
    },
    send() {
      const now = performance.now()
      const seconds = Math.round((accumulated + (visibleSince === null ? 0 : now - visibleSince)) / 1000)
      accumulated = 0
      if (visibleSince !== null) visibleSince = now
      if (seconds >= 1) trackEvent('page_time', { engaged_seconds: seconds })
    },
  }
}

/**
 * Las analíticas que no dependen de cada página (docs/analytics.md): páginas vistas con su contexto, tiempo en cada
 * página, clics, idioma, tema y backend del usuario, y errores sin capturar. Sin consentimiento, trackEvent no envía nada.
 */
export default function N4LAnalytics() {
  const location = useLocation()
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const theme = useTheme()
  const backend = useSyncExternalStore(subscribeActiveTFBackend, getActiveTFBackend)
  const [timer] = useState(createPageTimer)

  // Antes que los efectos de la página nueva: lo que envíe al montarse ya lleva su contexto. El tiempo, de la anterior
  useLayoutEffect(() => {
    timer.send()
    const context = pageContextFromPath(location.pathname, location.search)
    // Una ruta que no existe redirige enseguida a la 404, que la registra (not_found): no es una página vista más
    if (context.page_type !== 'other') trackPageView(window.location.href, context)
  }, [timer, location.pathname, location.search])

  // Al ocultar la pestaña (cambiar de app, bloquear el móvil, cerrarla) se envía el tiempo: puede no haber otra ocasión
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        timer.pause()
        timer.send()
      } else {
        timer.resume()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [timer])

  // Los clics, en la fase de captura: los ve aunque un componente pare la propagación
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const element = clickTargetName(event.target, BASENAME)
      if (element !== null) trackEvent('ui_click', { element })
    }
    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  // Idioma, tema y backend, para segmentar todo lo demás (los cambios del usuario los registran changeUserLanguage,
  // changeUserTheme y changeUserTFBackend: aquí también cambian al cargar)
  useEffect(() => {
    setUserProperties({ app_language: language, app_theme: theme, tf_backend: backend })
  }, [language, theme, backend])

  // Errores que nadie captura: qué falla y en qué página
  useEffect(() => {
    const sent = new Set<string>()
    const report = (description: string) => {
      const text = description.slice(0, 100)
      if (sent.has(text) || sent.size >= MAX_EXCEPTIONS) return
      sent.add(text)
      trackEvent('exception', { description: text, fatal: false })
    }
    const handleError = (event: ErrorEvent) => report(event.message || 'error')
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason
      report(reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason))
    }
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}
