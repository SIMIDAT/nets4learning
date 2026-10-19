import type { ReactNode } from 'react'
import { Pagination } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

type N4LPaginationProps = {
  activePage: number
  pageCount : number
  onChange  : (page: number) => void
  className?: string
  /** Nombre de la navegación; con varias tablas en la página, distinto en cada una (por defecto, «Páginas de la tabla») */
  label?    : string
}

// Páginas que se muestran a cada lado de la actual
const OFFSETS = [-3, -2, -1, 0, 1, 2, 3]

/**
 * Paginación de las tablas: primera/anterior, hasta tres páginas a cada lado de la actual y siguiente/última.
 * Las páginas se cuentan desde 0 por dentro y se enseñan desde 1. Con una sola página no se muestra.
 *
 * Las flechas son elementos normales y no Pagination.Next & cía.: estas traen su nombre para el lector de pantalla en
 * inglés («Next») y no se puede cambiar. Va en un <nav> con nombre, la página actual con aria-current y los botones
 * miden al menos 32 px (WCAG 2.5.8 pide 24). Los nombres («Página anterior», «Página 3») van en texto oculto y no en
 * aria-label: la página actual y las flechas desactivadas son un <span>, que no puede llevarlo
 */
export default function N4LPagination({ activePage, pageCount, onChange, className = '', label }: N4LPaginationProps) {
  const { t } = useTranslation()
  if (pageCount <= 1) return null
  const prefix = 'pagination.'
  const pages = OFFSETS.map((offset) => activePage + offset).filter((page) => page >= 0 && page < pageCount)
  const named = (visible: ReactNode, name: string) => <>
    <span aria-hidden={true}>{visible}</span>
    <span className={'visually-hidden'}>{name}</span>
  </>
  const arrow = (key: string, symbol: string, page: number, disabled: boolean) => (
    <Pagination.Item disabled={disabled} onClick={() => onChange(page)} title={t(prefix + key)}>
      {named(symbol, t(prefix + key))}
    </Pagination.Item>
  )
  return (
    <nav aria-label={label ?? t(prefix + 'label')}>
      <Pagination size="sm" className={`justify-content-center n4l-pagination-nav ${className}`.trim()}>
        {arrow('first', '«', 0, activePage <= 0)}
        {arrow('previous', '‹', activePage - 1, activePage - 1 < 0)}
        {pages.map((page) => (
          <Pagination.Item key={page} active={page === activePage} activeLabel={''} onClick={() => onChange(page)}
            aria-current={page === activePage ? 'page' : undefined}>
            {named(page + 1, t(prefix + 'page', { page: page + 1 }))}
          </Pagination.Item>
        ))}
        {arrow('next', '›', activePage + 1, activePage + 1 >= pageCount)}
        {arrow('last', '»', pageCount - 1, activePage + 1 > pageCount - 1)}
      </Pagination>
    </nav>
  )
}
