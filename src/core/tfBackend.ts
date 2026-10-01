// Backend de TensorFlow.js con el que se entrena y se predice, elegido desde el menú (N4LNavbar).
//
// @tensorflow/tfjs solo trae 'webgl' y 'cpu'; 'webgpu' y 'wasm' se cargan cuando se eligen. TF.js se importa
// aquí con import() para que la carga inicial no lo descargue: las páginas que lo usan van en chunks aparte.

import wasmPath from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm.wasm?url'
import wasmSimdPath from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-simd.wasm?url'
import wasmThreadedSimdPath from '@tensorflow/tfjs-backend-wasm/dist/tfjs-backend-wasm-threaded-simd.wasm?url'

export const TF_BACKENDS = ['webgl', 'webgpu', 'wasm', 'cpu'] as const
export type TFBackend_t = typeof TF_BACKENDS[number]

/** El que usa TF.js si no se le dice nada: el de más prioridad de los que trae @tensorflow/tfjs */
export const DEFAULT_TF_BACKEND: TFBackend_t = 'webgl'

const TF_BACKEND_STORAGE_KEY = 'tf-backend'

export const isTFBackend = (value: string): value is TFBackend_t => (TF_BACKENDS as readonly string[]).includes(value)

/** Backend con el que arranca la aplicación: el que eligió el usuario (si está guardado), si no el de TF.js */
export function detectTFBackend(saved: string | null): TFBackend_t {
  if (saved !== null && isTFBackend(saved)) return saved
  return DEFAULT_TF_BACKEND
}

