// Compara los backends de TF.js con dos operaciones típicas de las redes de N4L. Cada backend se activa solo mientras
// se mide (runWithTFBackend): el elegido en el menú no cambia.
import * as tfjs from '@tensorflow/tfjs'
import { detectWebGPUAdapter, isTFBackendAvailable, runWithTFBackend, TF_BACKENDS, type TFBackend_t } from '@core/tfBackend'

export const BENCHMARK_CASES = [
  { key: 'matMul', label: 'matMul 512×512 (dense layer)' },
  { key: 'conv2d', label: 'conv2d 224×224×3 → 32, 3×3 (convolution)' },
] as const
export type BenchmarkCase_t = typeof BENCHMARK_CASES[number]['key']

export type BenchmarkTiming_t = {
  /** Primera ejecución: incluye compilar shaders o kernels y subir los datos */
  firstMs : number
  medianMs: number
  runs    : number
}

export type BenchmarkResult_t = {
  backend: TFBackend_t
  status : 'ok' | 'unavailable' | 'error'
  timings: Partial<Record<BenchmarkCase_t, BenchmarkTiming_t>>
  error? : string
}

// Cada operación se repite hasta llenar este tiempo (con un mínimo y un máximo de repeticiones)
const TIME_BUDGET_MS = 1000
const MIN_RUNS = 3
const MAX_RUNS = 30

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

async function timeOperation(operation: () => tfjs.Tensor): Promise<BenchmarkTiming_t> {
  // data() espera a que la GPU acabe: sin él solo se mediría cuánto se tarda en encargar el trabajo
  const runOnce = async () => {
    const start = performance.now()
    const result = operation()
    await result.data()
    result.dispose()
    return performance.now() - start
  }
  const firstMs = await runOnce()
  const times: number[] = []
  const start = performance.now()
  while (times.length < MIN_RUNS || (times.length < MAX_RUNS && performance.now() - start < TIME_BUDGET_MS)) {
    times.push(await runOnce())
  }
  return { firstMs, medianMs: median(times), runs: times.length }
}

async function benchmarkActiveBackend(): Promise<BenchmarkResult_t['timings']> {
  const a = tfjs.randomNormal([512, 512])
  const b = tfjs.randomNormal([512, 512])
  const image = tfjs.randomNormal<tfjs.Rank.R4>([1, 224, 224, 3])
  const filter = tfjs.randomNormal<tfjs.Rank.R4>([3, 3, 3, 32])
  try {
    return {
      matMul: await timeOperation(() => tfjs.matMul(a, b)),
      conv2d: await timeOperation(() => tfjs.conv2d(image, filter, 1, 'same')),
    }
  } finally {
    tfjs.dispose([a, b, image, filter])
  }
}

/** Mide los backends uno detrás de otro; onResult avisa de cada uno en cuanto acaba */
export async function benchmarkBackends(onResult: (result: BenchmarkResult_t) => void, backends: readonly TFBackend_t[] = TF_BACKENDS) {
  for (const backend of backends) {
    if (!isTFBackendAvailable(backend) || (backend === 'webgpu' && await detectWebGPUAdapter() === null)) {
      onResult({ backend, status: 'unavailable', timings: {} })
      continue
    }
    try {
      const timings = await runWithTFBackend(backend, benchmarkActiveBackend)
      onResult(timings === null ? { backend, status: 'unavailable', timings: {} } : { backend, status: 'ok', timings })
    } catch (error) {
      onResult({ backend, status: 'error', timings: {}, error: error instanceof Error ? error.message : String(error) })
    }
  }
}
