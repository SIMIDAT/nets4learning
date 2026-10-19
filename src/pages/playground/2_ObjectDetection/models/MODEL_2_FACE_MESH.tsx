import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import { Trans } from 'react-i18next'
import { syncMediaPipeMirror } from './mediapipeMirror'
import { type Box_t, drawBox, drawingScale, drawPartName, drawTag, NAMES_MIN_WIDTH, personSide } from './drawing'
import { FACE_MESH_CONTOURS, type FaceMeshContour_t } from './faceMeshContours'
import { keypointSmoothing } from './smoothing'

import I_MODEL_OBJECT_DETECTION from './_model'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

type Point_t = { x: number, y: number }

// Todas las aristas de la malla (2.556 pares de puntos), de las que se dibujan los triángulos
const MESH = faceLandmarksDetection.util.getAdjacentPairs(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh)
// El color de cada contorno, encima de la malla
const CONTOUR_COLORS: Record<FaceMeshContour_t, string> = {
  faceOval    : '#e2e8f0',
  lips        : '#ec4899',
  rightEye    : '#38bdf8',
  leftEye     : '#38bdf8',
  rightEyebrow: '#f59e0b',
  leftEyebrow : '#f59e0b',
  rightIris   : '#22c55e',
  leftIris    : '#22c55e',
}
// Los centros de los iris (con refineLandmarks) y los extremos de cada ojo y de la boca, de los que salen sus nombres
const IRIS_CENTRES = [468, 473]
const NAMED_PARTS: Array<{ name: string, color: string, side?: 'right' | 'left', points: [number, number] }> = [
  { name: 'eye', side: 'right', color: CONTOUR_COLORS.rightEye, points: [33, 133] },
  { name: 'eye', side: 'left', color: CONTOUR_COLORS.leftEye, points: [263, 362] },
  { name: 'lips', color: CONTOUR_COLORS.lips, points: [61, 291] },
]
// Por debajo de este ancho (en un vídeo de 640 px) la malla es una mancha: solo se dibujan los contornos
const MESH_MIN_WIDTH = 80

