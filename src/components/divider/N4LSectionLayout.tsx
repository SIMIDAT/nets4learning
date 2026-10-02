import type { ReactNode } from 'react'
import { Container } from 'react-bootstrap'
import N4LSectionNav, { N4LSectionBar } from './N4LSectionNav'
import { useActiveSection } from './useActiveSection'

type N4LSectionLayoutProps = {
  /** Secciones de la página en orden (las i18nKey de sus N4LDivider) */
  steps     : string[]
  /** Contenedor ancho (páginas de trabajo); sin él, el ancho de Bootstrap (páginas de lectura, como el glosario) */
  wide?     : boolean
  className?: string
  children  : ReactNode
}

/**
 * Contenedor de los entrenadores: en escritorio (xl) el índice de secciones va fijo en una columna estrecha a la
 * izquierda y el contenido se queda con el resto del ancho; en pantallas más estrechas el índice es una barra que
 * aparece arriba al bajar de la cabecera de la página y se desliza en horizontal.
 */
export default function N4LSectionLayout({ steps, wide = true, className = '', children }: N4LSectionLayoutProps) {
  const { activeId, started } = useActiveSection(steps)
  return (
    <Container className={`${wide ? 'n4l-container-wide' : ''} ${className}`}>
      <div className={'n4l-section-layout'}>
        <div className={`d-xl-none n4l-section-bar-wrapper${started ? ' is-visible' : ''}`} inert={!started}>
          <N4LSectionBar steps={steps} activeId={activeId} />
        </div>
        <aside className={'d-none d-xl-block'}>
          <N4LSectionNav steps={steps} activeId={activeId} />
        </aside>
        <div className={'n4l-section-layout-content'}>
          {children}
        </div>
      </div>
    </Container>
  )
}
