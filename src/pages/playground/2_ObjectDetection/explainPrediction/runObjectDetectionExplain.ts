import * as tfjs from '@tensorflow/tfjs';
import { KernelSHAP } from '@core/explainability/webshap';
import { OD_MODEL_KEYS } from '@/MODEL_KEYS';
import { ExplainError } from '@core/explainability/explainError';

import { objectDetectionWrapper } from '@core/explainability/ObjectDetectionWrapper';
import { buildMaskedBackground, minShapSamples } from '@core/explainability/shapSampling';
import { computeSLICzeroMap } from '@utils/slic0';
import { FACE_SEGMENT_NAMES, getFaceSegmentMap } from '@utils/facialSegment';

export interface ObjDetExplainParams {
  model          : any;
  imageData      : ImageData;
  gridSide       : number;
  nSamples       : number;
  maskValue?     : number;
  blur?          : boolean;
  blurKernelSize?: number;
  blurPasses?    : number;
}

export interface ObjDetExplainResult {
  shapValues          : any;
  debugImages         : string[];
  selectedLabels      : Array<string | number>;
  segmentationMapArray: Int32Array | Uint8Array | null;
  numSegments         : number;
  backgroundData      : number[][];
  /** Texto de cada etiqueta para mostrarla (traducido por el modelo). */
  labelTexts          : string[];
  /** Valor de cada etiqueta con toda la imagen tapada (punto de partida de SHAP). */
  baseValues          : number[];
  /** Valor de cada etiqueta con la imagen completa (= punto de partida + suma de SHAP). */
  predictedValues     : number[];
  /** Clave de i18n del nombre de cada segmento, si los segmentos tienen significado (zonas de la cara). */
  segmentLabelKeys    : string[] | null;
}

// FaceMesh singleton (instancia + init lazy) para obtener keypoints siempre desde FaceMesh
let faceMeshInstance: any = null;
let faceMeshInitPromise: Promise<any> | null = null;

async function getFaceMeshInstance(): Promise<any> {
  if (!faceMeshInstance) {
    // Import dinámico: FaceMesh (mediapipe) solo se descarga si hace falta segmentar una cara.
    const { MODEL_2_FACE_MESH } = await import('../models/MODEL_2_FACE_MESH');
    // Esta instancia solo se usa para obtener keypoints (PREDICTION); la
    // función de traducción `t` solo afecta a textos de UI, así que pasamos
    // una identidad.
    faceMeshInstance = new MODEL_2_FACE_MESH(((key: string) => key) as any);
  }
  if (!faceMeshInitPromise) {
    faceMeshInitPromise = faceMeshInstance.ENABLE_MODEL();
  }
  await faceMeshInitPromise;
  return faceMeshInstance;
}

/**
 * Ejecuta el flujo completo de explicabilidad (SLIC0 + KernelSHAP) para
 * detección de objetos. No toca el estado de React: devuelve los resultados.
 */
export async function runObjectDetectionExplain(
  params: ObjDetExplainParams,
): Promise<ObjDetExplainResult> {
  const {
    model,
    imageData,
    gridSide,
    nSamples,
    maskValue,
    blur,
    blurKernelSize,
    blurPasses,
  } = params;
  if (!model) throw new Error('runObjectDetectionExplain: model is required');
  // Se explica una imagen estática, que se muestra tal cual (sin espejo): nunca se refleja.
  const flipHorizontal = false;
  if (!imageData)
    throw new Error('runObjectDetectionExplain: imageData is required');
  if (!Number.isFinite(gridSide) || gridSide <= 0)
    throw new Error('gridSide must be > 0');
  if (!Number.isFinite(nSamples) || nSamples <= 0)
    throw new Error('nSamples must be > 0');

  let segmentationTensor: tfjs.Tensor | null = null;

  try {
    // Inicializamos mapa de segmentos con SLIC0 o mapa facial
    let mapArray: Int32Array | Uint8Array | null = null;
    let numSegments = 0;
    let segmentLabelKeys: string[] | null = null;

    // Predicción base para etiquetas: el modelo seleccionado por el usuario
    const baseDetections = await model.PREDICTION(imageData, {
      flipHorizontal,
      staticImageMode: Boolean(model.faces),
    });
    const selectedLabels: string[] = Array.isArray(baseDetections) ? model.EXPLAIN_LABELS(baseDetections) : [];
    if (selectedLabels.length === 0) {
      throw new ExplainError('ui.explain.nothing-detected');
    }

    // Comprobamos si el modelo es facial o no
    if (model.faces) {
      // Si el modelo seleccionado ya es FaceMesh lo reutilizamos en vez de cargar otro.
      const isFaceMesh = (model.constructor as { KEY?: string }).KEY === OD_MODEL_KEYS.FACE_MESH;
      const faceMesh = isFaceMesh ? model : await getFaceMeshInstance();
      const meshDetections = await faceMesh.PREDICTION(imageData, {
        flipHorizontal,
        staticImageMode: true,
      });

      const keypoints = meshDetections?.[0]?.keypoints ?? [];
      ({ mapArray, numSegments } = getFaceSegmentMap(
        keypoints,
        imageData.width,
        imageData.height,
      ));

      // Sin cara (o sin keypoints suficientes): segmentación genérica.
      if (!numSegments || numSegments <= 1) {
        ({ mapArray, numSegments } = computeSLICzeroMap(imageData, gridSide * gridSide));
      } else {
        segmentLabelKeys = FACE_SEGMENT_NAMES.map((name) => 'ui.explain.face-parts.' + name);
      }
    } else {
      ({ mapArray, numSegments } = computeSLICzeroMap(imageData, gridSide * gridSide));
    }

    if (!numSegments || numSegments <= 0) {
      throw new Error('Segmentation produced 0 segments');
    }

    segmentationTensor = tfjs.tensor2d(
      mapArray as Int32Array | Uint8Array,
      [imageData.height, imageData.width],
      'int32',
    );

    const inputVector = Array(numSegments).fill(1);
    const backgroundData = buildMaskedBackground(numSegments);

    const { predict, debugImages } = objectDetectionWrapper(
      model,
      imageData,
      segmentationTensor,
      model.usesTensorForPrediction,
      selectedLabels,
      {
        flipHorizontal,
        staticImageMode: Boolean(model.faces),
        // Las etiquetas se eligen con la predicción normal; al explicar, el modelo puede pedir
        // otra configuración (p. ej. un umbral bajo para que la puntuación sea gradual).
        ...model.EXPLAIN_PREDICTION_CONFIG,
        ...(maskValue === undefined ? null : { maskValue }),
        ...(blur === undefined ? null : { blur }),
        ...(blurKernelSize === undefined ? null : { blurKernelSize }),
        ...(blurPasses === undefined ? null : { blurPasses }),
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
      labelTexts          : selectedLabels.map((label) => model.EXPLAIN_LABEL_TEXT(label)),
      baseValues,
      predictedValues     : shapValues.map((phi: number[], k: number) => baseValues[k] + phi.reduce((a, b) => a + b, 0)),
      segmentLabelKeys,
    };
  } finally {
    if (segmentationTensor?.dispose) segmentationTensor.dispose();
  }
}
