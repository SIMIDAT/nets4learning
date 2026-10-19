// Versiones del formato .n4l. Cada cambio del formato sube N4L_FORMAT_VERSION y añade aquí la migración desde la
// versión anterior: un paquete viejo se va subiendo de versión en versión hasta la actual al cargarlo, y uno de una
// versión más nueva que la aplicación se rechaza (hay que actualizar la aplicación). Sin alias de importación.

import { N4L_FORMAT, N4L_FORMAT_VERSION, type N4LManifest_t } from './format'
import { N4LError, validateManifest } from './validate'

type Json_t = Record<string, unknown>

/** De la versión N a la N+1 (la clave es N) */
export type N4LMigration_t = (manifest: Json_t) => Json_t

/** Ninguna todavía: la 1 es la primera versión del formato */
export const N4L_MIGRATIONS: Record<number, N4LMigration_t> = {}

/** El manifiesto en la versión actual del formato y validado; `migrations` y `current`, para las pruebas */
export function upgradeManifest(raw: unknown, migrations: Record<number, N4LMigration_t> = N4L_MIGRATIONS, current = N4L_FORMAT_VERSION) {
  const id = typeof raw === 'object' && raw !== null && 'id' in raw ? String((raw as Json_t).id) : '?'
  if (typeof raw !== 'object' || raw === null || (raw as Json_t).format !== N4L_FORMAT) {
    throw new N4LError(id, [`format: tiene que ser "${N4L_FORMAT}"`])
  }
  let manifest = raw as Json_t
  let version = manifest.formatVersion
  if (!Number.isInteger(version) || (version as number) < 1) throw new N4LError(id, ['formatVersion: un número entero desde 1'])
  if ((version as number) > current) {
    throw new N4LError(id, [`formatVersion ${version as number}: esta versión de Nets4Learning solo entiende hasta la ${current}; actualízala`])
  }
  while ((version as number) < current) {
    const migrate = migrations[version as number]
    if (migrate === undefined) throw new N4LError(id, [`no hay migración de la versión ${version as number} del formato a la ${(version as number) + 1}`])
    manifest = { ...migrate(manifest), formatVersion: (version as number) + 1 }
    version = manifest.formatVersion
  }
  return current === N4L_FORMAT_VERSION ? validateManifest<N4LManifest_t>(manifest) : manifest
}
