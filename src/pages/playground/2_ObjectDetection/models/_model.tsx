import type { TFunction } from 'i18next'
import type { Smoothing_t } from './smoothing'

/** Lo que se puede pasar a un detector: una imagen subida, un fotograma de la webcam o un canvas */
export type DetectionInput_t = ImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement

/** El ancho en píxeles de una entrada: el del vídeo o la imagen originales, en el que dan sus puntos los detectores */
export const inputWidth = (input: DetectionInput_t) =>
  'videoWidth' in input ? input.videoWidth : 'naturalWidth' in input ? input.naturalWidth : input.width

/**
 * La x de un recuadro reflejado en horizontal: para los detectores que no saben reflejar (MoveNet, COCO-SSD, face-api),
 * para que caigan sobre el vídeo de la webcam en espejo
 */
export const mirrorBoxX = (x: number, boxWidth: number, imageWidth: number) => imageWidth - x - boxWidth

export default abstract class I_MODEL_OBJECT_DETECTION {
  TITLE                  : string = ''
  i18n_TITLE             : string = ''
  // Cada modelo guarda aquí el detector de su librería y declara su tipo concreto
  _modelDetector         : unknown = null
  mirror                 : boolean = false
  usesTensorForPrediction: boolean = true
  faces                  : boolean = false
  t                      : TFunction<'translation', undefined>

  constructor(_t: TFunction<'translation', undefined>) {
    this.t = _t
  }

  DESCRIPTION() {
    return <></>
  }

  async ENABLE_MODEL() {}

  /**
   * Olvida lo que el detector sigue de un fotograma al siguiente (MediaPipe y MoveNet siguen la cara, la mano o la
   * persona del fotograma anterior): para que una imagen subida no dependa de lo que se vio antes en la webcam
   */
  RESET() {
    const detector = this._modelDetector as { reset?: () => void } | null
    detector?.reset?.()
  }

  /** Detecciones sobre la entrada; cada modelo concreta el tipo de sus detecciones */
  async PREDICTION(_input_image_or_video: DetectionInput_t, _config?: Record<string, unknown>): Promise<unknown[]> {
    return []
  }

  /** Dibuja las detecciones sobre el canvas */
  RENDER(_ctx: CanvasRenderingContext2D, _predictions?: unknown[]) {}

  /**
   * Cómo seguir y suavizar las detecciones de la webcam de un fotograma al siguiente, para que no tiemblen ni parpadeen
   * (DetectionSmoother); null: se dibujan tal cual
   */
  SMOOTHING: Smoothing_t<unknown> | null = null
  /**
   * Si RENDER solo dibuja y se puede llamar en cada fotograma de la pantalla (lo dibujado se mueve con suavidad entre
   * una predicción y la siguiente). Si RENDER además sigue algo fotograma a fotograma, solo se llama con cada predicción
   */
  RENDER_EVERY_FRAME = true

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
  EXPLAIN_LABELS(detections: unknown[]): string[] {
    const classes = (detections ?? []).map((d) => (d as { class?: unknown } | null)?.class).filter((c): c is string => typeof c === 'string')
    return Array.from(new Set(classes))
  }

  /**
   * Convierte una predicción en un número por etiqueta (misma longitud y orden que `labels`);
   * 0 si la etiqueta no aparece. Por defecto, la mayor puntuación de las detecciones de cada clase.
   */
  NORMALIZE_PREDICTIONS(predictions: unknown, labels: Array<string | number>): number[] {
    const scores: number[] = new Array(labels.length).fill(0)
    for (const det of (Array.isArray(predictions) ? predictions : []) as Array<{ class?: string, score?: unknown } | null>) {
      if (!det || det.class === undefined) continue
      const idx = labels.indexOf(det.class)
      if (idx !== -1 && typeof det.score === 'number') scores[idx] = Math.max(scores[idx], det.score)
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
}
