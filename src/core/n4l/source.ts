import { N4L_MANIFEST, n4lNamespace, type N4LManifest_t } from './format'
import { upgradeManifest } from './migrate'
import { N4LError } from './validate'

/**
 * De dónde se leen los ficheros de un paquete. La aplicación solo usa esta interfaz: el paquete puede ser una carpeta
 * servida (los de public/n4l/) o un fichero .n4l (ZIP) subido por el usuario.
 */
export interface N4LSource {
  /** Una dirección que se puede pedir (fetch, TF.js); null si el paquete no está servido (un .n4l subido) */
  url(path: string): string | null
  readText(path: string): Promise<string>
  readBytes(path: string): Promise<ArrayBuffer>
}

/**
 * Un paquete abierto: su manifiesto (en la versión actual del formato), sus ficheros y el espacio de nombres de sus
 * textos en i18next (n4l-<id> los de la aplicación; los abiertos por el usuario, aparte, por si repiten un id)
 */
export type N4LPackage_t = { manifest: N4LManifest_t, source: N4LSource, namespace: string }

/** Una carpeta servida: public/n4l/<id>.n4l/ */
export class N4LDirectorySource implements N4LSource {
  private readonly base: string

  /** `base`: la dirección de la carpeta, terminada en / */
  constructor(base: string) {
    this.base = base.endsWith('/') ? base : base + '/'
  }

  url(path: string) {
    return this.base + path
  }

  private async fetch(path: string) {
    const response = await fetch(this.url(path))
    if (!response.ok) throw new Error(`n4l: ${response.status} ${this.url(path)}`)
    return response
  }

  async readText(path: string) {
    return (await this.fetch(path)).text()
  }

  async readBytes(path: string) {
    return (await this.fetch(path)).arrayBuffer()
  }
}

/** Un fichero .n4l: un ZIP con la misma estructura que la carpeta (jszip solo se descarga al abrir uno) */
export class N4LZipSource implements N4LSource {
  private readonly files: Map<string, { async(type: 'string'): Promise<string>, async(type: 'arraybuffer'): Promise<ArrayBuffer> }>

  private constructor(files: N4LZipSource['files']) {
    this.files = files
  }

  /** Lee el ZIP. Si todo va dentro de una carpeta (<id>.n4l/…, como al comprimir la carpeta), se quita ese prefijo */
  static async open(data: Blob | ArrayBuffer | Uint8Array) {
    const { default: JSZip } = await import('jszip')
    const zip = await JSZip.loadAsync(data).catch(() => { throw new N4LError('?', ['no es un fichero .n4l (un ZIP)']) })
    const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir)
    const prefixes = new Set(names.map((name) => name.split('/')[0]))
    const strip = prefixes.size === 1 && !names.includes(N4L_MANIFEST) ? `${[...prefixes][0]}/` : ''
    return new N4LZipSource(new Map(names.map((name) => [name.slice(strip.length), zip.files[name]])))
  }

  url() {
    return null
  }

  private file(path: string) {
    const file = this.files.get(path)
    if (file === undefined) throw new Error(`n4l: el paquete no tiene ${path}`)
    return file
  }

  // async: un fichero que no está es una promesa rechazada, como en la carpeta
  async readText(path: string) {
    return this.file(path).async('string')
  }

  async readBytes(path: string) {
    return this.file(path).async('arraybuffer')
  }
}

/** Abre un paquete: lee su manifiesto, lo sube a la versión actual del formato y lo valida */
export async function openN4LPackage(source: N4LSource, namespaceOf: (id: string) => string = n4lNamespace): Promise<N4LPackage_t> {
  const text = await source.readText(N4L_MANIFEST).catch(() => { throw new N4LError('?', [`falta ${N4L_MANIFEST}`]) })
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new N4LError('?', [`${N4L_MANIFEST} no es JSON válido`])
  }
  const manifest = upgradeManifest(raw) as N4LManifest_t
  return { manifest, source, namespace: namespaceOf(manifest.id) }
}

/** Empaqueta ficheros (ruta dentro del paquete → contenido) en un .n4l: un Blob para descargarlo, o sus bytes */
export async function packN4L(files: Record<string, string | ArrayBuffer | Uint8Array>): Promise<Blob>
export async function packN4L(files: Record<string, string | ArrayBuffer | Uint8Array>, type: 'uint8array'): Promise<Uint8Array>
export async function packN4L(files: Record<string, string | ArrayBuffer | Uint8Array>, type: 'blob' | 'uint8array' = 'blob') {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) zip.file(path, content)
  return zip.generateAsync({ type, compression: 'DEFLATE', mimeType: 'application/vnd.nets4learning.n4l+zip' })
}
