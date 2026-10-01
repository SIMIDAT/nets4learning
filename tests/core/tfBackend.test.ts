import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// TF.js de mentira: setBackend falla con los backends de `failing`
const { failing, setBackend } = vi.hoisted(() => {
  const failing = new Set<string>()
  return { failing, setBackend: vi.fn(async (backend: string) => !failing.has(backend)) }
})
vi.mock('@tensorflow/tfjs', () => ({ setBackend }))
vi.mock('@tensorflow/tfjs-backend-webgpu', () => ({}))
vi.mock('@tensorflow/tfjs-backend-wasm', () => ({ setWasmPaths: vi.fn() }))

const { changeUserTFBackend, detectTFBackend, getActiveTFBackend } = await import('../../src/core/tfBackend')

describe('detectTFBackend', () => {

  test('manda el backend que eligió el usuario', () => {
    expect(detectTFBackend('wasm')).toBe('wasm')
    expect(detectTFBackend('cpu')).toBe('cpu')
  })

  test('sin elección guardada, el de TF.js', () => {
    expect(detectTFBackend(null)).toBe('webgl')
  })

  test('una elección guardada que no es un backend se ignora', () => {
    expect(detectTFBackend('tensorflow')).toBe('webgl')
    expect(detectTFBackend('')).toBe('webgl')
  })
})

describe('changeUserTFBackend', () => {

  beforeEach(() => {
    failing.clear()
    setBackend.mockClear()
    localStorage.clear()
  })

  test('activa el backend y lo recuerda', async () => {
    expect(await changeUserTFBackend('cpu')).toBe(true)
    expect(setBackend).toHaveBeenLastCalledWith('cpu')
    expect(getActiveTFBackend()).toBe('cpu')
    expect(localStorage.getItem('tf-backend')).toBe('cpu')
  })

  test('si el navegador no puede usarlo, vuelve al anterior y no lo recuerda', async () => {
    await changeUserTFBackend('cpu')
    failing.add('wasm')

    expect(await changeUserTFBackend('wasm')).toBe(false)
    expect(setBackend).toHaveBeenLastCalledWith('cpu')
    expect(getActiveTFBackend()).toBe('cpu')
    expect(localStorage.getItem('tf-backend')).toBe('cpu')
  })

  test('runWithTFBackend usa otro backend solo mientras dura y no lo recuerda', async () => {
    const { runWithTFBackend } = await import('../../src/core/tfBackend')
    await changeUserTFBackend('webgl')
    setBackend.mockClear()
    expect(await runWithTFBackend('cpu', async () => 'medido')).toBe('medido')
    expect(setBackend.mock.calls).toEqual([['cpu'], ['webgl']])
    expect(getActiveTFBackend()).toBe('webgl')
    expect(localStorage.getItem('tf-backend')).toBe('webgl')
  })

  test('runWithTFBackend devuelve null si no se puede usar el backend, y vuelve aunque fn falle', async () => {
    const { runWithTFBackend } = await import('../../src/core/tfBackend')
    await changeUserTFBackend('webgl')
    failing.add('wasm')
    expect(await runWithTFBackend('wasm', async () => 'nunca')).toBeNull()
    setBackend.mockClear()
    await expect(runWithTFBackend('cpu', async () => { throw new Error('falla') })).rejects.toThrow('falla')
    expect(setBackend).toHaveBeenLastCalledWith('webgl')
    // Los cambios siguientes se siguen haciendo
    expect(await changeUserTFBackend('cpu')).toBe(true)
  })

  test('dos cambios seguidos se aplican en orden', async () => {
    await Promise.all([changeUserTFBackend('webgl'), changeUserTFBackend('cpu')])
    expect(setBackend.mock.calls.map(([backend]) => backend)).toEqual(['webgl', 'cpu'])
    expect(getActiveTFBackend()).toBe('cpu')
  })
})

