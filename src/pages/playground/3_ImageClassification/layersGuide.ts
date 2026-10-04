import type { TFunction } from 'i18next'

import type { GuideStep_t } from '@components/guide/N4LGuide'
import { imageLayerShapes } from '@core/nn-utils/checkLayers'
import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import type { ImageLayer_t } from '@/types/types'

const prefix = 'guide.train.3-image-classification.'

/**
 * Un paso de la guía por cada capa del editor (en el entrenador de imágenes): qué hace esa capa con sus números de
 * verdad, lo que recibe y lo que sale, sus filtros y los pesos que aprende. Se rehacen al cambiar las capas. Textos en
 * guide.train.3-image-classification.<KEY>.layer.* (cómo se llama cada clase: dígito, carácter…) y, lo demás, en
 * .common.layer.*
 */
export function layersGuide(t: TFunction, language: string, dataset: string, layers: ImageLayer_t[]): GuideStep_t[] {
  const shapes = imageLayerShapes(layers)
  const text = (key: string, values: Record<string, string | number> = {}) =>
    t([`${prefix}${dataset}.layer.${key}`, `${prefix}common.layer.${key}`], values)
  const format = new Intl.NumberFormat(language)
  const activationLabel = (key: string) => TYPE_ACTIVATION.find((option) => option.key === key)?.label ?? key
  const className = text('class-name')
  let convolutions = 0

  return layers.map((layer, index) => {
    const shape = shapes[index]
    const target = `[data-guide="layer-${index}"]`
    const number = index + 1
    if (shape === null) return { target, placement: 'auto', title: text('broken.title', { number }), content: text('broken.content') }

    const isOutput = index === layers.length - 1 && layer._class === 'dense'
    const kind = isOutput ? 'output'
      : layer._class === 'conv2d' ? (convolutions++ === 0 ? 'conv-first' : 'conv')
        : layer._class === 'maxPooling2d' ? 'pool'
          : layer._class === 'flatten' ? 'flatten' : 'dense'
    const [inputHeight, inputWidth, inputChannels] = shape.input
    const [outputHeight, outputWidth, outputChannels] = shape.output
    const values = {
      number,
      class         : className,
      inputSize     : `${inputHeight}×${inputWidth}`,
      inputChannels : inputChannels ?? '',
      inputValues   : format.format(inputHeight),
      outputSize    : `${outputHeight}×${outputWidth}`,
      outputChannels: outputChannels ?? '',
      values        : format.format(outputHeight),
      params        : format.format(shape.params),
      kernel        : layer.kernelSize ?? '',
      filters       : layer.filters ?? '',
      pool          : layer.poolSize ?? '',
      strides       : layer.strides ?? '',
      units         : layer.units ?? '',
      activation    : activationLabel(layer.activation ?? 'linear'),
    }
    // La salida, con softmax o no (entonces el aviso del editor lo dice); las demás capas con activación, cuál es
    const content = kind === 'output'
      ? text(layer.activation === 'softmax' ? 'output.content' : 'output.content-other', values)
      : [text(kind + '.content', values), ...(kind === 'pool' || kind === 'flatten' ? [] : [text(layer.activation === 'relu' ? 'relu' : 'activation', values)])].join(' ')
    return { target, placement: 'auto', title: text(kind + '.title', values), content }
  })
}
