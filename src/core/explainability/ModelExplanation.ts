import * as tf from '@tensorflow/tfjs';

type PredictModel = { predict: (x: tf.Tensor) => tf.Tensor | tf.Tensor[] };

/**
 * Factory que devuelve un predictor async compatible con WebSHAP para modelos
 * tabulares (clasificación y regresión): (x: number[][]) => Promise<number[][]>.
 *
 * @param modelRef - un objeto ref con `.current` o una instancia de modelo directa
 */
export const myModelWrapper = (
  modelRef: PredictModel | { current: PredictModel | null } | null,
) => {
  return async (x: number[][]): Promise<number[][]> => {
    // Sin logs aquí: este wrapper se llama una vez por cada predicción de KernelSHAP
    // (N instancias × nSamples × background), así que loguear satura la consola y ralentiza.
    if (!x || x.length === 0) return [];

    const model = modelRef && 'current' in modelRef ? modelRef.current : modelRef;
    if (!model || typeof model.predict !== 'function') {
      throw new Error('Model is not available or has no predict method');
    }

    const inputTensor = tf.tensor2d(x, [x.length, x[0].length]);
    try {
      const output = model.predict(inputTensor);
      const predictionTensor = Array.isArray(output) ? output[0] : output;
      try {
        return (await predictionTensor.array()) as number[][];
      } finally {
        predictionTensor.dispose();
      }
    } finally {
      inputTensor.dispose();
    }
  };
};
