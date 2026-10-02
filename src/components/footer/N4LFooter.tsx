import type { MouseEvent } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { openConsentPreferences } from '@core/analytics'

const VITE_PATH = import.meta.env.VITE_PATH

type Person_t = { name: string, href: string }

const DIRECTORS: Person_t[] = [
  { name: 'Antonio Jesús Rivera Rivas', href: 'https://simidat.ujaen.es/es/miembros/arivera/' },
  { name: 'María Dolores Pérez Godoy', href: 'https://simidat.ujaen.es/es/miembros/lperez/' },
  { name: 'María José del Jesus Díaz', href: 'https://simidat.ujaen.es/es/miembros/mjjesus/' },
]

const DEVELOPERS: Person_t[] = [
  { name: 'Antonio Mudarra Machuca', href: 'https://github.com/nonodev96/' },
  { name: 'David Valdivia Vico', href: 'https://github.com/Davavico22' },
  { name: 'Carlos Requena', href: 'https://github.com/El-Requedaddy' },
]

// Logos a 88 px de alto (el doble de lo que se ven, para pantallas de doble densidad): los originales pesan mucho más
const INSTITUTIONS = [
  { name: 'SIMIDAT', href: 'https://simidat.ujaen.es', src: '/assets/footer/SIMIDAT.png' },
  { name: 'Universidad de Jaén', href: 'https://ujaen.es', src: '/assets/uja.svg' },
  { name: 'DaSCI', href: 'https://dasci.es', src: '/assets/footer/DaSCI.png' },
]

// Enlaces discretos: subrayado tenue que se marca al pasar el ratón
const LINK_CLASS = 'link-secondary link-underline-opacity-25 link-underline-opacity-100-hover'

function People({ title, people }: { title: string, people: Person_t[] }) {
  return <>
    <dt className={'n4l-footer-label'}>{title}</dt>
    <dd>
      {people.map((person, index) => (
        <span key={person.href}>
          {index > 0 && ', '}
          <a href={person.href} target={'_blank'} rel={'noreferrer'} className={LINK_CLASS}>{person.name}</a>
        </span>
      ))}
    </dd>
  </>
}

export default function N4LFooter() {
  const { t } = useTranslation()

  // Un enlace de verdad (se puede abrir en otra pestaña: lleva a la política de cookies); con un clic normal abre las
  // preferencias para cambiar el consentimiento
  const handleClick_CookiePreferences = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    openConsentPreferences()
  }

  return (
    <footer className={'n4l-footer bg-body-tertiary border-top mt-auto'}>
      <Container className={'py-4 n4l-container-wide'}>
        <Row className={'g-4'}>
          <Col xs={12} lg={5}>
            <h2 className={'n4l-footer-brand'}>
              <img src={VITE_PATH + '/logo-64.png'} width={32} height={32} alt={''} />
              Nets4Learning
            </h2>
            <p className={'text-body-secondary mb-2'}><Trans i18nKey={'footer.description-app'} /></p>
            {/* Cita del artículo que describe la plataforma (igual en todos los idiomas) */}
            <p className={'small text-body-secondary mb-0'}>
              Mudarra Machuca et al. (2024).{' '}
              <a href={'https://doi.org/10.3390/electronics13224378'} target={'_blank'} rel={'noreferrer'} className={LINK_CLASS}>
                Nets4Learning: A Web Platform for Designing and Testing ANN/DNN Models
              </a>. <i>Electronics</i>, 13(22), 4378.
            </p>
          </Col>

          <Col xs={12} sm={7} lg={4}>
            <h2 className={'n4l-footer-heading'}><Trans i18nKey={'footer.about-us'} /></h2>
            <dl className={'mb-0'}>
              <People title={t('footer.directors')} people={DIRECTORS} />
              <People title={t('footer.developers')} people={DEVELOPERS} />
            </dl>
          </Col>

          <Col xs={12} sm={5} lg={3}>
            <h2 className={'n4l-footer-heading'}><Trans i18nKey={'footer.links'} /></h2>
            <ul className={'n4l-footer-links'}>
              <li><Link to={'/settings'} className={LINK_CLASS}><Trans i18nKey={'footer.settings'} /></Link></li>
              <li><Link to={'/contribute'} className={LINK_CLASS}><Trans i18nKey={'footer.contribute'} /></Link></li>
              <li><Link to={'/version'} className={LINK_CLASS}><Trans i18nKey={'footer.version'} /></Link></li>
              <li><Link to={'/terms-and-conditions'} className={LINK_CLASS}><Trans i18nKey={'footer.terms'} /></Link></li>
              <li>
                <a href={VITE_PATH + '/terms-and-conditions#cookies'} className={LINK_CLASS} onClick={handleClick_CookiePreferences}>
                  <Trans i18nKey={'footer.cookies'} />
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <ul className={'n4l-footer-logos'} aria-label={t('footer.institutions')}>
          {INSTITUTIONS.map(({ name, href, src }) => (
            <li key={href}>
              <a href={href} target={'_blank'} rel={'noreferrer'} className={'n4l-footer-logo-link'}>
                <img src={VITE_PATH + src} alt={name} className={'n4l-footer-logo'} />
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  )
}
