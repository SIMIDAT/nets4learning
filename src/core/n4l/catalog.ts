import catalog from 'virtual:n4l-catalog'

import { isTableDataset, n4lNamespace, n4lTaskView, type N4LDataset_t, type N4LManifest_t, type N4LTaskView_t } from './format'
import { N4LDirectorySource, type N4LPackage_t } from './source'

/** Un paquete de public/n4l/ (vite/n4lPackages.ts): su manifiesto y su carpeta, relativa a public/ */
export type N4LCatalogEntry_t = N4LManifest_t & { path: string }

/** Un paquete de la aplicación en una de sus tareas */
export type N4LCatalogTask_t = N4LTaskView_t & { entry: N4LCatalogEntry_t }

/** Los paquetes de la aplicación, ordenados por su carpeta */
export const N4L_CATALOG: N4LCatalogEntry_t[] = catalog

/** Los paquetes que tienen esa tarea, cada uno en ella */
export const n4lPackagesOf = (task: string): N4LCatalogTask_t[] => N4L_CATALOG.flatMap((entry) => {
  const view = n4lTaskView(entry, task)
  return view === undefined ? [] : [{ ...view, entry }]
})

/** El paquete de esa tarea con esa clave en las direcciones (IRIS…) */
export const n4lPackageByKey = (task: string | undefined, key: string | undefined) =>
  task === undefined ? undefined : n4lPackagesOf(task).find(({ section }) => section.key === key)

/** Un fichero del paquete, relativo a public/ (como los demás ficheros de la aplicación) */
export const n4lPublicFile = (entry: N4LCatalogEntry_t, file: string) => `${entry.path}/${file}`

/** La tabla de un paquete que está en ese fichero (relativo a public/) */
export function n4lDatasetByFile(file: string): { entry: N4LCatalogEntry_t, dataset: N4LDataset_t } | undefined {
  for (const entry of N4L_CATALOG) {
    const dataset = entry.datasets.filter(isTableDataset).find((item) => n4lPublicFile(entry, item.file) === file)
    if (dataset !== undefined) return { entry, dataset }
  }
  return undefined
}

/** Los espacios de nombres de i18next de todos los paquetes (sus textos se cargan con los de la aplicación) */
export const N4L_NAMESPACES = N4L_CATALOG.map(({ id }) => n4lNamespace(id))

/** Un paquete de la aplicación, listo para leer sus ficheros */
export const builtinN4LPackage = (entry: N4LCatalogEntry_t): N4LPackage_t => ({
  manifest : entry,
  source   : new N4LDirectorySource(`${import.meta.env.VITE_PATH}/${entry.path}/`),
  namespace: n4lNamespace(entry.id),
})
