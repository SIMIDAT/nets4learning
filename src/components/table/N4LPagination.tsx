import { Pagination } from 'react-bootstrap'

type N4LPaginationProps = {
  activePage: number
  pageCount : number
  onChange  : (page: number) => void
  className?: string
}

// Páginas que se muestran a cada lado de la actual
const OFFSETS = [-3, -2, -1, 0, 1, 2, 3]

/** Paginación de las tablas: primera/anterior, tres páginas a cada lado de la actual y siguiente/última. */
export default function N4LPagination({ activePage, pageCount, onChange, className = '' }: N4LPaginationProps) {
  return (
    <Pagination size="sm" className={`justify-content-center ${className}`.trim()}>
      <Pagination.First disabled={activePage <= 0} onClick={() => onChange(0)} />
      <Pagination.Prev disabled={activePage - 1 < 0} onClick={() => onChange(activePage - 1)} />
      {OFFSETS.map((offset) => {
        const page = activePage + offset
        if (offset === 0) {
          return <Pagination.Item key={offset} active={true}>{page}</Pagination.Item>
        }
        const exists = page >= 0 && page < pageCount
        return (
          <Pagination.Item key={offset} disabled={!exists} onClick={() => onChange(page)}>
            {exists ? page : '-'}
          </Pagination.Item>
        )
      })}
      <Pagination.Next disabled={activePage + 1 >= pageCount} onClick={() => onChange(activePage + 1)} />
      <Pagination.Last disabled={activePage + 1 > pageCount - 1} onClick={() => onChange(pageCount - 1)} />
    </Pagination>
  )
}
