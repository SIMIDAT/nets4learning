import type { ReactNode } from 'react'
import { Alert } from 'react-bootstrap'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import { BoxArrowUpRight, ChevronRight } from 'react-bootstrap-icons'

import N4LSectionLayout from '@components/divider/N4LSectionLayout'
import N4LDivider from '@components/divider/N4LDivider'
import { sectionId } from '@components/divider/sectionId'
import { goToSection } from '@components/divider/useActiveSection'

const prefix = 'pages.accessibility.'

/** Para comunicar una barrera: una incidencia con la plantilla de accesibilidad (.github/ISSUE_TEMPLATE) */
const ISSUE_URL = 'https://github.com/SIMIDAT/nets4learning/issues/new?template=accessibility.md'
const SIMIDAT_URL = 'https://simidat.ujaen.es'

// Los apartados, en orden y con su ancla (/accessibility#feedback…)
const SECTIONS = ['status', 'not-accessible', 'use', 'feedback', 'preparation'] as const
const STEPS = SECTIONS.map((id) => prefix + id + '.title')

type NotAccessible_t = { problem: string, instead: string }

/** Un apartado: su ancla corta (#feedback), el título numerado y el índice de la página (N4LDivider) */
function Section({ id, children }: { id: typeof SECTIONS[number], children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={sectionId(prefix + id + '.title')} className={'n4l-a11y-section'}>
      <N4LDivider i18nKey={prefix + id + '.title'} steps={STEPS} />
      {children}
    </section>
  )
}

/** Un enlace que se abre en otra pestaña, como botón; lo dice (con un icono y, para el lector, con palabras) */
function ExternalButton({ href, variant, children }: { href: string, variant: 'primary' | 'outline-primary', children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <a href={href} target={'_blank'} rel={'noreferrer'} className={`btn btn-${variant} d-inline-flex align-items-center justify-content-center gap-2`}>
      {children}
      <BoxArrowUpRight aria-hidden={true} className={'flex-shrink-0'} />
      <span className={'visually-hidden'}>{t(prefix + 'new-tab')}</span>
    </a>
  )
}

/**
 * Declaración de accesibilidad (según el modelo de la Decisión de Ejecución (UE) 2018/1523): cuánto cumple la
 * aplicación, qué no es accesible y qué usar en su lugar, cómo usarla con teclado, lector de pantalla y los ajustes,
 * cómo comunicar una barrera y cómo se ha preparado y se revisa. Con el índice de las páginas largas: a un lado en
 * pantallas anchas y, en el móvil, arriba en una lista y en una barra fija al bajar
 */
export default function Accessibility() {
  const { t } = useTranslation()
  // Las listas vienen de la traducción (un elemento por línea)
  const list = <T = string,>(key: string): T[] => {
    const items = t(prefix + key, { returnObjects: true })
    return Array.isArray(items) ? items as T[] : []
  }
  const items = (key: string) => (
    <ul className={'n4l-a11y-list'}>{list(key).map((item) => <li key={item}>{item}</li>)}</ul>
  )

  return (
    <main className={'mb-4'} data-title={'Accessibility'} data-testid={'Test-Accessibility'}>
      <N4LSectionLayout steps={STEPS} wide={false}>
        <h1 className={'mt-3'}>{t(prefix + 'title')}</h1>
        <p className={'text-body-secondary'}>{t(prefix + 'updated')}</p>

        <Alert variant={'info'} className={'n4l-a11y-summary'}>
          <h2 className={'h6'}>{t(prefix + 'summary-title')}</h2>
          <ul className={'n4l-a11y-list mb-0'}>{list('summary').map((item) => <li key={item}>{item}</li>)}</ul>
        </Alert>

        {/* En pantallas estrechas, el índice también arriba (en las anchas va a un lado): filas cómodas para el dedo */}
        <nav className={'d-xl-none mb-2'} aria-label={t(prefix + 'index')} data-testid={'Test-Accessibility-Index'}>
          <h2 className={'h6'}>{t('hr.on-this-page')}</h2>
          <ol className={'list-group'}>
            {SECTIONS.map((id, index) => (
              <li key={id} className={'list-group-item p-0'}>
                <a href={'#' + id} className={'list-group-item-action n4l-a11y-index-link'}
                  onClick={(event) => goToSection(event, sectionId(prefix + id + '.title'))}>
                  <span className={'flex-grow-1'}>{index + 1}. {t(prefix + id + '.title')}</span>
                  <ChevronRight aria-hidden={true} className={'flex-shrink-0'} />
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id={'status'}>
          <p>{t(prefix + 'status.text')}</p>
          <p>{t(prefix + 'status.standard')}</p>
        </Section>

        <Section id={'not-accessible'}>
          <p>{t(prefix + 'not-accessible.text')}</p>
          {/* Cada problema y, aparte, qué usar en su lugar */}
          <ul className={'list-unstyled n4l-a11y-problems'}>
            {list<NotAccessible_t>('not-accessible.items').map(({ problem, instead }) => (
              <li key={problem}>
                <p className={'mb-1'}>{problem}</p>
                <p className={'mb-0'}><strong>{t(prefix + 'not-accessible.instead')}</strong> {instead}</p>
              </li>
            ))}
          </ul>
          <p className={'small text-body-secondary'}>{t(prefix + 'not-accessible.out-of-scope')}</p>
        </Section>

        <Section id={'use'}>
          <h3 className={'h6'}>{t(prefix + 'use.keyboard-title')}</h3>
          <ul className={'n4l-a11y-list'}>
            {list('use.keyboard').map((_item, index) => (
              <li key={index}><Trans i18nKey={prefix + 'use.keyboard.' + index} components={{ kbd: <kbd /> }} /></li>
            ))}
          </ul>
          <h3 className={'h6'}>{t(prefix + 'use.reader-title')}</h3>
          {items('use.reader')}
          <h3 className={'h6'}>{t(prefix + 'use.settings-title')}</h3>
          <p>{t(prefix + 'use.settings')}</p>
          <Link to={'/settings#accessibility'} className={'btn btn-outline-primary'}>{t(prefix + 'use.settings-link')}</Link>
        </Section>

        <Section id={'feedback'}>
          <p>{t(prefix + 'feedback.text')}</p>
          {items('feedback.items')}
          {/* Lo principal de la página: botones grandes, a todo el ancho en el móvil; si no caben en una fila, en dos */}
          <div className={'d-grid gap-2 d-sm-flex flex-sm-wrap mb-3'}>
            <ExternalButton href={ISSUE_URL} variant={'primary'}>{t(prefix + 'feedback.issue')}</ExternalButton>
            <ExternalButton href={SIMIDAT_URL} variant={'outline-primary'}>{t(prefix + 'feedback.simidat')}</ExternalButton>
          </div>
          <p>{t(prefix + 'feedback.response')}</p>
        </Section>

        <Section id={'preparation'}>
          {items('preparation.items')}
          <p className={'mb-0'}>{t(prefix + 'preparation.review')}</p>
        </Section>
      </N4LSectionLayout>
    </main>
  )
}
