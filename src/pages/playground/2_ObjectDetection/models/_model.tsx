import type { TFunction } from "i18next"

export default abstract class I_MODEL_OBJECT_DETECTION {
  TITLE                  : string = ""
  i18n_TITLE             : string = ""
  _modelDetector         : any | null = null
  mirror                 : boolean = false
  usesTensorForPrediction: boolean = true
  faces                  : boolean = false
  t                      : TFunction<"translation", undefined>

  constructor(_t: TFunction<"translation", undefined>) {
    this.t = _t
  }

  DESCRIPTION() {
    return <></>
  }

  async ENABLE_MODEL() {}

  /**
   *
   * @param {any} _input_image_or_video
   * @param {any} _config
   * @returns  {Promise<any[]>}
   */
  async PREDICTION(_input_image_or_video: any, _config: any): Promise<any[]> {
    return []
  }

  /**
   *
   * @param {CanvasRenderingContext2D} _ctx
   * @param {any} _predictions
   */
  RENDER(_ctx: CanvasRenderingContext2D, _predictions: any) {}

  // region EXPLICABILIDAD
  // SHAP explica un número por cada "etiqueta": tapa trozos de la imagen, vuelve a predecir y
  // mide cuánto cambia ese número. Cada modelo decide qué etiquetas tiene sentido explicar y
  // cómo convertir su predicción en esos números. Por defecto: modelos de clases (COCO-SSD).

  /**
   * Configuración que se pasa a PREDICTION al evaluar las imágenes tapadas. Sirve, p. ej., para
   * bajar el umbral de confianza: con el umbral normal la puntuación cae a 0 de golpe y SHAP
   * reparte a partes iguales efectos que en realidad son graduales.
   */
  EXPLAIN_PREDICTION_CONFIG: Record<string, unknown> = {}

  /**
   * Etiquetas que se explican, a partir de las detecciones de la imagen original.
   * Por defecto, las clases detectadas.
   */
  EXPLAIN_LABELS(detections: any[]): string[] {
    const classes = (detections ?? []).map((d) => d?.class).filter((c): c is string => typeof c === "string")
    return Array.from(new Set(classes))
  }

  /**
   * Convierte una predicción en un número por etiqueta (misma longitud y orden que `labels`);
   * 0 si la etiqueta no aparece. Por defecto, la mayor puntuación de las detecciones de cada clase.
   */
  NORMALIZE_PREDICTIONS(predictions: any, labels: Array<string | number>): number[] {
    const scores: number[] = new Array(labels.length).fill(0)
    for (const det of Array.isArray(predictions) ? predictions : []) {
      const idx = labels.indexOf(det?.class)
      if (idx !== -1 && typeof det.score === "number") scores[idx] = Math.max(scores[idx], det.score)
    }
    return scores
  }

  /** Texto con el que se muestra una etiqueta en la explicación. */
  EXPLAIN_LABEL_TEXT(label: string | number): string {
    return String(label)
  }

  /** Clave de i18n de una nota sobre cómo leer la explicación de este modelo (o null). */
  EXPLAIN_NOTE_KEY: string | null = null
  // endregion

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  _drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.lineWidth = 3
    ctx.strokeStyle = "rgba(0,255,21,0.84)"
    ctx.strokeRect(x, y, w, h)
  }
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} txt
   * @param {string} font
   * @param {number} x
   * @param {number} y
   * @param {number} padding
   */
  _drawTextBG(ctx: CanvasRenderingContext2D, txt: string, font: string, x: number, y: number, padding: number) {
    ctx.font = font
    ctx.textBaseline = "top"
    ctx.fillStyle = "#fff"

    const width = ctx.measureText(txt).width
    ctx.fillRect(x, y, width + padding, parseInt(font, 10) + padding)

    ctx.lineWidth = 2
    ctx.strokeStyle = "#009ddf"
    ctx.strokeRect(x, y, width + padding, parseInt(font, 10) + padding)

    ctx.fillStyle = "#000000"
    ctx.fillText(txt, x + padding / 2, y + padding / 2)
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} txt
   * @param {string} font
   * @param {number} x
   * @param {number} y
   * @param {number} padding
   * @param {boolean} threshold
   */
  _drawTextBG_Opacity(
    ctx: CanvasRenderingContext2D,
    txt: string,
    font: string,
    x: number,
    y: number,
    padding: number,
    threshold: boolean
  ) {
    ctx.font = font
    ctx.textBaseline = "top"
    ctx.fillStyle = "#fff"

    const width = ctx.measureText(txt).width

    if (threshold) ctx.globalAlpha = 0.4
    ctx.fillRect(x, y, width + padding, parseInt(font, 10) + padding)
    if (threshold) ctx.globalAlpha = 1.0

    ctx.lineWidth = 2
    ctx.strokeStyle = "#009ddf"
    if (threshold) ctx.globalAlpha = 0.4
    ctx.strokeRect(x, y, width + padding, parseInt(font, 10) + padding)
    if (threshold) ctx.globalAlpha = 1.0

    ctx.fillStyle = "#000000"
    if (threshold) ctx.globalAlpha = 0.8
    ctx.fillText(txt, x + padding / 2, y + padding / 2)
    if (threshold) ctx.globalAlpha = 1.0
  }

  _drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number, r = 3) {
    ctx.beginPath()
    ctx.arc(x, y, r, 1, 3 * Math.PI)
    ctx.fill()
  }
}
