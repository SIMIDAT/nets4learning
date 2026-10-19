import i18next from 'i18next'

import { N4L_SUPPORTED_TASKS } from './runtimes'
import { N4LZipSource, openN4LPackage, type N4LPackage_t } from './source'
import { N4LError } from './validate'

// Paquetes .n4l abiertos por el usuario: se guardan en el navegador y salen en el menú de su tarea. En las direcciones
// van como local-<id> y sus textos, en el espacio de nombres n4l-local-<id>: así no chocan con uno de la aplicación con
// el mismo id.

export const LOCAL_KEY_PREFIX = 'local-'
export const localKey = (id: string) => LOCAL_KEY_PREFIX + id
export const localNamespace = (id: string) => `n4l-local-${id}`
/** Como mucho, ficheros de este tamaño */
export const MAX_IMPORT_BYTES = 100 * 1024 * 1024

/**
 * Lo que se cuenta de un paquete guardado: su versión, cuándo se abrió, lo que ocupa y, de cada tarea, su nombre en cada
 * idioma y cuántos modelos ya entrenados trae (sin ninguno, solo sirve para entrenar)
 */
export type LocalPackage_t = {
  id        : string
  version   : string
  importedAt: number
  bytes     : number
  tasks     : Array<{ task: string, names: Record<string, string>, models: number }>
}

/** Dónde se guardan: IndexedDB en el navegador; en memoria en las pruebas */
export interface N4LPackageStore {
  list(): Promise<LocalPackage_t[]>
  read(id: string): Promise<ArrayBuffer | undefined>
  save(info: LocalPackage_t, data: ArrayBuffer): Promise<void>
  remove(id: string): Promise<void>
}

const DB_NAME = 'n4l-packages'
const INFO_STORE = 'packages'
// Aparte, para listar sin leer los ficheros
const DATA_STORE = 'files'

/** Los paquetes, en su propia base de datos: lo que se cuenta de cada uno en una tabla y su fichero en otra */
export class IndexedDBPackageStore implements N4LPackageStore {
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('Sin IndexedDB'))
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore(INFO_STORE, { keyPath: 'id' })
        request.result.createObjectStore(DATA_STORE)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async run<T>(stores: string[], mode: IDBTransactionMode, action: (transaction: IDBTransaction) => IDBRequest | null): Promise<T> {
    const db = await this.open()
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(stores, mode)
        const request = action(transaction)
        transaction.oncomplete = () => resolve(request?.result as T)
        transaction.onerror = () => reject(transaction.error)
      })
    } finally {
      db.close()
    }
  }

  async list() {
    return this.run<LocalPackage_t[]>([INFO_STORE], 'readonly', (transaction) => transaction.objectStore(INFO_STORE).getAll())
  }

  async read(id: string) {
    return this.run<ArrayBuffer | undefined>([DATA_STORE], 'readonly', (transaction) => transaction.objectStore(DATA_STORE).get(id))
  }

  async save(info: LocalPackage_t, data: ArrayBuffer) {
    await this.run([INFO_STORE, DATA_STORE], 'readwrite', (transaction) => {
      transaction.objectStore(INFO_STORE).put(info)
      transaction.objectStore(DATA_STORE).put(data, info.id)
      return null
    })
  }

  async remove(id: string) {
    await this.run([INFO_STORE, DATA_STORE], 'readwrite', (transaction) => {
      transaction.objectStore(INFO_STORE).delete(id)
      transaction.objectStore(DATA_STORE).delete(id)
      return null
    })
  }
}

export class MemoryPackageStore implements N4LPackageStore {
  private readonly packages = new Map<string, { info: LocalPackage_t, data: ArrayBuffer }>()

  async list() {
    return [...this.packages.values()].map(({ info }) => info)
  }

  async read(id: string) {
    return this.packages.get(id)?.data
  }

  async save(info: LocalPackage_t, data: ArrayBuffer) {
    this.packages.set(info.id, { info, data })
  }

  async remove(id: string) {
    this.packages.delete(id)
  }
}

let store: N4LPackageStore = new IndexedDBPackageStore()
/** Otro almacén (las pruebas, con MemoryPackageStore) */
export const setN4LPackageStore = (other: N4LPackageStore) => {
  store = other
  opened.clear()
}

