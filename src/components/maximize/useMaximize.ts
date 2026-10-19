import { useEffect, useState } from 'react'

/**
 * Una tarjeta que se puede maximizar: con `className` en la tarjeta, ocupa toda la pantalla (100dvh) por encima de la
 * barra de navegación (N4LMaximize.css). Escape la devuelve a su sitio y, mientras está maximizada, la página de
 * detrás no se desplaza. El botón es N4LMaximizeButton.
 */
export function useMaximize() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!maximized) return
    const onKeyDown = (event: KeyboardEvent) => {
      // Con un modal abierto encima, Escape es para cerrarlo
      if (event.key === 'Escape' && !document.body.classList.contains('modal-open')) setMaximized(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('n4l-maximized-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('n4l-maximized-open')
    }
  }, [maximized])

  return {
    maximized,
    toggle   : () => setMaximized((value) => !value),
    className: maximized ? 'n4l-maximized' : '',
  }
}
