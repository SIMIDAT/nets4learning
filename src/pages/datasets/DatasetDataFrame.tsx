import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type * as dfd from 'danfojs'

import { DataFrameReadCSV } from '@core/dataframe/DataFrameUtils'
import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'
import N4LDataFrameDescribe from '@components/dataframe/N4LDataFrameDescribe'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { datasetVariables, defaultTarget } from '@pages/analyze/projectDatasets'

// Cada CSV se lee una vez: las pestañas "Datos" y "Estadísticas" (y volver a abrir el modal) usan el mismo dataframe
const dataframes = new Map<string, Promise<dfd.DataFrame>>()

function readCSV(file: string): Promise<dfd.DataFrame> {
  let dataframe = dataframes.get(file)
  if (dataframe === undefined) {
    dataframe = DataFrameReadCSV(import.meta.env.VITE_PATH + '/' + file)
    // Si falla, la próxima vez se vuelve a intentar
    dataframe.catch(() => dataframes.delete(file))
    dataframes.set(file, dataframe)
  }
  return dataframe
}

type DatasetDataFrameProps = {
  /** CSV relativo a public/ */
  file: string
  /** 'data': todas las filas; 'describe': describe() de las columnas numéricas */
  view: 'data' | 'describe'
}

type Loaded_t = { file: string, dataframe: dfd.DataFrame } | { file: string, error: true }

/**
 * El CSV de un conjunto de datos como tabla (con el tipo de cada columna) o su describe(), con la variable objetivo
 * resaltada (la de su ficha de variables; si no tiene, la última columna). Se carga aparte (danfo.js es grande): solo
 * al abrir la pestaña.
 */
export default function DatasetDataFrame({ file, view }: DatasetDataFrameProps) {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState<Loaded_t | null>(null)

  useEffect(() => {
    let active = true
    readCSV(file).then(
      (dataframe) => { if (active) setLoaded({ file, dataframe }) },
      (error) => {
        console.error(error)
        if (active) setLoaded({ file, error: true })
      },
    )
    return () => { active = false }
  }, [file])

  // Mientras llega el fichero pedido (también al cambiar de fichero)
  if (loaded === null || loaded.file !== file) return <WaitingPlaceholder />
  if ('error' in loaded) return <p className={'text-danger mb-0'}>{t('datasets.data.error')}</p>

  const { dataframe } = loaded
  const target = defaultTarget(dataframe.columns, datasetVariables(file))
  return view === 'data'
    ? <N4LDataFrameTable dataframe={dataframe} target={target} subtitles={'dtype'} />
    : <>
      <p className={'small text-body-secondary'}>{t('datasets.data.describe-help')}</p>
      <N4LDataFrameDescribe dataframe={dataframe} target={target} />
    </>
}