/** Dónde van los textos de un paquete abierto (los de cada idioma, en su espacio de nombres): i18next en la aplicación */
export type N4LTextsRegistry_t = (language: string, namespace: string, texts: object) => void
let registerTexts: N4LTextsRegistry_t = (language, namespace, texts) => { i18next.addResourceBundle(language, namespace, texts, true, true) }
export const setN4LTextsRegistry = (registry: N4LTextsRegistry_t) => { registerTexts = registry }

// Quien enseña la lista se entera de los cambios
const listeners = new Set<() => void>()
export function onLocalPackagesChange(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
const notify = () => listeners.forEach((listener) => listener())

/** Los guardados, el más reciente primero; de una tarea, si se pide (y que esta versión de la aplicación sepa usar) */
export async function listLocalPackages(task?: string): Promise<LocalPackage_t[]> {
  const packages = await store.list().catch(() => [])
  return packages
    .filter(({ tasks }) => tasks.some((item) => (task === undefined || item.task === task) && N4L_SUPPORTED_TASKS.includes(item.task)))
    .sort((a, b) => b.importedAt - a.importedAt)
}

/**
 * Abre un fichero .n4l y lo guarda: lo valida (y lo sube a la versión actual del formato) y comprueba que tenga alguna
 * tarea que esta aplicación sepa usar. Si ya había uno con ese id, lo sustituye
 */
export async function importN4LPackage(data: ArrayBuffer): Promise<LocalPackage_t> {
  if (data.byteLength > MAX_IMPORT_BYTES) throw new N4LError('?', [`ocupa más de ${MAX_IMPORT_BYTES / 1024 / 1024} MB`])
  const pkg = await openN4LPackage(await N4LZipSource.open(data), localNamespace)
  const { manifest } = pkg
  const tasks = manifest.tasks.filter(({ task }) => N4L_SUPPORTED_TASKS.includes(task))
  if (tasks.length === 0) {
    throw new N4LError(manifest.id, [`ninguna de sus tareas (${manifest.tasks.map(({ task }) => task).join(', ')}) se puede usar todavía con un paquete`])
  }
  // Su nombre en cada idioma, para los menús (sin abrirlo cada vez)
  const texts = await Promise.all(manifest.locales.map(async (language) =>
    [language, JSON.parse(await pkg.source.readText(`locales/${language}.json`))] as const))
  const info: LocalPackage_t = {
    id        : manifest.id,
    version   : manifest.version,
    importedAt: Date.now(),
    bytes     : data.byteLength,
    tasks     : tasks.map(({ task, models }) => ({
      task,
      names : Object.fromEntries(texts.map(([language, text]) => [language, text?.tasks?.[task]?.name ?? manifest.id])),
      models: models.length,
    })),
  }
  await store.save(info, data)
  opened.delete(info.id)
  notify()
  return info
}

// Los ya abiertos: se descomprimen y sus textos se registran una sola vez (hasta que se vuelve a abrir o se quita)
const opened = new Map<string, Promise<N4LPackage_t>>()

/** Un paquete guardado, abierto y con sus textos ya en i18next */
export function openLocalPackage(id: string): Promise<N4LPackage_t> {
  const cached = opened.get(id)
  if (cached !== undefined) return cached
  const opening = (async () => {
    const data = await store.read(id)
    if (data === undefined) throw new N4LError(id, ['no está guardado en este navegador'])
    const pkg = await openN4LPackage(await N4LZipSource.open(data), localNamespace)
    for (const language of pkg.manifest.locales) {
      registerTexts(language, pkg.namespace, JSON.parse(await pkg.source.readText(`locales/${language}.json`)))
    }
    return pkg
  })()
  opened.set(id, opening)
  opening.catch(() => opened.delete(id))
  return opening
}

export async function removeLocalPackage(id: string) {
  await store.remove(id)
  opened.delete(id)
  notify()
}

/** El nombre de un paquete guardado en una tarea, en el idioma pedido (o en otro que tenga) */
export function localPackageName(info: LocalPackage_t, task: string, language: string) {
  const names = info.tasks.find((item) => item.task === task)?.names ?? {}
  return names[language] ?? names.en ?? Object.values(names)[0] ?? info.id
}
