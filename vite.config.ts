/// <reference types="vitest/config" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import svgrPlugin from "vite-plugin-svgr"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `base` (ruta de los assets) sigue a VITE_PATH:
  //   VITE_PATH=""      → base "/"      (raíz del dominio, p.ej. Netlify)
  //   VITE_PATH="/n4l"  → base "/n4l/"  (subruta)
  const env = loadEnv(mode, process.cwd(), "")
  const base = env.VITE_PATH ? `${env.VITE_PATH}/` : "/"
  return {
    plugins: [
      react(),
      svgrPlugin({
        svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
        include    : "**/*.svg",
      }),
    ],
    optimizeDeps: {
      include: [
        '@tensorflow/tfjs',
        '@tensorflow/tfjs-core',
        '@tensorflow/tfjs-converter',
      ],
    },
    resolve: {
      alias: {
        "@"                   : path.resolve(__dirname, "src"),
        "@/App"               : path.resolve(__dirname, "src/App"),
        "@/CONSTANTS_ACTIONS" : path.resolve(__dirname, "src/CONSTANTS_ACTIONS"),
        "@/CONSTANTS_ChartsJs": path.resolve(__dirname, "src/CONSTANTS_ChartsJs"),
        "@/CONSTANTS_DanfoJS" : path.resolve(__dirname, "src/CONSTANTS_DanfoJS"),
        "@/DATA_MODEL"        : path.resolve(__dirname, "src/DATA_MODEL"),
        "@/TASKS"             : path.resolve(__dirname, "src/TASKS"),
        "@/MODEL_KEYS"        : path.resolve(__dirname, "src/MODEL_KEYS"),
        "@/types"             : path.resolve(__dirname, "src/types"),
        "@assets"             : path.resolve(__dirname, "src/assets"),
        "@components"         : path.resolve(__dirname, "src/components"),
        "@context"            : path.resolve(__dirname, "src/context"),
        "@core"               : path.resolve(__dirname, "src/core"),
        "@hooks"              : path.resolve(__dirname, "src/hooks"),
        "@pages"              : path.resolve(__dirname, "src/pages"),
        "@shared"             : path.resolve(__dirname, "src/shared"),
        "@styles"             : path.resolve(__dirname, "src/styles"),
        "@utils"              : path.resolve(__dirname, "src/utils"),
        // danfojs publica por defecto un bundle precompilado (lib/bundle.esm.js, ~5,7 MB) que
        // incluye su propia copia de TensorFlow.js 3. Usamos su código sin empaquetar para que
        // importe nuestro @tensorflow/tfjs (forzado a 4.x en pnpm-workspace.yaml) y Rollup pueda
        // repartir plotly, mathjs y xlsx en chunks aparte.
        "danfojs"             : path.resolve(__dirname, "node_modules/danfojs/dist/danfojs-browser/src/index.js"),
      },
    },
    test: {
      globals    : true,
      environment: "jsdom",
      setupFiles : "./tests/setupTests.ts",
    },
    build: {
      // Sin manualChunks: Rollup divide el código según las rutas cargadas con lazy(), así
      // cada página descarga solo sus librerías (tfjs, danfojs, modelos de visión…).
      // TensorFlow.js y danfojs siguen siendo grandes por sí solos, de ahí el límite alto.
      chunkSizeWarningLimit: 5000,
    },
    base,
  }
})
