 
// Se compila desde su código fuente con el @tensorflow/tfjs del proyecto (alias en vite.config.ts): con el paquete
// por defecto se cargaba una segunda copia de TF.js y se registraban de nuevo todos los kernels. El código está
// parcheado (patches/, ver pnpm-workspace.yaml) para leer los resultados de forma asíncrona: con WebGPU las
// lecturas síncronas lo hacían muy lento.
import * as faceapi from '@vladmandic/face-api'
import { Trans } from 'react-i18next'
import I_MODEL_OBJECT_DETECTION, { inputWidth, mirrorBoxX } from './_model'
import {
  MT_CNN_BIBTEX,
  SSD_BIBTEX,
  MOBILE_NETS_BIBTEX,
  TINY_BIBTEX,
  FACE_RECOGNITION_MODEL_BIBTEX,
} from './MODEL_5_FACE_API_INFO'
import { OD_MODEL_KEYS } from '@/MODEL_KEYS'
import type { Smoothing_t } from './smoothing'
import { type Box_t, clamp, drawBox, drawingScale, drawTag, font, roundedRect } from './drawing'

// Las expresiones que da face-api, en su orden, y el color de cada una
const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']
const EXPRESSION_COLORS: Record<string, string> = {
  neutral  : '#94a3b8',
  happy    : '#facc15',
  sad      : '#60a5fa',
  angry    : '#ef4444',
  fearful  : '#a78bfa',
  disgusted: '#22c55e',
  surprised: '#f97316',
}
// Lo que se usa de cada cara, en objetos simples (se pueden copiar, suavizar y reflejar)
type FaceApiFace_t = {
  detection  : { score?: number, box: { x: number, y: number, width: number, height: number } }
  age        : number
  expressions: Record<string, number>
}

export default class MODEL_5_FACE_API extends I_MODEL_OBJECT_DETECTION {
  static KEY = OD_MODEL_KEYS.FACE_API
  TITLE = 'datasets-models.2-object-detection.face-api.title'
  i18n_TITLE = 'datasets-models.2-object-detection.face-api.title'
  URL = 'https://justadudewhohacks.github.io/face-api.js/docs/index.html'
  // La webcam, en espejo, como en el resto de modelos: face-api no sabe reflejar, así que PREDICTION refleja los recuadros
  mirror = true
  usesTensorForPrediction = false
  faces = true
  // El recuadro, la edad y la probabilidad de cada expresión, que si no saltan de un fotograma al siguiente
  SMOOTHING: Smoothing_t<FaceApiFace_t> = {
    positions: ({ detection: { box } }) => [box.x, box.y, box.x + box.width, box.y + box.height],
    extras   : ({ age, expressions }) => [age, ...EXPRESSIONS.map((expression) => expressions[expression] ?? 0)],
    update   : (face, [xMin, yMin, xMax, yMax], [age, ...scores]) => ({
      ...face,
      detection  : { score: face.detection.score, box: { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin } },
      age,
      expressions: Object.fromEntries(EXPRESSIONS.map((expression, index) => [expression, scores[index]])),
    }),
  }

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

  async PREDICTION(input_image_or_video: any, config: { minConfidence?: number, flipHorizontal?: boolean } = {}): Promise<FaceApiFace_t[]> {
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
    const faces = await faceapi
      .detectAllFaces(_input, optionsSSDMobileNet)
      .withAgeAndGender()
      .withFaceExpressions()
    // .withFaceLandmarks()
    // .withFaceDescriptors()
    const width = inputWidth(_input)
    return faces.map(({ detection, age, expressions }) => {
      const { x, y, width: boxWidth, height: boxHeight } = detection.box
      const probabilities = expressions as unknown as Record<string, number>
      return {
        detection: {
          score: detection.score,
          // Reflejado, con la webcam en espejo, para que caiga sobre el vídeo
          box  : { x: config.flipHorizontal ? mirrorBoxX(x, boxWidth, width) : x, y, width: boxWidth, height: boxHeight },
        },
        age,
        expressions: Object.fromEntries(EXPRESSIONS.map((expression) => [expression, probabilities[expression] ?? 0])),
      }
    })
  }

