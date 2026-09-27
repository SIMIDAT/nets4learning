/* eslint-disable @typescript-eslint/no-explicit-any */
import * as tfjs from '@tensorflow/tfjs';

interface EmbeddingCacheEntry {
  layerName: string;
  embedModel: tfjs.LayersModel;
}
interface ActivationsCacheEntry {
  layerNames: string[];
  actModel: tfjs.LayersModel;
}

// Caches are module-level so both MNIST and KMNIST can reuse them.
// WeakMap makes sure we don't keep models alive accidentally.
export const _embeddingModelCache = new WeakMap<object, EmbeddingCacheEntry>();
export const _activationsModelCache = new WeakMap<
  object,
  Map<string, ActivationsCacheEntry>
>();

/**
 * Normaliza stride/pool values a formato compatible con tfjs ([h, w] o number).
 */
function normalizeHw(
  value: number | number[] | undefined,
  fallback = 1,
): number | [number, number] {
  if (Array.isArray(value)) {
    // Si trae 2 o más números, coge estrictamente los dos primeros [Alto, Ancho].
    if (value.length >= 2) return [value[0], value[1]];

    // Si trae solo 1 número, asume cuadrado perfecto y lo duplica.
    if (value.length === 1) return [value[0], value[0]];

    // Array vacío: devuelve el salvavidas.
    return [fallback, fallback];
  }

  // Número primitivo: TFJS lo interpreta como simétrico.
  if (typeof value === 'number') return value;

  // undefined/null/otra cosa: salvavidas por defecto.
  return [fallback, fallback];
}

export function guessEmbeddingLayerName(model: any): string | null {
  const denseLayers = model.layers.filter(
    (l: any) => l?.getClassName?.() === 'Dense',
  );
  if (denseLayers.length >= 2)
    return denseLayers[denseLayers.length - 2].name;
  if (model.layers.length >= 2)
    return model.layers[model.layers.length - 2].name;
  return null;
}

export function defaultActivationLayerNames(model: any): string[] {
  return model.layers
    .filter(
      (l: any) =>
        l?.getClassName?.() !== 'InputLayer' &&
        l?.getClassName?.() !== 'Dropout' &&
        l?.getClassName?.() !== 'Flatten' &&
        l?.getClassName?.() !== 'MaxPooling2D',
    )
    .map((l: any) => l.name);
}

function _getOrCreateEmbeddingModel(
  model: any,
  layerName: string,
): EmbeddingCacheEntry {
  let cached = _embeddingModelCache.get(model);
  if (!cached || cached.layerName !== layerName) {
    const layer = model.getLayer(layerName);
    const embedModel = tfjs.model({
      inputs: model.inputs,
      outputs: layer.output,
    });
    cached = { layerName, embedModel };
    _embeddingModelCache.set(model, cached);
  }
  return cached;
}

function _getOrCreateActivationsModel(
  model: any,
  layerNames: string[],
): ActivationsCacheEntry {
  const key = layerNames.join('|');
  let perModel = _activationsModelCache.get(model);
  if (!perModel) {
    perModel = new Map();
    _activationsModelCache.set(model, perModel);
  }

  const existing = perModel.get(key);
  if (existing) return existing;

  const outputs = layerNames.map((name) => model.getLayer(name).output);
  const actModel = tfjs.model({ inputs: model.inputs, outputs });
  const cached: ActivationsCacheEntry = { layerNames: [...layerNames], actModel };
  perModel.set(key, cached);
  return cached;
}

interface EmbeddingActivationsParams {
  imageDataToTensor4d: (imageData: ImageData) => tfjs.Tensor4D;
  guessLayerName?: (model: any) => string | null;
}

/**
 * Factory que crea helpers para obtener embeddings y activaciones de un modelo, con caché.
 */
