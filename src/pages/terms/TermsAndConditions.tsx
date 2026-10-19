import { useState, type ReactNode } from 'react'
import { Alert, Button, Card, Container, Nav, Table } from 'react-bootstrap'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { readConsent, saveConsent, type AnalyticsConsent_t } from '@core/analytics'
import AnalyticsDisclosure from '@components/cookiesBanner/AnalyticsDisclosure'
import { VERBOSE } from '@/CONSTANTS'

const prefix = 'pages.terms.'

// Los apartados, en orden: cada uno con su ancla (el enlace "Preferencias de cookies" del pie apunta a #cookies)
const SECTIONS = ['use', 'privacy', 'storage', 'third-parties', 'cookies', 'contact'] as const

// Las cookies que se pueden guardar: la de la decisión siempre; las de Google Analytics, solo si se aceptan
const COOKIES = [
  { name: 'n4l-accept-cookies', key: 'consent' },
  { name: '_ga', key: 'ga' },
  { name: '_ga_<ID>', key: 'ga-session' },
] as const

function Section({ id, children }: { id: string, children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Card className={'mt-3 n4l-terms-section'} id={id}>
      <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + id + '.title')}</h2></Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  )
}

/** Términos de uso, privacidad (qué se procesa y qué se guarda), servicios externos, cookies y contacto */
export default function TermsAndConditions() {
  const { t } = useTranslation()
  const [consent, setConsent] = useState<AnalyticsConsent_t | null>(readConsent)
  // Las listas vienen de la traducción (un elemento por línea)
  const list = (key: string) => {
    const items = t(prefix + key, { returnObjects: true })
    return Array.isArray(items) ? items as string[] : []
  }
  const items = (key: string) => (
    <ul className={'mb-0'}>{list(key).map((item) => <li key={item} className={'mb-1'}>{item}</li>)}</ul>
  )

  const handleClick_Decide = (decision: AnalyticsConsent_t) => {
    saveConsent(decision, 'terms')
    setConsent(decision)
  }

  if (VERBOSE) console.debug('render TermsAndConditions')
  return (
    <main className={'mb-4'} data-title={'TermsAndConditions'}>
      <Container className={'n4l-container-wide'}>
        <h1 className={'mt-3'}>{t(prefix + 'title')}</h1>
        <p className={'text-body-secondary'}>{t(prefix + 'updated')}</p>

        <Alert variant={'info'}>
          <h2 className={'h6'}>{t(prefix + 'summary-title')}</h2>
          {items('summary')}
        </Alert>

        <Nav className={'n4l-terms-nav small'} aria-label={t(prefix + 'index')}>
          {SECTIONS.map((id) => <Nav.Link key={id} href={'#' + id} className={'ps-0 pe-3'}>{t(prefix + id + '.title')}</Nav.Link>)}
        </Nav>

        <Section id={'use'}>{items('use.items')}</Section>

        <Section id={'privacy'}>
          <p>{t(prefix + 'privacy.text')}</p>
          {items('privacy.items')}
        </Section>

        <Section id={'storage'}>
          <p>{t(prefix + 'storage.text')}</p>
          {items('storage.items')}
          <p className={'mt-3 mb-0'}>
            {t(prefix + 'storage.settings')} <Link to={'/settings'}>{t('footer.settings')}</Link>.
          </p>
        </Section>

        <Section id={'third-parties'}>{items('third-parties.items')}</Section>

        <Section id={'cookies'}>
          <p>{t(prefix + 'cookies.text')}</p>
          <Table responsive={true} size={'sm'} className={'small'}>
            <thead>
              <tr>
                <th>{t(prefix + 'cookies.name')}</th>
                <th>{t(prefix + 'cookies.purpose')}</th>
                <th>{t(prefix + 'cookies.duration')}</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map(({ name, key }) => (
                <tr key={name}>
                  <td className={'font-monospace text-nowrap'}>{name}</td>
                  <td>{t(prefix + 'cookies.' + key + '.purpose')}</td>
                  <td className={'text-nowrap'}>{t(prefix + 'cookies.' + key + '.duration')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className={'mb-3'}>
            <AnalyticsDisclosure />
          </div>
          <div className={'d-flex flex-wrap align-items-center gap-2'} data-testid={'Test-TermsConsent'}>
            <span className={'me-2'} role={'status'}>{t('pages.settings.privacy.status-' + (consent ?? 'undecided'))}</span>
            <Button size={'sm'} variant={consent === 'rejected' ? 'secondary' : 'outline-secondary'}
              onClick={() => handleClick_Decide('rejected')}>{t('cookies-policies.reject')}</Button>
            <Button size={'sm'} variant={consent === 'accepted' ? 'primary' : 'outline-primary'}
              onClick={() => handleClick_Decide('accepted')}>{t('cookies-policies.accept')}</Button>
          </div>
        </Section>

        <Section id={'contact'}>
          <p className={'mb-2'}>{t(prefix + 'contact.text')}</p>
          <ul className={'mb-0'}>
            <li><a href={'https://github.com/SIMIDAT/nets4learning/issues'} target={'_blank'} rel={'noreferrer'}>{t(prefix + 'contact.issues')}</a></li>
            <li><a href={'https://simidat.ujaen.es'} target={'_blank'} rel={'noreferrer'}>{t(prefix + 'contact.simidat')}</a></li>
          </ul>
        </Section>
      </Container>
    </main>
  )
}
