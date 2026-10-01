// "Graphics Feature Status" de chrome://gpu. Una página web no puede leer chrome://gpu: /debug explica cada línea y
// permite pegar la sección para verla anotada. Las descripciones van solo en inglés.

/** Cuánto afecta cada línea a lo que hace N4L (entrenar y predecir con TF.js, la webcam de detección de objetos) */
export type Relevance_t = 'high' | 'medium' | 'low' | 'none'

export type GraphicsFeature_t = {
  name       : string
  /** Otros nombres con los que aparece en otras versiones de Chrome */
  aliases?   : string[]
  description: string
  relevance  : Relevance_t
}

export const GRAPHICS_FEATURES: GraphicsFeature_t[] = [
  {
    name       : 'WebGL',
    description: 'WebGL, the API used by the default TF.js backend ("webgl"). "Hardware accelerated" means it runs on the GPU. '
      + '"Software only" means SwiftShader emulates the GPU on the CPU, which makes training and prediction very slow. '
      + 'This is the most important line for N4L.',
    relevance: 'high',
  },
  {
    name       : 'WebGL2',
    aliases    : ['WebGL 2'],
    description: 'WebGL 2.0, listed separately by some Chrome versions. The TF.js webgl backend prefers WebGL 2 (float textures, '
      + 'better precision); with only WebGL 1 it still works, with limitations.',
    relevance: 'high',
  },
  {
    name       : 'WebGPU',
    description: 'WebGPU, the API used by the TF.js "webgpu" backend. "Hardware accelerated" means the browser has a GPU adapter. '
      + '"Hardware accelerated but at reduced performance" means it works with some limitation. "Disabled" or "Unavailable" means '
      + 'there is no adapter, and the N4L backend menu shows WebGPU as not available. Chrome can still hand out a software adapter '
      + '(SwiftShader, e.g. on Linux with --enable-unsafe-webgpu but without Vulkan): the WebGPU card on this page tells which one '
      + 'TF.js gets.',
    relevance: 'high',
  },
  {
    name       : 'WebGPU interop',
    description: 'Zero-copy sharing of images between WebGPU and the rest of Chrome (video frames, canvases, the compositor), e.g. '
      + 'importExternalTexture() from a <video> element. When it is disabled those images are copied through slower paths. The TF.js '
      + 'webgpu backend reads webcam frames this way, so it mainly matters for object detection with the webcam.',
    relevance: 'medium',
  },
  {
    name       : 'Vulkan',
    description: 'Whether Chrome uses Vulkan for its own rendering (Skia) and for ANGLE. It is not the same as WebGPU: on Linux, WebGPU '
      + 'reaches the GPU through Vulkan by itself (Dawn) even when this line says "Disabled". Enabling it (chrome://flags/#enable-vulkan) '
      + 'changes how Chrome draws pages and, together with chrome://flags/#use-angle, can make WebGL run on Vulkan.',
    relevance: 'medium',
  },
  {
    name       : 'OpenGL',
    description: 'Chrome\'s GPU process can use the system OpenGL driver. On Linux, ANGLE runs WebGL on top of OpenGL unless Vulkan is '
      + 'selected (chrome://flags/#use-angle). The WebGL card on this page shows which one is in use.',
    relevance: 'medium',
  },
  {
    name       : 'Canvas',
    description: 'GPU acceleration of the 2D canvas (CanvasRenderingContext2D). N4L draws images, webcam frames and detection boxes on '
      + '2D canvases, and face-api crops faces with them. In software they still work, only slower.',
    relevance: 'medium',
  },
  {
    name       : 'Compositing',
    description: 'Chrome combines the layers of the page (text, images, <video>, <canvas>) into the final picture on the GPU. In '
      + 'software, scrolling, video and animations get slower for the whole page; in N4L it shows most in the webcam view.',
    relevance: 'medium',
  },
  {
    name       : 'Rasterization',
    description: 'Painting the page content (text, shapes, images) into tiles on the GPU. "Hardware accelerated" is the normal state; in '
      + 'software the page itself is drawn more slowly, TF.js is not affected.',
    relevance: 'low',
  },
  {
    name       : 'Multiple Raster Threads',
    description: 'Chrome paints page content with several threads in parallel. "Enabled" is the normal state. It affects how fast the '
      + 'page is drawn, not TF.js.',
    relevance: 'low',
  },
  {
    name       : 'Out-of-process Rasterization',
    aliases    : ['OOP Rasterization'],
    description: 'Older Chrome versions: page content is rasterized in the GPU process instead of the renderer process. "Enabled" is the '
      + 'normal state. No direct effect on TF.js.',
    relevance: 'low',
  },
  {
    name       : 'Canvas out-of-process rasterization',
    description: 'Older Chrome versions: 2D canvas drawing is rasterized in the GPU process. No direct effect on TF.js.',
    relevance  : 'low',
  },
  {
    name       : 'Video Decode',
    description: 'Decoding compressed video (H.264, VP9, AV1…) with the GPU\'s media engine instead of the CPU. N4L does not play video '
      + 'files; webcam frames usually arrive uncompressed (or as MJPEG that Chrome decodes), so the effect is small.',
    relevance: 'low',
  },
  {
    name       : 'Video Encode',
    description: 'Encoding video with the GPU\'s media engine, used by video calls (WebRTC) and MediaRecorder. N4L never encodes video. '
      + '"Software only" is common on Linux.',
    relevance: 'none',
  },
  {
    name       : 'Hardware Protected Video Decode',
    description: 'Decoding DRM-protected video in the GPU. No effect on N4L.',
    relevance  : 'none',
  },
  {
    name       : 'WebNN',
    description: 'Web Neural Network API (navigator.ml): runs models on the operating system\'s ML stack (GPU or NPU). Experimental and '
      + 'behind flags. TF.js does not use it.',
    relevance: 'none',
  },
  {
    name       : 'Skia Graphite',
    description: 'The next-generation GPU backend of Skia, the library Chrome uses to draw pages; it runs on Dawn, the same engine as '
      + 'WebGPU. It is being rolled out platform by platform; "Disabled" means the previous backend (Ganesh) is used. No direct '
      + 'effect on TF.js.',
    relevance: 'none',
  },
  {
    name       : 'Direct Rendering Display Compositor',
    description: 'Experimental mode of Chrome\'s display compositor (Viz) that draws straight to the screen. "Disabled" is the normal '
      + 'state. No effect on N4L.',
    relevance: 'none',
  },
  {
    name       : 'Raw Draw',
    description: 'Experimental rasterization path that skips the intermediate tiles. "Disabled" is the normal state. No effect on N4L.',
    relevance  : 'none',
  },
  {
    name       : 'TreesInViz',
    description: 'Experimental change in Chrome\'s architecture that moves the compositor layer trees into the Viz (GPU/display) '
      + 'process. "Disabled" is the normal state. No effect on N4L.',
    relevance: 'none',
  },
]

