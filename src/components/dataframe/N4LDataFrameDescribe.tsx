import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type * as dfd from 'danfojs'

import { DataFrameDescribeTable } from '@core/dataframe/DataFrameTable'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'

type N4LDataFrameDescribeProps = {
  dataframe: dfd.DataFrame
  /** Columna objetivo: su fila se resalta. Por defecto la última del dataframe; null para ninguna */
  target?  : string | null
}

/** describe() de danfo con una fila por columna numérica (count, mean, std…) y la del objetivo resaltada */
export default function N4LDataFrameDescribe({ dataframe, target }: N4LDataFrameDescribeProps) {
  const { t } = useTranslation()
  const describe = useMemo(() => (dataframe.columns.length > 0 ? DataFrameDescribeTable(dataframe) : null), [dataframe])
  const targetRow = target === undefined ? dataframe.columns[dataframe.columns.length - 1] ?? null : target

  if (describe === null) return <p className={'text-body-secondary'}>{t('dataframe.describe.no-numeric')}</p>
  return (
    <N4LDataFrameTable dataframe={describe}
      target={targetRow}
      targetAxis={'row'}
      indexHeader={t('dataframe.table.column')}
      maxRows={20}
      showShape={false} />
  )
}
