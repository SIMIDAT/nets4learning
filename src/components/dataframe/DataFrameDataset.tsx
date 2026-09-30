import * as dfd from 'danfojs'
import N4LTablePagination from '@components/table/N4LTablePagination'
import { DataFrameIterRows } from '@core/dataframe/DataFrameUtils'

type DataFrameDatasetProps = {
  dataframe: dfd.DataFrame
}

/** Tabla paginada con las filas de un dataframe. */
export default function DataFrameDataset({ dataframe }: DataFrameDatasetProps) {
  return <N4LTablePagination data_head={dataframe.columns} data_body={DataFrameIterRows(dataframe)} />
}
