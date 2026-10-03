import { useMemo, useState } from 'react'
import { Nav } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import * as dfd from 'danfojs'

import type * as _Types from '@core/types'
import N4LTablePagination from '@components/table/N4LTablePagination'

type View_t = 'original' | 'encoded' | 'scaled'
const VIEWS: View_t[] = ['original', 'encoded', 'scaled']
const prefix = 'dataset-view.'

// Los valores escalados, con estos decimales: con todos no se leen
const DECIMALS = 3

type N4LDatasetViewsProps = {
  dataset: _Types.DatasetProcessed_t
}

/**
 * Un conjunto de datos ya procesado, en las tres formas por las que pasa: tal cual está en el fichero; codificado (cada
 * categoría convertida en un número y sin las columnas que no se usan); y escalado, que es exactamente lo que recibe la
 * red, junto a lo que tiene que predecir. La columna que se predice va resaltada.
 */
export default function N4LDatasetViews({ dataset }: N4LDatasetViewsProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<View_t>('original')
  const processed = dataset.data_processed
  const target = processed?.column_name_target ?? null

  const table = useMemo(() => {
    if (view === 'original' || view === 'encoded' || processed === undefined) {
      const dataframe = view === 'encoded' ? dataset.dataframe_processed : dataset.dataframe_original
      return { head: dataframe.columns, body: dataframe.values as Array<Array<string | number>>, rows: dataframe.shape[0], columns: dataframe.shape[1] }
    }
    // Las entradas escaladas y, al final, lo que se predice (eso no se escala)
    const inputs = processed.X.values as number[][]
    const targets = (processed.y.values as Array<number | number[]>)
    const round = (value: number) => Math.round(value * 10 ** DECIMALS) / 10 ** DECIMALS
    return {
      head   : [...processed.X.columns, processed.column_name_target],
      body   : inputs.map((row, index) => [...row.map(round), Array.isArray(targets[index]) ? (targets[index] as number[]).join(', ') : targets[index] as number]),
      rows   : processed.X.shape[0],
      columns: processed.X.shape[1],
    }
  }, [view, dataset, processed])

  const scaler = processed?.scaler instanceof dfd.StandardScaler ? 'standard-scaler' : 'min-max-scaler'

  return (
    <>
      <Nav variant={'tabs'} activeKey={view} onSelect={(key) => setView((key as View_t | null) ?? 'original')} className={'mb-2'}
        data-testid={'Test-DatasetViews'}>
        {VIEWS.map((key) => (
          <Nav.Item key={key}>
            <Nav.Link eventKey={key} disabled={key !== 'original' && processed === undefined}>{t(prefix + key)}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <p className={'small text-body-secondary mb-2'} data-testid={'Test-DatasetViews-Help'}>
        {t(prefix + view + '-help', {
          rows   : table.rows,
          columns: table.columns,
          target : target ?? '',
          scaler : t('dataset-process.scalers.' + scaler + '.name'),
        })}
      </p>
      <div className={'overflow-x-auto'}>
        <N4LTablePagination key={view} data_head={table.head} data_body={table.body}
          highlight_column={target === null ? -1 : table.head.indexOf(target)} />
      </div>
    </>
  )
}
