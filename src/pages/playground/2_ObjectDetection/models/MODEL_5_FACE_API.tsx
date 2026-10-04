 
// Se compila desde su código fuente con el @tensorflow/tfjs del proyecto (alias en vite.config.ts): con el paquete
// por defecto se cargaba una segunda copia de TF.js y se registraban de nuevo todos los kernels. El código está
// parcheado (patches/, ver pnpm-workspace.yaml) para leer los resultados de forma asíncrona: con WebGPU las
// lecturas síncronas lo hacían muy lento.
import * as faceapi from '@vladmandic/face-api'
import { Trans } from 'react-i18next'
import I_MODEL_OBJECT_DETECTION from './_model'
import {
  MT_CNN_BIBTEX,
  SSD_BIBTEX,
  MOBILE_NETS_BIBTEX,
  TINY_BIBTEX,
  FACE_RECOGNITION_MODEL_BIBTEX,
} from './MODEL_5_FACE_API_INFO'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'

export default class MODEL_5_FACE_API extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.FACE_API
  TITLE = 'datasets-models.2-object-detection.face-api.title'
  i18n_TITLE = 'datasets-models.2-object-detection.face-api.title'
  URL = 'https://justadudewhohacks.github.io/face-api.js/docs/index.html'
  mirror = false
  usesTensorForPrediction = false
  faces = true

  i18n_face_api: Record<string, string> = {
    years    : 'face-api.years',
    neutral  : 'face-api.neutral',
    happy    : 'face-api.happy',
    sad      : 'face-api.sad',
    angry    : 'face-api.angry',
    fearful  : 'face-api.fearful',
    disgusted: 'face-api.disgusted',
    surprised: 'face-api.surprised',
  }

  // region EXPLICABILIDAD
  // Se explican las expresiones que el modelo ve en la cara (probabilidad ≥ 10 %, y siempre la
  // principal). La edad no: al tapar la cara el modelo deja de verla y la "edad" pasa a 0, así que
  // SHAP explicaría "hay cara o no" en lugar de "qué hace parecer mayor o más joven".
  static readonly MIN_EXPRESSION_TO_EXPLAIN = 0.1
  EXPLAIN_PREDICTION_CONFIG = { minConfidence: 0.2 }

  EXPLAIN_LABELS(detections: any[]): string[] {
    const expressions: Record<string, number> = detections?.[0]?.expressions ?? {}
    const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1])
    return sorted
      .filter(([, p], i) => i === 0 || p >= MODEL_5_FACE_API.MIN_EXPRESSION_TO_EXPLAIN)
      .map(([name]) => name)
  }

  EXPLAIN_LABEL_TEXT(label: string | number): string {
    return this.i18n_face_api[String(label)] ?? String(label)
  }

  /** Probabilidad de cada expresión en la primera cara detectada (0 si no hay cara). */
  NORMALIZE_PREDICTIONS(predictions: any[] = [], labels: Array<string | number>): number[] {
    const expressions: Record<string, number> = predictions?.[0]?.expressions ?? {}
    return labels.map((label) => expressions[String(label)] ?? 0)
  }
  // endregion

  DESCRIPTION() {
    const prefix = 'datasets-models.2-object-detection.face-api.description.'
    return (
      <>
        <p>
          <Trans i18nKey={prefix + 'text-0'} />
        </p>
        <details>
          <summary>
            <Trans i18nKey={prefix + 'details-input.title'} />
          </summary>
          <p>
            <Trans i18nKey={prefix + 'details-input.text-0'} />
          </p>
        </details>
        <details>
          <summary>
            <Trans i18nKey={prefix + 'details-output.title'} />
          </summary>
          <p>
            <Trans i18nKey={prefix + 'details-output.text-0'} />
          </p>
          <ol>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.bounding'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.0'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.1'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.2'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.3'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.4'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.5'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.6'} />
            </li>
            <li>
              <Trans i18nKey={prefix + 'details-output.list.7'} />
            </li>
          </ol>
        </details>
        <details>
          <summary>
            <Trans i18nKey={prefix + 'details-references.title'} />
          </summary>
          <p>
            <strong>Face Detection Models</strong>
          </p>
          <ol className="small">
            <li>
              <details>
                <summary>SSD Mobilenet V1 (5.4MB)</summary>
                <p>
                  <small>SSD: Single Shot MultiBox Detector</small>
                </p>
                <pre>{SSD_BIBTEX}</pre>
                <p>
                  <small>MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications</small>
                </p>
                <pre>{MOBILE_NETS_BIBTEX}</pre>
              </details>
            </li>
            <li>
              <details>
                <summary>Tiny Face Detector (190kb)</summary>
                <pre>{TINY_BIBTEX}</pre>
              </details>
            </li>
            <li>
              <details>
                <summary>MTCNN (2MB)</summary>
                <pre>{MT_CNN_BIBTEX}</pre>
              </details>
            </li>
          </ol>

          <p>
            <strong>Face Landmark Detection Models</strong>
          </p>
          <ol className="small">
            <li>
              <details>
                <summary>face_landmark_68_model (350kb)</summary>
                <pre>{MT_CNN_BIBTEX}</pre>
              </details>
            </li>
            <li>
              <details>
                <summary>face_landmark_68_tiny_model (80kb)</summary>
                <pre>{MT_CNN_BIBTEX}</pre>
              </details>
            </li>
          </ol>

          <p>
            <strong>Face Recognition Model</strong>
          </p>
          <ol className="small">
            <li>
              <details>
                <summary>face_recognition_model (6.2MB)</summary>
                <pre>{FACE_RECOGNITION_MODEL_BIBTEX}</pre>
              </details>
            </li>
          </ol>

          <p>
            <strong>Face Expression Recognition Model</strong>
          </p>
          <ol className="small">
            <li>face_expression_recognition_model (310kb)</li>
          </ol>
        </details>
      </>
    )
  }

  async ENABLE_MODEL() {
    const modelPath = import.meta.env.VITE_PATH + '/models/02-object-detection/face-api-js/v1.7.14/'
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.load(modelPath),
      faceapi.nets.tinyFaceDetector.load(modelPath),
      faceapi.nets.ageGenderNet.load(modelPath),
      faceapi.nets.faceExpressionNet.load(modelPath),
    ])
    // await faceapi.nets.faceLandmark68Net.load(modelPath);
    // await faceapi.nets.faceRecognitionNet.load(modelPath);

    this.i18n_face_api = {
      years    : this.t('face-api.years'),
      neutral  : this.t('face-api.neutral'),
      happy    : this.t('face-api.happy'),
      sad      : this.t('face-api.sad'),
      angry    : this.t('face-api.angry'),
      fearful  : this.t('face-api.fearful'),
      disgusted: this.t('face-api.disgusted'),
      surprised: this.t('face-api.surprised'),
    }
  }

  async PREDICTION(input_image_or_video: any, config: { minConfidence?: number } = {}) {
    let _input = input_image_or_video
    if (input_image_or_video instanceof ImageData) {
      // Canvas (síncrono): con una <img> habría que esperar a que cargue antes de detectar.
      _input = document.createElement('canvas')
      _input.width = input_image_or_video.width
      _input.height = input_image_or_video.height
      _input.getContext('2d').putImageData(input_image_or_video, 0, 0)
    }
    // 0.8 para mostrar detecciones; la explicabilidad pasa un umbral más bajo.
    const minConfidence = config.minConfidence ?? 0.8
    const maxResults = 10
    const optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence, maxResults })
    const predictions = await faceapi
      .detectAllFaces(_input, optionsSSDMobileNet)
      .withAgeAndGender()
      .withFaceExpressions()
    // .withFaceLandmarks()
    // .withFaceDescriptors()
    return predictions
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {faceapi.WithFaceExpressions<faceapi.WithAge<faceapi.WithGender<{detection: faceapi.FaceDetection;}>>>[]} predictions
   */
  RENDER(
    ctx: CanvasRenderingContext2D,
    predictions: faceapi.WithFaceExpressions<
      faceapi.WithAge<
        faceapi.WithGender<{
          detection: faceapi.FaceDetection
        }>
      >
    >[] = []
  ) {
    const font = '32px Barlow-SemiBold, Barlow-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    const font2 = '24px Barlow-SemiBold, Barlow-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'

    for (const { detection, expressions, age } of predictions) {
      const { x, y, width, height } = detection.box
      this._drawRect(ctx, x, y, width, height)

      let i = 0
      for (const [expression, score] of Object.entries(expressions)) {
        const scoreParsed = Math.round(parseFloat(score) * 100)
        const txt_expression = `${this.i18n_face_api[expression]} ${scoreParsed}%`
        this._drawTextBG_Opacity(ctx, txt_expression, font2, x + width, y + 38 * i, 12, scoreParsed < 20)
        i++
      }

      const ageParsed = Math.round(age)
      const txt = `${ageParsed} ${this.i18n_face_api['years']}`
      this._drawTextBG(ctx, txt, font, x, y - 48, 16)
    }
  }
}
