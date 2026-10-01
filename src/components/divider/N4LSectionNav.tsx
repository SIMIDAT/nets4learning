import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { sectionId } from './sectionId'

type N4LSectionNavProps = {
  /** Secciones de la página en orden (las i18nKey de sus N4LDivider) */
  steps: string[]
}

// Una sección pasa a ser la actual cuando su título sube por encima de esta parte de la ventana
const ACTIVE_LINE = 0.25

/**
 * Índice de la página: un enlace por sección, con la que se está viendo marcada. Va fijo (sticky) en su columna
 * mientras se baja por la página.
 */
export default function N4LSectionNav({ steps }: N4LSectionNavProps) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<string | null>(null)
  // Las páginas crean `steps` en cada render: el efecto depende de su contenido, no del array
  const stepsKey = steps.join('|')

  // La actual es la última cuyo separador ya ha pasado la línea; al final de la página, la última (puede ser corta
  // y no llegar nunca arriba)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const elements = stepsKey.split('|').map((step) => document.getElementById(sectionId(step))).filter((element) => element !== null)
      if (elements.length === 0) return
      let current = elements[0].id
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= window.innerHeight * ACTIVE_LINE) current = element.id
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      setActiveId(atBottom ? elements[elements.length - 1].id : current)
    }
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // El contenido cambia de alto sin hacer scroll (acordeones, modelos nuevos, gráficas…)
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    resizeObserver?.observe(document.body)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resizeObserver?.disconnect()
    }
  }, [stepsKey])

  const handleClick_Section = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id)
    if (element === null) return
    event.preventDefault()
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    // El foco va a la sección, para seguir con el teclado desde ahí
    element.focus({ preventScroll: true })
  }

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
                onClick={(event) => handleClick_Section(event, id)}>
                {index + 1}. {t(step)}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