  /**
   * Cada cara: un recuadro con las esquinas marcadas, su nombre encima («Cara» o, si hay varias, «Cara 1», «Cara 2»…)
   * con la edad estimada y, a su derecha, sus siete expresiones con su porcentaje y su barra
   * @param {CanvasRenderingContext2D} ctx
   * @param {FaceApiFace_t[]} faces
   */
  RENDER(ctx: CanvasRenderingContext2D, faces: FaceApiFace_t[] = []) {
    const scale = drawingScale(ctx)
    faces.forEach((face, index) => this._drawFace(ctx, face, faces.length > 1 ? index + 1 : null, scale))
  }

  _drawFace(ctx: CanvasRenderingContext2D, { detection: { box: { x, y, width, height } }, age, expressions }: FaceApiFace_t,
    number: number | null, scale: number) {
    const prefix = 'datasets-models.2-object-detection.face-api.render.'
    const box: Box_t = { xMin: x, yMin: y, xMax: x + width, yMax: y + height, width, height }
    drawBox(ctx, box, scale)
    this._drawExpressions(ctx, box, EXPRESSIONS.map((name) => ({ name, score: expressions[name] ?? 0 })), scale)
    const tag = number === null ? this.t(prefix + 'face') : this.t(prefix + 'face-number', { number })
    drawTag(ctx, box, tag, this.t(prefix + 'age', { age: Math.round(age) }), scale)
  }

  /**
   * Las expresiones, en un panel a la derecha de la cara (pegado al borde del dibujo si no cabe), siempre en el mismo
   * orden para que las filas no salten al cambiar las probabilidades, con la más probable resaltada
   */
  _drawExpressions(ctx: CanvasRenderingContext2D, box: Box_t, expressions: Array<{ name: string, score: number }>, scale: number) {
    const prefix = 'datasets-models.2-object-detection.face-api.render.'
    const rows = expressions.map(({ name, score }) => ({
      name   : this.t('face-api.' + name),
      color  : EXPRESSION_COLORS[name],
      score,
      percent: this.t(prefix + 'percent', { percent: Math.round(score * 100) }),
    }))
    ctx.save()
    ctx.font = font(11, scale, 700)
    const nameWidth = Math.max(...rows.map(({ name }) => ctx.measureText(name).width))
    const percentWidth = Math.max(...rows.map(({ percent }) => ctx.measureText(percent).width))
    const [padding, gap, rowHeight, barWidth, margin] = [8 * scale, 8 * scale, 18 * scale, 56 * scale, 2 * scale]
    const width = padding * 2 + nameWidth + gap + barWidth + gap + percentWidth
    const height = padding * 2 + rowHeight * rows.length
    const x = clamp(box.xMax + 10 * scale, margin, ctx.canvas.width - width - margin)
    const y = clamp(box.yMin, margin, ctx.canvas.height - height - margin)
    const top = rows.reduce((best, row, index) => (row.score > rows[best].score ? index : best), 0)

    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)'
    roundedRect(ctx, x, y, width, height, 10 * scale)
    ctx.fill()
    ctx.textBaseline = 'middle'
    rows.forEach(({ name, color, score, percent }, index) => {
      const middle = y + padding + index * rowHeight + rowHeight / 2
      const barX = x + padding + nameWidth + gap
      // La más probable, más marcada
      ctx.globalAlpha = index === top ? 1 : 0.75
      ctx.font = font(11, scale, index === top ? 700 : 500)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText(name, x + padding, middle + 0.5 * scale)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      roundedRect(ctx, barX, middle - 3 * scale, barWidth, 6 * scale, 3 * scale)
      ctx.fill()
      if (score >= 0.005) {
        ctx.fillStyle = color
        roundedRect(ctx, barX, middle - 3 * scale, Math.max(6 * scale, barWidth * score), 6 * scale, 3 * scale)
        ctx.fill()
      }
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'right'
      ctx.fillText(percent, x + width - padding, middle + 0.5 * scale)
    })
    ctx.restore()
  }
}
