import { useId, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import * as tfjs from '@tensorflow/tfjs'

type N4LModelSummaryButtonProps = {
  model: unknown
  /** Nombre del modelo: va en el título del resumen */
  title: string
}

/** Una forma de TF.js, como en Keras: «(—, 10)»; la primera dimensión, sin número, es el lote */
const formatShape = (shape: tfjs.Shape | tfjs.Shape[]) => {
  const shapes = Array.isArray(shape[0]) || shape.length === 0 ? (shape as tfjs.Shape[]) : [shape as tfjs.Shape]
  return shapes.map((item) => `(${item.map((dim) => dim ?? '—').join(', ')})`).join(' ')
}

const countWeights = (weights: tfjs.LayerVariable[]) =>
  weights.reduce((sum, weight) => sum + (weight.shape ?? []).reduce<number>((size, dim) => size * (dim ?? 1), 1), 0)

/**
 * Botón que despliega el resumen de las capas de un modelo preentrenado: una tabla con cada capa, su forma de salida y
 * sus parámetros, y el total. Es una tabla de la página (se lee con el lector de pantalla y se recorre con el teclado),
 * no el visor de tfjs-vis. Solo aparece con un LayersModel: el GraphModel de MobileNet y los detectores de
 * @tensorflow-models, MediaPipe o face-api no dicen sus capas.
 */
export default function N4LModelSummaryButton({ model, title }: N4LModelSummaryButtonProps) {
  const { t, i18n } = useTranslation()
  const prefix = 'model-summary-table.'
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  if (!(model instanceof tfjs.LayersModel)) return null

  const number = new Intl.NumberFormat(i18n.language)
  const caption = `${t('model-summary')}: ${title}`
  const total = model.countParams()
  const trainable = countWeights(model.trainableWeights)

  return (
    <div className={'mb-3'} data-guide={'model-summary'}>
      <div className={'d-grid'}>
        <Button size={'sm'} variant={'outline-primary'} aria-expanded={isOpen} aria-controls={isOpen ? panelId : undefined}
          onClick={() => setIsOpen(!isOpen)} data-testid={'Test-ModelSummary-Toggle'}>
          <Trans i18nKey={'model-summary'} />
        </Button>
      </div>
      {isOpen &&
        <div id={panelId} className={'table-responsive mt-2'} tabIndex={0} role={'region'} aria-label={caption} data-testid={'Test-ModelSummary'}>
          <Table size={'sm'} className={'mb-0 small'}>
            <caption className={'caption-top'}>{caption}</caption>
            <thead>
              <tr>
                <th scope={'col'}>{t(prefix + 'layer')}</th>
                <th scope={'col'}>{t(prefix + 'output-shape')}</th>
                <th scope={'col'} className={'text-end'}>{t(prefix + 'params')}</th>
              </tr>
            </thead>
            <tbody>
              {model.layers.map((layer) => (
                <tr key={layer.name}>
                  <th scope={'row'} className={'fw-normal'}>
                    <span lang={'en'}>{layer.name}</span>
                    <span className={'text-body-secondary'}> (<span lang={'en'}>{layer.getClassName()}</span>)</span>
                  </th>
                  <td className={'text-nowrap'}>{formatShape(layer.outputShape)}</td>
                  <td className={'text-end'}>{number.format(layer.countParams())}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope={'row'} colSpan={2}>{t(prefix + 'total')}</th>
                <td className={'text-end fw-semibold'}>{number.format(total)}</td>
              </tr>
              {trainable !== total &&
                <tr>
                  <th scope={'row'} colSpan={2} className={'fw-normal'}>{t(prefix + 'trainable')}</th>
                  <td className={'text-end'}>{number.format(trainable)}</td>
                </tr>}
            </tfoot>
          </Table>
          <p className={'small text-body-secondary mt-1 mb-0'}>{t(prefix + 'batch-note')}</p>
        </div>}
    </div>
  )
}
