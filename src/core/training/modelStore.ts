import type * as tfjs from '@tensorflow/tfjs'

import type { TrainingHistory_t } from '@core/training/buildModels'

// Los modelos que se entrenan, guardados en el navegador (IndexedDB) para no perderlos al recargar la página (el móvil
// la recarga al desbloquearlo). Cada uno lleva en sus metadatos lo que la página necesita para enseñarlo otra vez:
// hiperparámetros, historial y evaluación. Solo los de los conjuntos de ejemplo: los de un conjunto subido no se
// podrían usar sin volver a subirlo.

// TF.js bajo demanda, solo para guardar y cargar (las páginas de entrenamiento ya lo tienen). Para contar y borrar
// (/settings) se lee directamente la base de datos en la que TF.js guarda los modelos, sin descargarlo: su esquema es
// el de tfjs-core/src/io/indexed_db.ts
const loadTF = () => import('@tensorflow/tfjs')
const IDB_NAME = 'tensorflowjs'
const MODELS_STORE = 'models_store'
const INFO_STORE = 'model_info_store'
const SCHEME = 'indexeddb://'

const PREFIX = SCHEME + 'n4l-models/'
/** Como mucho, estos modelos guardados por conjunto de datos: al guardar uno más, se borra el más antiguo */
export const MAX_STORED_MODELS = 10
const METADATA_KEY = 'n4l'

export type StoredModel_t<T> = { url: string, model: tfjs.LayersModel, data: T }

const prefixOf = (task: string, dataset: string) => `${PREFIX}${task}/${dataset}/`

/** La base de datos de TF.js (se crea como la crea él si todavía no existe); null sin IndexedDB */
function openStore(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      for (const name of [MODELS_STORE, INFO_STORE]) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'modelPath' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

type StoredInfo_t = { modelPath: string, modelArtifactsInfo: tfjs.io.ModelArtifactsInfo }

/** Los guardados (de una tarea y conjunto, o todos), del más antiguo al más nuevo, con lo que ocupan */
async function listStored(prefix = PREFIX) {
  const db = await openStore()
  if (db === null) return []
  try {
    const infos = await new Promise<StoredInfo_t[]>((resolve, reject) => {
      const request = db.transaction(INFO_STORE, 'readonly').objectStore(INFO_STORE).getAll()
      request.onsuccess = () => resolve(request.result as StoredInfo_t[])
      request.onerror = () => reject(request.error)
    })
    return infos
      .map(({ modelPath, modelArtifactsInfo: info }) => ({
        url    : SCHEME + modelPath,
        savedAt: new Date(info.dateSaved).getTime(),
        bytes  : (info.modelTopologyBytes ?? 0) + (info.weightDataBytes ?? 0),
      }))
      .filter(({ url }) => url.startsWith(prefix))
      .sort((a, b) => a.savedAt - b.savedAt)
  } catch {
    return []
  } finally {
    db.close()
  }
}

/** Borra los modelos de esas direcciones (de las dos tablas de TF.js) */
async function removeStored(urls: string[]) {
  if (urls.length === 0) return
  const db = await openStore()
  if (db === null) return
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([MODELS_STORE, INFO_STORE], 'readwrite')
      for (const url of urls) {
        const modelPath = url.slice(SCHEME.length)
        transaction.objectStore(MODELS_STORE).delete(modelPath)
        transaction.objectStore(INFO_STORE).delete(modelPath)
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } finally {
    db.close()
  }
}

/** Guarda un modelo recién entrenado con sus datos. Si no se puede (sin espacio, sin IndexedDB), sigue sin guardar */
export async function saveTrainedModel<T>(task: string, dataset: string, model: tfjs.LayersModel, data: T): Promise<boolean> {
  try {
    // TF.js solo admite JSON puro en los metadatos (ni undefined ni objetos que no sean simples): pasan por JSON
    model.setUserDefinedMetadata({ [METADATA_KEY]: { version: 1, data: JSON.parse(JSON.stringify(data)) } })
    await model.save(`${prefixOf(task, dataset)}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`)
    const stored = await listStored(prefixOf(task, dataset))
    await removeStored(stored.slice(0, Math.max(0, stored.length - MAX_STORED_MODELS)).map(({ url }) => url))
    return true
  } catch (error) {
    console.warn('saveTrainedModel', error)
    return false
  }
}

/** Los modelos guardados de una tarea y conjunto, del más antiguo al más nuevo (los que no se puedan leer, se saltan) */
export async function loadTrainedModels<T>(task: string, dataset: string): Promise<StoredModel_t<T>[]> {
  const stored = await listStored(prefixOf(task, dataset))
  if (stored.length === 0) return []
  const tf = await loadTF()
  const loaded = await Promise.all(stored.map(async ({ url }) => {
    try {
      const model = await tf.loadLayersModel(url)
      const metadata = (model.getUserDefinedMetadata() as Record<string, { data: T }> | undefined)?.[METADATA_KEY]
      return metadata === undefined ? null : { url, model, data: metadata.data }
    } catch (error) {
      console.warn('loadTrainedModels', url, error)
      return null
    }
  }))
  return loaded.filter((item): item is StoredModel_t<T> => item !== null)
}

/** Borra los modelos guardados de una tarea y conjunto o, sin decir cuáles, todos */
export async function deleteTrainedModels(task?: string, dataset?: string): Promise<void> {
  const stored = await listStored(task === undefined || dataset === undefined ? PREFIX : prefixOf(task, dataset))
  await removeStored(stored.map(({ url }) => url))
}

/** Cuántos modelos hay guardados y cuánto ocupan, para /settings */
export async function storedModelsUsage(): Promise<{ count: number, bytes: number }> {
  const stored = await listStored()
  return { count: stored.length, bytes: stored.reduce((sum, { bytes }) => sum + bytes, 0) }
}

/** El historial guardado, como el de fit(): las tablas y las gráficas solo usan `history` y `epoch` */
export const historyFromData = (history: TrainingHistory_t) => history as unknown as tfjs.History
