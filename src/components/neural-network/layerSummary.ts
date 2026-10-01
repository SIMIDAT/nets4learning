import type { TFunction } from 'i18next'

/** Lo que se describe de una capa; vale para las dense (tabular, regresión) y las de imágenes */
export type DrawableLayer_t = {
  _class?    : string
  units?     : number
  activation?: string | null
  kernelSize?: number
  filters?   : number
  poolSize?  : number
  strides?   : number
}

/**
 * Tipo de la capa y sus parámetros, con el mismo vocabulario en el diagrama y en los editores de capas. Los tipos
 * de capa y las activaciones se dejan con su nombre técnico. Sin `_class`, la capa es dense (tabular, regresión).
 */
export function layerSummaryParts(t: TFunction, layer: DrawableLayer_t): string[] {
  const units = t('neural-network.units', { units: layer.units })
  switch (layer._class) {
    case 'flatten':
      return ['Flatten']
    case 'dense':
      return ['Dense', units, String(layer.activation)]
    case 'conv2d':
      return ['Conv 2D', t('neural-network.kernel-size', { value: layer.kernelSize }),
        t('neural-network.filters', { value: layer.filters }), String(layer.activation)]
    case 'maxPooling2d':
      return ['Max Pooling 2D', t('neural-network.pool-size', { value: layer.poolSize }),
        t('neural-network.strides', { value: layer.strides })]
    default:
      return [units, String(layer.activation)]
  }
}
