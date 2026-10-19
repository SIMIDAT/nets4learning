import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import ReactGA from 'react-ga4'

// analytics.ts decide al cargarse si envía a Google Analytics (solo en producción): cada prueba lo carga de nuevo
async function loadAnalytics(environment: 'production' | 'development') {
  vi.stubEnv('VITE_ENVIRONMENT', environment)
  vi.resetModules()
  const { default: GA } = await import('react-ga4')
  const initialize = vi.spyOn(GA, 'initialize').mockImplementation(() => {})
  const gtag = vi.spyOn(GA, 'gtag').mockImplementation(() => {})
  return { ...await import('@core/analytics'), initialize, gtag }
}

const eventsOf = (gtag: { mock: { calls: unknown[][] } }) => gtag.mock.calls.filter((call) => call[0] === 'event').map((call) => [call[1], call[2]])

describe('analytics', () => {
  beforeEach(() => {
    document.cookie = 'n4l-accept-cookies=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  test('sin decisión guardada no hay consentimiento ni se envía nada', async () => {
    const { readConsent, trackEvent, trackPageView, initialize, gtag } = await loadAnalytics('production')
    expect(readConsent()).toBeNull()
    trackPageView('https://n4l/playground/regression/model/AUTO_MPG', { page_type: 'playground', task: 'regression' })
    trackEvent('predict', { input: 'form' })
    expect(initialize).not.toHaveBeenCalled()
    expect(gtag).not.toHaveBeenCalled()
  })

  test('al rechazar se recuerda, no se envía nada y se borran las cookies de Google Analytics', async () => {
    const { readConsent, saveConsent, trackEvent, gtag } = await loadAnalytics('production')
    document.cookie = '_ga=GA1.1.123; path=/'
    document.cookie = '_ga_3644EFBXMG=GS1.1.456; path=/'
    saveConsent('rejected')
    expect(readConsent()).toBe('rejected')
    trackEvent('predict', { input: 'form' })
    expect(gtag).not.toHaveBeenCalled()
    expect(document.cookie).not.toMatch(/_ga/)
  })

  test('al aceptar se carga sin publicidad y se registra la página en la que se está', async () => {
    const { saveConsent, trackPageView, initialize, gtag } = await loadAnalytics('production')
    // Antes de aceptar: no se envía, pero la página queda como la actual
    trackPageView('https://n4l/playground/tabular-classification/model/CAR', { page_type: 'playground', task: 'tabular-classification', mode: 'pretrained', item: 'CAR' })
    saveConsent('accepted')

    expect(gtag).toHaveBeenCalledWith('consent', 'default', expect.objectContaining({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }))
    expect(initialize).toHaveBeenCalledWith(expect.any(String), {
      gtagOptions: expect.objectContaining({ send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }),
    })
    expect(eventsOf(gtag)).toContainEqual(['page_view', {
      page_location: 'https://n4l/playground/tabular-classification/model/CAR',
      page_title   : 'playground / tabular-classification / pretrained / CAR',
      page_type    : 'playground',
      task         : 'tabular-classification',
      mode         : 'pretrained',
      item         : 'CAR',
    }])
    expect(eventsOf(gtag)).toContainEqual(['consent_granted', expect.objectContaining({ source: 'banner', item: 'CAR' })])
  })

  test('cada evento lleva el contexto de la página; al retirar el consentimiento se deja de enviar', async () => {
    const { saveConsent, trackPageView, trackEvent, setUserProperties, gtag } = await loadAnalytics('production')
    saveConsent('accepted', 'settings')
    trackPageView('https://n4l/playground/regression/dataset/AUTO_MPG', { page_type: 'playground', task: 'regression', mode: 'train', item: 'AUTO_MPG' })
    trackEvent('train_start', { epochs: 20 })
    expect(eventsOf(gtag)).toContainEqual(['train_start', { page_type: 'playground', task: 'regression', mode: 'train', item: 'AUTO_MPG', epochs: 20 }])
    setUserProperties({ app_language: 'es', tf_backend: 'webgl' })
    expect(gtag).toHaveBeenCalledWith('set', 'user_properties', { app_language: 'es', tf_backend: 'webgl' })

    gtag.mockClear()
    saveConsent('rejected', 'settings')
    expect(gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'denied' })
    trackEvent('predict', { input: 'form' })
    expect(eventsOf(gtag)).toEqual([])
  })

  test('en desarrollo no se carga Google Analytics: los eventos van a la consola', async () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const { saveConsent, trackEvent, initialize, gtag } = await loadAnalytics('development')
    saveConsent('accepted')
    trackEvent('predict', { input: 'drawing' })
    expect(initialize).not.toHaveBeenCalled()
    expect(gtag).not.toHaveBeenCalled()
    expect(debug).toHaveBeenCalledWith('[analytics]', 'predict', { input: 'drawing' })
  })

  test('react-ga4 sigue siendo el mismo módulo (la prueba no deja el real inicializado)', () => {
    expect(ReactGA.isInitialized).toBe(false)
  })
})
