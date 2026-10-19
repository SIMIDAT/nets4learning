import { useEffect, useEffectEvent, useState } from 'react'

import type { N4LCatalogTask_t } from '@core/n4l/catalog'
import { isTableDataset, n4lTaskText, n4lNamespace } from '@core/n4l/format'
import { readDatasetInWorker } from '@core/dataframe/datasetReaderClient'
import { readSeries } from '@core/timeSeries/series'
import { fileName } from '@pages/analyze/projectDatasets'

import type { LoadedSeries_t } from './timeSeriesConfig'

type PackageSeries_t = { series: LoadedSeries_t | null, error: boolean }

/**
 * La serie de un paquete: su CSV, con la columna de la fecha y la del objetivo de su ficha, y su frecuencia. `pkg`
 * tiene que ser el mismo objeto mientras no cambie (el catálogo da uno nuevo en cada llamada: con useMemo). `onLoaded`,
 * al llegar (para prepararla)
 */
export function usePackageSeries(pkg: N4LCatalogTask_t | undefined, file: string | undefined, onLoaded?: (series: LoadedSeries_t) => void): PackageSeries_t {
  const [loaded, setLoaded] = useState<PackageSeries_t & { file?: string }>({ series: null, error: false })
  const notify = useEffectEvent((series: LoadedSeries_t) => onLoaded?.(series))

  useEffect(() => {
    const table = pkg?.datasets.find(isTableDataset)
    const valueColumn = table?.columns.find(({ role }) => role === 'Target')?.name
    const dateColumn = table?.columns.find(({ type }) => type === 'Date')?.name ?? null
    if (pkg === undefined || file === undefined || table === undefined || valueColumn === undefined) return
    let isCancelled = false
    fetch(import.meta.env.VITE_PATH + '/' + file)
      .then(async (response) => {
        if (!response.ok) throw new Error(`${response.status} ${file}`)
        const { columns, rows } = await readDatasetInWorker(new File([await response.blob()], fileName(file), { type: 'text/csv' }))
        if (isCancelled) return
        const name = n4lTaskText(n4lNamespace(pkg.entry.id), pkg.section.task) + 'name'
        const series = { ...readSeries(columns, rows, valueColumn, dateColumn), name, valueColumn, frequency: table.frequency }
        setLoaded({ file, error: false, series })
        notify(series)
      })
      .catch((reason: unknown) => {
        console.error(reason)
        if (!isCancelled) setLoaded({ file, series: null, error: true })
      })
    return () => { isCancelled = true }
  }, [pkg, file])

  // Lo de otro fichero (al cambiar de conjunto) no vale
  return loaded.file === file ? loaded : { series: null, error: false }
}
