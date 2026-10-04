import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection'
import { Trans } from 'react-i18next'
import { syncMediaPipeMirror } from './mediapipeMirror'

import * as _Types from '@core/types'
import I_MODEL_OBJECT_DETECTION from './_model'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

export default class MODEL_1_FACE_DETECTOR extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.FACE_DETECTOR
  TITLE = 'datasets-models.2-object-detection.face-detection.title'
  i18n_TITLE = 'datasets-models.2-object-detection.face-detection.title'
  URL = ''
  mirror = true
  // Salida sí/no: la explicación muestra lo mínimo que necesita ver para detectar la cara.
  EXPLAIN_NOTE_KEY = 'ui.explain.notes.presence-only'
  // Explicabilidad por zonas de la cara (ojos, nariz, labios…) en vez de una rejilla.
  faces = true

  /**
   * @type {faceDetection.FaceDetector}
   */
  _modelDetector: faceDetection.FaceDetector | null = null

  DESCRIPTION () {
    const prefix = 'datasets-models.2-object-detection.face-detection.description.'
    return <>
      <p><Trans i18nKey={prefix + 'text-0'} /></p>
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
                     link1: <a href={'https://tfhub.dev/mediapipe/tfjs-model/face_detection/short/1'} target={'_blank'} rel="noreferrer">link</a>,
                   }} />
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre>
{`
@article{DBLP:journals/corr/abs-2006-10204,
  author       = {Valentin Bazarevsky and
                  Ivan Grishchenko and
                  Karthik Raveendran and
                  Tyler Zhu and
                  Fan Zhang and
                  Matthias Grundmann},
  title        = {BlazePose: On-device Real-time Body Pose tracking},
  journal      = {CoRR},
  volume       = {abs/2006.10204},
  year         = {2020},
  url          = {https://arxiv.org/abs/2006.10204},
  eprinttype    = {arXiv},
  eprint       = {2006.10204},
  timestamp    = {Tue, 23 Jun 2020 17:57:22 +0200},
  biburl       = {https://dblp.org/rec/journals/corr/abs-2006-10204.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}
`}
        </pre>
      </details>
    </>
  }

  async ENABLE_MODEL () {
    const model = faceDetection.SupportedModels.MediaPipeFaceDetector
    /**
     * @type {faceDetection.MediaPipeFaceDetectorMediaPipeModelConfig}
     */
    const config: faceDetection.MediaPipeFaceDetectorMediaPipeModelConfig | faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
      // runtime     : 'tfjs',
      runtime     : 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
      modelType   : 'full',
      maxFaces    : 4,
    }
    this._modelDetector = await faceDetection.createDetector(model, config)
  }

  async PREDICTION (input_image_or_video: any, config = { flipHorizontal: false }): Promise<faceDetection.Face[]> {
    if (this._modelDetector === null) {
      console.error('MODEL_1_FACE_DETECTOR: PREDICTION: modelDetector is null')
      return []
    }
    syncMediaPipeMirror(this._modelDetector, config.flipHorizontal)
    return await this._modelDetector.estimateFaces(input_image_or_video, { flipHorizontal: config.flipHorizontal })
  }

  // Se explica una sola salida: "¿hay una cara?" (el detector no da una confianza por cara).
  EXPLAIN_LABELS(detections: faceDetection.Face[]): string[] {
    return detections?.length ? ['face'] : []
  }

  EXPLAIN_LABEL_TEXT(_label: string | number): string {
    return this.t('ui.explain.labels.face')
  }

  /** 1 si se detecta alguna cara, 0 si no. */
  NORMALIZE_PREDICTIONS(predictions: faceDetection.Face[], _labels: Array<string | number>): number[] {
    return [Array.isArray(predictions) && predictions.length > 0 ? 1 : 0]
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {faceDetection.Face[]} faces 
   */
  RENDER (ctx: CanvasRenderingContext2D, faces: faceDetection.Face[]) {
    const font = '20px Barlow-SemiBold, Barlow-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'

    ctx.font = font
    ctx.lineWidth = 5
    ctx.strokeStyle = '#FF0902'
    for (const face of faces) {
      for (const element of face.keypoints) {
        ctx.beginPath()
        ctx.arc(element.x, element.y, 2, 0, (Math.PI / 180) * 360)
        ctx.stroke()
        ctx.fillText(`${element.name}`, element.x, element.y)
      }
    }
  }

}
