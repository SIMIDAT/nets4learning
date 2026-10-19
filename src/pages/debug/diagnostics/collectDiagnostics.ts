// Todo lo que /debug muestra del backend de TF.js y de la GPU del navegador. Las funciones que solo leen los datos
// (describeWebGLRenderer, buildRecommendations) son puras para poder probarlas.
import * as tfjs from '@tensorflow/tfjs'
import {
  DEFAULT_TF_BACKEND,
  getActiveTFBackend,
  isFallbackWebGPUAdapter,
  isTFBackendAvailable,
  readSavedTFBackend,
  requestWebGPUAdapter,
  TF_BACKENDS,
  type GPUAdapterLike,
  type TFBackend_t,
} from '@core/tfBackend'

// region Tipos

export type ApiCheck_t = { name: string, available: boolean, detail: string, usedBy: string }

export type WebGLInfo_t = {
  webgl1                : boolean
  webgl2                : boolean
  vendor                : string | null
  renderer              : string | null
  /** Lo que dice WEBGL_debug_renderer_info: el driver y la GPU de verdad */
  unmaskedVendor        : string | null
  unmaskedRenderer      : string | null
  version               : string | null
  shadingLanguageVersion: string | null
  /** API gráfica sobre la que ANGLE ejecuta WebGL (Vulkan, OpenGL, Direct3D 11, Metal…) */
  angleBackend          : string | null
  software              : boolean
  /** El navegador avisa de que WebGL iría mucho más lento de lo normal (failIfMajorPerformanceCaveat) */
  majorPerformanceCaveat: boolean | null
  maxTextureSize        : number | null
  maxRenderbufferSize   : number | null
  floatColorBuffer      : boolean | null
  extensions            : string[]
}

export type WebGPUAdapterInfo_t = {
  vendor      : string
  architecture: string
  device      : string
  description : string
  fallback    : boolean
  features    : string[]
  limits      : Record<string, number | null>
}

export type WebGPUInfo_t = {
  api                  : boolean
  /** El que pide TF.js */
  highPerformance      : WebGPUAdapterInfo_t | null
  lowPower             : WebGPUAdapterInfo_t | null
  preferredCanvasFormat: string | null
  wgslLanguageFeatures : string[]
}

export type WasmInfo_t = {
  supported        : boolean
  simd             : boolean
  threads          : boolean
  sharedArrayBuffer: boolean
  /** Lo que comprueba TF.js para usar hilos: SharedArrayBuffer transferible y atómicos de WebAssembly */
  threadsUsable    : boolean
  /** El .wasm de TF.js que ha descargado la página, si ya se ha usado el backend */
  binaryInUse      : string | null
  threadsCount     : number | null
}

export type CodecCheck_t = {
  codec         : string
  label         : string
  supported     : boolean | null
  /** WebCodecs con hardwareAcceleration: 'prefer-hardware' (Chrome lo trata como "solo hardware") */
  hardware      : boolean | null
  /** Media Capabilities: powerEfficient suele indicar que lo hace la GPU */
  powerEfficient: boolean | null
}

export type MediaInfo_t = {
  decode          : CodecCheck_t[]
  encode          : CodecCheck_t[]
  cameras         : number | null
  cameraPermission: string | null
}

export type SystemInfo_t = {
  userAgent          : string
  brands             : string | null
  platform           : string
  mobile             : boolean | null
  architecture       : string | null
  platformVersion    : string | null
  cores              : number | null
  memoryGB           : number | null
  devicePixelRatio   : number
  screen             : string
  language           : string
  secureContext      : boolean
  crossOriginIsolated: boolean
}

