import * as tfjs from '@tensorflow/tfjs';

interface ActivationsCacheEntry {
  layerNames: string[];
  actModel  : tfjs.LayersModel;
}

// Caché a nivel de módulo para reutilizarla entre modelos (MNIST, KMNIST…).
// WeakMap evita mantener vivos los modelos accidentalmente.
const _activationsModelCache = new WeakMap<
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

export function defaultActivationLayerNames(model: any): string[] {
  return model.layers
    .filter((l: any) => l?.getClassName?.() !== 'InputLayer')
    .map((l: any) => l.name);
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

interface ActivationsParams {
  imageDataToTensor4d: (imageData: ImageData) => tfjs.Tensor4D;
}

/**
 * Factory que crea un helper para obtener las activaciones de un modelo, con caché.
 */
export function createActivationsHelpers(params: ActivationsParams) {
  const { imageDataToTensor4d } = params;
  if (typeof imageDataToTensor4d !== 'function') {
    throw new Error(
      'createActivationsHelpers: imageDataToTensor4d must be a function',
    );
  }

  return {
    async GET_ACTIVATIONS_IMAGE(
      model: any,
      imageData: ImageData,
      options: { layerNames?: string[]; includeInput?: boolean } = {},
    ): Promise<{
      layers: Record<string, { data: Float32Array; shape: number[] }>;
      order : string[];
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

      try {
        if (includeInput) {
          layers.__input__ = {
            data : Float32Array.from(await x.data()),
            shape: Array.from(x.shape),
          };
          order.push('__input__');
        }

        for (let i = 0; i < cached.layerNames.length; i++) {
          const name = cached.layerNames[i];
          const t = tensors[i];
          layers[name] = {
            data : Float32Array.from(await t.data()),
            shape: Array.from(t.shape),
          };
          order.push(name);
        }
      } finally {
        x.dispose();
        tensors.forEach((t) => t.dispose());
      }

      return { layers, order };
    },
  };
}

interface ConvConfig {
  strides?: number | number[];
  padding?: 'same' | 'valid';
  bias?   : tfjs.Tensor | null;
}

interface PoolConfig {
  poolSize?: number | number[];
  strides? : number | number[];
  padding? : 'same' | 'valid';
}

type Forward = (x: tfjs.Tensor) => tfjs.Tensor;

/**
 * Estabilizador de la regla epsilon: z + epsilon * sign(z), con sign(0) = +1
 * para que nunca haya divisiones entre cero.
 */
function stabilize(z: tfjs.Tensor, epsilon: number): tfjs.Tensor {
  return z.add(
    tfjs.where(z.greaterEqual(0), tfjs.scalar(epsilon), tfjs.scalar(-epsilon)),
  );
}

/**
 * Paso hacia atrás genérico de LRP en su formulación gradiente × entrada
 * (Montavon et al. 2019, §10.2.2):
 *
 *   z = forward(x)          s = R_out / z (constante)
 *   c = ∇_x Σ(forward(x) · s)
 *   R_in = x ⊙ c
 *
 * Sirve para cualquier capa lineal (Dense, Conv2D, AvgPool) y, con MaxPool,
 * reparte la relevancia a la neurona ganadora (winner-takes-all). Conserva la
 * relevancia salvo la parte absorbida por el sesgo y el estabilizador.
 */
function lrpBackward(
  forward: Forward,
  x: tfjs.Tensor,
  s: tfjs.Tensor,
): tfjs.Tensor {
  const c = tfjs.grad((xx: tfjs.Tensor) => forward(xx).mul(s).sum())(x);
  return x.mul(c);
}

/** Regla epsilon genérica: R_i = Σ_j x_i·w_ij / (z_j + ε·sign(z_j)) · R_j */
function lrpEpsilon(
  forward: Forward,
  x: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  epsilon: number,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const z = stabilize(forward(x), epsilon);
    return lrpBackward(forward, x, relevanceOut.div(z));
  });
}

/**
 * Regla alpha-beta genérica (con α − β = 1):
 *   R_i = Σ_j ( α · (x_i·w⁺_ij)/z⁺_j − β · (x_i·w⁻_ij)/z⁻_j ) · R_j
 * Supone entradas no negativas (salida de ReLU o píxeles en [0, 1]).
 */
function lrpAlphaBeta(
  forwardPos: Forward,
  forwardNeg: Forward,
  x: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  alpha: number,
  beta: number,
  epsilon: number,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const zPos = forwardPos(x).add(epsilon);
    const zNeg = forwardNeg(x).sub(epsilon);
    const rPos = lrpBackward(forwardPos, x, relevanceOut.div(zPos));
    const rNeg = lrpBackward(forwardNeg, x, relevanceOut.div(zNeg));
    return rPos.mul(alpha).sub(rNeg.mul(beta));
  });
}

const denseForward =
  (weights: tfjs.Tensor, bias: tfjs.Tensor | null): Forward =>
  (x) => {
    const z = x.matMul(weights);
    return bias ? z.add(bias) : z;
  };

const convForward =
  (kernel: tfjs.Tensor4D, config: ConvConfig, bias: tfjs.Tensor | null): Forward =>
  (x) => {
    const z = tfjs.conv2d(
      x as tfjs.Tensor4D,
      kernel,
      normalizeHw(config.strides, 1),
      config.padding ?? 'valid',
    );
    return bias ? z.add(bias) : z;
  };

/** LRP para capa Dense con regla epsilon. */
export function lrpDense(
  inputTensor: tfjs.Tensor,
  weights: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  bias: tfjs.Tensor | null = null,
  epsilon = 1e-9,
): tfjs.Tensor {
  return lrpEpsilon(denseForward(weights, bias), inputTensor, relevanceOut, epsilon);
}

