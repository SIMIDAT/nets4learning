import { useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'

import { LOCAL_KEY_PREFIX, listLocalPackages, localPackageName, onLocalPackagesChange, type LocalPackage_t } from '@core/n4l/localPackages'

/**
 * Los paquetes .n4l guardados en el navegador: los de una tarea o, sin ella, todos (la página de los paquetes y su
 * enlace en la barra). Se actualiza al abrir o quitar uno. Con null no lee nada
 */
export function useLocalPackages(task?: string | null): LocalPackage_t[] {
  const [packages, setPackages] = useState<LocalPackage_t[]>([])
  useEffect(() => {
    // La miga de pan de un modelo de la aplicación: sin leer nada
    if (task === null) return
    let isCurrent = true
    const refresh = () => { listLocalPackages(task).then((list) => { if (isCurrent) setPackages(list) }) }
    refresh()
    const unsubscribe = onLocalPackagesChange(refresh)
    return () => {
      isCurrent = false
      unsubscribe()
    }
  }, [task])
  return packages
}

/** El nombre de un paquete guardado en una tarea (para una clave local-<id>), en el idioma actual; null si no lo es */
export function useLocalPackageName(task: string, key: string | undefined): string | null {
  const { i18n } = useTranslation()
  const isLocal = key?.startsWith(LOCAL_KEY_PREFIX) ?? false
  const packages = useLocalPackages(isLocal ? task : null)
  if (!isLocal || key === undefined) return null
  const info = packages.find(({ id }) => id === key.slice(LOCAL_KEY_PREFIX.length))
  return info === undefined ? key.slice(LOCAL_KEY_PREFIX.length) : localPackageName(info, task, i18n.language)
}
