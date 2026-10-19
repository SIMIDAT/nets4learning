import { useTranslation } from 'react-i18next'

/** El id de lo que rodea a las páginas (App.tsx): el destino del enlace, aunque lo que recibe el foco es su <main> */
export const SKIP_LINK_TARGET = 'n4l-content'

/**
 * «Saltar al contenido» (WCAG 2.4.1): el primer elemento al que se llega con el tabulador, solo visible entonces. Lleva
 * el foco al <main> que se ve, sin pasar por los enlaces y menús de la barra de navegación. No cambia la dirección
 * (seguir el enlace la cambiaría y el router lo trataría como otra navegación)
 */
export default function N4LSkipLink() {
  const { t } = useTranslation()

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    // Mientras carga una página, React deja la anterior oculta: la que cuenta es la que se ve
    const main = Array.from(document.querySelectorAll('main')).find((element) => element.getClientRects().length > 0)
    if (main === undefined) return
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
    main.focus({ preventScroll: true })
    main.scrollIntoView({ block: 'start' })
  }

  return (
    <a href={'#' + SKIP_LINK_TARGET} className={'visually-hidden-focusable n4l-skip-link'} onClick={handleClick} data-testid={'Test-SkipLink'}>
      {t('skip-to-content')}
    </a>
  )
}
