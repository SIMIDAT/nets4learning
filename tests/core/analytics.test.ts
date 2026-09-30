import { describe, test, expect, vi, beforeEach } from 'vitest'
import ReactGA from 'react-ga4'
import { readConsent, saveConsent, trackPageView } from '../../src/core/analytics'

describe('analytics', () => {
  beforeEach(() => {
    document.cookie = 'n4l-accept-cookies=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    vi.restoreAllMocks()
  })

  test('sin decisión guardada no hay consentimiento', () => {
    expect(readConsent()).toBeNull()
  })

  test('al rechazar se recuerda y no se registra ninguna página', () => {
    const send = vi.spyOn(ReactGA, 'send').mockImplementation(() => {})
    saveConsent('rejected')
    expect(readConsent()).toBe('rejected')
    trackPageView('/Iris', 'IRIS')
    expect(send).not.toHaveBeenCalled()
  })

  test('al aceptar se carga Analytics y se registran las páginas', () => {
    const initialize = vi.spyOn(ReactGA, 'initialize').mockImplementation(() => {})
    const send = vi.spyOn(ReactGA, 'send').mockImplementation(() => {})
    saveConsent('accepted')
    expect(readConsent()).toBe('accepted')
    expect(initialize).toHaveBeenCalled()
    trackPageView('/Iris', 'IRIS')
    expect(send).toHaveBeenCalledWith({ hitType: 'pageview', page: '/Iris', title: 'IRIS' })
  })
})
