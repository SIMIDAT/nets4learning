import * as tfjs from '@tensorflow/tfjs';
import { KernelSHAP } from '@core/explainability/webshap';

import { objectDetectionWrapper } from '@core/explainability/ObjectDetectionWrapper';
import { createImageClassificationAdapter } from '@core/explainability/adapters/createImageClassificationAdapter';
import { buildMaskedBackground, minShapSamples } from '@core/explainability/shapSampling';
import { computeSLICzeroMap } from '@utils/slic0';
import { ExplainError } from '@core/explainability/explainError';
import { compileShaders } from '@core/nn-utils/warmUpModel';

export interface ExplainParams {
  iModel         : any;
  modelInstance  : any;
  imageData      : ImageData;
  gridSide       : number;
  nSamples       : number;
  maskValue?     : number;
  blur?          : boolean;
  blurKernelSize?: number;
  blurPasses?    : number;
}

export interface ExplainLrpParams {
  iModel       : any;
  modelInstance: any;
  imageData    : ImageData;
}

export interface ExplainResult {
  shapValues          : any;
  debugImages         : string[];
  selectedLabels      : Array<string | number>;
  segmentationMapArray: Int32Array | number[] | null;
  numSegments         : number;
  backgroundData      : number[][];
  relevanceShape?     : number[];
  /** Valor de cada etiqueta con toda la imagen tapada (SHAP) — null en LRP. */
  baseValues          : number[] | null;
  /** Valor (probabilidad) de cada etiqueta con la imagen completa. */
  predictedValues     : number[];
}

const unique = <T>(arr: T[]): T[] => Array.from(new Set(arr));

/** Indica si el modelo implementa lo necesario para explicar con LRP. */
export const supportsLrp = (iModel: any): boolean =>
  typeof iModel?.GET_ACTIVATIONS_IMAGE === 'function' &&
  typeof iModel?.CALCULATE_LRP_PROPAGATION === 'function';

const getSelectedLabelsFromClassification = (
  predictions: any,
): Array<string | number> => {
  // Caso MobileNet/ResNet/etc: [{ className, probability }, ...]
  if (
    Array.isArray(predictions) &&
    predictions.length > 0 &&
    typeof predictions[0] === 'object'
  ) {
    return unique(
      predictions
        .map((p: any) => p?.className)
        .filter((v: any) => typeof v === 'string' && v.length > 0),
    );
  }

  // Caso MNIST/KMNIST/etc: vector numérico
  try {
    const arr = Array.from(predictions ?? []);
    return arr.map((_v, i) => i);
  } catch {
    return [];
  }
};

/**
 * Ejecuta el flujo completo de explicabilidad (SLIC0 + KernelSHAP) para
 * clasificación de imágenes. No toca el estado de React: devuelve los
 * resultados para que el caller los gestione.
 */
export async function runImageClassificationExplain(
  params: ExplainParams,
): Promise<ExplainResult> {
  const {
    iModel,
    modelInstance,
    imageData,
    gridSide,
    nSamples,
    maskValue,
    blur,
    blurKernelSize,
    blurPasses,
  } = params;
  if (!iModel)
    throw new Error('runImageClassificationExplain: iModel is required');
  if (!modelInstance)
    throw new Error('runImageClassificationExplain: modelInstance is required');
  if (!imageData)
    throw new Error('runImageClassificationExplain: imageData is required');
  if (!Number.isFinite(gridSide) || gridSide <= 0)
    throw new Error('gridSide must be > 0');
  if (!Number.isFinite(nSamples) || nSamples <= 0)
    throw new Error('nSamples must be > 0');

  let segmentationTensor: tfjs.Tensor | null = null;

  try {
    // Inicializamos mapa de segmentos con SLIC0
    // gridSide = superpíxeles por lado → unos gridSide² segmentos en total.
    const slicResult = computeSLICzeroMap(imageData, gridSide * gridSide);
    const mapArray = slicResult.mapArray;
    const numSegments = slicResult.numSegments;

    if (!numSegments || numSegments <= 0) {
      throw new Error('Segmentation produced 0 segments');
    }

    // Predicción base para fijar dimensión de salida
    const baseResult = await iModel.CLASSIFY_IMAGE(modelInstance, imageData);
    const basePredictions = baseResult?.predictions;
    const selectedLabels = getSelectedLabelsFromClassification(basePredictions);
    if (selectedLabels.length === 0) {
      throw new ExplainError('ui.explain.no-predictions');
    }

    segmentationTensor = tfjs.tensor2d(
      mapArray,
      [imageData.height, imageData.width],
      'int32',
    );

    const inputVector = Array(numSegments).fill(1);
    const backgroundData = buildMaskedBackground(numSegments);

    const adapter = createImageClassificationAdapter(iModel, modelInstance);

    // Reutilizamos el wrapper de detección para aplicar la máscara por segmentos.
    // `usesTensorForPrediction=false` para que pase un canvas al adapter.
    const { predict, debugImages } = objectDetectionWrapper(
      adapter,
      imageData,
      segmentationTensor,
      false,
      selectedLabels,
      {
        ...(maskValue === undefined ? null : { maskValue }),
        ...(blurKernelSize === undefined ? null : { blurKernelSize }),
        ...(blurPasses === undefined ? null : { blurPasses }),
        blur: Boolean(blur),
      },
    );

    const explainer = new KernelSHAP(predict, backgroundData, 0.2022);
    const shapValues = await explainer.explainOneInstance(inputVector, minShapSamples(numSegments, nSamples));

    const baseValues = [...explainer.expectedValue];
    return {
      shapValues,
      debugImages,
      selectedLabels,
      segmentationMapArray: mapArray,
      numSegments,
      backgroundData,
      baseValues,
      predictedValues     : shapValues.map((phi: number[], k: number) => baseValues[k] + phi.reduce((a, b) => a + b, 0)),
    };
  } finally {
    if (segmentationTensor?.dispose) segmentationTensor.dispose();
  }
}

