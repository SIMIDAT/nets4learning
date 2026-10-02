import { useEffect, useState, type MouseEvent } from 'react'
import { sectionId } from './sectionId'

// Una sección pasa a ser la actual cuando su título sube por encima de esta parte de la ventana
const ACTIVE_LINE = 0.25

/**
 * La sección que se está viendo: la última cuyo separador ya ha pasado la línea; al final de la página, la última
 * (puede ser corta y no llegar nunca arriba). `started`: el separador de la primera sección ya ha subido por debajo de
 * la barra de navegación (el título de la página ya no se ve).
 */
export function useActiveSection(steps: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  // Las páginas crean `steps` en cada render: el efecto depende de su contenido, no del array
  const stepsKey = steps.join('|')

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
      // Por debajo de la barra de navegación, que va fija arriba
      const navbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--n4l-navbar-height')) || 0
      setStarted(elements[0].getBoundingClientRect().top < navbarHeight)
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

  return { activeId, started }
}

/** Lleva a la sección (y le da el foco) en vez de saltar al ancla */
export function goToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const element = document.getElementById(id)
  if (element === null) return
  event.preventDefault()
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  // El foco va a la sección, para seguir con el teclado desde ahí
  element.focus({ preventScroll: true })
}
