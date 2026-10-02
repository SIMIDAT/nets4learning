import { analyzeColumns, type ColumnData_t, type DataFrameAnalysis_t } from '@core/dataframe/eda'
import { createWorkerClient } from '@core/workers/workerClient'
import type { AnalysisWorkerApi_t } from './analysis.worker'

// Un worker para toda la página (se crea con el primer conjunto); sin workers, el análisis se hace aquí mismo
const client = createWorkerClient<AnalysisWorkerApi_t>(
  () => new Worker(new URL('./analysis.worker.ts', import.meta.url), { type: 'module' }),
  { analyze: analyzeColumns },
)

/** Analiza las columnas en el worker (o en el hilo principal si no se puede) */
export async function analyzeInWorker(columns: ColumnData_t[]): Promise<DataFrameAnalysis_t> {
  try {
    return await client.call('analyze', columns)
  } catch (error) {
    console.warn('Analysis done in the main thread:', error)
    return analyzeColumns(columns)
  }
}
