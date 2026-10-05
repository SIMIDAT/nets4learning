// Los paquetes .n4l de public/n4l/, reunidos por el plugin vite/n4lPackages.ts
declare module 'virtual:n4l-catalog' {
  import type { N4LManifest_t } from '@core/n4l/format'

  const catalog: Array<N4LManifest_t & { path: string }>
  export default catalog
}