export type TFInfo_t = {
  version         : string
  /** El elegido en el menú (el que N4L intenta usar) */
  appBackend      : TFBackend_t
  /** El guardado en localStorage (null si nunca se ha elegido) */
  savedBackend    : string | null
  defaultBackend  : TFBackend_t
  /** El que usa TF.js de verdad */
  activeBackend   : string
  registered      : string[]
  initialized     : string[]
  menuAvailability: Record<TFBackend_t, boolean>
  numTensors      : number
  numBytes        : number
  numBytesInGPU   : number | null
  webgpuAdapter   : string | null
  flags           : Record<string, unknown>
}

export type Diagnostics_t = {
  collectedAt: string
  system     : SystemInfo_t
  apis       : ApiCheck_t[]
  webgl      : WebGLInfo_t
  webgpu     : WebGPUInfo_t
  wasm       : WasmInfo_t
  media      : MediaInfo_t
  tfjs       : TFInfo_t
}

// endregion

// region WebGL

/** API gráfica de ANGLE y si es un renderizador por software, a partir del renderer de WebGL */
export function describeWebGLRenderer(renderer: string): { angleBackend: string | null, software: boolean } {
  const software = /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render/i.test(renderer)
  const match = /\b(Vulkan|OpenGL ES|OpenGL|Direct3D ?11|D3D11|Direct3D ?9|D3D9|Metal)\b/i.exec(renderer)
  if (match === null) return { angleBackend: null, software }
  const name = match[1].toLowerCase().replace(/\s/g, '')
  const angleBackend = ({
    vulkan    : 'Vulkan',
    opengles  : 'OpenGL ES',
    opengl    : 'OpenGL',
    direct3d11: 'Direct3D 11',
    d3d11     : 'Direct3D 11',
    direct3d9 : 'Direct3D 9',
    d3d9      : 'Direct3D 9',
    metal     : 'Metal',
  } as Record<string, string>)[name] ?? match[1]
  return { angleBackend, software }
}

const loseContext = (gl: WebGLRenderingContext | null) => gl?.getExtension('WEBGL_lose_context')?.loseContext()

/** WebGL del navegador y la GPU que hay detrás (también en la información del dispositivo de la cámara) */
export function probeWebGL(): WebGLInfo_t {
  const getContext = (type: 'webgl' | 'webgl2', options?: WebGLContextAttributes) => {
    try {
      return document.createElement('canvas').getContext(type, options) as WebGLRenderingContext | null
    } catch {
      return null
    }
  }
  const gl2 = getContext('webgl2')
  const gl1 = getContext('webgl')
  const gl = gl2 ?? gl1
  const empty: WebGLInfo_t = {
    webgl1                : gl1 !== null,
    webgl2                : gl2 !== null,
    vendor                : null,
    renderer              : null,
    unmaskedVendor        : null,
    unmaskedRenderer      : null,
    version               : null,
    shadingLanguageVersion: null,
    angleBackend          : null,
    software              : false,
    majorPerformanceCaveat: null,
    maxTextureSize        : null,
    maxRenderbufferSize   : null,
    floatColorBuffer      : null,
    extensions            : [],
  }
  if (gl === null) return empty
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const unmaskedRenderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : null
  const renderer = String(gl.getParameter(gl.RENDERER))
  const caveatContext = getContext(gl2 ? 'webgl2' : 'webgl', { failIfMajorPerformanceCaveat: true })
  const info: WebGLInfo_t = {
    ...empty,
    vendor                : String(gl.getParameter(gl.VENDOR)),
    renderer,
    unmaskedVendor        : debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : null,
    unmaskedRenderer,
    version               : String(gl.getParameter(gl.VERSION)),
    shadingLanguageVersion: String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION)),
    ...describeWebGLRenderer(unmaskedRenderer ?? renderer),
    majorPerformanceCaveat: caveatContext === null,
    maxTextureSize        : Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
    maxRenderbufferSize   : Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)),
    floatColorBuffer      : gl2 ? gl2.getExtension('EXT_color_buffer_float') !== null : gl.getExtension('WEBGL_color_buffer_float') !== null,
    extensions            : (gl.getSupportedExtensions() ?? []).slice().sort(),
  }
  // Los navegadores limitan los contextos WebGL abiertos: se liberan en cuanto se han leído
  ;[gl1, gl2, caveatContext].forEach(loseContext)
  return info
}

