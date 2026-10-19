// Worker que decodifica los sprites de imágenes fuera del hilo principal (TODO-worker.md, fase 3)
import { exposeWorker } from '@core/workers/exposeWorker'
import { decodeSpriteRows } from './spriteDecode'

export const spriteWorkerApi = { decode: decodeSpriteRows }
export type SpriteWorkerApi_t = typeof spriteWorkerApi

exposeWorker(spriteWorkerApi)