describe('startupTFBackend', () => {

  beforeEach(() => {
    // Cada prueba arranca la aplicación de cero
    vi.resetModules()
    failing.clear()
    setBackend.mockClear()
    localStorage.clear()
  })

  test('sin elección guardada no hay nada que esperar ni se carga TF.js', async () => {
    const { startupTFBackend } = await import('../../src/core/tfBackend')
    expect(startupTFBackend()).toBeNull()
    expect(setBackend).not.toHaveBeenCalled()
  })

  test('activa el backend guardado una sola vez', async () => {
    localStorage.setItem('tf-backend', 'wasm')
    const { startupTFBackend, getActiveTFBackend } = await import('../../src/core/tfBackend')
    const startup = startupTFBackend()
    expect(getActiveTFBackend()).toBe('wasm')
    expect(startupTFBackend()).toBe(startup)
    await startup
    expect(setBackend.mock.calls).toEqual([['wasm']])
  })

  test('si el guardado ya no se puede usar, sigue con el de por defecto sin olvidar la elección', async () => {
    localStorage.setItem('tf-backend', 'webgpu')
    failing.add('webgpu')
    const { startupTFBackend, getActiveTFBackend } = await import('../../src/core/tfBackend')
    await startupTFBackend()
    expect(setBackend).toHaveBeenLastCalledWith('webgl')
    expect(getActiveTFBackend()).toBe('webgl')
    expect(localStorage.getItem('tf-backend')).toBe('webgpu')
  })
})

describe('WebGPU', () => {

  // requestAdapter() devuelve, por orden, cada valor de `adapters` (el último se repite)
  const setGPU = (...adapters: unknown[]) => {
    const requestAdapter = vi.fn(async () => adapters.length > 1 ? adapters.shift() : adapters[0])
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: { requestAdapter } })
    return requestAdapter
  }

  beforeEach(() => {
    // La comprobación del adaptador se hace una vez por visita: cada prueba carga el módulo de cero
    vi.resetModules()
    failing.clear()
    setBackend.mockClear()
    localStorage.clear()
  })

  afterEach(() => {
    delete (navigator as { gpu?: unknown }).gpu
  })

  test('sin adaptador no se le pasa a TF.js', async () => {
    setGPU(null)
    const { changeUserTFBackend, detectWebGPUAdapter } = await import('../../src/core/tfBackend')
    expect(await detectWebGPUAdapter()).toBeNull()
    expect(await changeUserTFBackend('webgpu')).toBe(false)
    expect(setBackend.mock.calls).toEqual([['webgl']])
  })

  test('con adaptador se activa', async () => {
    setGPU({ info: { isFallbackAdapter: false } })
    const { changeUserTFBackend, detectWebGPUAdapter, getActiveTFBackend } = await import('../../src/core/tfBackend')
    expect(await detectWebGPUAdapter()).toBe('hardware')
    expect(await changeUserTFBackend('webgpu')).toBe(true)
    expect(setBackend).toHaveBeenLastCalledWith('webgpu')
    expect(getActiveTFBackend()).toBe('webgpu')
  })

  test('pide la GPU de alto rendimiento, como TF.js, y repite si la primera petición no da adaptador', async () => {
    const requestAdapter = setGPU(null, {})
    const { detectWebGPUAdapter } = await import('../../src/core/tfBackend')
    expect(await detectWebGPUAdapter()).toBe('hardware')
    expect(requestAdapter.mock.calls).toEqual([[{ powerPreference: 'high-performance' }], [{ powerPreference: 'high-performance' }]])
  })

  test('el adaptador de SwiftShader (la GPU emulada en la CPU) se distingue, pero se puede usar', async () => {
    setGPU({ info: { isFallbackAdapter: true } })
    const { changeUserTFBackend, detectWebGPUAdapter } = await import('../../src/core/tfBackend')
    expect(await detectWebGPUAdapter()).toBe('software')
    expect(await changeUserTFBackend('webgpu')).toBe(true)
  })
})
