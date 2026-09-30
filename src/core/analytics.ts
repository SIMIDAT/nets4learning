import ReactGA from 'react-ga4'

export type AnalyticsConsent_t = 'accepted' | 'rejected'

// Se mantiene el nombre de la cookie anterior: quien ya aceptó no vuelve a ver el aviso
const CONSENT_COOKIE = 'n4l-accept-cookies'
const CONSENT_EXPIRATION_DAYS = 120
// Evento para volver a abrir el aviso de cookies desde cualquier sitio (p. ej. el pie de página)
export const OPEN_CONSENT_EVENT = 'n4l:open-cookie-preferences'

// Si el usuario retira el consentimiento, Google Analytics ya cargado deja de recibir páginas
let enabled = false

/** Decisión guardada del usuario, o null si todavía no ha decidido */
export function readConsent(): AnalyticsConsent_t | null {
  const match = document.cookie.match(new RegExp('(^| )' + CONSENT_COOKIE + '=([^;]+)'))
  if (match === null) return null
  if (match[2] === 'true') return 'accepted'
  if (match[2] === 'false') return 'rejected'
  return null
}

export function saveConsent(consent: AnalyticsConsent_t) {
  const expires = new Date(Date.now() + CONSENT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toUTCString()
  // SameSite=Lax es suficiente: la cookie solo la lee esta aplicación
  document.cookie = `${CONSENT_COOKIE}=${consent === 'accepted'};expires=${expires};path=/;SameSite=Lax`
  if (consent === 'accepted') {
    startAnalytics()
  } else {
    enabled = false
  }
}

/** Carga Google Analytics. Solo se llama con el consentimiento del usuario. */
export function startAnalytics() {
  enabled = true
  if (!ReactGA.isInitialized) ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID)
}

/** Registra una página vista; sin consentimiento no hace nada (ni la guarda para enviarla después) */
export function trackPageView(page: string, title: string) {
  if (!enabled) return
  ReactGA.send({ hitType: 'pageview', page, title })
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))
}