/** LRP para capa Dense con regla alpha-beta. */
export function lrpDenseAlphaBeta(
  inputTensor: tfjs.Tensor,
  weights: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  bias: tfjs.Tensor | null = null,
  alpha = 1,
  beta = 0,
  epsilon = 1e-9,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const forwardPos = denseForward(
      tfjs.maximum(weights, 0),
      bias ? tfjs.maximum(bias, 0) : null,
    );
    const forwardNeg = denseForward(
      tfjs.minimum(weights, 0),
      bias ? tfjs.minimum(bias, 0) : null,
    );
    return lrpAlphaBeta(forwardPos, forwardNeg, inputTensor, relevanceOut, alpha, beta, epsilon);
  });
}

/** LRP para capa Convolucional 2D con regla epsilon. */
export function lrpConv2D(
  inputTensor: tfjs.Tensor,
  kernel: tfjs.Tensor4D,
  relevanceOut: tfjs.Tensor,
  config: ConvConfig = {},
  epsilon = 1e-9,
): tfjs.Tensor {
  return lrpEpsilon(
    convForward(kernel, config, config.bias ?? null),
    inputTensor,
    relevanceOut,
    epsilon,
  );
}

/** LRP para capa Convolucional 2D con regla alpha-beta. */
export function lrpConv2DAlphaBeta(
  inputTensor: tfjs.Tensor,
  kernel: tfjs.Tensor4D,
  relevanceOut: tfjs.Tensor,
  config: ConvConfig = {},
  alpha = 1,
  beta = 0,
  epsilon = 1e-9,
): tfjs.Tensor {
  return tfjs.tidy(() => {
    const bias = config.bias ?? null;
    const forwardPos = convForward(
      tfjs.maximum(kernel, 0) as tfjs.Tensor4D,
      config,
      bias ? tfjs.maximum(bias, 0) : null,
    );
    const forwardNeg = convForward(
      tfjs.minimum(kernel, 0) as tfjs.Tensor4D,
      config,
      bias ? tfjs.minimum(bias, 0) : null,
    );
    return lrpAlphaBeta(forwardPos, forwardNeg, inputTensor, relevanceOut, alpha, beta, epsilon);
  });
}

const poolArgs = (config: PoolConfig) =>
  [
    normalizeHw(config.poolSize, 2),
    normalizeHw(config.strides ?? config.poolSize, 2),
    config.padding ?? 'valid',
  ] as const;

/**
 * LRP para capa MaxPooling2D.
 * - winnerTakesAll = true: toda la relevancia de cada ventana va a la neurona
 *   ganadora (gradiente de maxPool).
 * - winnerTakesAll = false: se reparte en proporción a la activación, como si
 *   fuera un AveragePooling.
 */
export function lrpMaxPooling2D(
  inputTensor: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  config: PoolConfig = {},
  winnerTakesAll = true,
  epsilon = 1e-9,
): tfjs.Tensor {
  if (!winnerTakesAll) {
    return lrpAvgPooling2D(inputTensor, relevanceOut, config, epsilon);
  }
  const [poolSize, strides, padding] = poolArgs(config);
  return lrpEpsilon(
    (x) => tfjs.maxPool(x as tfjs.Tensor4D, poolSize, strides, padding),
    inputTensor,
    relevanceOut,
    epsilon,
  );
}

/**
 * LRP para capa AveragePooling2D: la relevancia de cada ventana se reparte
 * en proporción a la contribución de cada entrada.
 */
export function lrpAvgPooling2D(
  inputTensor: tfjs.Tensor,
  relevanceOut: tfjs.Tensor,
  config: PoolConfig = {},
  epsilon = 1e-9,
): tfjs.Tensor {
  const [poolSize, strides, padding] = poolArgs(config);
  return lrpEpsilon(
    (x) => tfjs.avgPool(x as tfjs.Tensor4D, poolSize, strides, padding),
    inputTensor,
    relevanceOut,
    epsilon,
  );
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
  layerType   : string;
  inputTensor : tfjs.Tensor;
  relevanceOut: tfjs.Tensor;
  layer       : any;
  options?: {
    rule?          : 'epsilon' | 'alpha_beta';
    epsilon?       : number;
    alpha?         : number;
    beta?          : number;
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
    winnerTakesAll = true,
  } = options;

  switch (layerType) {
    case 'Dense': {
      const [weights, bias = null] = layer.getWeights();
      return rule === 'alpha_beta'
        ? lrpDenseAlphaBeta(inputTensor, weights, relevanceOut, bias, alpha, beta, epsilon)
        : lrpDense(inputTensor, weights, relevanceOut, bias, epsilon);
    }

    case 'Conv2D': {
      const [kernel, bias = null] = layer.getWeights();
      const config: ConvConfig = {
        strides: layer.strides,
        padding: layer.padding,
        bias,
      };
      return rule === 'alpha_beta'
        ? lrpConv2DAlphaBeta(inputTensor, kernel, relevanceOut, config, alpha, beta, epsilon)
        : lrpConv2D(inputTensor, kernel, relevanceOut, config, epsilon);
    }

    case 'MaxPooling2D': {
      const config: PoolConfig = {
        poolSize: layer.poolSize,
        strides : layer.strides,
        padding : layer.padding,
      };
      return lrpMaxPooling2D(inputTensor, relevanceOut, config, winnerTakesAll);
    }

    case 'AveragePooling2D':
    case 'AvgPool2D': {
      const config: PoolConfig = {
        poolSize: layer.poolSize,
        strides : layer.strides,
        padding : layer.padding,
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
