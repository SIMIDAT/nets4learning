import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection'
import { Trans } from 'react-i18next'
import { syncMediaPipeMirror } from './mediapipeMirror'
import { drawBox, drawingScale, drawPartName, drawTag, NAMES_MIN_WIDTH, personSide } from './drawing'
import { keypointSmoothing } from './smoothing'

import * as _Types from '@core/types'
import I_MODEL_OBJECT_DETECTION from './_model'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

/**
 * Las seis partes que da el detector, cada una con su color, su nombre y su lado según MediaPipe (que no siempre es el
 * de la persona: ver personSide)
 */
const PARTS: Record<string, { color: string, name: string, side?: 'right' | 'left' }> = {
  rightEye       : { color: '#38bdf8', name: 'eye', side: 'right' },
  leftEye        : { color: '#38bdf8', name: 'eye', side: 'left' },
  noseTip        : { color: '#f59e0b', name: 'nose' },
  mouthCenter    : { color: '#ec4899', name: 'mouth' },
  rightEarTragion: { color: '#22c55e', name: 'ear', side: 'right' },
  leftEarTragion : { color: '#22c55e', name: 'ear', side: 'left' },
}
// La geometría de la cara: las orejas y los ojos en línea, y debajo de los ojos la nariz y la boca
const LINES = [
  ['rightEarTragion', 'rightEye'], ['rightEye', 'leftEye'], ['leftEye', 'leftEarTragion'],
  ['rightEye', 'noseTip'], ['leftEye', 'noseTip'], ['noseTip', 'mouthCenter'],
]

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
  // Si la última imagen llegó en espejo (la webcam): cambia qué lado de la cara es cada ojo y cada oreja
  _mirrored = false
  SMOOTHING = keypointSmoothing<faceDetection.Face>({ box: true })

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
    this._mirrored = config.flipHorizontal ?? false
    syncMediaPipeMirror(this._modelDetector, this._mirrored)
    return await this._modelDetector.estimateFaces(input_image_or_video, { flipHorizontal: this._mirrored })
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
   * Cada cara: un recuadro con las esquinas marcadas (como el visor de una cámara) y su nombre encima («Cara» o, si hay
   * varias, «Cara 1», «Cara 2»…), y sus seis puntos unidos, cada parte de un color. Si la cara es grande, con el nombre
   * de cada parte hacia fuera; si es pequeña, solo los puntos
   * @param {CanvasRenderingContext2D} ctx 
   * @param {faceDetection.Face[]} faces 
   */
  RENDER (ctx: CanvasRenderingContext2D, faces: faceDetection.Face[]) {
    const scale = drawingScale(ctx)
    faces.forEach((face, index) => this._drawFace(ctx, face, faces.length > 1 ? index + 1 : null, scale))
  }

  _drawFace (ctx: CanvasRenderingContext2D, { box, keypoints }: faceDetection.Face, number: number | null, scale: number) {
    const prefix = 'datasets-models.2-object-detection.face-detection.render.'
    const points = new Map(keypoints.map((point) => [point.name ?? '', point]))
    drawBox(ctx, box, scale)

    // Las líneas entre los puntos y los puntos
    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.lineWidth = 2 * scale
    for (const [from, to] of LINES) {
      const a = points.get(from)
      const b = points.get(to)
      if (!a || !b) continue
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    const radius = Math.min(6, Math.max(3, box.width / (40 * scale))) * scale
    for (const point of keypoints) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = PARTS[point.name ?? '']?.color ?? '#ffffff'
      ctx.fill()
      ctx.lineWidth = 1.5 * scale
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
    }
    ctx.restore()

    // El nombre de cada parte, hacia fuera del centro de la cara (para no tapar los rasgos), si cabe
    if (box.width >= NAMES_MIN_WIDTH * scale) {
      const centre = { x: box.xMin + box.width / 2, y: box.yMin + box.height / 2 }
      for (const point of keypoints) {
        const part = PARTS[point.name ?? '']
        if (!part) continue
        const name = part.side === undefined ? part.name : part.name + '-' + personSide(part.side, this._mirrored)
        const dx = point.x - centre.x
        const dy = point.y - centre.y
        const length = Math.hypot(dx, dy)
        // La nariz y la boca, que quedan en el centro, hacia abajo
        const [ux, uy] = length < box.width * 0.15 || point.name === 'mouthCenter' ? [0, 1] : [dx / length, dy / length]
        drawPartName(ctx, this.t(prefix + name), part.color, { x: point.x, y: point.y, ux, uy, gap: radius + 6 * scale }, scale)
      }
    }

    const tag = number === null ? this.t(prefix + 'face') : this.t(prefix + 'face-number', { number })
    drawTag(ctx, box, tag, null, scale)
  }
}
