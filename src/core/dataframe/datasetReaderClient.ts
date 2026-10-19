import { createWorkerClient } from '@core/workers/workerClient'
import { readDatasetRows, type DatasetRead_t } from '@core/dataframe/datasetReader'
import type { DatasetReaderWorkerApi_t } from '@core/dataframe/datasetReader.worker'

// Un worker para toda la sesión (se crea con el primer fichero); sin workers (jsdom), se lee aquí mismo
const client = createWorkerClient<DatasetReaderWorkerApi_t>(
  () => new Worker(new URL('./datasetReader.worker.ts', import.meta.url), { type: 'module' }),
  { read: readDatasetRows },
)

/**
 * Lee el fichero en el worker (o en el hilo principal si no se puede crear). Los errores del fichero (formato, filas
 * con más columnas…) llegan tal cual; si lo que falla es el worker, se lee aquí.
 */
export async function readDatasetInWorker(file: File): Promise<DatasetRead_t> {
  try {
    return await client.call('read', file)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'Worker error' || message.startsWith('Web Workers are not available') || /import|module|fetch/i.test(message)) {
      console.warn('Dataset read in the main thread:', message)
      return readDatasetRows(file)
    }
    throw error
  }
}
