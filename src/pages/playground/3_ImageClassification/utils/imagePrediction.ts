import { argMax } from '@core/nn-utils/classificationOutput'

/** Resultado de clasificar un dibujo con uno de los modelos entrenados */
export type ImagePrediction_t = {
  /** Salida del modelo para cada clase */
  values    : number[]
  /** Clase elegida: la de mayor valor */
  index     : number
  /** Modelo de la tabla (desde 0) que ha hecho la predicción */
  modelIndex: number
}

export function makeImagePrediction(values: number[], modelIndex: number): ImagePrediction_t {
  return { values, index: argMax(values), modelIndex }
}
