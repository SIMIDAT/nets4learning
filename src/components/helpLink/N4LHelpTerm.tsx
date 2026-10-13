import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Overlay, Popover } from 'react-bootstrap'

import { prefersReducedMotion } from '@core/a11y/displaySettings'

/** Lo que se espera antes de cerrar la ayuda al quitar el ratón: da tiempo a llevarlo hasta ella */
const HIDE_DELAY_MS = 250

/**
 * Término con su definición, que aparece al pasar el ratón, al llegar con el teclado o al pulsarlo (WCAG 1.4.13): se
 * puede llevar el ratón hasta la definición sin que se cierre, se queda mientras se mira y se cierra con Escape. Es un
 * botón (sin otra acción) para que se llegue a él con el tabulador; la definición se le asocia (aria-describedby)
 * mientras se ve
 */
export default function N4LHelpTerm({ label, help }: { label: ReactNode, help: string }) {
  const [show, setShow] = useState(false)
  const target = useRef<HTMLButtonElement>(null)
  const hideTimer = useRef(0)
  const popoverId = useId()

  const open = () => {
    window.clearTimeout(hideTimer.current)
    setShow(true)
  }
  const closeSoon = () => {
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setShow(false), HIDE_DELAY_MS)
  }
  useEffect(() => () => window.clearTimeout(hideTimer.current), [])

  // Escape la cierra sin cerrar también lo que haya debajo (un modal, la guía)
  useEffect(() => {
    if (!show) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setShow(false)
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [show])

  return <>
    <button ref={target} type={'button'} className={'n4l-help-term'} aria-describedby={show ? popoverId : undefined}
      onMouseEnter={open} onMouseLeave={closeSoon} onFocus={open} onBlur={closeSoon}
      // Al pulsarlo (también con el dedo) se abre: el clic le da el foco, y alternar la cerraría nada más abrirse
      onClick={open}>
      {label}
    </button>
    <Overlay target={target} show={show} placement={'top'} transition={prefersReducedMotion() ? false : undefined}>
      <Popover id={popoverId} onMouseEnter={open} onMouseLeave={closeSoon} data-testid={'Test-HelpTerm-Popover'}>
        <Popover.Body>{help}</Popover.Body>
      </Popover>
    </Overlay>
  </>
}
