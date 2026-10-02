import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type * as dfd from 'danfojs'

import { useTheme } from '@hooks/useTheme'
import { scheduleIdle } from '@core/scheduler/idleQueue'
import {
  DEFAULT_MAX_ROWS,
  DataFrameTablePlot,
  DataFrameTablePurge,
  DataFrameTableResize,
  resolveTableTarget,
  type DataFrameTableOptions_t,
} from '@core/dataframe/DataFrameTable'

type N4LDataFrameTableProps = Omit<DataFrameTableOptions_t, 'theme' | 'fontFamily'> & {
  dataframe : dfd.DataFrame
  /** Número de filas y columnas bajo la tabla (por defecto sí) */
  showShape?: boolean
  className?: string
}

/**
 * Un dataframe como tabla de Plotly con los colores del tema: la columna objetivo resaltada (por defecto la última) y
 * debajo qué significa ese color y el tamaño del dataframe.
 */
export default function N4LDataFrameTable({
  dataframe,
  target,
  targetAxis = 'column',
  index = true,
  indexHeader,
  subtitles = null,
  maxRows = DEFAULT_MAX_ROWS,
  title,
  showShape = true,
  className = '',
}: N4LDataFrameTableProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  // Se dibuja cuando el navegador está libre: con varias tablas y gráficos, cada uno en su propia tarea corta
  useEffect(() => {
    if (ref.current === null || dataframe.columns.length === 0) return
    const element = ref.current
    return scheduleIdle(() => DataFrameTablePlot(element, dataframe, { target, targetAxis, index, indexHeader, subtitles, maxRows, title, theme }))
  }, [dataframe, target, targetAxis, index, indexHeader, subtitles, maxRows, title, theme])

  // Plotly solo se ajusta al redimensionar la ventana: si la tabla se dibuja oculta (en un <details> cerrado, en una
  // pestaña) o cambia el ancho de la columna, se ajusta al cambiar el tamaño del contenedor
  useEffect(() => {
    const element = ref.current
    let observer: ResizeObserver | undefined
    if (element !== null && typeof ResizeObserver !== 'undefined') {
      let width = element.clientWidth
      observer = new ResizeObserver(() => {
        if (element.clientWidth === width) return
        width = element.clientWidth
        DataFrameTableResize(element)
      })
      observer.observe(element)
    }
    return () => {
      observer?.disconnect()
      DataFrameTablePurge(element)
    }
  }, [])

  const highlighted = resolveTableTarget(dataframe, { target, targetAxis })
  const [rows, columns] = dataframe.columns.length === 0 ? [0, 0] : dataframe.shape
  return (
    <div className={className} data-testid={'Test-DataFrameTable'}>
      <div ref={ref} />
      {(highlighted !== null || showShape) &&
        <p className={'n4l-dataframe-table-caption'}>
          {highlighted !== null && <span data-testid={'Test-DataFrameTable-target'}>
            <span className={'n4l-target-swatch'} aria-hidden={true} />
            <Trans i18nKey={'dataframe.table.target'} values={{ column: highlighted }} components={{ code: <code /> }} />
          </span>}
          {showShape && <span>
            {t('dataframe.table.shape', { rows, columns })}
            {rows > maxRows && <> · {t('dataframe.table.scroll-rows')}</>}
          </span>}
        </p>}
    </div>
  )
}
