import i18next from 'i18next'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import {
  createHandSignEstimator,
  HandMotionTracker,
  HandSignClassifier,
  HandSignsASL,
  HandSignsSSL,
  signingHand,
  type HandSignEstimator,
  type HandSignLang,
} from 'handsign-multilingual'
import { Trans } from 'react-i18next'
import { Container, Row, Col } from 'react-bootstrap'
import { syncMediaPipeMirror } from './mediapipeMirror'
import { keypointSmoothing } from './smoothing'

import * as _Types from '@core/types'
import I_MODEL_OBJECT_DETECTION, { type DetectionInput_t } from './_model'
import { HandSignInfo } from './MODEL_6_HAND_SIGN_HandSignInfo'
import { TFJS_handpose_bibtex } from './MODEL_6_HAND_SIGN_INFO'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

/** La letra de una mano en un fotograma: la que llega al mínimo (null: ninguna) y la puntuación de cada una (0-1) */
type Recognition_t = { letter: string | null, score: number, scores: Record<string, number> }

/** Lo que se dibuja de cada mano */
type HandView_t = {
  hand  : handPoseDetection.Hand
  side  : 'left' | 'right' | undefined
  letter: string | null
  score : number
  /** Es una letra de movimiento (LL, Ñ, RR) */
  moving: boolean
  /** Por dónde ha pasado el centro de la mano (para ver el movimiento) */
  trail : Array<{ x: number, y: number }>
}

// Cada dedo con su color, desde su base; la palma une la muñeca con la base de los dedos
const FINGERS = [
  { points: [1, 2, 3, 4], color: '#f97316' },
  { points: [5, 6, 7, 8], color: '#eab308' },
  { points: [9, 10, 11, 12], color: '#22c55e' },
  { points: [13, 14, 15, 16], color: '#06b6d4' },
  { points: [17, 18, 19, 20], color: '#a855f7' },
]
const PALM = [0, 1, 5, 9, 13, 17, 0]
const COLORS = { letter: '#4f46e5', moving: '#059669', none: 'rgba(71, 85, 105, 0.85)' }

// Para que la letra no parpadee: la que dan la mayoría de los últimos fotogramas (a 20 por segundo, unos 0,4 s)
const STEADY_FRAMES = 8
const STEADY_AGREEMENT = 5
// Una letra de movimiento se queda en pantalla un momento después de hacerla; el rastro, lo que dura el movimiento
const MOTION_SHOWN_MS = 1500
const TRAIL_MS = 1500

const centre = (hand: handPoseDetection.Hand) => ({
  x: hand.keypoints.reduce((sum, { x }) => sum + x, 0) / hand.keypoints.length,
  y: hand.keypoints.reduce((sum, { y }) => sum + y, 0) / hand.keypoints.length,
})

/** La letra que más se repite en el historial, si se repite al menos `agreement` veces */
const mostVoted = (history: Array<string | null>, agreement: number) => {
  const votes = new Map<string, number>()
  for (const letter of history) if (letter !== null) votes.set(letter, (votes.get(letter) ?? 0) + 1)
  let best: string | null = null
  for (const [letter, count] of votes) if (count >= agreement && (best === null || count > (votes.get(best) ?? 0))) best = letter
  return best
}

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, width, height, radius)
  else ctx.rect(x, y, width, height)
}

