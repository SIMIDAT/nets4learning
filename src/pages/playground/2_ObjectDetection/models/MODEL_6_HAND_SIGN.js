// import * as handpose from '@tensorflow-models/handpose'
import * as fp from 'fingerpose'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import * as handsignMultiligual from 'handsign-multilingual'
import { Trans } from 'react-i18next'
import { Container, Row, Col } from 'react-bootstrap'

import * as _Types from '@/core/types'
import I_MODEL_OBJECT_DETECTION from './_model'
import { HandSignInfo } from './MODEL_6_HAND_SIGN_HandSignInfo'
import { TFJS_handpose_bibtex } from './MODEL_6_HAND_SIGN_INFO'

export class MODEL_6_HAND_SIGN extends I_MODEL_OBJECT_DETECTION {
  static KEY = 'HAND-SIGN'
  TITLE = 'datasets-models.2-object-detection.hand-sign.title'
  i18n_TITLE = 'datasets-models.2-object-detection.hand-sign.title'
  URL = 'https://github.com/nonodev96/handsign-multilingual'
  mirror = true
  /**
   * @type {handPoseDetection.HandDetector}
   */
  _modelDetector = null
  /**
   * @type {fp.GestureEstimator}
   */
  gestureEstimator = null

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
    if (localStorage.getItem('language') === 'es') {
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
    const modelConfig = {
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
   * @param {{flipHorizontal: boolean}} config 
   * @returns {Promise<handPoseDetection.Hand[]>}
   */
  async PREDICTION (input_image_or_video, config = { flipHorizontal: false }) {
    if (this._modelDetector === null) return []
    return await this._modelDetector.estimateHands(input_image_or_video, { flipHorizontal: config.flipHorizontal })
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   * @param {handPoseDetection.Hand[]} predictions 
   */
  RENDER(ctx, predictions = []) {
    const font = '32px Barlow-SemiBold, Barlow-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    for (const hand of predictions) {
      this._drawFinger(ctx, hand.keypoints)
      const keypoints3D = (/** @type {keypoints3D[]} */(hand.keypoints3D.map(({ x, y, z }) => [x, y, z])))
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
  _drawFinger(ctx, landmarks) {
    ctx.strokeStyle = 'gold'
    ctx.lineWidth = 2

    for (let j = 0; j < Object.keys(this.FINGER_JOINTS).length; j++) {
      let finger = Object.keys(this.FINGER_JOINTS)[j]
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