/**
 * Ejecuta el flujo de explicabilidad para LRP (Layer-wise Relevance Propagation).
 */
/** Las capas que recorre LRP (todas menos la de entrada) */
const lrpLayerNames = (modelInstance: tfjs.LayersModel): string[] =>
  modelInstance.layers
    .filter((layer) => layer.getClassName() !== 'InputLayer')
    .map((layer) => layer.name);

const withBatch = (shape: Array<number | null>): number[] => [1, ...shape.slice(1).map((size) => size ?? 1)];

/**
 * Compila los shaders de LRP (gradientes de cada capa, argMax, oneHot…) antes de la primera explicación, que si no
 * bloquea unos 300 ms compilándolos (TODO-worker.md, fase 0). Se propaga la relevancia con activaciones a cero de la
 * forma de cada capa (la forma sale del modelo, sin calcular nada) en modo solo compilar: ver `compileShaders`.
 */
export async function warmUpLrp(iModel: any, modelInstance: tfjs.LayersModel): Promise<void> {
  if (!supportsLrp(iModel)) return;
  const inputShape = modelInstance.inputs[0]?.shape;
  if (!inputShape) return;
  const layers: Record<string, { data: Float32Array; shape: number[] }> = {};
  const add = (name: string, shape: Array<number | null>) => {
    const full = withBatch(shape);
    layers[name] = { data: new Float32Array(full.reduce((a, b) => a * b, 1)), shape: full };
  };
  add('__input__', inputShape);
  const names = lrpLayerNames(modelInstance);
  for (const name of names) {
    const outputShape = modelInstance.getLayer(name).outputShape;
    // Capas con varias salidas: no las hay en estos modelos; si las hubiera, no se calienta
    if (!Array.isArray(outputShape) || Array.isArray(outputShape[0])) return;
    add(name, outputShape as Array<number | null>);
  }
  await compileShaders(() => iModel.CALCULATE_LRP_PROPAGATION(
    modelInstance,
    null,
    { layers, order: ['__input__', ...names] },
    { rule: 'epsilon', epsilon: 0.01, winnerTakesAll: true },
  ));
}

export async function runImageClassificationExplainLrp(
  params: ExplainLrpParams,
): Promise<ExplainResult> {
  const { iModel, modelInstance, imageData } = params;
  if (!iModel)
    throw new Error('runImageClassificationExplainLrp: iModel is required');
  if (!modelInstance)
    throw new Error(
      'runImageClassificationExplainLrp: modelInstance is required',
    );
  if (!imageData)
    throw new Error('runImageClassificationExplainLrp: imageData is required');

  if (typeof iModel.GET_ACTIVATIONS_IMAGE !== 'function') {
    throw new Error(
      'runImageClassificationExplainLrp: iModel.GET_ACTIVATIONS_IMAGE is required',
    );
  }
  if (typeof iModel.CALCULATE_LRP_PROPAGATION !== 'function') {
    throw new Error(
      'runImageClassificationExplainLrp: iModel.CALCULATE_LRP_PROPAGATION is required',
    );
  }

  const layerNames = lrpLayerNames(modelInstance);

  const activations = await iModel.GET_ACTIVATIONS_IMAGE(
    modelInstance,
    imageData,
    {
      layerNames,
      includeInput: true,
    },
  );

  const relevanceTensor = await iModel.CALCULATE_LRP_PROPAGATION(
    modelInstance,
    imageData,
    activations,
    {
      rule          : 'epsilon',
      epsilon       : 0.01,
      winnerTakesAll: true,
    },
  );

  try {
    // Lectura asíncrona: dataSync detiene el hilo principal hasta que la GPU termina
    const relevanceValues: number[] = Array.from(await relevanceTensor.data());
    const { index: predictedIndex, predictions } = await iModel.CLASSIFY_IMAGE(
      modelInstance,
      imageData,
    );

    return {
      shapValues          : [relevanceValues],
      debugImages         : [],
      selectedLabels      : [predictedIndex],
      baseValues          : null,
      predictedValues     : [Number(predictions?.[predictedIndex] ?? 0)],
      segmentationMapArray: null,
      numSegments         : relevanceValues.length,
      backgroundData      : [],
      relevanceShape      : Array.from(relevanceTensor.shape),
    };
  } finally {
    if (relevanceTensor?.dispose) relevanceTensor.dispose();
  }
}
