import React from 'react'
import { Link } from 'react-router'

type N4LHelpLinkProps = {
  page     : 'glossary' | 'manual'
  action   : string
  children?: React.ReactNode
}

/**
 * Enlace a una sección del glosario o del manual. Se abre en otra pestaña para no perder lo que hay en el
 * playground (dataset procesado, modelos entrenados…). La sección va en la URL (?action=…) porque el `state`
 * del router no llega a una pestaña nueva.
 */
export default function N4LHelpLink({ page, action, children }: N4LHelpLinkProps) {
  return (
    <Link className={'text-info'}
      to={{ pathname: `/${page}/`, search: new URLSearchParams({ action }).toString() }}
      target={'_blank'}
      rel={'noreferrer'}>
      {children}
    </Link>
  )
}
