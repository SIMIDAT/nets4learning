/* eslint-disable @typescript-eslint/no-explicit-any */

interface PredictionItem {
  className?: string;
  probability?: number;
}

export const createImageClassificationAdapter = (
  iModel: any,
  modelInstance: any,
) => {
  if (!iModel)
    throw new Error('createImageClassificationAdapter: iModel is required');
  if (!modelInstance)
    throw new Error(
      'createImageClassificationAdapter: modelInstance is required',
    );

  const getImageDataFromInput = (input: any): ImageData => {
    // ImageData
    if (typeof ImageData !== 'undefined' && input instanceof ImageData)
      return input;

    // Canvas
    if (
      typeof HTMLCanvasElement !== 'undefined' &&
      input instanceof HTMLCanvasElement
    ) {
      const ctx = input.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas 2D context not available');
      return ctx.getImageData(0, 0, input.width, input.height);
    }

    // ImageData-like fallback
    if (
      input &&
      typeof input === 'object' &&
      Number.isFinite(input.width) &&
      Number.isFinite(input.height) &&
      input.data
    ) {
      return input as ImageData;
    }

    throw new Error('Unsupported prediction input for image classification');
  };

  return {
    async PREDICTION(input: any): Promise<any[]> {
      const imageData = getImageDataFromInput(input);
      const result = await iModel.CLASSIFY_IMAGE(modelInstance, imageData);
      return result?.predictions ?? [];
    },

    NORMALIZE_PREDICTIONS(
      predictions: any,
      labels: Array<string | number>,
    ): number[] {
      const safeLabels = Array.isArray(labels) ? labels : [];
      const output: number[] = new Array(safeLabels.length).fill(0);

      // Caso: lista de objetos (MobileNet, etc.)
      if (
        Array.isArray(predictions) &&
        predictions.length > 0 &&
        typeof predictions[0] === 'object'
      ) {
        const indexByLabel = new Map(
          safeLabels.map((l, i) => [String(l), i] as [string, number]),
        );
        for (const p of predictions as PredictionItem[]) {
          const label = p?.className;
          const prob = Number(p?.probability);
          const idx = indexByLabel.get(String(label));
          if (idx !== undefined && Number.isFinite(prob)) output[idx] = prob;
        }
        return output;
      }

      // Caso: vector numérico (MNIST/KMNIST)
      let arr: any[] = [];
      try {
        arr = Array.from(predictions ?? []);
      } catch {
        arr = [];
      }

      const limit = Math.min(output.length, arr.length);
      for (let i = 0; i < limit; i++) {
        const v = Number(arr[i]);
        output[i] = Number.isFinite(v) ? v : 0;
      }
      return output;
    },
  };
};
