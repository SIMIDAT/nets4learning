import ReactGA from 'react-ga4'

import { pageTitle, type PageContext_t } from '@core/analyticsPage'

export type AnalyticsConsent_t = 'accepted' | 'rejected'
/** Desde dónde se decidió: el aviso, la configuración o los términos */
export type ConsentSource_t = 'banner' | 'settings' | 'terms'
export type AnalyticsParams_t = Record<string, string | number | boolean | undefined>

// Se mantiene el nombre de la cookie anterior: quien ya aceptó no vuelve a ver el aviso
const CONSENT_COOKIE = 'n4l-accept-cookies'
const CONSENT_EXPIRATION_DAYS = 120
// Evento para volver a abrir el aviso de cookies desde cualquier sitio (p. ej. el pie de página)
export const OPEN_CONSENT_EVENT = 'n4l:open-cookie-preferences'

// Solo el tráfico de producción llega a Google Analytics. En desarrollo, los eventos se escriben en la consola; con
// VITE_GA_DEBUG=true se envían de verdad, marcados para verlos en DebugView
const GA_DEBUG = import.meta.env.VITE_GA_DEBUG === 'true'
const SEND_TO_GA = import.meta.env.VITE_ENVIRONMENT === 'production' || GA_DEBUG
// Las cookies de GA duran 13 meses, como recomiendan las autoridades de protección de datos (Google pone 2 años)
const GA_COOKIE_EXPIRES_SECONDS = 13 * 30 * 24 * 60 * 60

// Si el usuario retira el consentimiento, Google Analytics ya cargado deja de recibir eventos
let enabled = false
// La página en la que está el usuario: su contexto va en todos los eventos y, si acepta estando en ella, se registra
let currentPage: { location: string, context: PageContext_t } | null = null
let userProperties: Record<string, string> = {}
let performanceSent = false

/** Decisión guardada del usuario, o null si todavía no ha decidido */
export function readConsent(): AnalyticsConsent_t | null {
  const match = document.cookie.match(new RegExp('(^| )' + CONSENT_COOKIE + '=([^;]+)'))
  if (match === null) return null
  if (match[2] === 'true') return 'accepted'
  if (match[2] === 'false') return 'rejected'
  return null
}

export function saveConsent(consent: AnalyticsConsent_t, source: ConsentSource_t = 'banner') {
  const expires = new Date(Date.now() + CONSENT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toUTCString()
  // SameSite=Lax es suficiente: la cookie solo la lee esta aplicación
  document.cookie = `${CONSENT_COOKIE}=${consent === 'accepted'};expires=${expires};path=/;SameSite=Lax`
  if (consent === 'accepted') {
    const wasEnabled = enabled
    startAnalytics()
    if (!wasEnabled) trackEvent('consent_granted', { source })
  } else {
    stopAnalytics()
  }
}

/** Olvida la decisión: el aviso de cookies vuelve a salir y, mientras tanto, no se envía nada */
export function clearConsent() {
  document.cookie = `${CONSENT_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`
  stopAnalytics()
}

/** Carga Google Analytics (solo se llama con el consentimiento del usuario) y registra la página en la que está */
export function startAnalytics() {
  if (enabled) return
  enabled = true
  if (SEND_TO_GA) {
    if (ReactGA.isInitialized) {
      ReactGA.gtag('consent', 'update', { analytics_storage: 'granted' })
    } else {
      // Antes de cargar gtag: nada de publicidad, ni señales de Google
      ReactGA.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
      ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID, {
        gtagOptions: {
          // Las páginas vistas las envía N4LAnalytics, con su contexto (en una SPA, gtag solo vería la primera)
          send_page_view                  : false,
          allow_google_signals            : false,
          allow_ad_personalization_signals: false,
          cookie_expires                  : GA_COOKIE_EXPIRES_SECONDS,
          ...(GA_DEBUG ? { debug_mode: true } : {}),
        },
      })
    }
  }
  sendUserProperties()
  if (currentPage !== null) sendPageView(currentPage.location, currentPage.context)
  sendPerformance()
}

/** Deja de enviar y borra las cookies de Google Analytics */
function stopAnalytics() {
  if (enabled && SEND_TO_GA) ReactGA.gtag('consent', 'update', { analytics_storage: 'denied' })
  enabled = false
  removeGACookies()
}

// _ga y _ga_<id>: GA las crea en el dominio más alto posible, con o sin punto delante
function removeGACookies() {
  const host = window.location.hostname
  const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')]
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (name !== '_ga' && !name.startsWith('_ga_')) continue
    for (const domain of domains) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domain === '' ? '' : ';domain=' + domain}`
    }
  }
}

function send(name: string, params: AnalyticsParams_t) {
  if (SEND_TO_GA) ReactGA.gtag('event', name, params)
  else console.debug('[analytics]', name, params)
}

type AppEventListener_t = (name: string, params: AnalyticsParams_t) => void
const appEventListeners = new Set<AppEventListener_t>()

/**
 * Los eventos (y las páginas vistas) dentro de la propia aplicación, con o sin consentimiento: no salen del navegador.
 * Así, p. ej., el recorrido «Empieza aquí» sabe qué pasos se han hecho sin repetir los avisos en cada página.
 */
export function onAppEvent(listener: AppEventListener_t): () => void {
  appEventListeners.add(listener)
  return () => { appEventListeners.delete(listener) }
}

/**
 * Registra un evento con el contexto de la página actual (tarea, modelo o conjunto de datos…). Sin consentimiento no
 * hace nada, ni lo guarda para enviarlo después (solo se avisa dentro de la aplicación: onAppEvent).
 */
export function trackEvent(name: string, params: AnalyticsParams_t = {}) {
  const event = { ...currentPage?.context, ...params }
  appEventListeners.forEach((listener) => listener(name, event))
  if (!enabled) return
  send(name, event)
}

function sendPageView(location: string, context: PageContext_t) {
  send('page_view', { page_location: location, page_title: pageTitle(context), ...context })
}

/** La página cambia: desde ahora los eventos llevan su contexto */
export function trackPageView(location: string, context: PageContext_t) {
  currentPage = { location, context }
  appEventListeners.forEach((listener) => listener('page_view', context))
  if (enabled) sendPageView(location, context)
}

/** Idioma, tema y backend: GA los guarda con el usuario y permiten segmentar todo lo demás */
export function setUserProperties(properties: Record<string, string>) {
  userProperties = { ...userProperties, ...properties }
  if (enabled) sendUserProperties()
}

function sendUserProperties() {
  if (Object.keys(userProperties).length === 0) return
  if (SEND_TO_GA) ReactGA.gtag('set', 'user_properties', userProperties)
  else console.debug('[analytics] user_properties', userProperties)
}

/** Lo que tardó en cargar la aplicación, una vez por visita (si se acepta más tarde, se envía al aceptar) */
function sendPerformance() {
  if (performanceSent) return
  const send = () => {
    const [navigation] = performance.getEntriesByType?.('navigation') as PerformanceNavigationTiming[] ?? []
    if (navigation === undefined || navigation.loadEventEnd <= 0 || !enabled) return
    performanceSent = true
    trackEvent('app_performance', { load_ms: Math.round(navigation.loadEventEnd), dom_ms: Math.round(navigation.domContentLoadedEventEnd) })
  }
  if (document.readyState === 'complete') send()
  // loadEventEnd se rellena al terminar el evento load
  else window.addEventListener('load', () => window.setTimeout(send), { once: true })
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))
}
