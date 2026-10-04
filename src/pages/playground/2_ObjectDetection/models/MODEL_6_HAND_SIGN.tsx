import i18next from 'i18next'
import * as fp from 'fingerpose'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import * as handsignMultiligual from 'handsign-multilingual'
import { Trans } from 'react-i18next'
import { Container, Row, Col } from 'react-bootstrap'
import { syncMediaPipeMirror } from './mediapipeMirror'

import * as _Types from '@core/types'
import I_MODEL_OBJECT_DETECTION from './_model'
import { HandSignInfo } from './MODEL_6_HAND_SIGN_HandSignInfo'
import { TFJS_handpose_bibtex } from './MODEL_6_HAND_SIGN_INFO'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

type Finger_t = 'thumb' | 'index' | 'mid' | 'ring' | 'pinky'


export default class MODEL_6_HAND_SIGN extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.HAND_SIGN
  TITLE = 'datasets-models.2-object-detection.hand-sign.title'
  i18n_TITLE = 'datasets-models.2-object-detection.hand-sign.title'
  URL = 'https://github.com/nonodev96/handsign-multilingual'
  mirror = true
  /**
   * @type {handPoseDetection.HandDetector}
   */
  _modelDetector  : handPoseDetection.HandDetector | null = null
  /**
   * @type {fp.GestureEstimator}
   */
  gestureEstimator: fp.GestureEstimator | null = null

  FINGER_JOINTS = {
    thumb: [0, 1, 2, 3, 4],
    index: [0, 5, 6, 7, 8],
    mid  : [0, 9, 10, 11, 12],
    ring : [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20]
  }

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
              </ol>
            </details>
            <details>
              <summary><Trans i18nKey={prefix + 'details-references.title'} /></summary>
              <ol>
                <li>
                  <details>
                    <summary><Trans i18nKey={prefix + 'details-output.list.0'} /></summary>
                    <pre>{TFJS_handpose_bibtex}</pre>
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
    const { HandSignsSSL, HandSignsASL } = handsignMultiligual
    let HandSign = null
    if (i18next.language === 'es') {
      HandSign = HandSignsSSL
    } else {
      HandSign = HandSignsASL
    }
    const signs = Object.values(HandSign.signs)
    this.gestureEstimator = new fp.GestureEstimator([
      // fp.Gestures.ThumbsUpGesture,
      // fp.Gestures.VictoryGesture,
      ...signs
    ])
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
  async PREDICTION (input_image_or_video: ImageData, config: { flipHorizontal?: boolean, resetTracking?: boolean } = {}) {
    if (this._modelDetector === null) return []
    // El runtime de MediaPipe sigue la mano del fotograma anterior (ignora `staticImageMode`);
    // al explicar, cada imagen perturbada debe evaluarse sin memoria de la anterior.
    if (config.resetTracking) this._modelDetector.reset()
    const flipHorizontal = config.flipHorizontal ?? false
    syncMediaPipeMirror(this._modelDetector, flipHorizontal)
    return await this._modelDetector.estimateHands(input_image_or_video, { flipHorizontal })
  }

  // region EXPLICABILIDAD
  EXPLAIN_PREDICTION_CONFIG = { resetTracking: true }

  // Se explican la presencia de la mano y cada letra reconocida: "¿qué partes de la mano hacen
  // que el modelo lea la letra X?".
  static readonly HAND_LABEL = 'hand'

  /** Puntuación (0-1) de cada gesto para una mano; sin umbral para que la señal sea gradual. */
  _gestureScores(hand: handPoseDetection.Hand): Record<string, number> {
    if (!this.gestureEstimator || !hand.keypoints3D) return {}
    const keypoints3D: any = hand.keypoints3D.map(({ x, y, z }) => [x, y, z])
    const { gestures } = this.gestureEstimator.estimate(keypoints3D, 0)
    return Object.fromEntries(gestures.map(({ name, score }: { name: string, score: number }) => [name, score / 10]))
  }

  EXPLAIN_LABELS(detections: handPoseDetection.Hand[]): string[] {
    if (!detections?.length || !this.gestureEstimator) return detections?.length ? [MODEL_6_HAND_SIGN.HAND_LABEL] : []
    // Las letras que se muestran en pantalla (umbral 7 de 10, como en RENDER).
    const letters = detections.flatMap((hand) => {
      const keypoints3D: any = hand.keypoints3D?.map(({ x, y, z }) => [x, y, z]) ?? []
      return keypoints3D.length ? this.gestureEstimator!.estimate(keypoints3D, 7).gestures.map(({ name }: { name: string }) => name) : []
    })
    return [MODEL_6_HAND_SIGN.HAND_LABEL, ...Array.from(new Set(letters))]
  }

  EXPLAIN_LABEL_TEXT(label: string | number): string {
    return label === MODEL_6_HAND_SIGN.HAND_LABEL
      ? this.t('ui.explain.labels.hand')
      : this.t('ui.explain.labels.sign', { sign: String(label) })
  }

  NORMALIZE_PREDICTIONS(predictions: handPoseDetection.Hand[], labels: Array<string | number>): number[] {
    const hands = Array.isArray(predictions) ? predictions : []
    const perHand = hands.map((hand) => this._gestureScores(hand))
    return labels.map((label) => label === MODEL_6_HAND_SIGN.HAND_LABEL
      ? Math.max(0, ...hands.map((hand) => hand.score ?? 1))
      : Math.max(0, ...perHand.map((scores) => scores[String(label)] ?? 0)))
  }
  // endregion

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {handPoseDetection.Hand[]} predictions 
   */
  RENDER(ctx: CanvasRenderingContext2D, predictions: handPoseDetection.Hand[] = []) {
    if (this.gestureEstimator === null) return
    const font = '32px Barlow-SemiBold, Barlow-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    for (const hand of predictions) {
      this._drawFinger(ctx, hand.keypoints)
      const keypoints3D: any = hand.keypoints3D!.map(({ x, y, z }) => [x, y, z])
      const estimatedGestures = this.gestureEstimator.estimate(keypoints3D, 7)
      const { x, y } = hand.keypoints[0]
      this._drawTextBG(ctx, `${estimatedGestures.gestures.map(({ name }) => name)}`, font, x, y, 16)
    }
  }
  
  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {handPoseDetection.Keypoint[]} landmarks 
   */
  _drawFinger(ctx: CanvasRenderingContext2D, landmarks: handPoseDetection.Keypoint[]) {
    ctx.strokeStyle = 'gold'
    ctx.lineWidth = 2

    for (let j = 0; j < Object.keys(this.FINGER_JOINTS).length; j++) {
      const finger: Finger_t = Object.keys(this.FINGER_JOINTS)[j] as Finger_t
      for (let k = 0; k < this.FINGER_JOINTS[finger].length - 1; k++) {
        const firstJointIndex = this.FINGER_JOINTS[finger][k]
        const secondJointIndex = this.FINGER_JOINTS[finger][k + 1]
        ctx.beginPath()
        ctx.moveTo(landmarks[firstJointIndex].x, landmarks[firstJointIndex].y)
        ctx.lineTo(landmarks[secondJointIndex].x, landmarks[secondJointIndex].y)
        ctx.stroke()
      }
    }
    for (const {x, y} of landmarks) {
      this._drawPoint(ctx, x, y)
    }
  }
}