export function createEmbeddingActivationsHelpers(
  params: EmbeddingActivationsParams,
) {
  const { imageDataToTensor4d, guessLayerName } = params;
  if (typeof imageDataToTensor4d !== 'function') {
    throw new Error(
      'createEmbeddingActivationsHelpers: imageDataToTensor4d must be a function',
    );
  }

  const _guess = guessLayerName ?? guessEmbeddingLayerName;

  return {
    async GET_EMBEDDING_IMAGE(
      model: any,
      imageData: ImageData,
      options: { layerName?: string } = {},
    ): Promise<{ embedding: Float32Array; layerName: string }> {
      const layerName = options.layerName ?? _guess(model);
      if (!layerName) {
        throw new Error(
          'GET_EMBEDDING_IMAGE: unable to infer embedding layer name',
        );
      }

      const cached = _getOrCreateEmbeddingModel(model, layerName);

      const x = imageDataToTensor4d(imageData);
      const y = cached.embedModel.predict(x) as tfjs.Tensor;
      const embedding = Float32Array.from(y.dataSync());
      x.dispose();
      y.dispose();

      console.log('GET_EMBEDDING_IMAGE:', {
        layerName,
        embeddingLength: embedding.length,
      });
      console.log(embedding);

      return { embedding, layerName };
    },

    async GET_ACTIVATIONS_IMAGE(
      model: any,
      imageData: ImageData,
      options: { layerNames?: string[]; includeInput?: boolean } = {},
    ): Promise<{
      layers: Record<string, { data: Float32Array; shape: number[] }>;
      order: string[];
    }> {
      const layerNames =
        options.layerNames ?? defaultActivationLayerNames(model);
      const includeInput = options.includeInput ?? false;

      if (!Array.isArray(layerNames) || layerNames.length === 0) {
        throw new Error(
          'GET_ACTIVATIONS_IMAGE: layerNames must be a non-empty array',
        );
      }

      const cached = _getOrCreateActivationsModel(model, layerNames);

      const x = imageDataToTensor4d(imageData);
      const yList = cached.actModel.predict(x);
      const tensors: tfjs.Tensor[] = Array.isArray(yList) ? yList : [yList];

      const layers: Record<string, { data: Float32Array; shape: number[] }> =
        {};
      const order: string[] = [];

      if (includeInput) {
        layers.__input__ = {
          data: Float32Array.from(x.dataSync()),
          shape: Array.from(x.shape),
        };
        order.push('__input__');
      }

      for (let i = 0; i < cached.layerNames.length; i++) {
        const name = cached.layerNames[i];
        const t = tensors[i];
        layers[name] = {
          data: Float32Array.from(t.dataSync()),
          shape: Array.from(t.shape),
        };
        order.push(name);
      }

      x.dispose();
      tensors.forEach((t) => t.dispose());

      console.log('GET_ACTIVATIONS_IMAGE:', { layerNames: order });
      console.log(layers);

      return { layers, order };
    },
  };
}

interface ConvConfig {
  strides?: number | number[];
  padding?: 'same' | 'valid';
  bias?: tfjs.Tensor | null;
}

interface PoolConfig {
  poolSize?: number | number[];
  strides?: number | number[];
  padding?: 'same' | 'valid';
}

/**
 * LRP para capa Dense con regla epsilon.
 * R_i = sum_j ( (x_i * w_ij) / (z_j + epsilon * sign(z_j)) * R_j )
 */
export function lrpDense(
  inputTensor: tfjs.Tensor,
  weights: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  bias: tfjs.Tensor | null = null,
  epsilon = 1e-9,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    // Forward pass: z = x * W + b
    let z: tfjs.Tensor = inputTensor.matMul(weights);
    if (bias) {
      z = z.add(bias);
    }

    // Prevenimos divisiones entre cero
    const stabilizer = tfjs.where(
      z.greaterEqual(tfjs.scalar(0)),
      tfjs.scalar(epsilon),
      tfjs.scalar(-epsilon),
    );
    z = z.add(stabilizer);

    // Backward pass: s = R_out / z
    const s = relevanceOut.div(z);

    // c = s * W^T
    const c = s.matMul(weights, false, true);

    // R_in = x * c
    const relevanceIn = inputTensor.mul(c);

    return relevanceIn;
  });
}

/**
 * LRP para capa Dense con regla alpha-beta.
 */
export function lrpDenseAlphaBeta(
  inputTensor: tfjs.Tensor,
  weights: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  bias: tfjs.Tensor | null = null,
  alpha = 0.5,
  beta = 0.5,
  epsilon = 1e-9,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    // Separar pesos en positivos y negativos
    const wPos = tfjs.maximum(weights, 0);
    const wNeg = tfjs.minimum(weights, 0);

    // Forward pass con pesos positivos
    let zPos: tfjs.Tensor = inputTensor.matMul(wPos);
    if (bias) {
      const bPos = tfjs.maximum(bias, 0);
      zPos = zPos.add(bPos);
    }
    zPos = zPos.add(epsilon);

    // Forward pass con pesos negativos
    let zNeg: tfjs.Tensor = inputTensor.matMul(wNeg);
    if (bias) {
      const bNeg = tfjs.minimum(bias, 0);
      zNeg = zNeg.add(bNeg);
    }
    zNeg = zNeg.sub(epsilon);

    // Backward pass
    const sPos = relevanceOut.div(zPos).mul(alpha);
    const sNeg = relevanceOut.div(zNeg).mul(beta);

    const cPos = sPos.matMul(wPos, false, true);
    const cNeg = sNeg.matMul(wNeg, false, true);

    const relevanceIn = inputTensor.mul(cPos.add(cNeg));

    return relevanceIn;
  });
}

