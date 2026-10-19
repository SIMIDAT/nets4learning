import { describe, test, expect } from 'vitest'
import {
  classifyStatus,
  findGraphicsFeature,
  GRAPHICS_FEATURES,
  parseGraphicsFeatureStatus,
} from '../../src/pages/debug/diagnostics/graphicsFeatureStatus'
import {
  buildRecommendations,
  describeWebGLRenderer,
  type Diagnostics_t,
  type WebGPUAdapterInfo_t,
} from '../../src/pages/debug/diagnostics/collectDiagnostics'
import { median } from '../../src/pages/debug/diagnostics/benchmarkBackends'

// Sección copiada de chrome://gpu (Chrome 152, Linux con NVIDIA)
const GPU_STATUS = `Graphics Feature Status
=======================
*   Canvas: Hardware accelerated
*   Direct Rendering Display Compositor: Disabled
*   Compositing: Hardware accelerated
*   Multiple Raster Threads: Enabled
*   OpenGL: Enabled
*   Rasterization: Hardware accelerated
*   Raw Draw: Disabled
*   Skia Graphite: Disabled
*   TreesInViz: Disabled
*   Video Decode: Hardware accelerated
*   Video Encode: Software only. Hardware acceleration disabled
*   Vulkan: Enabled
*   WebGL: Hardware accelerated
*   WebGPU: Hardware accelerated
*   WebGPU interop: Disabled
*   WebNN: Disabled`

describe('parseGraphicsFeatureStatus', () => {

  test('lee todas las líneas de la sección y reconoce cada una', () => {
    const parsed = parseGraphicsFeatureStatus(GPU_STATUS)
    expect(parsed).toHaveLength(16)
    expect(parsed.find((p) => p.name === 'WebGL')).toMatchObject({ status: 'Hardware accelerated', statusClass: 'hardware' })
    expect(parsed.find((p) => p.name === 'Video Encode')).toMatchObject({ statusClass: 'software' })
    // Todas las líneas que da este Chrome tienen descripción
    expect(parsed.filter((p) => p.feature === undefined)).toEqual([])
  })

  test('del informe entero se queda solo con la sección "Graphics Feature Status"', () => {
    const report = 'Graphics Feature Status\n=======================\n*   WebGL: Hardware accelerated\n*   WebGPU: Disabled\n\n'
      + 'Problems Detected\n=================\n*   Accelerated video encode has been disabled: Disabled Features: video_encode\n\n'
      + 'Version Information\nData exported: 2026-10-01T12:00:00.000Z\nChrome version: Chrome/152.0.7977.82'
    expect(parseGraphicsFeatureStatus(report).map((p) => p.name)).toEqual(['WebGL', 'WebGPU'])
  })

  test('también vale pegar solo las líneas, con o sin viñetas', () => {
    expect(parseGraphicsFeatureStatus('WebGL: Hardware accelerated\n• WebGPU: Unavailable').map((p) => [p.name, p.statusClass]))
      .toEqual([['WebGL', 'hardware'], ['WebGPU', 'unavailable']])
  })

  test('las líneas desconocidas se leen sin descripción', () => {
    expect(parseGraphicsFeatureStatus('*   Future Thing: Enabled')).toEqual([
      { name: 'Future Thing', status: 'Enabled', statusClass: 'enabled', feature: undefined },
    ])
  })
})

