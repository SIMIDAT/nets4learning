import type { TFunction } from 'i18next'

import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'

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

/** Todas las capas en una línea (para comparar modelos): «Dense · 10 neuronas · relu → Dense · 3 neuronas · softmax» */
export function layersSummary(t: TFunction, layers: DrawableLayer_t[]): string {
  return layers.map((layer) => layerSummaryParts(t, layer).join(' · ')).join(' → ')
}

/** Una capa dense en la cabecera de su editor: «10 neuronas · ReLU» (sin activación, ReLU, como el selector) */
export function denseLayerSummary(t: TFunction, { units, activation }: { units: number, activation: string | null }): string {
  const key = activation || 'relu'
  return `${t('neural-network.units', { units })} · ${TYPE_ACTIVATION.find((option) => option.key === key)?.label ?? key}`
}
