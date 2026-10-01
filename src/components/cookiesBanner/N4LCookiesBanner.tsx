import { useEffect, useState } from 'react'
import { Button, Container } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'

import { OPEN_CONSENT_EVENT, readConsent, saveConsent, type AnalyticsConsent_t } from '@core/analytics'

/**
 * Aviso de cookies en la parte de abajo. No bloquea la página: se puede seguir usando sin decidir, y
 * mientras tanto no se carga Google Analytics. Aceptar y rechazar están al mismo nivel.
 */
export default function N4LCookiesBanner() {
  const { t } = useTranslation()
  const [show, setShow] = useState(() => readConsent() === null)

  // El pie de página permite cambiar la decisión más adelante
  useEffect(() => {
    const open = () => setShow(true)
    window.addEventListener(OPEN_CONSENT_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open)
  }, [])

  const handleClick_Decide = (consent: AnalyticsConsent_t) => {
    saveConsent(consent)
    setShow(false)
  }

  if (!show) return null

  return (
    <section className={'n4l-cookies-banner fixed-bottom bg-body-tertiary border-top shadow py-3'}
      aria-label={t('cookies-policies.title')}
      data-testid={'Test-CookiesBanner'}>
      <Container className={'d-flex flex-column flex-md-row align-items-md-center gap-3 n4l-container-wide'}>
        <p className={'mb-0 flex-grow-1'}>
          <Trans i18nKey={'cookies-policies.banner'} />{' '}
          <Link to={'/terms-and-conditions'}><Trans i18nKey={'cookies-policies.more-info'} /></Link>
        </p>
        <div className={'d-flex gap-2 flex-shrink-0'}>
          <Button variant={'outline-primary'} onClick={() => handleClick_Decide('rejected')}>
            <Trans i18nKey={'cookies-policies.reject'} />
          </Button>
          <Button variant={'primary'} onClick={() => handleClick_Decide('accepted')}>
            <Trans i18nKey={'cookies-policies.accept'} />
          </Button>
        </div>
      </Container>
    </section>
  )
}