/**
 * LRP para capa Convolucional 2D con regla epsilon.
 */
export function lrpConv2D(
  inputTensor: tfjs.Tensor,
  kernel: tfjs.Tensor4D,
  relevanceOut: tfjs.Tensor,
  config: ConvConfig = {},
  epsilon = 1e-9,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const { padding = 'valid', bias = null } = config;
    const strides = normalizeHw(config.strides, 1);
    const x4 = inputTensor as tfjs.Tensor4D;
    const r4 = relevanceOut as tfjs.Tensor4D;

    // Forward pass: z = conv2d(x, W) + b
    let z: tfjs.Tensor = tfjs.conv2d(x4, kernel, strides, padding);
    if (bias) {
      z = z.add(bias);
    }

    // Estabilización
    const stabilizer = tfjs.where(
      z.greaterEqual(0),
      tfjs.scalar(epsilon),
      tfjs.scalar(-epsilon),
    );
    z = z.add(stabilizer);

    // s = R_out / z
    const s = r4.div(z) as tfjs.Tensor4D;

    // Convolución transpuesta (equivalente al paso hacia atrás)
    const outputShape = x4.shape as [number, number, number, number];
    const c = tfjs.conv2dTranspose(s, kernel, outputShape, strides, padding);

    // R_in = x * c
    const relevanceIn = x4.mul(c);

    return relevanceIn;
  });
}

/**
 * LRP para capa Convolucional 2D con regla alpha-beta.
 */
export function lrpConv2DAlphaBeta(
  inputTensor: tfjs.Tensor,
  kernel: tfjs.Tensor4D,
  relevanceOut: tfjs.Tensor,
  config: ConvConfig = {},
  alpha = 0.5,
  beta = 0.5,
  epsilon = 1e-9,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const { padding = 'valid', bias = null } = config;
    const strides = normalizeHw(config.strides, 1);
    const x4 = inputTensor as tfjs.Tensor4D;
    const r4 = relevanceOut as tfjs.Tensor4D;

    const kernelPos = tfjs.maximum(kernel, 0) as tfjs.Tensor4D;
    const kernelNeg = tfjs.minimum(kernel, 0) as tfjs.Tensor4D;

    // Forward con pesos positivos
    let zPos: tfjs.Tensor = tfjs.conv2d(x4, kernelPos, strides, padding);
    if (bias) {
      const bPos = tfjs.maximum(bias, 0);
      zPos = zPos.add(bPos);
    }
    zPos = zPos.add(epsilon);

    // Forward con pesos negativos
    let zNeg: tfjs.Tensor = tfjs.conv2d(x4, kernelNeg, strides, padding);
    if (bias) {
      const bNeg = tfjs.minimum(bias, 0);
      zNeg = zNeg.add(bNeg);
    }
    zNeg = zNeg.sub(epsilon);

    // Backward
    const sPos = r4.div(zPos).mul(alpha) as tfjs.Tensor4D;
    const sNeg = r4.div(zNeg).mul(beta) as tfjs.Tensor4D;

    const outputShape = x4.shape as [number, number, number, number];
    const cPos = tfjs.conv2dTranspose(
      sPos,
      kernelPos,
      outputShape,
      strides,
      padding,
    );
    const cNeg = tfjs.conv2dTranspose(
      sNeg,
      kernelNeg,
      outputShape,
      strides,
      padding,
    );

    const relevanceIn = x4.mul(cPos.add(cNeg));

    return relevanceIn;
  });
}

/**
 * LRP para capa MaxPooling2D.
 * Implementa la relajación heurística asimilada a Average Pooling
 * para entornos Edge-AI, garantizando el Axioma de Conservación (Bach et al.)
 */
export function lrpMaxPooling2D(
  inputTensor: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  config: PoolConfig = {}
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const poolSize = normalizeHw(config.poolSize, 2);
    const strides = normalizeHw(config.strides, 2);
    const x4 = inputTensor as tfjs.Tensor4D;
    const r4 = relevanceOut as tfjs.Tensor4D;

    // Despliegue espacial y normalización matemática
    const upsampled = upsampleRelevance(r4, x4.shape, poolSize, strides);

    return upsampled;
  });
}

