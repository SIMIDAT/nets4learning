/// <reference types="vitest/config" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import svgrPlugin from "vite-plugin-svgr"

// https://vite.dev/config/
export default defineConfig({
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
      '@tensorflow/tfjs-layers',
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
    },
  },
  test: {
    globals    : true,
    environment: "jsdom",
    setupFiles : "./tests/setupTests.ts",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Separa las librerías en un chunk aparte llamado 'vendor'
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 20000, // Opcional: sube el límite a 1000kb para que no moleste
  },
  base  : "/n4l/",
  define: {
  },
})
