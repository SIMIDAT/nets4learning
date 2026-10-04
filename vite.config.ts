/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import svgrPlugin from 'vite-plugin-svgr'

// Ruta real (pnpm enlaza node_modules/@vladmandic/face-api a node_modules/.pnpm/…): así se comparan los importadores
const FACE_API = fs.realpathSync(path.resolve(__dirname, 'node_modules/@vladmandic/face-api'))

/**
 * El código de face-api importa TF.js de ../dist/tfjs.esm, que en el paquete publicado es TF.js entero empaquetado
 * (1,2 MB): se cambia por src/tfjs/tf-browser.ts, que reexporta el @tensorflow/tfjs del proyecto (lo mismo que hace
 * su build "nobundle"). Igual con ../dist/tfjs.version, que se genera de src/tfjs/tf-version.ts.
 */
function resolveFaceApiTfjs(source: string, importer: string | undefined): string | undefined {
  if (importer === undefined || !source.startsWith('.')) return undefined
  const target = path.resolve(path.dirname(importer), source).replace(/\.js$/, '')
  if (target === path.join(FACE_API, 'dist/tfjs.esm')) return path.join(FACE_API, 'src/tfjs/tf-browser.ts')
  if (target === path.join(FACE_API, 'dist/tfjs.version')) return path.join(FACE_API, 'src/tfjs/tf-version.ts')
  return undefined
}

// En la build (Rollup) y con los módulos que Vite sirve uno a uno en desarrollo
const faceApiTfjs: Plugin = {
  name     : 'n4l:face-api-tfjs',
  enforce  : 'pre',
  resolveId: (source, importer) => resolveFaceApiTfjs(source, importer),
}

// Lo que danfojs importa al cargarse y casi nunca usa, cambiado solo para él (src/core/dataframe/danfo*.ts): Plotly
// (df.plot) se descarga al dibujar y xlsx (readExcel y toExcel, que la app no usa) no se incluye
const DANFO = fs.realpathSync(path.resolve(__dirname, 'node_modules/danfojs'))
const DANFO_LAZY_DEPS: Record<string, string> = {
  'plotly.js-dist-min': path.resolve(__dirname, 'src/core/dataframe/danfoPlotly.ts'),
  'xlsx'              : path.resolve(__dirname, 'src/core/dataframe/danfoXlsx.ts'),
}

// Solo en la build: en desarrollo Vite empaqueta danfo con esbuild y no pasa por aquí (lleva los de verdad)
const danfoLazyDeps: Plugin = {
  name     : 'n4l:danfo-lazy-deps',
  enforce  : 'pre',
  apply    : 'build',
  resolveId: (source, importer) => (importer?.startsWith(DANFO) ? DANFO_LAZY_DEPS[source] : undefined),
}

/**
 * Librerías que van en un chunk propio. danfojs las importa sin import() (y la app usa también Plotly y mathjs en las
 * mismas páginas), así que Rollup las juntaba con danfojs en un solo chunk de 5,3 MB. Por separado se descargan en
 * paralelo y siguen en la caché del navegador cuando cambia el código de la app; se siguen cargando solo en las
 * páginas que las usan.
 */
