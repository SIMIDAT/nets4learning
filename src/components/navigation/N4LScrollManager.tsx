import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

import { scrollAction, type Place_t, type ScrollAction_t } from '@components/navigation/scrollAction'

// El scroll al cambiar de página. BrowserRouter no lo toca: sin esto, la página nueva se ve a la altura a la que estaba
// la anterior y parece que no se ha cambiado. Las navegaciones dentro de la misma página (secciones, ?task=…) no son
// cosa de este componente: las lleva cada página.

/** Lo que se espera a que la página (que se carga aparte) tenga el alto o la sección a la que se va */
const WAIT_MS = 3000

const scrollToY = (top: number) => window.scrollTo({ top, left: 0, behavior: 'instant' })

/** El foco, al título de la página nueva (los lectores de pantalla la anuncian), si la página no lo ha puesto en otro sitio */
function focusPage(target: HTMLElement | null) {
  const main = document.querySelector('main')
  if (main === null || main.contains(document.activeElement)) return
  const element = target ?? main.querySelector<HTMLElement>('h1') ?? main
  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1')
  element.focus({ preventScroll: true })
}

/** Hace scroll según la navegación y recuerda dónde se estaba en cada página para volver con atrás y adelante */
export default function N4LScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previous = useRef<Place_t | null>(null)
  const positions = useRef(new Map<string, number>())
  const currentKey = useRef(location.key)
  // Lo decidido para la navegación actual: si el efecto se repite (modo estricto de React), se repite lo mismo
  const handled = useRef<{ key: string, action: ScrollAction_t, isPageChange: boolean } | null>(null)

  // Dónde se está en la página actual (para volver a ella con atrás)
  useEffect(() => {
    let frame = 0
    const save = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => positions.current.set(currentKey.current, window.scrollY))
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', save)
    }
  }, [])

  // Antes de pintar la página nueva, para que no se vea un momento a la altura de la anterior
  useLayoutEffect(() => {
    if (handled.current?.key !== location.key) {
      const action = scrollAction(previous.current, location, navigationType, positions.current.get(location.key))
      handled.current = { key: location.key, action, isPageChange: previous.current !== null && previous.current.pathname !== location.pathname }
      previous.current = { pathname: location.pathname, hash: location.hash }
      currentKey.current = location.key
      if (action.type === 'top') scrollToY(0)
    }
    const { action, isPageChange } = handled.current
    if (action.type === 'none') return

    // La sección o el alto al que se vuelve pueden no estar todavía (la página se carga aparte): se espera un poco, y si
    // quien usa la página se mueve mientras tanto, se deja de esperar
    let frame = 0
    let isCancelled = false
    const cancel = () => { isCancelled = true }
    const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const
    userEvents.forEach((name) => window.addEventListener(name, cancel, { passive: true, once: true }))
    const startedAt = performance.now()
    const attempt = () => {
      if (isCancelled) return
      const isLate = performance.now() - startedAt > WAIT_MS
      if (action.type === 'hash') {
        const element = document.getElementById(action.id)
        if (element !== null) {
          element.scrollIntoView({ block: 'start', behavior: 'instant' })
          if (isPageChange) focusPage(element)
          return
        }
      } else if (action.type === 'restore') {
        const maxY = document.documentElement.scrollHeight - window.innerHeight
        if (maxY >= action.y || isLate) {
          scrollToY(Math.min(action.y, Math.max(0, maxY)))
          focusPage(null)
          return
        }
      } else if (document.querySelector('main') !== null || isLate) {
        focusPage(null)
        return
      }
      if (!isLate) frame = requestAnimationFrame(attempt)
    }
    attempt()
    return () => {
      cancelAnimationFrame(frame)
      cancel()
      userEvents.forEach((name) => window.removeEventListener(name, cancel))
    }
  }, [location, navigationType])

  return null
}