// endregion

// region WebGPU

const WEBGPU_LIMITS = [
  'maxBufferSize',
  'maxStorageBufferBindingSize',
  'maxComputeWorkgroupStorageSize',
  'maxComputeInvocationsPerWorkgroup',
  'maxComputeWorkgroupSizeX',
  'maxComputeWorkgroupsPerDimension',
  'maxTextureDimension2D',
] as const

function describeAdapter(adapter: GPUAdapterLike): WebGPUAdapterInfo_t {
  return {
    vendor      : adapter.info?.vendor ?? '',
    architecture: adapter.info?.architecture ?? '',
    device      : adapter.info?.device ?? '',
    description : adapter.info?.description ?? '',
    fallback    : isFallbackWebGPUAdapter(adapter),
    features    : adapter.features ? [...adapter.features].sort() : [],
    limits      : Object.fromEntries(WEBGPU_LIMITS.map((name) => [name, adapter.limits?.[name] ?? null])),
  }
}

async function probeWebGPU(): Promise<WebGPUInfo_t> {
  const gpu = (navigator as unknown as { gpu?: { getPreferredCanvasFormat?: () => string, wgslLanguageFeatures?: Iterable<string> } }).gpu
  if (gpu === undefined) return { api: false, highPerformance: null, lowPower: null, preferredCanvasFormat: null, wgslLanguageFeatures: [] }
  // Uno detrás de otro: Chrome arranca la GPU con la primera petición
  const highPerformance = await requestWebGPUAdapter('high-performance')
  const lowPower = await requestWebGPUAdapter('low-power')
  return {
    api                  : true,
    highPerformance      : highPerformance && describeAdapter(highPerformance),
    lowPower             : lowPower && describeAdapter(lowPower),
    preferredCanvasFormat: gpu.getPreferredCanvasFormat?.() ?? null,
    wgslLanguageFeatures : gpu.wgslLanguageFeatures ? [...gpu.wgslLanguageFeatures].sort() : [],
  }
}

// endregion

// region WebAssembly

// Los mismos módulos mínimos que usa TF.js (y wasm-feature-detect) para saber si hay SIMD e hilos
const WASM_SIMD = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])
const WASM_THREADS = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11])

const validateWasm = (bytes: Uint8Array<ArrayBuffer>) => {
  try {
    return WebAssembly.validate(bytes)
  } catch {
    return false
  }
}

async function probeWasm(activeBackend: string): Promise<WasmInfo_t> {
  const supported = typeof WebAssembly === 'object'
  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined'
  let sabTransferable = false
  try {
    new MessageChannel().port1.postMessage(new SharedArrayBuffer(1))
    sabTransferable = true
  } catch {
    // Sin aislamiento de origen cruzado no hay SharedArrayBuffer
  }
  const threads = supported && validateWasm(WASM_THREADS)
  // El .wasm que descargó TF.js (en desarrollo también aparecen los módulos "?import&url" de Vite: se descartan)
  const binary = performance.getEntriesByType('resource')
    .map((entry) => new URL(entry.name, window.location.href))
    .find((url) => url.search === '' && /tfjs-backend-wasm[^/]*\.wasm$/.test(url.pathname))
    ?.pathname
  let threadsCount: number | null = null
  if (activeBackend === 'wasm') {
    const { getThreadsCount } = await import('@tensorflow/tfjs-backend-wasm')
    threadsCount = getThreadsCount()
  }
  return {
    supported,
    simd         : supported && validateWasm(WASM_SIMD),
    threads,
    sharedArrayBuffer,
    threadsUsable: sabTransferable && threads,
    binaryInUse  : binary === undefined ? null : /threaded-simd/.test(binary) ? 'threaded SIMD' : /simd/.test(binary) ? 'SIMD' : 'plain',
    threadsCount,
  }
}

