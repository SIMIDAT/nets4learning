import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, CloseButton, Container } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import { OPEN_CONSENT_EVENT, readConsent, saveConsent, type AnalyticsConsent_t } from '@core/analytics'
import AnalyticsDisclosure from './AnalyticsDisclosure'

/**
 * Aviso de cookies en la parte de abajo. No bloquea la página: se puede seguir usando sin decidir, y mientras tanto no
 * se carga Google Analytics. Explica para qué sirven las analíticas y, desplegando, qué se mide y qué no se envía nunca.
 * Aceptar y rechazar están al mismo nivel, uno junto al otro y del mismo tamaño (lo exigen el RGPD y la AEPD: si
 * rechazar costara más, el consentimiento no valdría). Al abrirlo otra vez desde "Preferencias de cookies" dice qué se
 * decidió y se puede cerrar sin cambiar nada.
 */
export default function N4LCookiesBanner() {
  const { t } = useTranslation()
  const [show, setShow] = useState(() => readConsent() === null)
  const [consent, setConsent] = useState<AnalyticsConsent_t | null>(readConsent)
  const banner_ref = useRef<HTMLElement>(null)
  // Lo que lo abrió desde el pie («Preferencias de cookies»): al cerrarlo, el foco vuelve ahí
  const opener_ref = useRef<HTMLElement | null>(null)
  const focusOnShow_ref = useRef(false)

  // El pie de página permite cambiar la decisión más adelante; al abrirlo así, el foco va al aviso (si no, quien usa el
  // teclado no sabría que ha aparecido: está al principio de la página)
  useEffect(() => {
    const open = () => {
      opener_ref.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      focusOnShow_ref.current = true
      setConsent(readConsent())
      setShow(true)
    }
    window.addEventListener(OPEN_CONSENT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open)
  }, [])
  useEffect(() => {
    if (!show || !focusOnShow_ref.current) return
    focusOnShow_ref.current = false
    document.getElementById('n4l-cookies-banner-title')?.focus()
  }, [show])

  // Está fijo abajo: la página deja su alto libre al final, para que no tape lo último ni lo que tiene el foco (WCAG
  // 2.4.11; --n4l-cookies-height en globals.css)
  useLayoutEffect(() => {
    const element = banner_ref.current
    const root = document.documentElement
    if (!show || element === null) return
    const update = () => root.style.setProperty('--n4l-cookies-height', `${element.offsetHeight}px`)
    update()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(element)
    return () => {
      observer?.disconnect()
      root.style.removeProperty('--n4l-cookies-height')
    }
  }, [show])

  // Al cerrarlo, el foco no se pierde: vuelve a lo que lo abrió o, la primera vez, a la página
  const hide = () => {
    const hadFocus = banner_ref.current?.contains(document.activeElement) ?? false
    setShow(false)
    if (!hadFocus) return
    const opener = opener_ref.current
    opener_ref.current = null
    window.requestAnimationFrame(() => {
      if (opener !== null && opener.isConnected) {
        opener.focus()
        return
      }
      const main = Array.from(document.querySelectorAll('main')).find((element) => element.getClientRects().length > 0)
      if (main === undefined) return
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
    })
  }

  const handleClick_Decide = (decision: AnalyticsConsent_t) => {
    saveConsent(decision, 'banner')
    setConsent(decision)
    hide()
  }

  if (!show) return null

  return (
    <section ref={banner_ref} className={'n4l-cookies-banner fixed-bottom bg-body-tertiary border-top shadow py-3'}
      aria-labelledby={'n4l-cookies-banner-title'}
      data-testid={'Test-CookiesBanner'}>
      <Container className={'n4l-container-wide'}>
        <div className={'d-flex flex-column flex-lg-row align-items-lg-start gap-3'}>
          <div className={'flex-grow-1'}>
            <h2 id={'n4l-cookies-banner-title'} className={'h6 fw-semibold mb-1'} tabIndex={-1}>{t('cookies-policies.banner-title')}</h2>
            <p className={'n4l-cookies-text mb-2'}>
              <Trans i18nKey={'cookies-policies.banner'} />
            </p>
            <details className={'n4l-cookies-details mb-2'}>
              <summary className={'link-primary small'}>{t('cookies-policies.details')}</summary>
              <div className={'pt-2'}>
                <AnalyticsDisclosure />
              </div>
            </details>
            <p className={'small mb-0'}>
              {consent !== null && <span className={'fw-semibold me-2'}>{t('pages.settings.privacy.status-' + consent)}</span>}
              <Link to={'/terms-and-conditions#cookies'} onClick={() => setShow(false)}><Trans i18nKey={'cookies-policies.more-info'} /></Link>
              {/* Un separador que se ve, pero el lector no lee */}
              <span aria-hidden={true}> | </span>
              <Link to={'/settings#privacy'} onClick={() => setShow(false)}><Trans i18nKey={'cookies-policies.settings'} /></Link>
            </p>
          </div>
          <div className={'n4l-cookies-actions d-flex align-items-center gap-2 flex-shrink-0'}>
            <Button variant={'outline-primary'} className={'n4l-cookies-button'} onClick={() => handleClick_Decide('rejected')}
              data-testid={'Test-CookiesReject'}>
              <Trans i18nKey={'cookies-policies.reject'} />
            </Button>
            <Button variant={'primary'} className={'n4l-cookies-button'} onClick={() => handleClick_Decide('accepted')}
              data-testid={'Test-CookiesAccept'}>
              <Trans i18nKey={'cookies-policies.accept'} />
            </Button>
            {/* Ya hay una decisión: se puede cerrar sin cambiarla */}
            {consent !== null && <CloseButton className={'ms-1'} aria-label={t('cookies-policies.close')} onClick={hide} />}
          </div>
        </div>
      </Container>
    </section>
  )
}
