/* eslint-disable @typescript-eslint/no-explicit-any */
import * as tf from '@tensorflow/tfjs';

/**
 * Factory que devuelve un predictor async compatible con WebSHAP.
 * La función devuelta tiene la firma: (x: number[][]) => Promise<number[][]>
 *
 * @param modelRef - un objeto ref con `.current` o una instancia de modelo directa
 */
export const myModelWrapper = (modelRef: any) => {
  return async (x: any[]): Promise<number[][]> => {
    // Sin logs aquí: este wrapper se llama una vez por cada predicción de KernelSHAP
    // (N instancias × nSamples × background), así que loguear satura la consola y ralentiza.
    if (!x || x.length === 0) return [];
    const numInstances = x.length;
    const numFeatures = x[0].length;

    // Comprobamos si es imagen o no por el número de features
    const isImageInput =
      Array.isArray(x[0]) &&
      x[0][0]?.length >= 2 &&
      (x[0].length === 3 || x[0][0].length === 3);

    if (isImageInput) {
      // Entrada de imagen: no gestionada por este wrapper tabular.
    } else {
      // Entrada tabular o vectorial
      const inputTensor = tf.tensor2d(x, [numInstances, numFeatures]);
      try {
        let model: any;
        if (modelRef && typeof modelRef === 'object' && 'current' in modelRef) {
          model = modelRef.current;
        } else {
          model = modelRef; // modelo directo, ej. regresión
        }

        if (!model || typeof model.predict !== 'function') {
          throw new Error('Model is not available or has no predict method');
        }

        const predictionTensor = model.predict(inputTensor);
        // predictionTensor.array() devuelve Promise<number[][]>
        const predictionData = await predictionTensor.array();

        // Liberamos memoria
        inputTensor.dispose();
        if (predictionTensor.dispose) predictionTensor.dispose();

        return predictionData;
      } catch (error) {
        inputTensor.dispose();
        console.error('Error en la predicción del wrapper:', error);
        throw error;
      }
    }

    return [];
  };
};