// endregion

// region Vídeo y cámara

type VideoCodecApi_t = { isConfigSupported(config: object): Promise<{ supported?: boolean }> }
type MediaCapabilitiesApi_t = {
  decodingInfo(config: object): Promise<{ supported: boolean, powerEfficient: boolean }>
  encodingInfo(config: object): Promise<{ supported: boolean, powerEfficient: boolean }>
}

const DECODE_CODECS = [
  { label: 'H.264', codec: 'avc1.64001f', contentType: 'video/mp4; codecs="avc1.64001f"' },
  { label: 'VP9', codec: 'vp09.00.10.08', contentType: 'video/webm; codecs="vp09.00.10.08"' },
  { label: 'AV1', codec: 'av01.0.04M.08', contentType: 'video/mp4; codecs="av01.0.04M.08"' },
  { label: 'HEVC (H.265)', codec: 'hvc1.1.6.L93.B0', contentType: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
]
// Chrome solo responde a encodingInfo() con type 'webrtc' (y tipos MIME de WebRTC)
const ENCODE_CODECS = [
  { label: 'H.264', codec: 'avc1.42001f', contentType: 'video/H264' },
  { label: 'VP8', codec: 'vp8', contentType: 'video/VP8' },
  { label: 'VP9', codec: 'vp09.00.10.08', contentType: 'video/VP9' },
  { label: 'AV1', codec: 'av01.0.04M.08', contentType: 'video/AV1' },
]
const VIDEO = { width: 1280, height: 720, bitrate: 2_000_000, framerate: 30 }

const isSupported = async (api: VideoCodecApi_t | undefined, config: object) => {
  if (api === undefined) return null
  try {
    return (await api.isConfigSupported(config)).supported === true
  } catch {
    return false
  }
}

async function probeMedia(): Promise<MediaInfo_t> {
  const { VideoDecoder, VideoEncoder } = window as unknown as { VideoDecoder?: VideoCodecApi_t, VideoEncoder?: VideoCodecApi_t }
  const mediaCapabilities = (navigator as unknown as { mediaCapabilities?: MediaCapabilitiesApi_t }).mediaCapabilities
  const powerEfficient = async (kind: 'decodingInfo' | 'encodingInfo', contentType: string) => {
    if (mediaCapabilities === undefined) return null
    try {
      const type = kind === 'decodingInfo' ? 'file' : 'webrtc'
      const result = await mediaCapabilities[kind]({ type, video: { contentType, ...VIDEO } })
      return result.supported ? result.powerEfficient : false
    } catch {
      return null
    }
  }
  const decode = await Promise.all(DECODE_CODECS.map(async ({ label, codec, contentType }) => ({
    label,
    codec,
    supported     : await isSupported(VideoDecoder, { codec }),
    hardware      : await isSupported(VideoDecoder, { codec, hardwareAcceleration: 'prefer-hardware' }),
    powerEfficient: await powerEfficient('decodingInfo', contentType),
  })))
  const encode = await Promise.all(ENCODE_CODECS.map(async ({ label, codec, contentType }) => ({
    label,
    codec,
    supported     : await isSupported(VideoEncoder, { codec, ...VIDEO }),
    hardware      : await isSupported(VideoEncoder, { codec, ...VIDEO, hardwareAcceleration: 'prefer-hardware' }),
    powerEfficient: await powerEfficient('encodingInfo', contentType),
  })))
  let cameras: number | null = null
  try {
    // Sin permiso los dispositivos vienen sin nombre, pero se pueden contar
    cameras = (await navigator.mediaDevices?.enumerateDevices())?.filter((device) => device.kind === 'videoinput').length ?? null
  } catch {
    cameras = null
  }
  let cameraPermission: string | null = null
  try {
    cameraPermission = (await navigator.permissions?.query({ name: 'camera' as PermissionName }))?.state ?? null
  } catch {
    cameraPermission = null
  }
  return { decode, encode, cameras, cameraPermission }
}

// endregion

// region Sistema y APIs

type UserAgentData_t = {
  brands               : Array<{ brand: string, version: string }>
  mobile               : boolean
  platform             : string
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string, bitness?: string, platformVersion?: string }>
}

