import { isLayersModel, N4L_MANIFEST, n4lManifestFiles, type N4LManifest_t } from './format'
import { packN4L, type N4LPackage_t } from './source'

const directoryOf = (path: string) => path.slice(0, path.lastIndexOf('/') + 1)

/** Todos los ficheros del paquete: los que nombra el manifiesto y, de cada modelo, sus pesos (los nombra su model.json) */
export async function n4lPackageFiles({ manifest, source }: N4LPackage_t): Promise<string[]> {
  const files = new Set<string>([N4L_MANIFEST, ...n4lManifestFiles(manifest)])
  for (const { path } of manifest.tasks.flatMap(({ models }) => models.filter(isLayersModel))) {
    const { weightsManifest = [] } = JSON.parse(await source.readText(path)) as { weightsManifest?: Array<{ paths: string[] }> }
    for (const weights of weightsManifest.flatMap(({ paths }) => paths)) files.add(directoryOf(path) + weights.replace(/^\.?\//, ''))
  }
  return [...files]
}

/** El paquete en un único fichero .n4l (ZIP): un Blob para descargarlo, o sus bytes */
export async function exportN4LPackage(pkg: N4LPackage_t): Promise<Blob>
export async function exportN4LPackage(pkg: N4LPackage_t, type: 'uint8array'): Promise<Uint8Array>
export async function exportN4LPackage(pkg: N4LPackage_t, type: 'blob' | 'uint8array' = 'blob') {
  const files = await n4lPackageFiles(pkg)
  const contents = Object.fromEntries(await Promise.all(files.map(async (file) => [file, await pkg.source.readBytes(file)] as const)))
  return type === 'blob' ? packN4L(contents) : packN4L(contents, 'uint8array')
}

/** iris-1.0.0.n4l */
export const n4lFileName = ({ id, version }: N4LManifest_t) => `${id}-${version}.n4l`

/** Descarga el paquete como fichero .n4l */
export async function downloadN4LPackage(pkg: N4LPackage_t) {
  const url = URL.createObjectURL(await exportN4LPackage(pkg))
  const link = document.createElement('a')
  link.href = url
  link.download = n4lFileName(pkg.manifest)
  link.click()
  URL.revokeObjectURL(url)
}
