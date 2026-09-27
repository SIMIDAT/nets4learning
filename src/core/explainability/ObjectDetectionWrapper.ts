/* eslint-disable @typescript-eslint/no-explicit-any */
import * as tf from '@tensorflow/tfjs';

interface ObjectDetectionOptions {
  maskValue?: number;
  blur?: boolean;
  blurKernelSize?: number;
  blurPasses?: number;
  [key: string]: any;
}

const normalizeBlurKernelSize = (kernelSize: number, maxSize: number): number => {
  const fallback = 15;
  const raw = Number.isFinite(kernelSize) ? Math.trunc(kernelSize) : fallback;
  let k = raw <= 0 ? fallback : raw;
  if (k % 2 === 0) k += 1;
  if (Number.isFinite(maxSize) && maxSize > 0) {
    k = Math.min(k, Math.trunc(maxSize));
    if (k < 3) k = 3;
    if (k % 2 === 0) k = Math.max(3, k - 1);
  }
  return k;
};

const normalizeBlurPasses = (passes: number | undefined): number => {
  const fallback = 2;
  const raw = Number.isFinite(passes) ? Math.trunc(passes as number) : fallback;
  const p = raw <= 0 ? fallback : raw;
  return Math.max(1, Math.min(6, p));
};

export const objectDetectionWrapper = (
  modelRef: any,
  imagenOriginal: ImageData,
  segmentationTensor: tf.Tensor,
  debugImages: string[],
  usesTensorForPrediction: boolean,
  labels: Array<string | number>,
  options: ObjectDetectionOptions = {},
) => {
  return async (x: number[][]): Promise<number[][]> => {
    if (!x || x.length === 0) return [];

    // Sin logs: este wrapper se llama una vez por perturbación de KernelSHAP (hot path).

    // imgoriginal ---> tensor
    const imgToTensor = tf.tidy(() => {
      return tf.browser
        .fromPixels(imagenOriginal)
        .resizeBilinear([imagenOriginal.height, imagenOriginal.width])
        .toFloat();
    });

    const batchVectors: number[][] = [];
    const maskValue = options.maskValue || Number(0);
    if (maskValue < 0 || maskValue > 1) {
      throw new Error('maskValue debe estar entre 0 y 1');
    }
    const maskMul = 1 - maskValue;

    // Si se solicita explícitamente en options activamos blur.
    const shouldBlurMaskedRegions = Boolean(options.blur);
    let blurredImgToTensor: tf.Tensor3D | null = null;

    try {
      let reusableCanvasForPrediction: HTMLCanvasElement | null = null;
      if (!usesTensorForPrediction) {
        reusableCanvasForPrediction = document.createElement('canvas');
        reusableCanvasForPrediction.width = imagenOriginal.width;
        reusableCanvasForPrediction.height = imagenOriginal.height;
      }

      if (shouldBlurMaskedRegions) {
        const maxSize = Math.min(imagenOriginal.width, imagenOriginal.height);
        // Para caras, por defecto un blur más agresivo.
        const blurKernelSize = normalizeBlurKernelSize(
          options.blurKernelSize ?? 20,
          maxSize,
        );
        const blurPasses = normalizeBlurPasses(options.blurPasses);
        blurredImgToTensor = tf.tidy(() => {
          let img4d = imgToTensor.expandDims(0) as tf.Tensor4D;
          for (let p = 0; p < blurPasses; p++) {
            img4d = tf.avgPool(
              img4d,
              [blurKernelSize, blurKernelSize],
              [1, 1],
              'same',
            );
          }
          // Quitamos la dimensión extra
          return img4d.squeeze([0]) as tf.Tensor3D;
        });
      }

      for (let i = 0; i < x.length; i++) {
        const rawVector = x[i];
        const blurred = blurredImgToTensor;
        const inputTensor = tf.tidy(() => {
          const maskVector = Array.from(rawVector).flat();
          const values = tf.tensor1d(maskVector);

          const maskFlat = values.gather(segmentationTensor);
          const mask3d = maskFlat.reshape([
            imagenOriginal.height,
            imagenOriginal.width,
            1,
          ]);

          const maskLeve = mask3d.mul(maskMul).add(maskValue);

          if (shouldBlurMaskedRegions && blurred) {
            const invMask = tf.scalar(1).sub(maskLeve);
            const blended = imgToTensor
              .mul(maskLeve)
              .add(blurred.mul(invMask));
            return blended.toInt();
          }

          return imgToTensor.mul(maskLeve).toInt();
        });

        let predictionInput: any = inputTensor;

        if (!usesTensorForPrediction) {
          await tf.browser.toPixels(
            inputTensor as tf.Tensor3D,
            reusableCanvasForPrediction!,
          );
          predictionInput = reusableCanvasForPrediction;
        }

        // Guardar imagen de debug cada 50 iteraciones antes de dispose
        if (i % 50 === 0) {
          if (reusableCanvasForPrediction) {
            debugImages.push(reusableCanvasForPrediction.toDataURL());
          } else {
            const canvas = document.createElement('canvas');
            canvas.width = imagenOriginal.width;
            canvas.height = imagenOriginal.height;
            await tf.browser.toPixels(inputTensor as tf.Tensor3D, canvas);
            debugImages.push(canvas.toDataURL()); // Guardamos como imagen base64
          }
        }

        // Llamada al predictor (modelRef debe exponer PREDICTION)
        const detections = await modelRef.PREDICTION(predictionInput, options);

        // IMPORTANTE: La salida debe tener dimensión fija.
        // En COCO-SSD esto viene dado por `labels.length` (labels del caso base).
        // Si labels no existe/está vacío (p.ej. modelos faciales), forzamos salida escalar.
        // Si no hay detecciones (p.ej. no detecta cara), devolvemos [0].
        const safeDetections = Array.isArray(detections) ? detections : [];
        const expectedLength = Array.isArray(labels) ? labels.length : 0;
        const outputLength = expectedLength > 0 ? expectedLength : 1;

        if (safeDetections.length === 0) {
          batchVectors.push(new Array(outputLength).fill(0));
        } else {
          const normalized = modelRef.NORMALIZE_PREDICTIONS(
            safeDetections,
            labels,
          );
          const vector =
            Array.isArray(normalized) && normalized.length === outputLength
              ? normalized
              : new Array(outputLength).fill(0);
          batchVectors.push(vector);
        }

        inputTensor.dispose();
      }
    } catch (error) {
      console.error('Error en la predicción del wrapper:', error);
      throw error;
    } finally {
      if (blurredImgToTensor?.dispose) blurredImgToTensor.dispose();
      if (imgToTensor.dispose) imgToTensor.dispose();
    }

    return batchVectors;
  };
};