/** Navegador, sistema y pantalla (también en la información del dispositivo de la cámara) */
export async function probeSystem(): Promise<SystemInfo_t> {
  const nav = navigator as Navigator & { userAgentData?: UserAgentData_t, deviceMemory?: number }
  const uaData = nav.userAgentData
  let highEntropy: Awaited<ReturnType<NonNullable<UserAgentData_t['getHighEntropyValues']>>> | null = null
  try {
    highEntropy = await uaData?.getHighEntropyValues?.(['architecture', 'bitness', 'platformVersion']) ?? null
  } catch {
    highEntropy = null
  }
  return {
    userAgent          : navigator.userAgent,
    brands             : uaData ? uaData.brands.filter(({ brand }) => !/not.a.brand/i.test(brand)).map(({ brand, version }) => `${brand} ${version}`).join(', ') : null,
    platform           : uaData?.platform || navigator.platform,
    mobile             : uaData?.mobile ?? null,
    architecture       : highEntropy?.architecture ? `${highEntropy.architecture}${highEntropy.bitness ? ` (${highEntropy.bitness}-bit)` : ''}` : null,
    platformVersion    : highEntropy?.platformVersion || null,
    cores              : navigator.hardwareConcurrency || null,
    memoryGB           : nav.deviceMemory ?? null,
    devicePixelRatio   : window.devicePixelRatio,
    screen             : `${window.screen.width}×${window.screen.height}`,
    language           : navigator.language,
    secureContext      : window.isSecureContext,
    crossOriginIsolated: window.crossOriginIsolated === true,
  }
}

function probeApis(webgl: WebGLInfo_t, wasm: WasmInfo_t): ApiCheck_t[] {
  const has = (value: unknown) => value !== undefined && value !== null
  const nav = navigator as unknown as { gpu?: unknown, ml?: unknown }
  return [
    { name: 'WebGL 2', available: webgl.webgl2, detail: webgl.webgl2 ? 'getContext("webgl2")' : 'no WebGL 2 context', usedBy: 'TF.js webgl backend (preferred)' },
    { name: 'WebGL 1', available: webgl.webgl1, detail: webgl.webgl1 ? 'getContext("webgl")' : 'no WebGL context', usedBy: 'TF.js webgl backend (fallback)' },
    { name: 'WebGPU', available: has(nav.gpu), detail: has(nav.gpu) ? 'navigator.gpu' : 'no navigator.gpu', usedBy: 'TF.js webgpu backend' },
    { name: 'WebAssembly', available: wasm.supported, detail: 'WebAssembly', usedBy: 'TF.js wasm backend' },
    { name: 'WebAssembly SIMD', available: wasm.simd, detail: '128-bit SIMD instructions', usedBy: 'TF.js wasm backend (much faster)' },
    {
      name     : 'WebAssembly threads',
      available: wasm.threadsUsable,
      detail   : wasm.threadsUsable ? 'SharedArrayBuffer + atomics' : wasm.threads ? 'atomics yes, SharedArrayBuffer no (page not cross-origin isolated)' : 'no atomics',
      usedBy   : 'TF.js wasm backend (multi-threaded)',
    },
    { name: 'Cross-origin isolation', available: window.crossOriginIsolated === true, detail: 'COOP + COEP headers', usedBy: 'SharedArrayBuffer (WASM threads)' },
    { name: 'Secure context', available: window.isSecureContext, detail: 'HTTPS or localhost', usedBy: 'WebGPU, camera' },
    { name: 'OffscreenCanvas', available: typeof OffscreenCanvas !== 'undefined', detail: 'OffscreenCanvas', usedBy: 'TF.js (WebGPU reads, image processing)' },
    { name: 'Web Workers', available: typeof Worker !== 'undefined', detail: 'Worker', usedBy: 'WASM threads' },
    { name: 'WebCodecs', available: typeof (window as unknown as { VideoDecoder?: unknown }).VideoDecoder !== 'undefined', detail: 'VideoDecoder / VideoEncoder', usedBy: 'Video checks below (not used by N4L)' },
    { name: 'Camera', available: has(navigator.mediaDevices?.getUserMedia), detail: 'navigator.mediaDevices.getUserMedia', usedBy: 'Object detection (webcam)' },
    { name: 'WebNN', available: has(nav.ml), detail: has(nav.ml) ? 'navigator.ml' : 'no navigator.ml', usedBy: 'Not used by TF.js' },
  ]
}

