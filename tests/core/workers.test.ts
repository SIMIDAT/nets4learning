import { describe, test, expect, vi, afterEach } from 'vitest'
import { createWorkerClient } from '@core/workers/workerClient'
import { exposeWorker, type WorkerScope_t } from '@core/workers/exposeWorker'
import { transferablesOf, type WorkerApi_t, type WorkerTaskContext_t } from '@core/workers/workerProtocol'

/**
 * Worker de mentira: lo que el cliente le manda llega a `exposeWorker` (como dentro de un worker de verdad) en otra
 * vuelta del bucle de eventos, y sus respuestas vuelven al cliente
 */
function fakeWorkerOf(api: WorkerApi_t, transfers: Transferable[][] = []) {
  return class FakeWorker extends EventTarget {
    private listener: ((event: MessageEvent) => void) | null = null
    terminated = false
    constructor() {
      super()
      const scope: WorkerScope_t = {
        postMessage     : (message, transfer) => { transfers.push(transfer); setTimeout(() => this.dispatchEvent(new MessageEvent('message', { data: message }))) },
        addEventListener: (_type, listener) => { this.listener = listener },
      }
      exposeWorker(api, scope)
    }
    postMessage(message: unknown) { setTimeout(() => this.listener?.(new MessageEvent('message', { data: message }))) }
    terminate() { this.terminated = true }
  }
}

describe('workers', () => {

  afterEach(() => vi.unstubAllGlobals())

  test('cada petición recibe su respuesta, aunque terminen en otro orden', async () => {
    const api = {
      slow: async (n: number) => { await new Promise((r) => setTimeout(r, 20)); return n * 2 },
      fast: (text: string) => text.toUpperCase(),
    }
    vi.stubGlobal('Worker', fakeWorkerOf(api))
    const client = createWorkerClient<typeof api>(() => new Worker('x'))
    const [slow, fast] = await Promise.all([client.call('slow', 21), client.call('fast', 'hola')])
    expect(slow).toBe(42)
    expect(fast).toBe('HOLA')
  })

  test('los errores del worker llegan a quien llama', async () => {
    const api = { fail: () => { throw new Error('mal') } }
    vi.stubGlobal('Worker', fakeWorkerOf(api))
    const client = createWorkerClient<typeof api>(() => new Worker('x'))
    await expect(client.call('fail', undefined as never)).rejects.toThrow('mal')
    await expect((client as ReturnType<typeof createWorkerClient<WorkerApi_t>>).call('nope', undefined as never)).rejects.toThrow('Unknown worker request: nope')
  })

  test('los buffers del resultado se transfieren en vez de copiarse', async () => {
    const transfers: Transferable[][] = []
    const api = { pixels: (n: number) => new Float32Array(n) }
    vi.stubGlobal('Worker', fakeWorkerOf(api, transfers))
    const client = createWorkerClient<typeof api>(() => new Worker('x'))
    const pixels = await client.call('pixels', 8)
    expect(pixels).toHaveLength(8)
    expect(transfers[0]).toEqual([pixels.buffer])
    const buffer = new ArrayBuffer(4)
    expect(transferablesOf({ a: new Uint8Array(buffer), b: 'x', c: buffer })).toEqual([buffer])
  })

  test('una tarea larga manda progreso antes de su resultado y para cuando se le pide', async () => {
    const api = {
      count: async (limit: number, { progress, cancelled }: WorkerTaskContext_t) => {
        let i = 0
        for (; i < limit && !cancelled(); i++) {
          progress({ step: i })
          await new Promise((r) => setTimeout(r, 5))
        }
        return i
      },
    }
    vi.stubGlobal('Worker', fakeWorkerOf(api))
    const client = createWorkerClient<typeof api>(() => new Worker('x'))
    const steps: unknown[] = []
    expect(await client.call('count', 3, { onProgress: (data) => steps.push(data) })).toBe(3)
    expect(steps).toEqual([{ step: 0 }, { step: 1 }, { step: 2 }])

    const controller = new AbortController()
    const call = client.call('count', 1000, { signal: controller.signal, onProgress: () => controller.abort() })
    const done = await call
    expect(done).toBeLessThan(1000)
  })

  test('los buffers anidados (pesos de un modelo) también se transfieren', () => {
    const weights = new ArrayBuffer(8)
    const shards = [new ArrayBuffer(4), new ArrayBuffer(4)]
    expect(transferablesOf({ artifacts: { weightData: weights, modelTopology: { a: 1 } } })).toEqual([weights])
    expect(transferablesOf({ artifacts: { weightData: shards } })).toEqual(shards)
    // Un array largo de números no se recorre
    expect(transferablesOf({ values: Array.from({ length: 1000 }, () => 1) })).toEqual([])
  })

  test('al pararlo, lo pendiente falla', async () => {
    const api = { wait: () => new Promise(() => undefined) }
    vi.stubGlobal('Worker', fakeWorkerOf(api))
    const client = createWorkerClient<typeof api>(() => new Worker('x'))
    const call = client.call('wait', undefined as never)
    client.terminate()
    await expect(call).rejects.toThrow('Worker terminated')
  })

  test('sin workers (jsdom) usa el camino del mismo hilo, o falla si no lo hay', async () => {
    vi.stubGlobal('Worker', undefined)
    const api = { double: (n: number) => n * 2 }
    const create = vi.fn()
    expect(await createWorkerClient<typeof api>(create, api).call('double', 4)).toBe(8)
    await expect(createWorkerClient<typeof api>(create).call('double', 4)).rejects.toThrow('Web Workers are not available')
    expect(create).not.toHaveBeenCalled()
  })
})