// localStorage puede no estar disponible (modo privado, almacenamiento bloqueado…): entonces no se recuerda
export function readSavedTFBackend(): string | null {
  try {
    return localStorage.getItem(TF_BACKEND_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Si el navegador tiene la API que pide el backend. Con WebGPU no basta: ver detectWebGPUAdapter().
 */
export function isTFBackendAvailable(backend: TFBackend_t): boolean {
  switch (backend) {
    case 'webgpu': return typeof navigator !== 'undefined' && 'gpu' in navigator
    case 'wasm'  : return typeof WebAssembly === 'object'
    default      : return true
  }
}

// lib.dom de TypeScript aún no trae los tipos de WebGPU, y los de @webgpu/types (que llegan con
// @tensorflow/tfjs-backend-webgpu) son de una versión sin GPUAdapter.info: lo justo que se usa aquí y en /debug
export type GPUAdapterLike = {
  info?             : { vendor?: string, architecture?: string, device?: string, description?: string, isFallbackAdapter?: boolean }
  isFallbackAdapter?: boolean
  features?         : Iterable<string>
  limits?           : Record<string, number | undefined>
}
type NavigatorWithGPU = {
  gpu?: { requestAdapter(options?: { powerPreference?: GPUPowerPreference_t }): Promise<GPUAdapterLike | null> }
}
export type GPUPowerPreference_t = 'high-performance' | 'low-power'

/**
 * Pide un adaptador WebGPU (null si no hay o el navegador no tiene WebGPU). TF.js lo pide de alto rendimiento.
 * Chrome con Vulkan devuelve null en la primera petición mientras arranca la GPU: se repite una vez.
 */
export async function requestWebGPUAdapter(powerPreference: GPUPowerPreference_t = 'high-performance'): Promise<GPUAdapterLike | null> {
  try {
    const gpu = (navigator as unknown as NavigatorWithGPU).gpu
    if (gpu === undefined) return null
    return await gpu.requestAdapter({ powerPreference }) ?? await gpu.requestAdapter({ powerPreference })
  } catch {
    return null
  }
}

/** Si el adaptador es SwiftShader (la GPU emulada en la CPU) */
export const isFallbackWebGPUAdapter = (adapter: GPUAdapterLike) => adapter.info?.isFallbackAdapter ?? adapter.isFallbackAdapter ?? false

/**
 * El adaptador WebGPU que tendría TF.js: 'hardware' (una GPU), 'software' (SwiftShader: la GPU emulada en la CPU,
 * funciona pero muy lento) o null si no hay ninguno.
 * - Chrome da SwiftShader con --enable-unsafe-webgpu cuando no puede usar la GPU (p. ej. en Linux sin Vulkan).
 * - navigator.gpu puede existir y no dar adaptador (GPU o driver en la lista de bloqueo, WebGPU sin activar…). TF.js
 *   no lo comprueba antes de usarlo, y al activarlo avisa en la consola de un TypeError ("Cannot read properties of
 *   null (reading 'features')").
 */
export type WebGPUAdapter_t = 'hardware' | 'software' | null

let webgpuAdapterCheck: Promise<WebGPUAdapter_t> | undefined

/**
 * Se pregunta una sola vez por visita (Chrome avisa en la consola, "No available adapters.", cada vez que no hay
 * adaptador) y como lo hace TF.js, pidiendo la GPU de alto rendimiento.
 */
export function detectWebGPUAdapter(): Promise<WebGPUAdapter_t> {
  webgpuAdapterCheck ??= requestWebGPUAdapter('high-performance').then((adapter) => {
    if (adapter === null) return null
    return isFallbackWebGPUAdapter(adapter) ? 'software' : 'hardware'
  })
  return webgpuAdapterCheck
}

// Backend activo, para el menú (useSyncExternalStore)
let activeBackend: TFBackend_t = DEFAULT_TF_BACKEND
const listeners = new Set<() => void>()

export const getActiveTFBackend = () => activeBackend

export function subscribeActiveTFBackend(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function setActiveBackend(backend: TFBackend_t) {
  activeBackend = backend
  listeners.forEach((listener) => listener())
}

// setWasmPaths() solo se puede llamar antes de que el backend se inicialice por primera vez
let wasmPathsSet = false

async function loadWasmBackend() {
  const { setWasmPaths } = await import('@tensorflow/tfjs-backend-wasm')
  if (wasmPathsSet) return
  // Vite copia los .wasm a los assets de la build; TF.js descarga el que admita el navegador (con hilos solo
  // si la página tiene aislamiento de origen cruzado)
  setWasmPaths({
    'tfjs-backend-wasm.wasm'              : wasmPath,
    'tfjs-backend-wasm-simd.wasm'         : wasmSimdPath,
    'tfjs-backend-wasm-threaded-simd.wasm': wasmThreadedSimdPath,
  })
  wasmPathsSet = true
}

/** Carga el backend si hace falta y lo activa. Devuelve false si el navegador no puede usarlo */
async function activateTFBackend(backend: TFBackend_t): Promise<boolean> {
  try {
    if (backend === 'webgpu' && await detectWebGPUAdapter() === null) return false
    const tfjs = await import('@tensorflow/tfjs')
    if (backend === 'webgpu') await import('@tensorflow/tfjs-backend-webgpu')
    if (backend === 'wasm') await loadWasmBackend()
    // Lanza una excepción si el backend no está registrado (WebGPU solo se registra si existe navigator.gpu)
    return await tfjs.setBackend(backend)
  } catch (error) {
    console.error(`TensorFlow.js: no se ha podido activar el backend '${backend}'`, error)
    return false
  }
}

// Los cambios van de uno en uno: si se eligen dos backends seguidos, el segundo espera a que acabe el primero
let pendingChange: Promise<unknown> = Promise.resolve()

/**
 * Cambia el backend porque lo ha elegido el usuario y lo recuerda para las siguientes visitas. Los tensores y
 * los modelos que ya existen siguen valiendo: TF.js pasa sus datos al nuevo backend cuando se usan.
 * Si el navegador no puede usar el nuevo, sigue con el anterior y devuelve false.
 */
export function changeUserTFBackend(backend: TFBackend_t): Promise<boolean> {
  const change = pendingChange.then(async () => {
    const previous = activeBackend
    if (!await activateTFBackend(backend)) {
      await activateTFBackend(previous)
      return false
    }
    try {
      localStorage.setItem(TF_BACKEND_STORAGE_KEY, backend)
    } catch {
      // Sin almacenamiento: el backend solo dura esta visita
    }
    setActiveBackend(backend)
    return true
  })
  pendingChange = change
  return change
}

/**
 * Vuelve a activar el backend elegido. Hace falta después de cargar una librería que registra otro backend con
 * más prioridad: @tensorflow-models/pose-detection importa @tensorflow/tfjs-backend-webgpu, y sin esto TF.js
 * pasaría a WebGPU en la siguiente operación aunque se haya elegido otro.
 */
export function restoreTFBackend(): Promise<boolean> {
  const restore = pendingChange.then(() => activateTFBackend(activeBackend))
  pendingChange = restore
  return restore
}

/**
 * Ejecuta fn con otro backend sin cambiar el elegido ni recordarlo (para comparar backends en /debug) y al acabar
 * vuelve al elegido. Devuelve null si el navegador no puede usar ese backend.
 */
export function runWithTFBackend<T>(backend: TFBackend_t, fn: () => Promise<T>): Promise<T | null> {
  const run = pendingChange.then(async () => {
    try {
      if (!await activateTFBackend(backend)) return null
      return await fn()
    } finally {
      await activateTFBackend(activeBackend)
    }
  })
  // Si fn falla, los cambios que vengan detrás tienen que seguir haciéndose
  pendingChange = run.catch(() => undefined)
  return run
}

let startup: Promise<void> | null | undefined

/**
 * Activa al arrancar el backend que eligió el usuario. Se hace una sola vez: las siguientes llamadas devuelven la
 * misma promesa, que App espera antes de montar las páginas. Con el de por defecto no hay nada que hacer y devuelve
 * null: TF.js ya lo usa, y así no se descarga TF.js hasta que una página lo necesite.
 */
export function startupTFBackend(): Promise<void> | null {
  if (startup !== undefined) return startup
  const backend = detectTFBackend(readSavedTFBackend())
  if (backend === DEFAULT_TF_BACKEND) {
    startup = null
    return startup
  }
  setActiveBackend(backend)
  startup = (async () => {
    if (await activateTFBackend(backend)) return
    // El navegador ya no puede usarlo (p. ej. WebGPU desactivado): esta visita sigue con el de por defecto
    setActiveBackend(DEFAULT_TF_BACKEND)
    await activateTFBackend(DEFAULT_TF_BACKEND)
  })()
  // Un cambio desde el menú mientras arranca espera a que termine
  pendingChange = startup
  return startup
}