// endregion

// region TensorFlow.js

async function probeTF(): Promise<TFInfo_t> {
  await tfjs.ready()
  const engine = tfjs.engine()
  const memory = tfjs.memory() as tfjs.MemoryInfo & { numBytesInGPU?: number }
  const activeBackend = tfjs.getBackend()
  const adapterInfo = activeBackend === 'webgpu'
    ? (tfjs.backend() as unknown as { adapterInfo?: { vendor?: string, architecture?: string } }).adapterInfo
    : undefined
  const menuAvailability = Object.fromEntries(TF_BACKENDS.map((backend) => [backend, isTFBackendAvailable(backend)])) as Record<TFBackend_t, boolean>
  return {
    version       : tfjs.version.tfjs,
    appBackend    : getActiveTFBackend(),
    savedBackend  : readSavedTFBackend(),
    defaultBackend: DEFAULT_TF_BACKEND,
    activeBackend,
    registered    : engine.backendNames(),
    initialized   : Object.keys(engine.registry),
    menuAvailability,
    numTensors    : memory.numTensors,
    numBytes      : memory.numBytes,
    numBytesInGPU : memory.numBytesInGPU ?? null,
    webgpuAdapter : adapterInfo ? [adapterInfo.vendor, adapterInfo.architecture].filter(Boolean).join(' / ') || null : null,
    flags         : { ...tfjs.env().getFlags() },
  }
}

// endregion

export async function collectDiagnostics(): Promise<Diagnostics_t> {
  const tfInfo = await probeTF()
  const webgl = probeWebGL()
  const [system, webgpu, wasm, media] = await Promise.all([probeSystem(), probeWebGPU(), probeWasm(tfInfo.activeBackend), probeMedia()])
  return {
    collectedAt: new Date().toISOString(),
    system,
    apis       : probeApis(webgl, wasm),
    webgl,
    webgpu,
    wasm,
    media,
    tfjs       : tfInfo,
  }
}

// region Recomendaciones

export type Recommendation_t = { level: 'success' | 'info' | 'warning' | 'danger', text: string }

const adapterName = (adapter: WebGPUAdapterInfo_t) => [adapter.vendor, adapter.architecture, adapter.description].filter(Boolean).join(' / ') || 'unknown'

