import I_MODEL_OBJECT_DETECTION, { inputWidth } from './_model'
import { Trans } from 'react-i18next'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'
import { type Box_t, drawBox, drawingScale, drawTag, overlaps, paintPartName, placePartName, type Rect_t } from './drawing'
import { keypointSmoothing } from './smoothing'

// En el orden COCO de MoveNet, los puntos impares son del lado izquierdo de la persona y los pares (salvo la nariz, el
// 0), del derecho. Los lados son siempre los de la persona: MoveNet ve la imagen tal cual, sin espejo
const LEFT = '#f59e0b'
const RIGHT = '#38bdf8'
const CENTRE = '#e2e8f0'
const sideColor = (index: number) => (index === 0 ? CENTRE : index % 2 === 1 ? LEFT : RIGHT)
// Los huesos del esqueleto (pares de puntos), del color de su lado
const BONES: Array<[number, number, string]> = [
  // La cabeza: la nariz, los ojos y las orejas
  [0, 1, LEFT], [1, 3, LEFT], [0, 2, RIGHT], [2, 4, RIGHT],
  // El tronco
  [5, 6, CENTRE], [11, 12, CENTRE], [5, 11, LEFT], [6, 12, RIGHT],
  // Los brazos
  [5, 7, LEFT], [7, 9, LEFT], [6, 8, RIGHT], [8, 10, RIGHT],
  // Las piernas
  [11, 13, LEFT], [13, 15, LEFT], [12, 14, RIGHT], [14, 16, RIGHT],
]
const HEAD = [0, 1, 2, 3, 4]
// Las articulaciones con nombre, por orden de prioridad (si dos se tapan, se queda la primera). Las de la cabeza no:
// están tan juntas que sus nombres se taparían
const JOINTS: Array<[number, string]> = [
  [5, 'shoulder-left'], [6, 'shoulder-right'], [7, 'elbow-left'], [8, 'elbow-right'], [9, 'wrist-left'], [10, 'wrist-right'],
  [11, 'hip-left'], [12, 'hip-right'], [13, 'knee-left'], [14, 'knee-right'], [15, 'ankle-left'], [16, 'ankle-right'],
]
// El color de cada persona, de izquierda a derecha de la imagen
const PERSON_COLORS = ['#4f46e5', '#db2777', '#0d9488', '#d97706', '#7c3aed']
// Los puntos con menos confianza no se dibujan
const MIN_SCORE = 0.3
const seen = (keypoint: poseDetection.Keypoint | undefined): keypoint is poseDetection.Keypoint =>
  keypoint !== undefined && (keypoint.score ?? 1) >= MIN_SCORE
// Por debajo de esta altura (en un vídeo de 640 px) no caben los nombres de las articulaciones
const NAMES_MIN_HEIGHT = 160