export type StatusClass_t = 'hardware' | 'reduced' | 'enabled' | 'software' | 'disabled' | 'unavailable' | 'unknown'

/** Los valores que puede tener una línea, de chrome://gpu */
export const STATUS_MEANINGS: Array<{ status: string, statusClass: StatusClass_t, meaning: string }> = [
  { status: 'Hardware accelerated', statusClass: 'hardware', meaning: 'Runs on the GPU.' },
  {
    status     : 'Hardware accelerated but at reduced performance',
    statusClass: 'reduced',
    meaning    : 'Runs on the GPU, but with some limitation (a driver workaround, software compositing, a partial blocklist entry…).',
  },
  { status: 'Enabled', statusClass: 'enabled', meaning: 'The feature is on. It says nothing about GPU vs. CPU.' },
  {
    status     : 'Software only. Hardware acceleration disabled',
    statusClass: 'software',
    meaning    : 'Works, but on the CPU: the GPU path is turned off (GPU blocklist, a flag or a driver problem).',
  },
  {
    status     : 'Software only, hardware acceleration unavailable',
    statusClass: 'software',
    meaning    : 'Works, but on the CPU: there is no GPU path at all.',
  },
  {
    status     : 'Disabled',
    statusClass: 'disabled',
    meaning    : 'The feature is off: not supported, not shipped yet in this Chrome version, or turned off by a flag.',
  },
  { status: 'Unavailable', statusClass: 'unavailable', meaning: 'The feature cannot be used at all.' },
]

export function classifyStatus(status: string): StatusClass_t {
  if (/software/i.test(status)) return 'software'
  if (/reduced performance/i.test(status)) return 'reduced'
  if (/^hardware accelerated/i.test(status)) return 'hardware'
  if (/^enabled/i.test(status)) return 'enabled'
  if (/^disabled/i.test(status)) return 'disabled'
  if (/unavailable/i.test(status)) return 'unavailable'
  return 'unknown'
}

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

export function findGraphicsFeature(name: string): GraphicsFeature_t | undefined {
  const key = normalize(name)
  return GRAPHICS_FEATURES.find((feature) => [feature.name, ...(feature.aliases ?? [])].some((n) => normalize(n) === key))
}

export type ParsedFeature_t = { name: string, status: string, statusClass: StatusClass_t, feature?: GraphicsFeature_t }

/**
 * Lee la sección "Graphics Feature Status" copiada de chrome://gpu (el botón "Copy Report to Clipboard" o el texto
 * seleccionado a mano). Si se pega la página entera, se queda con esa sección; si se pegan solo las líneas, también vale.
 */
export function parseGraphicsFeatureStatus(text: string): ParsedFeature_t[] {
  const lines = text.split(/\r?\n/)
  const header = lines.findIndex((line) => /graphics feature status/i.test(line))
  const parsed: ParsedFeature_t[] = []
  for (const line of lines.slice(header + 1)) {
    // El subrayado (=====) de la sección siguiente ("Problems Detected", "Driver Bug Workarounds"…)
    if (parsed.length > 0 && /^\s*=+\s*$/.test(line)) break
    const match = /^\s*(?:[*•-]\s*)?([^:]{2,60}?):\s*(.+?)\s*$/.exec(line)
    if (match === null) continue
    const [, name, status] = match
    parsed.push({ name: name.trim(), status, statusClass: classifyStatus(status), feature: findGraphicsFeature(name) })
  }
  return parsed
}