const VENDOR_CHUNKS: [name: string, module: RegExp][] = [
  ['plotly', /\/node_modules\/plotly\.js-dist-min\//],
  ['mathjs', /\/node_modules\/(mathjs|decimal\.js|complex\.js|fraction\.js|typed-function)\//],
  ['xlsx', /\/node_modules\/xlsx\//],
]

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // `base` (ruta de los assets) sigue a VITE_PATH:
  //   VITE_PATH=""      → base "/"      (raíz del dominio, p.ej. Netlify)
  //   VITE_PATH="/n4l"  → base "/n4l/"  (subruta)
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_PATH ? `${env.VITE_PATH}/` : '/'
  return {
    plugins: [
      faceApiTfjs,
      danfoLazyDeps,
      react(),
      svgrPlugin({
        svgrOptions: { exportType: 'default', ref: true, svgo: false, titleProp: true },
        include    : '**/*.svg',
      }),
    ],
    optimizeDeps: {
      include: [
        '@tensorflow/tfjs',
        '@tensorflow/tfjs-core',
        '@tensorflow/tfjs-converter',
        // Se cargan con import() al elegirlos en el menú (src/core/tfBackend.ts): sin esto, en desarrollo Vite los
        // descubriría entonces y volvería a empaquetar las dependencias recargando la página
        '@tensorflow/tfjs-backend-wasm',
        '@tensorflow/tfjs-backend-webgpu',
      ],
      esbuildOptions: {
        plugins: [{
          // En desarrollo Vite empaqueta face-api con esbuild, que no pasa los imports relativos por los plugins de
          // Vite: sin esto se colaba el TF.js empaquetado de face-api (TF.js dos veces, kernels registrados de nuevo)
          name : 'n4l:face-api-tfjs',
          setup: (build) => {
            build.onResolve({ filter: /dist\/tfjs\.(esm|version)/ }, ({ path: source, importer }) => {
              const resolved = resolveFaceApiTfjs(source, importer)
              return resolved === undefined ? undefined : { path: resolved }
            })
          },
        }],
      },
    },
    // Workers de módulo (new Worker(new URL(…, import.meta.url), { type: 'module' })): mismo formato que la app
    worker: {
      format: 'es' as const,
    },
    resolve: {
      alias: {
        '@'                   : path.resolve(__dirname, 'src'),
        '@/App'               : path.resolve(__dirname, 'src/App'),
        '@/CONSTANTS_ACTIONS' : path.resolve(__dirname, 'src/CONSTANTS_ACTIONS'),
        '@/CONSTANTS_ChartsJs': path.resolve(__dirname, 'src/CONSTANTS_ChartsJs'),
        '@/CONSTANTS_DanfoJS' : path.resolve(__dirname, 'src/CONSTANTS_DanfoJS'),
        '@/DATA_MODEL'        : path.resolve(__dirname, 'src/DATA_MODEL'),
        '@/TASKS'             : path.resolve(__dirname, 'src/TASKS'),
        '@/TASK_OPTIONS'      : path.resolve(__dirname, 'src/TASK_OPTIONS'),
        '@/MODEL_KEYS'        : path.resolve(__dirname, 'src/MODEL_KEYS'),
        '@/types'             : path.resolve(__dirname, 'src/types'),
        '@assets'             : path.resolve(__dirname, 'src/assets'),
        '@components'         : path.resolve(__dirname, 'src/components'),
        '@context'            : path.resolve(__dirname, 'src/context'),
        '@core'               : path.resolve(__dirname, 'src/core'),
        '@hooks'              : path.resolve(__dirname, 'src/hooks'),
        '@pages'              : path.resolve(__dirname, 'src/pages'),
        '@shared'             : path.resolve(__dirname, 'src/shared'),
        '@styles'             : path.resolve(__dirname, 'src/styles'),
        '@utils'              : path.resolve(__dirname, 'src/utils'),
        // danfojs publica por defecto un bundle precompilado (lib/bundle.esm.js, ~5,7 MB) que
        // incluye su propia copia de TensorFlow.js 3. Usamos su código sin empaquetar para que
        // importe nuestro @tensorflow/tfjs (forzado a 4.x en pnpm-workspace.yaml) y Rollup pueda
        // repartir plotly, mathjs y xlsx en chunks aparte.
        'danfojs'             : path.resolve(__dirname, 'node_modules/danfojs/dist/danfojs-browser/src/index.js'),
        // Ese código de danfojs hace require("mathjs"), que daría la build CommonJS entera (lib/cjs) además de la
        // ESM que importa la app: en la build se le da también la ESM para que solo haya una copia de mathjs.
        // Solo al construir: en los tests danfojs se carga con Node y su require no pasa por aquí.
        ...(command === 'build' && { 'mathjs': path.resolve(__dirname, 'node_modules/mathjs/lib/esm/index.js') }),
        // face-api se compila desde su código (src/, parcheado en patches/): el build publicado (dist/) no se usa.
        // Sus imports de TF.js los redirige el plugin faceApiTfjs (más arriba).
        '@vladmandic/face-api': path.resolve(FACE_API, 'src/index.ts'),
      },
    },
    test: {
      globals    : true,
      environment: 'jsdom',
      setupFiles : './tests/setupTests.ts',
      // e2e/ son las pruebas de Playwright (pnpm test:e2e), que van en un navegador de verdad
      exclude    : [...configDefaults.exclude, 'e2e/**'],
    },
    build: {
      // Rollup divide el código según las rutas cargadas con lazy(), así cada página descarga solo sus librerías
      // (tfjs, danfojs, modelos de visión…). manualChunks solo saca de ahí las de VENDOR_CHUNKS.
      rollupOptions: {
        output: {
          manualChunks            : (id: string) => VENDOR_CHUNKS.find(([, module]) => module.test(id))?.[0],
          // Sin esto Rollup mete en cada uno también sus dependencias, incluidas las que comparte con el resto de la
          // app (los helpers de CommonJS, @babel/runtime, seedrandom…): la página de inicio cargaba entero el de mathjs
          onlyExplicitManualChunks: true,
        },
      },
      // TensorFlow.js y danfojs siguen siendo grandes por sí solos, de ahí el límite alto.
      chunkSizeWarningLimit: 5000,
    },
    base,
  }
})
