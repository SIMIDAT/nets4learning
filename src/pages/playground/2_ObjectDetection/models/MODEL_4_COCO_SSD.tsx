import { Trans } from 'react-i18next'
import I_MODEL_OBJECT_DETECTION from './_model'
import * as coCoSsdDetection from '@tensorflow-models/coco-ssd'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

export class MODEL_4_COCO_SSD extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.COCO_SSD
  static URL = 'https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd'
  static URL_MODEL = ''
  TITLE = 'datasets-models.2-object-detection.coco-ssd.title'
  i18n_TITLE = 'datasets-models.2-object-detection.coco-ssd.title'
  mirror = false

  /**
   * @type {coCoSsdDetection.ObjectDetection}
   */
  _modelDetector: coCoSsdDetection.ObjectDetection | null = null

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
        <pre>
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

  async PREDICTION (input_image_or_video: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, config: { minScore?: number } = {}) {
    if (this._modelDetector === null) return []
    const maxNumBoxes = 20
    // 0.5 para mostrar detecciones; la explicabilidad pasa un umbral más bajo.
    const minScore = config.minScore ?? 0.5
    return await this._modelDetector.detect(input_image_or_video, maxNumBoxes, minScore)
  }

  // Al explicar, umbral bajo: la puntuación de la clase varía de forma gradual en vez de caer a 0.
  EXPLAIN_PREDICTION_CONFIG = { minScore: 0.05 }

  /** Nombre traducido de una clase de COCO ('dog' → «Perro»); si no hay traducción, el original. */
  EXPLAIN_LABEL_TEXT(label: string | number): string {
    return this.t(`datasets-models.2-object-detection.coco-ssd.classes.${label}`, { defaultValue: String(label) })
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {coCoSsdDetection.DetectedObject[]} predictions
   */
  RENDER(ctx: CanvasRenderingContext2D, predictions: coCoSsdDetection.DetectedObject[]) {
    let scoreParsed = 0
    const font = '16px Barlow-SemiBold, Barlow-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'

    predictions.forEach(({ score, class: _class, bbox }) => {
      scoreParsed = Math.round(parseFloat(score.toFixed(2)) * 100)
      this._drawRect(ctx, bbox[0], bbox[1], bbox[2], bbox[3])
      const label = this.t('datasets-models.2-object-detection.coco-ssd.render-label', { label: this.EXPLAIN_LABEL_TEXT(_class), score: scoreParsed })
      this._drawTextBG(ctx, label, font, bbox[0], bbox[1], 20)
    })
  }
}
