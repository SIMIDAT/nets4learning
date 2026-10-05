import fs from 'fs'
import path from 'path'
import type { Plugin, ViteDevServer } from 'vite'

import { N4L_MANIFEST, N4L_PACKAGES_DIR, n4lManifestFiles, type N4LManifest_t } from '../src/core/n4l/format'
import { upgradeManifest } from '../src/core/n4l/migrate'
import { N4LError } from '../src/core/n4l/validate'

const VIRTUAL_ID = 'virtual:n4l-catalog'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/** Un paquete del catálogo: su manifiesto (ya migrado y validado) y dónde está, relativo a public/ */
export type N4LCatalogEntry_t = N4LManifest_t & { path: string }

/** Los ficheros que nombra el manifiesto tienen que estar en el paquete */
function missingFiles(dir: string, manifest: N4LManifest_t): string[] {
  return n4lManifestFiles(manifest).filter((file) => !fs.existsSync(path.join(dir, file))).map((file) => `falta el fichero ${file}`)
}

/** Los paquetes de public/n4l/: cada carpeta <id>.n4l/ con su manifest.json. Un paquete no válido para la build */
export function readN4LCatalog(publicDir: string): N4LCatalogEntry_t[] {
  const root = path.join(publicDir, N4L_PACKAGES_DIR)
  if (!fs.existsSync(root)) return []
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('.n4l'))
    .map(({ name }) => name)
    .sort()
    .map((name) => {
      const dir = path.join(root, name)
      const file = path.join(dir, N4L_MANIFEST)
      if (!fs.existsSync(file)) throw new N4LError(name, [`falta ${N4L_MANIFEST}`])
      const manifest = upgradeManifest(JSON.parse(fs.readFileSync(file, 'utf-8'))) as N4LManifest_t
      const problems = [
        ...(name === `${manifest.id}.n4l` ? [] : [`la carpeta se tiene que llamar ${manifest.id}.n4l`]),
        ...missingFiles(dir, manifest),
      ]
      if (problems.length > 0) throw new N4LError(manifest.id, problems)
      return { ...manifest, path: `${N4L_PACKAGES_DIR}/${name}` }
    })
}

/**
 * Reúne los paquetes .n4l de public/n4l/ en un módulo virtual (`import catalog from 'virtual:n4l-catalog'`): para que la
 * aplicación los use basta con dejar la carpeta ahí. En desarrollo, al añadir, cambiar o quitar uno, se recarga.
 */
export function n4lPackages(): Plugin {
  let publicDir = ''
  const isPackageFile = (file: string) => file.startsWith(path.join(publicDir, N4L_PACKAGES_DIR) + path.sep)
  return {
    name          : 'n4l:packages',
    configResolved: (config) => { publicDir = config.publicDir },
    resolveId     : (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    load          : (id) => {
      if (id !== RESOLVED_ID) return undefined
      return `export default ${JSON.stringify(readN4LCatalog(publicDir))}`
    },
    configureServer: (server: ViteDevServer) => {
      const reload = (file: string) => {
        if (!isPackageFile(file) || !(file.endsWith(N4L_MANIFEST) || file.endsWith('.n4l'))) return
        const module = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (module !== undefined) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(path.join(publicDir, N4L_PACKAGES_DIR))
      server.watcher.on('add', reload)
      server.watcher.on('change', reload)
      server.watcher.on('unlink', reload)
      server.watcher.on('unlinkDir', reload)
    },
  }
}