/** Lo que conviene revisar, a partir de lo recogido (en inglés, como el resto de la sección) */
export function buildRecommendations(d: Diagnostics_t): Recommendation_t[] {
  const result: Recommendation_t[] = []
  const { tfjs: tf, webgl, webgpu, wasm } = d

  if (!d.system.secureContext) {
    result.push({ level: 'danger', text: 'The page is not in a secure context (HTTPS or localhost): WebGPU and the camera are not available.' })
  }
  if (tf.activeBackend !== tf.appBackend) {
    result.push({
      level: 'warning',
      text : `TF.js is running on "${tf.activeBackend}" but the backend menu says "${tf.appBackend}". The selected backend could not be `
        + 'activated (N4L fell back to the default) or a library switched it.',
    })
  }
  if (tf.savedBackend !== null && tf.savedBackend !== tf.appBackend) {
    result.push({ level: 'info', text: `The saved choice is "${tf.savedBackend}" but this visit uses "${tf.appBackend}": the browser could not use the saved one.` })
  }

  if (!webgl.webgl1 && !webgl.webgl2) {
    result.push({ level: 'danger', text: 'WebGL is not available: the default backend cannot use the GPU. Check that hardware acceleration is enabled in the browser settings.' })
  } else if (webgl.software) {
    result.push({
      level: 'danger',
      text : `WebGL runs in software (${webgl.unmaskedRenderer ?? webgl.renderer}): the webgl backend will be very slow. In chrome://gpu `
        + '"WebGL" should say "Hardware accelerated"; enable "Use graphics acceleration when available" in the browser settings and '
        + 'update the GPU drivers.',
    })
  } else if (webgl.majorPerformanceCaveat) {
    result.push({ level: 'warning', text: 'The browser reports a major performance caveat for WebGL (blocklisted GPU or driver): it may be much slower than usual.' })
  } else {
    result.push({ level: 'success', text: `WebGL runs on the GPU: ${webgl.unmaskedRenderer ?? webgl.renderer}${webgl.angleBackend ? ` (ANGLE on ${webgl.angleBackend})` : ''}.` })
  }

  if (!webgpu.api) {
    result.push({ level: 'info', text: 'This browser has no WebGPU API (navigator.gpu): the webgpu backend is not available.' })
  } else if (webgpu.highPerformance === null) {
    result.push({
      level: 'info',
      text : 'navigator.gpu exists but there is no adapter: WebGPU is disabled for this GPU or driver. On Linux with Chrome it needs '
        + 'chrome://flags/#enable-unsafe-webgpu and Vulkan (chrome://flags/#enable-vulkan, Vulkan drivers installed).',
    })
  } else if (webgpu.highPerformance.fallback) {
    result.push({
      level: 'warning',
      text : 'The WebGPU adapter is a software fallback (SwiftShader): the GPU is emulated on the CPU and the webgpu backend will be '
        + 'extremely slow. On Linux, enable chrome://flags/#enable-vulkan (and #use-angle → Vulkan) so WebGPU can use the real GPU.',
    })
  } else {
    result.push({ level: 'success', text: `WebGPU uses a hardware adapter: ${adapterName(webgpu.highPerformance)}.` })
  }
  if (webgpu.highPerformance && webgpu.lowPower && webgpu.highPerformance.vendor !== webgpu.lowPower.vendor) {
    result.push({
      level: 'info',
      text : `There are two GPUs: TF.js asks for the high-performance one (${adapterName(webgpu.highPerformance)}); the low-power one is `
        + `${adapterName(webgpu.lowPower)}.`,
    })
  }

  if (!wasm.supported) {
    result.push({ level: 'warning', text: 'WebAssembly is not available: the wasm backend cannot be used.' })
  } else {
    if (!wasm.simd) result.push({ level: 'warning', text: 'WebAssembly SIMD is not supported: the wasm backend will use its slowest build.' })
    if (!wasm.threadsUsable) {
      result.push({
        level: 'info',
        text : 'The wasm backend runs on a single thread because the page is not cross-origin isolated (it needs the headers '
          + '"Cross-Origin-Opener-Policy: same-origin" and "Cross-Origin-Embedder-Policy: require-corp" or "credentialless"). '
          + 'Multi-threaded WASM is usually several times faster on multi-core CPUs.',
      })
    }
  }
  if (tf.activeBackend === 'cpu') {
    result.push({ level: 'warning', text: 'The cpu backend is plain JavaScript, the slowest of all. Use it only to compare.' })
  }
  return result
}

// endregion