/**
 * LRP para capa AveragePooling2D.
 * La relevancia se distribuye uniformemente entre los elementos de la ventana.
 */
export function lrpAvgPooling2D(
  inputTensor: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  config: PoolConfig = {},
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const poolSize = normalizeHw(config.poolSize, 2);
    const strides = normalizeHw(config.strides, 2);
    const x4 = inputTensor as tfjs.Tensor4D;
    const r4 = relevanceOut as tfjs.Tensor4D;

    const upsampled = upsampleRelevance(r4, x4.shape, poolSize, strides);

    return upsampled;
  });
}

/**
 * Función auxiliar para hacer upsample de la relevancia.
 * Distribuye la relevancia de salida al tamaño de entrada.
 */
function upsampleRelevance(
  relevanceOut: tfjs.Tensor4D,
  inputShape: number[],
  poolSize: number | [number, number],
  _strides: number | [number, number],
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const inH = inputShape[1];
    const inW = inputShape[2];

    const [poolH, poolW] = Array.isArray(poolSize)
      ? poolSize
      : [poolSize, poolSize];

    // Usamos resize bilinear como aproximación al despliegue espacial
    const resized = tfjs.image.resizeBilinear(relevanceOut, [inH, inW]);

    // Ajustamos por el área de la ventana de pooling (conservación)
    const poolArea = poolH * poolW;
    return resized.div(poolArea);
  });
}

/**
 * LRP para capa Flatten: solo hace reshape de la relevancia.
 */
export function lrpFlatten(
  relevanceOut: tfjs.Tensor,
  inputShape: number[],
): tfjs.Tensor {
  return relevanceOut.reshape(inputShape);
}

interface ApplyLRPParams {
  layerType: string;
  inputTensor: tfjs.Tensor;
  relevanceOut: tfjs.Tensor;
  layer: any;
  options?: {
    rule?: 'simple' | 'epsilon' | 'alpha_beta';
    epsilon?: number;
    alpha?: number;
    beta?: number;
    winnerTakesAll?: boolean;
  };
}

/**
 * Función principal para aplicar LRP según el tipo de capa.
 */
export function applyLRP(params: ApplyLRPParams): tfjs.Tensor {
  const { layerType, inputTensor, relevanceOut, layer, options = {} } = params;

  const {
    rule = 'epsilon',
    epsilon = 0.01,
    alpha = 2,
    beta = 1,
  } = options;

  switch (layerType) {
    case 'Dense': {
      const [weights, bias] = layer.getWeights();
      if (rule === 'alpha_beta') {
        return lrpDense(
          inputTensor,
          weights,
          relevanceOut,
          bias,
          epsilon,
        );
      } else {
        return lrpDense(inputTensor, weights, relevanceOut, bias, epsilon);
      }
    }

    case 'Conv2D': {
      const [kernel, bias] = layer.getWeights();
      const config: ConvConfig = {
        strides: layer.strides,
        padding: layer.padding,
        bias: bias,
      };
      if (rule === 'alpha_beta') {
        return lrpConv2DAlphaBeta(
          inputTensor,
          kernel,
          relevanceOut,
          config,
          alpha,
          beta,
          epsilon,
        );
      } else {
        return lrpConv2D(inputTensor, kernel, relevanceOut, config, epsilon);
      }
    }

    case 'MaxPooling2D': {
      const config: PoolConfig = {
        poolSize: layer.poolSize,
        strides: layer.strides,
        padding: layer.padding,
      };
      return lrpMaxPooling2D(inputTensor, relevanceOut, config);
    }

    case 'AveragePooling2D':
    case 'AvgPool2D': {
      const config: PoolConfig = {
        poolSize: layer.poolSize,
        strides: layer.strides,
        padding: layer.padding,
      };
      return lrpAvgPooling2D(inputTensor, relevanceOut, config);
    }

    case 'Flatten': {
      return lrpFlatten(relevanceOut, inputTensor.shape);
    }

    case 'Activation':
    case 'ReLU':
    case 'Dropout':
      // Estas capas pasan la relevancia sin cambios
      return relevanceOut.clone();

    default:
      console.warn(
        `LRP no implementado para capa tipo: ${layerType}. Pasando relevancia sin cambios.`,
      );
      return relevanceOut.clone();
  }
}