export default class MODEL_2_FACE_MESH extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.FACE_MESH
  TITLE = 'datasets-models.2-object-detection.face-mesh.title'
  i18n_TITLE = 'datasets-models.2-object-detection.face-mesh.title'
  URL = 'https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection'
  mirror = true
  // Salida sí/no: la explicación muestra lo mínimo que necesita ver para detectar la cara.
  EXPLAIN_NOTE_KEY = 'ui.explain.notes.presence-only'
  faces = true
  usesTensorForPrediction = true

  /**
   * @type {faceLandmarksDetection.FaceLandmarksDetector}
   */
  _modelDetector: faceLandmarksDetection.FaceLandmarksDetector | null = null
  // Si la última imagen llegó en espejo (la webcam): cambia qué lado de la cara es cada ojo
  _mirrored = false
  SMOOTHING = keypointSmoothing<faceLandmarksDetection.Face>({ box: true })

  DESCRIPTION () {
    const prefix = 'datasets-models.2-object-detection.face-mesh.description.'
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
                     link1: <a href={'https://tfhub.dev/mediapipe/tfjs-model/facemesh/1/default/1'} target={'_blank'} rel="noreferrer">link</a>,
                   }} />
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre lang={'en'}>
{`
@article{DBLP:journals/corr/abs-2006-10962,
  author       = {Ivan Grishchenko and
                  Artsiom Ablavatski and
                  Yury Kartynnik and
                  Karthik Raveendran and
                  Matthias Grundmann},
  title        = {Attention Mesh: High-fidelity Face Mesh Prediction in Real-time},
  journal      = {CoRR},
  volume       = {abs/2006.10962},
  year         = {2020},
  url          = {https://arxiv.org/abs/2006.10962},
  eprinttype    = {arXiv},
  eprint       = {2006.10962},
  timestamp    = {Tue, 23 Jun 2020 17:57:22 +0200},
  biburl       = {https://dblp.org/rec/journals/corr/abs-2006-10962.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}
`}
        </pre>
      </details>
    </>
  }

  async ENABLE_MODEL () {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
    /**
     * @type {faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig}
     */
    const mediaPipeFaceMeshMediaPipeModelConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
      runtime        : 'mediapipe',
      solutionPath   : 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      refineLandmarks: true,
      maxFaces       : 4,
    }
    this._modelDetector = await faceLandmarksDetection.createDetector(model, mediaPipeFaceMeshMediaPipeModelConfig)
  }

  async PREDICTION (input_image_or_video: any, config = { flipHorizontal: false }): Promise<faceLandmarksDetection.Face[]> {
    if (this._modelDetector === null) return []
    this._mirrored = config.flipHorizontal ?? false
    syncMediaPipeMirror(this._modelDetector, this._mirrored)
    return await this._modelDetector.estimateFaces(input_image_or_video, { flipHorizontal: this._mirrored, staticImageMode: false })
  }

  // Se explica una sola salida: "¿hay una cara?" (FaceMesh no da una confianza por cara).
  EXPLAIN_LABELS(detections: faceLandmarksDetection.Face[]): string[] {
    return detections?.length ? ['face'] : []
  }

  EXPLAIN_LABEL_TEXT(_label: string | number): string {
    return this.t('ui.explain.labels.face')
  }

  /** 1 si se detecta alguna cara, 0 si no. */
  NORMALIZE_PREDICTIONS(predictions: faceLandmarksDetection.Face[], _labels?: Array<string | number>): number[] {
    return [Array.isArray(predictions) && predictions.length > 0 ? 1 : 0]
  }

  /**
   * Cada cara: la malla, fina, y encima los contornos de cada parte, cada uno de su color (el óvalo, los labios, los
   * ojos, las cejas y los iris), dentro de un recuadro con las esquinas marcadas y su nombre encima («Cara» o, si hay
   * varias, «Cara 1», «Cara 2»…) con el número de puntos. Si la cara es grande, con el nombre de los ojos y de los
   * labios a los lados; si es muy pequeña, sin la malla
   * @param {CanvasRenderingContext2D} ctx
   * @param {faceLandmarksDetection.Face[]} faces
   */
  RENDER (ctx: CanvasRenderingContext2D, faces: faceLandmarksDetection.Face[]) {
    const scale = drawingScale(ctx)
    faces.forEach((face, index) => this._drawFace(ctx, face, faces.length > 1 ? index + 1 : null, scale))
  }

  _drawFace (ctx: CanvasRenderingContext2D, { box: tight, keypoints }: faceLandmarksDetection.Face, number: number | null, scale: number) {
    const prefix = 'datasets-models.2-object-detection.face-mesh.render.'
    // El recuadro de la malla toca el óvalo de la cara: con un margen, para que las esquinas no tapen la barbilla
    const pad = tight.width * 0.06
    const box: Box_t = {
      xMin  : tight.xMin - pad,
      yMin  : tight.yMin - pad,
      xMax  : tight.xMax + pad,
      yMax  : tight.yMax + pad,
      width : tight.width + 2 * pad,
      height: tight.height + 2 * pad,
    }
    const path = (pairs: number[][]) => {
      ctx.beginPath()
      for (const [from, to] of pairs) {
        const a = keypoints[from]
        const b = keypoints[to]
        if (!a || !b) continue
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
      }
    }

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (tight.width >= MESH_MIN_WIDTH * scale) {
      path(MESH)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
      ctx.lineWidth = 0.8 * scale
      ctx.stroke()
    }
    // Los contornos, con un borde oscuro debajo para que se vean sobre la piel clara
    for (const [contour, color] of Object.entries(CONTOUR_COLORS) as Array<[FaceMeshContour_t, string]>) {
      path(FACE_MESH_CONTOURS[contour])
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)'
      ctx.lineWidth = 4 * scale
      ctx.stroke()
      ctx.strokeStyle = color
      ctx.lineWidth = 2 * scale
      ctx.stroke()
    }
    for (const index of IRIS_CENTRES) {
      const centre = keypoints[index]
      if (!centre) continue
      ctx.beginPath()
      ctx.arc(centre.x, centre.y, 2.5 * scale, 0, 2 * Math.PI)
      ctx.fillStyle = CONTOUR_COLORS.rightIris
      ctx.fill()
    }
    ctx.restore()

    drawBox(ctx, box, scale)

    // El nombre de los ojos y de los labios, fuera del recuadro, unidos a su parte con una línea
    if (box.width >= NAMES_MIN_WIDTH * scale) {
      const centreX = box.xMin + box.width / 2
      // A cada lado de la cara, de arriba abajo: el ojo y, debajo, los labios
      const names = { [-1]: 0, [1]: 0 }
      for (const part of NAMED_PARTS) {
        const [a, b] = part.points.map((index) => keypoints[index]) as Array<Point_t | undefined>
        if (!a || !b) continue
        // El ojo, por su extremo de fuera; los labios, por la comisura del lado con menos nombres
        const ux = part.side === undefined
          ? (names[1] <= names[-1] ? 1 : -1)
          : Math.sign(a.x - centreX) || 1
        const anchor = part.side === undefined ? (Math.sign(a.x - centreX) === ux ? a : b) : a
        const name = part.side === undefined ? part.name : part.name + '-' + personSide(part.side, this._mirrored)
        const edge = ux > 0 ? box.xMax + 8 * scale : box.xMin - 8 * scale
        const pill = drawPartName(ctx, this.t(prefix + name), part.color,
                                  { x: anchor.x, y: anchor.y, ux, uy: 0, gap: Math.abs(edge - anchor.x) }, scale)
        names[ux as -1 | 1] += 1
        // La línea, del punto al borde de la etiqueta más cercano
        const end = { x: ux > 0 ? pill.left : pill.left + pill.width, y: pill.top + pill.height / 2 }
        if (Math.sign(end.x - anchor.x) === ux) {
          ctx.save()
          ctx.strokeStyle = part.color
          ctx.lineWidth = 1.5 * scale
          ctx.setLineDash([4 * scale, 3 * scale])
          ctx.beginPath()
          ctx.moveTo(anchor.x, anchor.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
          ctx.restore()
        }
      }
    }

    const tag = number === null ? this.t(prefix + 'face') : this.t(prefix + 'face-number', { number })
    drawTag(ctx, box, tag, this.t(prefix + 'points', { count: keypoints.length }), scale)
  }
}
