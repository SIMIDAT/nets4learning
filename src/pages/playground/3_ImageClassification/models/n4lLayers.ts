import type { N4LLayer_t } from '@core/n4l/format'
import type { ImageLayer_t } from '@/types/types'
import type { SpriteImage_t } from './spriteDecode'

/**
 * Las capas del manifiesto como las edita la aplicación: la primera recibe las imágenes del conjunto (`image`); las
 * «locked», protegidas
 */
export function imageLayersOf(layers: N4LLayer_t[], { width, height, channels }: SpriteImage_t): ImageLayer_t[] {
  return layers.map((layer, index): ImageLayer_t => {
    const base: ImageLayer_t = { _class: layer.class, _protected: layer.locked ?? false, ...(index === 0 && { inputShape: [height, width, channels] }) }
    switch (layer.class) {
      case 'conv2d':
        return { ...base, filters: layer.filters, kernelSize: layer.kernelSize, activation: layer.activation }
      case 'maxPooling2d':
        return { ...base, poolSize: layer.poolSize, strides: layer.strides }
      case 'dense':
        return { ...base, units: layer.units, activation: layer.activation }
      default:
        return base
    }
  })
}

/** Las capas del editor como en el manifiesto (para guardar un modelo entrenado en un .n4l) */
export function n4lLayersOf(layers: ImageLayer_t[]): N4LLayer_t[] {
  return layers.flatMap((layer): N4LLayer_t[] => {
    const locked = layer._protected === true ? { locked: true } : {}
    switch (layer._class) {
      case 'conv2d':
        return [{ class: 'conv2d', filters: layer.filters ?? 1, kernelSize: layer.kernelSize ?? 1, activation: layer.activation ?? 'linear', ...locked }]
      case 'maxPooling2d':
        return [{ class: 'maxPooling2d', poolSize: layer.poolSize ?? 2, strides: layer.strides ?? 2, ...locked }]
      case 'flatten':
        return [{ class: 'flatten', ...locked }]
      case 'dense':
        return [{ class: 'dense', units: layer.units ?? 1, activation: layer.activation ?? 'linear', ...locked }]
      default:
        return []
    }
  })
}
