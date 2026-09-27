/* eslint-disable @typescript-eslint/no-explicit-any */
export { createImageClassificationAdapter } from './adapters/createImageClassificationAdapter';

import * as tf from '@tensorflow/tfjs';

const normalizeMaskValue = (maskValue: number | undefined): number => {
  const raw = Number(maskValue);
  const fallback = 0;
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(1, Math.max(0, raw));
};

const isLabelPredictionList = (predictions: any): boolean => {
  return (
    Array.isArray(predictions) &&
    predictions.length > 0 &&
    typeof predictions[0] === 'object'
  );
};

const toFixedVector = (
  predictions: any,
  selectedLabels: Array<string | number>,
): number[] => {
  if (isLabelPredictionList(predictions)) {
    const out: number[] = new Array(selectedLabels.length).fill(0);
    const indexByLabel = new Map(
      selectedLabels.map((l, i) => [String(l), i] as [string, number]),
    );
    for (const p of predictions) {
      const label = p?.className;
      const prob = Number(p?.probability);
      const idx = indexByLabel.get(String(label));
      if (idx !== undefined && Number.isFinite(prob)) out[idx] = prob;
    }
    return out;
  }

  try {
    const arr = Array.from(predictions ?? []);
    return arr.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));
  } catch {
    return [];
  }
};

/**
 * Wrapper compatible con WebSHAP para clasificación de imágenes.
 * Devuelve una función async: (x: number[][]) => Promise<number[][]>
 *
 * @param iModel - instancia de I_MODEL_IMAGE_CLASSIFICATION (o compatible)
 * @param modelInstance - modelo subyacente (tf.LayersModel, mobilenet, etc.)
 * @param originalImageData
 * @param segmentationTensor - [H,W] con ids de segmento
 * @param debugImages - array donde se van añadiendo dataURLs
 * @param selectedLabels - labels fijos para vector de salida
 * @param options
 */
export const imageClassificationWrapper = (
  iModel: any,
  modelInstance: any,
  originalImageData: ImageData,
  segmentationTensor: tf.Tensor,
  debugImages: string[],
  selectedLabels: Array<string | number>,
  options: { maskValue?: number } = {},
) => {
  return async (x: number[][]): Promise<number[][]> => {
    if (!x || x.length === 0) return [];

    const width = originalImageData.width;
    const height = originalImageData.height;

    const maskValue = normalizeMaskValue(options.maskValue);
    const maskMul = 1 - maskValue;

    // original -> tensor
    const imgToTensor = tf.tidy(() => {
      return tf.browser
        .fromPixels(originalImageData)
        .resizeBilinear([height, width])
        .toFloat();
    });

    const reusableCanvas = document.createElement('canvas');
    reusableCanvas.width = width;
    reusableCanvas.height = height;
    const reusableCtx = reusableCanvas.getContext('2d', {
      willReadFrequently: true,
    });

    const batchVectors: number[][] = [];

    try {
      for (let i = 0; i < x.length; i++) {
        const rawVector = x[i];

        const inputTensor = tf.tidy(() => {
          const maskVector = Array.from(rawVector).flat();
          const values = tf.tensor1d(maskVector);

          const maskFlat = values.gather(segmentationTensor);
          const mask3d = maskFlat.reshape([height, width, 1]);

          const maskLeve = mask3d.mul(maskMul).add(maskValue);
          return imgToTensor.mul(maskLeve).toInt();
        });

        if (!reusableCtx) throw new Error('Canvas 2D context not available');
        await tf.browser.toPixels(
          inputTensor as tf.Tensor3D,
          reusableCanvas,
        );

        if (i % 50 === 0) {
          debugImages.push(reusableCanvas.toDataURL());
        }

        const perturbedImageData = reusableCtx.getImageData(
          0,
          0,
          width,
          height,
        );

        const result = await iModel.CLASSIFY_IMAGE(
          modelInstance,
          perturbedImageData,
        );
        const predictions = result?.predictions;

        const vector = toFixedVector(predictions, selectedLabels);
        batchVectors.push(vector);

        inputTensor.dispose();
      }

      return batchVectors;
    } finally {
      if (imgToTensor?.dispose) imgToTensor.dispose();
    }
  };
};