export default class MODEL_3_MOVE_NET_POSE_NET extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.MOVE_NET_POSE_NET
  TITLE = 'datasets-models.2-object-detection.move-net--pose-net.title'
  i18n_TITLE = 'datasets-models.2-object-detection.move-net--pose-net.title'
  URL = 'https://github.com/tensorflow/tfjs-models/tree/master/pose-detection'
  // La webcam, en espejo, como en el resto de modelos: MoveNet no sabe reflejar, así que PREDICTION refleja los puntos
  mirror = true
  usesTensorForPrediction = false

  /**
   * @type {poseDetection.PoseDetector} 
   */
  _modelDetector: poseDetection.PoseDetector | null = null
  // Los puntos y su confianza (así un punto dudoso no aparece y desaparece y el recuadro no salta), seguidos por el
  // identificador de cada persona que da MoveNet
  SMOOTHING = keypointSmoothing<poseDetection.Pose>({ scores: true, id: (pose) => pose.id })


  DESCRIPTION () {
    const prefix = 'datasets-models.2-object-detection.move-net--pose-net.description.'
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
                     link1: <a href={'https://tfhub.dev/google/movenet/multipose/lightning/1'} target={'_blank'} rel="noreferrer">link</a>,
                   }} />
          </li>
        </ol>
      </details>
      <details>
        <summary>BibTeX</summary>
        <pre lang={'en'}>
{`
@article{DBLP:journals/corr/KendallGC15,
  author       = {Alex Kendall and
                  Matthew Grimes and
                  Roberto Cipolla},
  title        = {Convolutional networks for real-time 6-DOF camera relocalization},
  journal      = {CoRR},
  volume       = {abs/1505.07427},
  year         = {2015},
  url          = {https://arxiv.org/abs/1505.07427},
  eprinttype    = {arXiv},
  eprint       = {1505.07427},
  timestamp    = {Mon, 13 Aug 2018 16:46:52 +0200},
  biburl       = {https://dblp.org/rec/journals/corr/KendallGC15.bib},
  bibsource    = {dblp computer science bibliography, https://dblp.org}
}
`}
        </pre>
      </details>
    </>
  }

  // https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/movenet
  // https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/posenet
  async ENABLE_MODEL () {
    const model = poseDetection.SupportedModels.MoveNet
    /**
     * @type {poseDetection.MoveNetModelConfig}
     */
    const modelConfig__MoveNet = {
      modelType      : poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
      enableTracking : true,
      trackerType    : poseDetection.TrackerType.BoundingBox,
      minPoseScore   : 0.2,
      enableSmoothing: true
    }
    this._modelDetector = await poseDetection.createDetector(model, modelConfig__MoveNet)
  }

  async PREDICTION (input_image_or_video: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, config = { flipHorizontal: false }) {
    if (this._modelDetector === null) return []
    // MoveNet ignora flipHorizontal: devuelve los puntos de la imagen tal cual
    const poses = await this._modelDetector.estimatePoses(input_image_or_video, { maxPoses: 5 })
    if (!config.flipHorizontal) return poses
    // Reflejados, para que caigan sobre el vídeo en espejo. Sus nombres no cambian: son los lados de la persona
    const width = inputWidth(input_image_or_video)
    return poses.map((pose) => ({
      ...pose,
      keypoints: pose.keypoints.map((keypoint) => ({ ...keypoint, x: width - keypoint.x })),
      // El recuadro de MoveNet va de 0 a 1
      ...(pose.box && { box: { ...pose.box, xMin: 1 - pose.box.xMax, xMax: 1 - pose.box.xMin } }),
    }))
  }

  /** Partes del cuerpo que se explican, con los índices de sus puntos clave (orden COCO de MoveNet). */
  EXPLAIN_NOTE_KEY = 'ui.explain.notes.body-parts'

  static readonly BODY_PARTS: Record<string, number[]> = {
    head: [0, 1, 2, 3, 4], // nariz, ojos y orejas
    arms: [5, 6, 7, 8, 9, 10], // hombros, codos y muñecas
    legs: [11, 12, 13, 14, 15, 16], // caderas, rodillas y tobillos
  }

  // Se explica la confianza en la pose completa y en cada parte del cuerpo: «¿qué zonas de la imagen
  // hacen que el modelo vea los brazos?». Con una sola media de 17 puntos, tapar una zona apenas se notaba.
  EXPLAIN_LABELS(detections: poseDetection.Pose[]): string[] {
    return detections?.length ? ['pose', ...Object.keys(MODEL_3_MOVE_NET_POSE_NET.BODY_PARTS)] : []
  }

  EXPLAIN_LABEL_TEXT(label: string | number): string {
    return label === 'pose' ? this.t('ui.explain.labels.pose') : this.t(`ui.explain.labels.body.${label}`)
  }

  /** Por etiqueta, confianza media de sus puntos clave en la pose más segura (0 si no hay poses). */
  NORMALIZE_PREDICTIONS(predictions: poseDetection.Pose[], labels: Array<string | number>): number[] {
    const meanScore = (pose: poseDetection.Pose, indices?: number[]) => {
      const keypoints = indices ? indices.map((i) => pose.keypoints[i]) : pose.keypoints
      const scores = keypoints.map((k) => k?.score ?? 0)
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    }
    let best: poseDetection.Pose | null = null
    for (const pose of predictions ?? []) {
      if (best === null || meanScore(pose) > meanScore(best)) best = pose
    }
    return labels.map((label) => {
      if (best === null) return 0
      if (label === 'pose') return meanScore(best)
      const indices = MODEL_3_MOVE_NET_POSE_NET.BODY_PARTS[label]
      return indices ? meanScore(best, indices) : 0
    })
  }

  /**
   * Cada persona: su esqueleto, con el lado izquierdo y el derecho de distinto color, dentro de un recuadro con las
   * esquinas marcadas y su nombre encima («Persona» o, si hay varias, «Persona 1», «Persona 2»… de izquierda a derecha,
   * cada una de un color) con la confianza. Si la persona es grande, con el nombre de cada articulación hacia fuera
   * @param {CanvasRenderingContext2D} ctx
   * @param {poseDetection.Pose[]} poses
   */
  RENDER (ctx: CanvasRenderingContext2D, poses: poseDetection.Pose[]) {
    const scale = drawingScale(ctx)
    const people = poses
      .map((pose) => ({ pose, box: this._box(ctx, pose, scale) }))
      .filter((person): person is { pose: poseDetection.Pose, box: Box_t } => person.box !== null)
      .sort((a, b) => a.box.xMin + a.box.xMax - b.box.xMin - b.box.xMax)
    people.forEach(({ pose, box }, index) => this._drawPerson(ctx, pose, box, people.length > 1 ? index + 1 : null, scale))
  }

  /** El recuadro de los puntos visibles, con margen y con la cabeza entera (MoveNet solo marca la cara) */
  _box (ctx: CanvasRenderingContext2D, { keypoints }: poseDetection.Pose, scale: number): Box_t | null {
    const visible = keypoints.filter(seen)
    if (visible.length < 2) return null
    const xs = visible.map(({ x }) => x)
    const ys = visible.map(({ y }) => y)
    const [xMin, xMax, yMin, yMax] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const pad = Math.max(xMax - xMin, yMax - yMin) * 0.06 + 8 * scale
    // Por encima de los ojos queda media cabeza: como la mitad de lo que hay de los ojos a los hombros
    const head = HEAD.map((index) => keypoints[index]).filter(seen)
    const shoulders = [keypoints[5], keypoints[6]].filter(seen)
    const top = head.length > 0 && shoulders.length > 0
      ? Math.max(pad, 0.5 * (Math.min(...shoulders.map(({ y }) => y)) - Math.min(...head.map(({ y }) => y))))
      : pad
    const box = {
      xMin: Math.max(0, xMin - pad),
      yMin: Math.max(0, yMin - top),
      xMax: Math.min(ctx.canvas.width, xMax + pad),
      yMax: Math.min(ctx.canvas.height, yMax + pad),
    }
    return { ...box, width: box.xMax - box.xMin, height: box.yMax - box.yMin }
  }

  _drawPerson (ctx: CanvasRenderingContext2D, { keypoints, score }: poseDetection.Pose, box: Box_t, number: number | null, scale: number) {
    const prefix = 'datasets-models.2-object-detection.move-net--pose-net.render.'
    const color = PERSON_COLORS[((number ?? 1) - 1) % PERSON_COLORS.length]
    const visible = (index: number) => (seen(keypoints[index]) ? keypoints[index] : null)
    drawBox(ctx, box, scale, color)

    // Los huesos, con un borde oscuro debajo para que se vean sobre cualquier fondo, y las articulaciones
    const width = Math.min(5, Math.max(2, box.height / (90 * scale))) * scale
    ctx.save()
    ctx.lineCap = 'round'
    for (const halo of [true, false]) {
      for (const [from, to, boneColor] of BONES) {
        const a = visible(from)
        const b = visible(to)
        if (!a || !b) continue
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = halo ? 'rgba(15, 23, 42, 0.4)' : boneColor
        ctx.lineWidth = halo ? width + 3 * scale : width
        ctx.stroke()
      }
    }
    const radius = width + 1.5 * scale
    keypoints.forEach((_, index) => {
      const keypoint = visible(index)
      if (!keypoint) return
      ctx.beginPath()
      ctx.arc(keypoint.x, keypoint.y, HEAD.includes(index) ? radius * 0.75 : radius, 0, 2 * Math.PI)
      ctx.fillStyle = sideColor(index)
      ctx.fill()
      ctx.lineWidth = 1.5 * scale
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
    })
    ctx.restore()

    // El nombre de cada articulación, hacia fuera del cuerpo, si cabe y no tapa otro
    if (box.height >= NAMES_MIN_HEIGHT * scale) {
      const [left, right] = [visible(5), visible(6)]
      const centreX = left && right ? (left.x + right.x) / 2 : box.xMin + box.width / 2
      const placed: Rect_t[] = []
      for (const [index, name] of JOINTS) {
        const keypoint = visible(index)
        if (!keypoint) continue
        const text = this.t(prefix + name)
        const ux = Math.sign(keypoint.x - centreX) || 1
        const rect = placePartName(ctx, text, { x: keypoint.x, y: keypoint.y, ux, uy: 0, gap: radius + 6 * scale }, scale)
        if (placed.some((other) => overlaps(rect, other))) continue
        paintPartName(ctx, text, sideColor(index), rect, scale)
        placed.push(rect)
      }
    }

    const tag = number === null ? this.t(prefix + 'person') : this.t(prefix + 'person-number', { number })
    const detail = score === undefined ? null : this.t(prefix + 'score', { percent: Math.round(score * 100) })
    drawTag(ctx, box, tag, detail, scale, color)
  }
}