export default class MODEL_6_HAND_SIGN extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.HAND_SIGN
  TITLE = 'datasets-models.2-object-detection.hand-sign.title'
  i18n_TITLE = 'datasets-models.2-object-detection.hand-sign.title'
  URL = 'https://github.com/nonodev96/handsign-multilingual'
  mirror = true
  /**
   * @type {handPoseDetection.HandDetector}
   */
  _modelDetector: handPoseDetection.HandDetector | null = null
  /** Las letras del alfabeto: el americano (ASL) o, en español, el español (SSL), con sus letras de movimiento */
  signLanguage  : HandSignLang = HandSignsASL
  /**
   * Las reglas de handsign-multilingual: lleva cada mano al marco en el que están descritas las letras (una mano
   * derecha sin espejo), así que valen la mano izquierda y la webcam en espejo, y puntúa de 0 a 1
   */
  signEstimator : HandSignEstimator | null = null
  /**
   * Con la ASL, los ejemplos de 2122 manos reales de handsign-multilingual/samples: aciertan el 92 %, frente al 38 % de
   * las reglas. Del español aún no hay: se usan las reglas
   */
  classifier    : HandSignClassifier | null = null
  // Puntuación mínima de una letra: con las reglas (fracción de lo que coincide) y con los ejemplos (votos)
  static readonly MIN_SCORE = 0.8
  static readonly MIN_SHARE = 0.6

  // Lo de cada mano entre fotogramas, por su lado (el orden de las manos cambia): las últimas letras, el movimiento,
  // la letra de movimiento en pantalla y el rastro
  _mirrored = false
  _steady = new Map<string, Array<string | null>>()
  _trackers = new Map<string, HandMotionTracker>()
  _motions = new Map<string, { letter: string, until: number }>()
  _trails = new Map<string, Array<{ x: number, y: number, time: number }>>()
  // Lo último que se ha dibujado: el resumen en texto de la página dice lo mismo que la pantalla
  _lastViews: { predictions: unknown[], views: HandView_t[] } | null = null
  // Los puntos de cada mano (sus puntos 3D, con los que se reconoce la letra, tal cual). RENDER también sigue la letra
  // y el movimiento de cada mano fotograma a fotograma: solo se llama con cada predicción
  SMOOTHING = keypointSmoothing<handPoseDetection.Hand>()
  RENDER_EVERY_FRAME = false

  DESCRIPTION() {
    const prefix = 'datasets-models.2-object-detection.hand-sign.description.'

    return <>
      <Container>
        <Row>
          <Col>
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
                <li><Trans i18nKey={prefix + 'details-output.list.1'} /></li>
              </ol>
            </details>
            <details>
              <summary><Trans i18nKey={prefix + 'details-movement.title'} /></summary>
              <ol>
                <li><Trans i18nKey={prefix + 'details-movement.list.0'} /></li>
                <li><Trans i18nKey={prefix + 'details-movement.list.1'} /></li>
              </ol>
            </details>
            <details>
              <summary><Trans i18nKey={prefix + 'details-references.title'} /></summary>
              <ol>
                <li>
                  <details>
                    <summary><Trans i18nKey={prefix + 'details-references.list.0'} /></summary>
                    <pre lang={'en'}>{TFJS_handpose_bibtex}</pre>
                  </details>
                </li>
              </ol>
            </details>
          </Col>
        </Row>
        <Row>
          <Col>
            <HandSignInfo />
          </Col>
        </Row>
      </Container>

    </>
  }

  async ENABLE_MODEL() {
    const spanish = i18next.language === 'es'
    this.signLanguage = spanish ? HandSignsSSL : HandSignsASL
    // Todas las letras (desde 0): el mínimo se aplica después
    this.signEstimator = createHandSignEstimator(this.signLanguage, { minScore: 0 })
    // Los ejemplos (unos 180 kB) solo se descargan con la ASL
    this.classifier = spanish ? null : HandSignClassifier.fromJSON((await import('handsign-multilingual/samples')).SamplesASL)
    this._resetTracking()
    const model = handPoseDetection.SupportedModels.MediaPipeHands
    /**
     * @type {handPoseDetection.MediaPipeHandsMediaPipeModelConfig}
     */
    const modelConfig: handPoseDetection.MediaPipeHandsMediaPipeModelConfig | handPoseDetection.MediaPipeHandsTfjsModelConfig = {
      runtime     : 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
      modelType   : 'full',
      maxHands    : 4
    }
    this._modelDetector = await handPoseDetection.createDetector(model, modelConfig)
  }

  /**
   *
   * @param {ImageData} input_image_or_video
   * @param {{flipHorizontal?: boolean, resetTracking?: boolean}} config
   * @returns {Promise<handPoseDetection.Hand[]>}
   */
  async PREDICTION (input_image_or_video: DetectionInput_t, config: { flipHorizontal?: boolean, resetTracking?: boolean } = {}) {
    if (this._modelDetector === null) return []
    // El runtime de MediaPipe sigue la mano del fotograma anterior (ignora `staticImageMode`);
    // al explicar, cada imagen perturbada debe evaluarse sin memoria de la anterior.
    if (config.resetTracking) this._modelDetector.reset()
    const flipHorizontal = config.flipHorizontal ?? false
    this._mirrored = flipHorizontal
    // Una imagen suelta (no la webcam): sin la letra ni el movimiento de los fotogramas anteriores
    if (!(typeof HTMLVideoElement !== 'undefined' && input_image_or_video instanceof HTMLVideoElement)) this._resetTracking()
    syncMediaPipeMirror(this._modelDetector, flipHorizontal)
    return await this._modelDetector.estimateHands(input_image_or_video, { flipHorizontal })
  }

  _resetTracking() {
    this._steady.clear()
    this._trackers.clear()
    this._motions.clear()
    this._trails.clear()
    this._lastViews = null
  }

  /** La letra de una mano en este fotograma: con los ejemplos si los hay y, si no, con las reglas */
  _recognize(hand: handPoseDetection.Hand): Recognition_t {
    if (this.signEstimator === null || !hand.keypoints3D) return { letter: null, score: 0, scores: {} }
    const [letters, minimum] = this.classifier !== null
      ? [this.classifier.predict(hand), MODEL_6_HAND_SIGN.MIN_SHARE]
      : [this.signEstimator.estimate(hand).letters, MODEL_6_HAND_SIGN.MIN_SCORE]
    const best = letters[0]
    return {
      letter: best !== undefined && best.score >= minimum ? best.letter : null,
      score : best?.score ?? 0,
      scores: Object.fromEntries(letters.map(({ letter, score }) => [letter, score])),
    }
  }

  /**
   * Cada mano de este fotograma con su letra: la que dan la mayoría de los últimos fotogramas (no parpadea) o, al hacer
   * una de movimiento (LL, Ñ, RR, en la SSL), esa durante un momento
   */
  _track(predictions: handPoseDetection.Hand[]): HandView_t[] {
    const now = performance.now()
    const hands = predictions.filter((hand) => hand.keypoints?.length === 21)
    const sides = hands.map((hand) => signingHand(hand, { mirrored: this._mirrored }))
    // Una clave por mano que se mantiene entre fotogramas: su lado (y «-2» si MediaPipe da el mismo a dos manos)
    const seen = new Map<string, number>()
    const keys = sides.map((side) => {
      const count = (seen.get(side ?? 'hand') ?? 0) + 1
      seen.set(side ?? 'hand', count)
      return count === 1 ? (side ?? 'hand') : `${side ?? 'hand'}-${count}`
    })
    for (const map of [this._steady, this._trackers, this._motions, this._trails]) {
      for (const key of [...map.keys()]) if (!keys.includes(key)) map.delete(key)
    }

    return hands.map((hand, index) => {
      const key = keys[index]
      const { letter, score, scores } = this._recognize(hand)
      const history = [...(this._steady.get(key) ?? []), letter].slice(-STEADY_FRAMES)
      this._steady.set(key, history)
      // Con pocos fotogramas (una imagen, o la mano recién aparecida) vale la de este
      const steady = history.length < STEADY_FRAMES ? letter : mostVoted(history, STEADY_AGREEMENT)

      let tracker = this._trackers.get(key)
      if (tracker === undefined) {
        tracker = new HandMotionTracker(this.signLanguage.motions ?? [])
        this._trackers.set(key, tracker)
      }
      const moved = tracker.update(hand, letter, now)
      if (moved !== null) this._motions.set(key, { letter: moved, until: now + MOTION_SHOWN_MS })
      const motion = this._motions.get(key)
      const moving = motion !== undefined && motion.until > now

      const trail = [...(this._trails.get(key) ?? []).filter(({ time }) => now - time <= TRAIL_MS), { ...centre(hand), time: now }]
      this._trails.set(key, trail)

      return {
        hand,
        side  : sides[index],
        letter: moving ? motion.letter : steady,
        score : moving ? 1 : steady !== null ? (scores[steady] ?? score) : score,
        moving,
        trail,
      }
    })
  }

  // region EXPLICABILIDAD
  EXPLAIN_PREDICTION_CONFIG = { resetTracking: true }

  // Se explican la presencia de la mano y cada letra reconocida: "¿qué partes de la mano hacen
  // que el modelo lea la letra X?".
  static readonly HAND_LABEL = 'hand'

  /** Lo que se ve en pantalla si estas son las detecciones que se acaban de dibujar (null: otras) */
  _shown(predictions: unknown): HandView_t[] | null {
    return this._lastViews !== null && this._lastViews.predictions === predictions ? this._lastViews.views : null
  }

  EXPLAIN_LABELS(detections: handPoseDetection.Hand[]): string[] {
    if (!detections?.length || this.signEstimator === null) return detections?.length ? [MODEL_6_HAND_SIGN.HAND_LABEL] : []
    // En directo, las letras de la pantalla (también las de movimiento); al explicar una imagen, la de cada mano
    const letters = this._shown(detections)?.map(({ letter }) => letter) ?? detections.map((hand) => this._recognize(hand).letter)
    return [MODEL_6_HAND_SIGN.HAND_LABEL, ...new Set(letters.filter((letter): letter is string => letter !== null))]
  }

  EXPLAIN_LABEL_TEXT(label: string | number): string {
    return label === MODEL_6_HAND_SIGN.HAND_LABEL
      ? this.t('ui.explain.labels.hand')
      : this.t('ui.explain.labels.sign', { sign: String(label) })
  }

  NORMALIZE_PREDICTIONS(predictions: handPoseDetection.Hand[], labels: Array<string | number>): number[] {
    const hands = Array.isArray(predictions) ? predictions : []
    const shown = this._shown(predictions)
    const perHand = hands.map((hand) => this._recognize(hand).scores)
    return labels.map((label) => {
      if (label === MODEL_6_HAND_SIGN.HAND_LABEL) return Math.max(0, ...hands.map((hand) => hand.score ?? 1))
      const onScreen = shown?.find(({ letter }) => letter === label)
      if (onScreen !== undefined) return onScreen.score
      return Math.max(0, ...perHand.map((scores) => scores[String(label)] ?? 0))
    })
  }
  // endregion

  /**
   * Cada mano: sus dedos (cada uno de un color), un recuadro y, encima, su letra con la mano y la confianza (o «?» si
   * no llega al mínimo). Al hacer una letra de movimiento, el rastro de la mano y la letra en verde
   */
  RENDER(ctx: CanvasRenderingContext2D, predictions: handPoseDetection.Hand[] = []) {
    if (this.signEstimator === null) return
    const views = this._track(predictions)
    this._lastViews = { predictions, views }
    const scale = Math.max(ctx.canvas.width, ctx.canvas.height) / 640
    for (const view of views) this._drawHand(ctx, view, scale)
  }

  _drawHand(ctx: CanvasRenderingContext2D, { hand, side, letter, score, moving, trail }: HandView_t, scale: number) {
    const points = hand.keypoints
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // El rastro: más claro cuanto más antiguo
    for (let i = 1; i < trail.length; i++) {
      ctx.strokeStyle = `rgba(250, 204, 21, ${(i / trail.length) * 0.9})`
      ctx.lineWidth = 6 * scale
      ctx.beginPath()
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
      ctx.lineTo(trail[i].x, trail[i].y)
      ctx.stroke()
    }

    // La palma, rellena, y los dedos
    ctx.beginPath()
    PALM.forEach((point, i) => (i === 0 ? ctx.moveTo(points[point].x, points[point].y) : ctx.lineTo(points[point].x, points[point].y)))
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 2.5 * scale
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, 5 * scale, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    for (const { points: finger, color } of FINGERS) {
      ctx.strokeStyle = color
      ctx.lineWidth = 4 * scale
      ctx.beginPath()
      finger.forEach((point, i) => (i === 0 ? ctx.moveTo(points[point].x, points[point].y) : ctx.lineTo(points[point].x, points[point].y)))
      ctx.stroke()
      finger.forEach((point, i) => {
        ctx.beginPath()
        ctx.arc(points[point].x, points[point].y, (i === finger.length - 1 ? 6 : 4.5) * scale, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
        ctx.lineWidth = 1.5 * scale
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
      })
    }

    // El recuadro de la mano
    const xs = points.map(({ x }) => x)
    const ys = points.map(({ y }) => y)
    const padding = 14 * scale
    const box = { x: Math.min(...xs) - padding, y: Math.min(...ys) - padding }
    const boxWidth = Math.max(...xs) + padding - box.x
    const boxHeight = Math.max(...ys) + padding - box.y
    const color = letter === null ? COLORS.none : moving ? COLORS.moving : COLORS.letter
    ctx.setLineDash(letter === null ? [8 * scale, 6 * scale] : [])
    ctx.strokeStyle = color
    ctx.lineWidth = 3 * scale
    roundedRect(ctx, box.x, box.y, boxWidth, boxHeight, 14 * scale)
    ctx.stroke()
    ctx.setLineDash([])

    // La etiqueta: la letra grande y, al lado, la mano y la confianza (o que es de movimiento)
    const prefix = 'datasets-models.2-object-detection.hand-sign.render.'
    const percent = new Intl.NumberFormat(i18next.language, { style: 'percent', maximumFractionDigits: 0 })
    const lines = [
      side === undefined ? '' : this.t(prefix + side),
      letter === null ? '' : moving ? this.t(prefix + 'movement') : percent.format(score),
    ].filter((line) => line !== '')
    const big = `700 ${34 * scale}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
    const small = `600 ${13 * scale}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
    ctx.font = big
    const text = letter ?? '?'
    const letterWidth = ctx.measureText(text).width
    ctx.font = small
    const linesWidth = Math.max(0, ...lines.map((line) => ctx.measureText(line).width))
    const gap = 10 * scale
    const chipWidth = 12 * scale + letterWidth + (lines.length > 0 ? gap + linesWidth : 0) + 12 * scale
    const chipHeight = 48 * scale
    const chipX = Math.min(Math.max(4 * scale, box.x), ctx.canvas.width - chipWidth - 4 * scale)
    // Encima del recuadro o, si no cabe, dentro, arriba
    const chipY = box.y - chipHeight - 6 * scale >= 4 * scale ? box.y - chipHeight - 6 * scale : box.y + 6 * scale
    ctx.shadowColor = 'rgba(15, 23, 42, 0.35)'
    ctx.shadowBlur = 8 * scale
    ctx.fillStyle = color
    roundedRect(ctx, chipX, chipY, chipWidth, chipHeight, 12 * scale)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.font = big
    ctx.fillText(text, chipX + 12 * scale, chipY + chipHeight / 2 + 1 * scale)
    ctx.font = small
    lines.forEach((line, i) => {
      const y = chipY + chipHeight / 2 + (lines.length === 1 ? 0 : (i === 0 ? -9 : 9) * scale)
      ctx.fillText(line, chipX + 12 * scale + letterWidth + gap, y)
    })
    ctx.restore()
  }
}
