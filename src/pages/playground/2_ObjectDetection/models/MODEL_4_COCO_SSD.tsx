import { Trans } from 'react-i18next'
import I_MODEL_OBJECT_DETECTION, { inputWidth, mirrorBoxX } from './_model'
import * as coCoSsdDetection from '@tensorflow-models/coco-ssd'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'
import type { Smoothing_t } from './smoothing'
import { type Box_t, drawBox, drawingScale, drawTag, type Rect_t, roundedRect } from './drawing'

// El color de cada clase, siempre el mismo (todas las personas de un color, todos los coches de otro…)
const CLASS_COLORS = ['#4f46e5', '#db2777', '#0d9488', '#d97706', '#7c3aed', '#0284c7', '#16a34a', '#dc2626', '#9333ea', '#ca8a04']
function classColor(name: string) {
  let hash = 0
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return CLASS_COLORS[hash % CLASS_COLORS.length]
}

export default class MODEL_4_COCO_SSD extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.COCO_SSD
  static URL = 'https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd'
  static URL_MODEL = ''
  TITLE = 'datasets-models.2-object-detection.coco-ssd.title'
  i18n_TITLE = 'datasets-models.2-object-detection.coco-ssd.title'
  // La webcam, en espejo, como en el resto de modelos: COCO-SSD no sabe reflejar, así que PREDICTION refleja los recuadros
  mirror = true

  /**
   * @type {coCoSsdDetection.ObjectDetection}
   */
  _modelDetector: coCoSsdDetection.ObjectDetection | null = null
  // El recuadro y la confianza de cada objeto (la clase, la última)
  SMOOTHING: Smoothing_t<coCoSsdDetection.DetectedObject> = {
    positions: ({ bbox: [x, y, width, height] }) => [x, y, x + width, y + height],
    extras   : ({ score }) => [score],
    update   : (object, [xMin, yMin, xMax, yMax], [score]) => ({ ...object, bbox: [xMin, yMin, xMax - xMin, yMax - yMin], score }),
  }

  DESCRIPTION() {
    const prefix = 'datasets-models.2-object-detection.coco-ssd.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-0'} /></p>
      <p>
        <Trans i18nKey={prefix + 'text-1'}
          components={{
            link1: <a href="https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd" target={'_blank'} rel={'noreferrer'}>TEXT</a>,
          }} />
      </p>
      <p>
        <Trans i18nKey={prefix + 'text-2'}
          components={{
            link1: <a href="https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/src/classes.ts" target={'_blank'} rel={'noreferrer'}>TEXT</a>,
          }} />
      </p>
      <p><Trans i18nKey={prefix + 'text-3'} /></p>
      <details>
        <summary><Trans i18nKey={prefix + 'details-input.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-input.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-output.title'} /></summary>
        <ol>
          <li><Trans i18nKey={prefix + 'details-output.list.0'} /></li>
        </ol>
      </details>
      <details>
        <summary><Trans i18nKey={prefix + 'details-references.title'} /></summary>
        <ol>
          <li>
            <Trans i18nKey={prefix + 'details-references.list.0'}
              components={{
                link1: <a href="https://cocodataset.org/" target={'_blank'} rel={'noreferrer'}>TEXT</a>,
              }} />
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre lang={'en'}>
          {`
@article{DBLP:journals/corr/LiuAESR15,
  author       = {Wei Liu and
                  Dragomir Anguelov and
                  Dumitru Erhan and
                  Christian Szegedy and
                  Scott E. Reed and
                  Cheng{-}Yang Fu and
                  Alexander C. Berg},
  title        = {{SSD:} Single Shot MultiBox Detector},
  journal      = {CoRR},
  volume       = {abs/1512.02325},
  year         = {2015},
  url          = {http://arxiv.org/abs/1512.02325},
  eprinttype    = {arXiv},
  eprint       = {1512.02325},
  timestamp    = {Wed, 12 Feb 2020 08:32:49 +0100},
  biburl       = {https://dblp.org/rec/journals/corr/LiuAESR15.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}
`}
        </pre>
      </details>
    </>
  }

  async ENABLE_MODEL() {
    this._modelDetector = await coCoSsdDetection.load()
  }

  async PREDICTION (
    input_image_or_video: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    config: { minScore?: number, flipHorizontal?: boolean } = {}
  ) {
    if (this._modelDetector === null) return []
    const maxNumBoxes = 20
    // 0.5 para mostrar detecciones; la explicabilidad pasa un umbral más bajo.
    const minScore = config.minScore ?? 0.5
    const objects = await this._modelDetector.detect(input_image_or_video, maxNumBoxes, minScore)
    if (!config.flipHorizontal) return objects
    // Reflejados, para que caigan sobre el vídeo en espejo
    const width = inputWidth(input_image_or_video)
    return objects.map((object): coCoSsdDetection.DetectedObject => {
      const [x, y, boxWidth, boxHeight] = object.bbox
      return { ...object, bbox: [mirrorBoxX(x, boxWidth, width), y, boxWidth, boxHeight] }
    })
  }

  // Al explicar, umbral bajo: la puntuación de la clase varía de forma gradual en vez de caer a 0.
  EXPLAIN_PREDICTION_CONFIG = { minScore: 0.05 }

  /** Nombre traducido de una clase de COCO ('dog' → «Perro»); si no hay traducción, el original. */
  EXPLAIN_LABEL_TEXT(label: string | number): string {
    return this.t(`datasets-models.2-object-detection.coco-ssd.classes.${label}`, { defaultValue: String(label) })
  }

  /**
   * Cada objeto: un recuadro con las esquinas marcadas, del color de su clase y relleno muy suave, con su nombre y la
   * confianza encima (numerados si hay varios de la misma clase, de izquierda a derecha). Las etiquetas no se tapan
   * entre sí: si chocan, van dentro del recuadro o debajo
   * @param {CanvasRenderingContext2D} ctx
   * @param {coCoSsdDetection.DetectedObject[]} objects
   */
  RENDER(ctx: CanvasRenderingContext2D, objects: coCoSsdDetection.DetectedObject[]) {
    const prefix = 'datasets-models.2-object-detection.coco-ssd.render.'
    const scale = drawingScale(ctx)
    const items = objects.map((object) => {
      const [x, y, width, height] = object.bbox
      const box: Box_t = { xMin: x, yMin: y, xMax: x + width, yMax: y + height, width, height }
      return { object, box, color: classColor(object.class), number: null as number | null }
    })
    for (const item of items) {
      const same = items.filter(({ object }) => object.class === item.object.class)
      if (same.length > 1) item.number = same.filter(({ box }) => box.xMin < item.box.xMin).length + 1
    }

    // Los recuadros: primero los grandes, para que los pequeños queden encima
    for (const { box, color } of [...items].sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height)) {
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.fillStyle = color
      roundedRect(ctx, box.xMin, box.yMin, box.width, box.height, 10 * scale)
      ctx.fill()
      ctx.restore()
      drawBox(ctx, box, scale, color)
    }
    // Las etiquetas, encima de todos los recuadros: primero las de más confianza, que se quedan el mejor sitio
    const placed: Rect_t[] = []
    for (const { object, box, color, number } of [...items].sort((a, b) => b.object.score - a.object.score)) {
      const name = this.EXPLAIN_LABEL_TEXT(object.class)
      const text = number === null ? name : this.t(prefix + 'numbered', { label: name, number })
      const score = this.t(prefix + 'score', { percent: Math.round(object.score * 100) })
      placed.push(drawTag(ctx, box, text, score, scale, color, placed))
    }
  }
}
