import { describe, test, expect, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { trackDownloads, useDownloadProgress } from '@core/downloadProgress'

/** Una respuesta que llega en trozos, con o sin content-length */
function chunkedResponse(chunks: number[], contentLength?: number) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const size of chunks) controller.enqueue(new Uint8Array(size))
      controller.close()
    },
  })
  const headers = contentLength === undefined ? undefined : { 'content-length': String(contentLength) }
  return new Response(body, { headers })
}

const wait = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)))

describe('downloadProgress', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('cuenta los bytes que llegan mientras dura la carga y después fetch vuelve a ser el de siempre', async () => {
    const original = vi.fn(async () => chunkedResponse([300, 300, 400], 1000))
    vi.stubGlobal('fetch', original)
    const { result } = renderHook(() => useDownloadProgress())
    expect(result.current).toBeNull()

    await trackDownloads(async () => {
      expect(window.fetch).not.toBe(original)
      const response = await window.fetch('/modelo/pesos.bin')
      // La respuesta sigue siendo la misma: estado, cabeceras y todo el contenido
      expect(response.ok).toBe(true)
      expect(response.headers.get('content-length')).toBe('1000')
      expect((await response.arrayBuffer()).byteLength).toBe(1000)
      await wait(150)
      expect(result.current).toEqual({ loaded: 1000, total: 1000 })
    })

    expect(window.fetch).toBe(original)
    expect(result.current).toBeNull()
  })

  test('sin content-length el total no se sabe; comprimido, llega más de lo anunciado y el total crece', async () => {
    const responses = [chunkedResponse([500]), chunkedResponse([800, 700], 1000)]
    vi.stubGlobal('fetch', vi.fn(async () => responses.shift()!))
    const { result } = renderHook(() => useDownloadProgress())

    await trackDownloads(async () => {
      await (await window.fetch('/model.json')).arrayBuffer()
      await wait(150)
      expect(result.current).toEqual({ loaded: 500, total: null })
    })
    await trackDownloads(async () => {
      await (await window.fetch('/pesos.bin')).arrayBuffer()
      await wait(150)
      expect(result.current).toEqual({ loaded: 1500, total: 1500 })
    })
  })

  test('si la carga falla, fetch también vuelve a ser el de siempre', async () => {
    const original = vi.fn(async () => chunkedResponse([10], 10))
    vi.stubGlobal('fetch', original)
    await expect(trackDownloads(async () => {
      throw new Error('sin red')
    })).rejects.toThrow('sin red')
    expect(window.fetch).toBe(original)
  })
})