describe('classifyStatus y findGraphicsFeature', () => {

  test('clasifica los estados de chrome://gpu', () => {
    expect(classifyStatus('Hardware accelerated')).toBe('hardware')
    expect(classifyStatus('Hardware accelerated but at reduced performance')).toBe('reduced')
    expect(classifyStatus('Software only, hardware acceleration unavailable')).toBe('software')
    expect(classifyStatus('Software only. Hardware acceleration disabled')).toBe('software')
    expect(classifyStatus('Enabled')).toBe('enabled')
    expect(classifyStatus('Disabled')).toBe('disabled')
    expect(classifyStatus('Unavailable')).toBe('unavailable')
    expect(classifyStatus('Something new')).toBe('unknown')
  })

  test('encuentra las líneas por su nombre o por los otros nombres que tienen en otras versiones', () => {
    expect(findGraphicsFeature('webgl2')?.name).toBe('WebGL2')
    expect(findGraphicsFeature('WebGL 2')?.name).toBe('WebGL2')
    expect(findGraphicsFeature('OOP Rasterization')?.name).toBe('Out-of-process Rasterization')
    expect(findGraphicsFeature('Nope')).toBeUndefined()
  })

  test('los nombres no se repiten', () => {
    const names = GRAPHICS_FEATURES.flatMap((f) => [f.name, ...(f.aliases ?? [])].map((n) => n.toLowerCase()))
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('describeWebGLRenderer', () => {

  test('saca la API gráfica de ANGLE', () => {
    expect(describeWebGLRenderer('ANGLE (NVIDIA, Vulkan 1.4.312 (NVIDIA NVIDIA GeForce RTX 5070 (0x00002F04)), NVIDIA)'))
      .toEqual({ angleBackend: 'Vulkan', software: false })
    expect(describeWebGLRenderer('ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 5070/PCIe/SSE2, OpenGL 4.5.0 NVIDIA 580.178.04)'))
      .toEqual({ angleBackend: 'OpenGL', software: false })
    expect(describeWebGLRenderer('ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)').angleBackend).toBe('Direct3D 11')
    expect(describeWebGLRenderer('ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)').angleBackend).toBe('Metal')
  })

  test('reconoce los renderizadores por software', () => {
    expect(describeWebGLRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)'))
      .toEqual({ angleBackend: 'Vulkan', software: true })
    expect(describeWebGLRenderer('llvmpipe (LLVM 20.1.2, 256 bits)')).toEqual({ angleBackend: null, software: true })
    expect(describeWebGLRenderer('NVIDIA GeForce GTX 980, or similar')).toEqual({ angleBackend: null, software: false })
  })
})

const NVIDIA: WebGPUAdapterInfo_t = { vendor: 'nvidia', architecture: 'blackwell', device: '', description: '', fallback: false, features: [], limits: {} }
const AMD: WebGPUAdapterInfo_t = { ...NVIDIA, vendor: 'amd', architecture: 'rdna-2' }
const SWIFTSHADER: WebGPUAdapterInfo_t = { ...NVIDIA, vendor: 'google', architecture: 'swiftshader', fallback: true }

type Overrides_t = { [K in 'system' | 'webgl' | 'webgpu' | 'wasm' | 'tfjs']?: Partial<Diagnostics_t[K]> }

/** Un navegador sin problemas: WebGL en la GPU, WebGPU con la NVIDIA, WASM con hilos */
function makeDiagnostics(overrides: Overrides_t = {}): Diagnostics_t {
  const base: Diagnostics_t = {
    collectedAt: '2026-10-01T00:00:00.000Z',
    system     : {
      userAgent          : '',
      brands             : null,
      platform           : 'Linux',
      mobile             : false,
      architecture       : null,
      platformVersion    : null,
      cores              : 32,
      memoryGB           : 8,
      devicePixelRatio   : 1,
      screen             : '1920×1080',
      language           : 'es',
      secureContext      : true,
      crossOriginIsolated: true,
    },
    apis : [],
    webgl: {
      webgl1                : true,
      webgl2                : true,
      vendor                : 'WebKit',
      renderer              : 'WebKit WebGL',
      unmaskedVendor        : 'Google Inc. (NVIDIA)',
      unmaskedRenderer      : 'ANGLE (NVIDIA, Vulkan 1.4.312 (NVIDIA GeForce RTX 5070), NVIDIA)',
      version               : 'WebGL 2.0',
      shadingLanguageVersion: null,
      angleBackend          : 'Vulkan',
      software              : false,
      majorPerformanceCaveat: false,
      maxTextureSize        : 16384,
      maxRenderbufferSize   : 16384,
      floatColorBuffer      : true,
      extensions            : [],
    },
    webgpu: { api: true, highPerformance: NVIDIA, lowPower: NVIDIA, preferredCanvasFormat: 'bgra8unorm', wgslLanguageFeatures: [] },
    wasm  : { supported: true, simd: true, threads: true, sharedArrayBuffer: true, threadsUsable: true, binaryInUse: null, threadsCount: null },
    media : { decode: [], encode: [], cameras: 1, cameraPermission: 'prompt' },
    tfjs  : {
      version         : '4.22.0',
      appBackend      : 'webgl',
      savedBackend    : null,
      defaultBackend  : 'webgl',
      activeBackend   : 'webgl',
      registered      : ['webgl', 'cpu'],
      initialized     : ['webgl'],
      menuAvailability: { webgl: true, webgpu: true, wasm: true, cpu: true },
      numTensors      : 0,
      numBytes        : 0,
      numBytesInGPU   : 0,
      webgpuAdapter   : null,
      flags           : {},
    },
  }
  return {
    ...base,
    system: { ...base.system, ...overrides.system },
    webgl : { ...base.webgl, ...overrides.webgl },
    webgpu: { ...base.webgpu, ...overrides.webgpu },
    wasm  : { ...base.wasm, ...overrides.wasm },
    tfjs  : { ...base.tfjs, ...overrides.tfjs },
  }
}

const levels = (d: Diagnostics_t) => buildRecommendations(d).map((r) => r.level)
const texts = (d: Diagnostics_t) => buildRecommendations(d).map((r) => r.text).join('\n')

describe('buildRecommendations', () => {

  test('sin problemas solo hay mensajes buenos', () => {
    expect(levels(makeDiagnostics())).toEqual(['success', 'success'])
  })

  test('WebGPU con SwiftShader avisa y explica cómo usar la GPU en Linux', () => {
    const d = makeDiagnostics({ webgpu: { highPerformance: SWIFTSHADER, lowPower: SWIFTSHADER } })
    expect(levels(d)).toContain('warning')
    expect(texts(d)).toMatch(/SwiftShader/)
    expect(texts(d)).toMatch(/#enable-vulkan/)
  })

  test('navigator.gpu sin adaptador', () => {
    expect(texts(makeDiagnostics({ webgpu: { highPerformance: null, lowPower: null } }))).toMatch(/no adapter/)
  })

  test('dos GPU distintas: dice cuál usa TF.js', () => {
    expect(texts(makeDiagnostics({ webgpu: { lowPower: AMD } }))).toMatch(/two GPUs.*nvidia.*amd/s)
  })

  test('WebGL por software es grave', () => {
    const d = makeDiagnostics({ webgl: { software: true, unmaskedRenderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device), SwiftShader driver)' } })
    expect(buildRecommendations(d)[0]).toMatchObject({ level: 'danger' })
  })

  test('WASM sin aislamiento de origen cruzado corre en un hilo', () => {
    expect(texts(makeDiagnostics({ wasm: { threadsUsable: false } }))).toMatch(/single thread.*Cross-Origin-Opener-Policy/s)
  })

  test('TF.js con otro backend que el del menú, y un guardado que no se pudo usar', () => {
    const d = makeDiagnostics({ tfjs: { appBackend: 'webgl', activeBackend: 'webgpu', savedBackend: 'wasm' } })
    expect(texts(d)).toMatch(/running on "webgpu" but the backend menu says "webgl"/)
    expect(texts(d)).toMatch(/saved choice is "wasm"/)
  })

  test('sin contexto seguro no hay WebGPU ni cámara', () => {
    expect(buildRecommendations(makeDiagnostics({ system: { secureContext: false } }))[0]).toMatchObject({ level: 'danger' })
  })
})

describe('median', () => {
  test('impar, par y desordenado', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})
