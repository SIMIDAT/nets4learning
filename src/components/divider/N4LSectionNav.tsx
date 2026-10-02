import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { sectionId } from './sectionId'
import { goToSection } from './useActiveSection'

type N4LSectionNavProps = {
  /** Secciones de la página en orden (las i18nKey de sus N4LDivider) */
  steps   : string[]
  /** id del separador de la sección que se está viendo (useActiveSection) */
  activeId: string | null
}

/**
 * Índice de la página en escritorio: un enlace por sección, con la que se está viendo marcada. Va fijo (sticky) en su
 * columna mientras se baja por la página.
 */
export default function N4LSectionNav({ steps, activeId }: N4LSectionNavProps) {
  const { t } = useTranslation()

  return (
    <nav className={'n4l-section-nav'} aria-label={t('hr.on-this-page')}>
      <p className={'n4l-section-nav-title'}>{t('hr.on-this-page')}</p>
      <ol>
        {steps.map((step, index) => {
          const id = sectionId(step)
          const isActive = id === activeId
          return (
            <li key={step}>
              <a href={`#${id}`}
                className={`n4l-section-nav-link${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(event) => goToSection(event, id)}>
                {index + 1}. {t(step)}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * El mismo índice en pantallas estrechas: una barra fija arriba con una pestaña por sección que se desliza en
 * horizontal; la de la sección que se está viendo se queda siempre a la vista.
 */
export function N4LSectionBar({ steps, activeId }: N4LSectionNavProps) {
  const { t } = useTranslation()
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('.active')
    if (!list || !active) return
    const left = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    list.scrollTo?.({ left: Math.max(0, left), behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [activeId])

  return (
    <nav className={'n4l-section-bar'} aria-label={t('hr.on-this-page')} data-testid={'Test-SectionBar'}>
      <ol ref={listRef}>
        {steps.map((step, index) => {
          const id = sectionId(step)
          const isActive = id === activeId
          return (
            <li key={step}>
              <a href={`#${id}`}
                className={`n4l-section-bar-link${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(event) => goToSection(event, id)}>
                {index + 1}. {t(step)}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
