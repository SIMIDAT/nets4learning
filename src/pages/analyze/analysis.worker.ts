// Worker del análisis exploratorio: perfil de las columnas, valores numéricos y correlaciones fuera del hilo
// principal (TODO-worker.md, fase 2). Sin danfo ni TF.js: recibe las columnas tal cual.
import { exposeWorker } from '@core/workers/exposeWorker'
import { analyzeColumns } from '@core/dataframe/eda'

export const analysisWorkerApi = { analyze: analyzeColumns }
export type AnalysisWorkerApi_t = typeof analysisWorkerApi

exposeWorker(analysisWorkerApi)
