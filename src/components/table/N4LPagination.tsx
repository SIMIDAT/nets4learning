import { Pagination } from 'react-bootstrap'

type N4LPaginationProps = {
  activePage: number
  pageCount : number
  onChange  : (page: number) => void
  className?: string
}

// Páginas que se muestran a cada lado de la actual
const OFFSETS = [-3, -2, -1, 0, 1, 2, 3]

/**
 * Paginación de las tablas: primera/anterior, hasta tres páginas a cada lado de la actual y siguiente/última.
 * Las páginas se cuentan desde 0 por dentro y se enseñan desde 1. Con una sola página no se muestra.
 */
export default function N4LPagination({ activePage, pageCount, onChange, className = '' }: N4LPaginationProps) {
  if (pageCount <= 1) return null
  const pages = OFFSETS.map((offset) => activePage + offset).filter((page) => page >= 0 && page < pageCount)
  return (
    <Pagination size="sm" className={`justify-content-center ${className}`.trim()}>
      <Pagination.First disabled={activePage <= 0} onClick={() => onChange(0)} />
      <Pagination.Prev disabled={activePage - 1 < 0} onClick={() => onChange(activePage - 1)} />
      {pages.map((page) => (
        <Pagination.Item key={page} active={page === activePage} onClick={() => onChange(page)}>
          {page + 1}
        </Pagination.Item>
      ))}
      <Pagination.Next disabled={activePage + 1 >= pageCount} onClick={() => onChange(activePage + 1)} />
      <Pagination.Last disabled={activePage + 1 > pageCount - 1} onClick={() => onChange(pageCount - 1)} />
    </Pagination>
  )
}
