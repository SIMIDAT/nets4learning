import type { ReactNode } from 'react'
import { Container } from 'react-bootstrap'
import N4LSectionNav from './N4LSectionNav'

type N4LSectionLayoutProps = {
  /** Secciones de la página en orden (las i18nKey de sus N4LDivider) */
  steps     : string[]
  className?: string
  children  : ReactNode
}

/**
 * Contenedor de los entrenadores: en escritorio (xl) el índice de secciones va fijo en una columna estrecha a la
 * izquierda y el contenido se queda con el resto del ancho; en pantallas más estrechas no hay índice.
 */
export default function N4LSectionLayout({ steps, className = '', children }: N4LSectionLayoutProps) {
  return (
    <Container className={`n4l-container-wide ${className}`}>
      <div className={'n4l-section-layout'}>
        <aside className={'d-none d-xl-block'}>
          <N4LSectionNav steps={steps} />
        </aside>
        <div className={'n4l-section-layout-content'}>
          {children}
        </div>
      </div>
    </Container>
  )
}
