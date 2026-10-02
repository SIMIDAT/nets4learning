import * as tfjs from '@tensorflow/tfjs'

/** Lo que usa del backend WebGL de TF.js para compilar en paralelo (no está en los tipos públicos) */
type ParallelCompileBackend_t = {
  checkCompileCompletionAsync: () => Promise<unknown>
  getUniformLocations        : () => void
}

type Compiled_t = tfjs.Tensor | tfjs.Tensor[] | undefined | void

/**
 * Compila los shaders de WebGL de lo que hace `run` sin ejecutarlo (`ENGINE_COMPILE_ONLY`) y espera a que los programas
 * estén listos. Si el navegador tiene `KHR_parallel_shader_compile`, la espera es asíncrona y el hilo principal sigue
 * libre. `run` tiene que lanzar sus operaciones en su parte síncrona (si devuelve una promesa, antes del primer
 * `await`) y no leer datos de los tensores: en este modo no los tienen. Si algo falla, se deja todo como estaba: las
 * operaciones compilarán la primera vez que se usen.
 */
export async function compileShaders(run: () => Compiled_t | Promise<Compiled_t>): Promise<void> {
  if (tfjs.getBackend() !== 'webgl') return
  const backend = tfjs.backend() as unknown as Partial<ParallelCompileBackend_t>
  if (typeof backend.checkCompileCompletionAsync !== 'function' || typeof backend.getUniformLocations !== 'function') return
  let output: Compiled_t | Promise<Compiled_t>
  tfjs.env().set('ENGINE_COMPILE_ONLY', true)
  try {
    output = run()
  } catch (error) {
    console.warn('Shader warm-up skipped:', error)
    return
  } finally {
    tfjs.env().set('ENGINE_COMPILE_ONLY', false)
  }
  let tensors: tfjs.Tensor[] = []
  try {
    const result = await output
    tensors = result === undefined ? [] : Array.isArray(result) ? result : [result]
    await backend.checkCompileCompletionAsync()
    backend.getUniformLocations()
  } catch (error) {
    console.warn('Shader warm-up skipped:', error)
  } finally {
    tfjs.dispose(tensors)
  }
}

/**
 * Compila los shaders de WebGL de un modelo antes de su primera predicción. Sin esto, la primera predicción compila
 * cada programa y TF.js espera a que termine (`getShaderParameter`), bloqueando el hilo principal cientos de ms justo
 * cuando el usuario pulsa.
 *
 * Hay que esperar a que termine antes de usar el modelo: hasta `getUniformLocations()` los programas no están listos.
 */
export async function warmUpModel(model: tfjs.LayersModel): Promise<void> {
  const shape = model.inputs[0]?.shape
  if (!shape) return
  const input = tfjs.zeros([1, ...shape.slice(1).map((size) => size ?? 1)])
  try {
    await compileShaders(() => model.predict(input))
  } finally {
    input.dispose()
  }
}
