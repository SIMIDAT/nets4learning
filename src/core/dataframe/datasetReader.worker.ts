// Worker que lee los ficheros de datos que sube el usuario (TODO-worker.md, fase 2): convertir el formato, averiguar el
// separador y papaparse, fuera del hilo principal. Sin danfo: devuelve columnas y filas.
import { exposeWorker } from '@core/workers/exposeWorker'
import { readDatasetRows } from '@core/dataframe/datasetReader'

export const datasetReaderWorkerApi = { read: readDatasetRows }
export type DatasetReaderWorkerApi_t = typeof datasetReaderWorkerApi

exposeWorker(datasetReaderWorkerApi)
