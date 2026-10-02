import { useEffect, useState } from 'react'
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

  // El pie de página permite cambiar la decisión más adelante
  useEffect(() => {
    const open = () => {
      setConsent(readConsent())
      setShow(true)
    }
    window.addEventListener(OPEN_CONSENT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open)
  }, [])

  const handleClick_Decide = (decision: AnalyticsConsent_t) => {
    saveConsent(decision, 'banner')
    setConsent(decision)
    setShow(false)
  }

  if (!show) return null

  return (
    <section className={'n4l-cookies-banner fixed-bottom bg-body-tertiary border-top shadow py-3'}
      aria-labelledby={'n4l-cookies-banner-title'}
      data-testid={'Test-CookiesBanner'}>
      <Container className={'n4l-container-wide'}>
        <div className={'d-flex flex-column flex-lg-row align-items-lg-start gap-3'}>
          <div className={'flex-grow-1'}>
            <h2 id={'n4l-cookies-banner-title'} className={'h6 fw-semibold mb-1'}>{t('cookies-policies.banner-title')}</h2>
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
              {' · '}
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
            {consent !== null && <CloseButton className={'ms-1'} aria-label={t('cookies-policies.close')} onClick={() => setShow(false)} />}
          </div>
        </div>
      </Container>
    </section>
  )
}
