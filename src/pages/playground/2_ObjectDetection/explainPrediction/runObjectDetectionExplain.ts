import * as tfjs from '@tensorflow/tfjs';
import { KernelSHAP } from 'webshap';
import { OD_MODEL_KEYS } from '@/MODEL_KEYS';

import { objectDetectionWrapper } from '@core/explainability/ObjectDetectionWrapper';
import { buildMaskedBackground } from '@core/explainability/shapSampling';
import { computeSLICzeroMap } from '@utils/slic0';
import { getFaceSegmentMap } from '@utils/facialSegment';

export interface ObjDetExplainParams {
  model          : any;
  imageData      : ImageData;
  gridSide       : number;
  nSamples       : number;
  flipHorizontal : boolean;
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

const unique = <T>(arr: T[]): T[] => Array.from(new Set(arr));

const getSelectedLabelsFromDetections = (
  detections: any,
  model: any,
): Array<string | number> => {
  // Si el modelo tiene GET_LABELS, usarlo (para FACE_API)
  if (model && typeof model.GET_LABELS === 'function') {
    return model.GET_LABELS();
  }

  // En caso contrario, extraer nombres de clase únicos (para COCO-SSD, etc.)
  if (!Array.isArray(detections)) return [];
  return unique(
    detections
      .filter((det: any) => det && typeof det.class === 'string')
      .map((det: any) => det.class),
  );
};

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
    flipHorizontal,
    maskValue,
    blur,
    blurKernelSize,
    blurPasses,
  } = params;
  if (!model) throw new Error('runObjectDetectionExplain: model is required');
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

    // Predicción base para etiquetas: el modelo seleccionado por el usuario
    const baseDetections = await model.PREDICTION(imageData, {
      flipHorizontal,
      staticImageMode: Boolean(model.faces),
    });
    const selectedLabels = getSelectedLabelsFromDetections(
      baseDetections,
      model,
    );
    if (!Array.isArray(baseDetections) || baseDetections.length === 0) {
      throw new Error('The model detected nothing in this image');
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
        flipHorizontal,
      ));

      // Sin cara (o sin keypoints suficientes): segmentación genérica.
      if (!numSegments || numSegments <= 1) {
        ({ mapArray, numSegments } = computeSLICzeroMap(imageData, gridSide));
      }
    } else {
      ({ mapArray, numSegments } = computeSLICzeroMap(imageData, gridSide));
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
        ...(maskValue === undefined ? null : { maskValue }),
        ...(blur === undefined ? null : { blur }),
        ...(blurKernelSize === undefined ? null : { blurKernelSize }),
        ...(blurPasses === undefined ? null : { blurPasses }),
      },
    );

    const explainer = new KernelSHAP(predict, backgroundData, 0.2022);
    const shapValues = await explainer.explainOneInstance(inputVector, nSamples);

    return {
      shapValues,
      debugImages,
      selectedLabels,
      segmentationMapArray: mapArray,
      numSegments,
      backgroundData,
    };
  } finally {
    if (segmentationTensor?.dispose) segmentationTensor.dispose();
  }
}
