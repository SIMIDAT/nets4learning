// Sección de /debug con el backend de TF.js y lo que el navegador ofrece de GPU, WebAssembly y vídeo.
// Solo en inglés (como el resto de /debug): es una página para desarrollo y para diagnosticar problemas.
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Accordion, Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { getActiveTFBackend, subscribeActiveTFBackend } from '@core/tfBackend'
import {
  buildRecommendations,
  collectDiagnostics,
  type CodecCheck_t,
  type Diagnostics_t,
  type WebGPUAdapterInfo_t,
} from './diagnostics/collectDiagnostics'
import { BENCHMARK_CASES, benchmarkBackends, type BenchmarkResult_t } from './diagnostics/benchmarkBackends'
import {
  findGraphicsFeature,
  GRAPHICS_FEATURES,
  parseGraphicsFeatureStatus,
  STATUS_MEANINGS,
  type Relevance_t,
  type StatusClass_t,
} from './diagnostics/graphicsFeatureStatus'

// region Utilidades de presentación

const GPU_STATUS_STORAGE_KEY = 'n4l-debug-gpu-status'

function readStoredGpuStatus() {
  try {
    return localStorage.getItem(GPU_STATUS_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function storeGpuStatus(text: string) {
  try {
    if (text === '') localStorage.removeItem(GPU_STATUS_STORAGE_KEY)
    else localStorage.setItem(GPU_STATUS_STORAGE_KEY, text)
  } catch {
    // Sin almacenamiento: el texto pegado solo dura esta visita
  }
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return 'n/a'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

const formatMs = (ms: number | undefined) => ms === undefined ? '—' : ms < 10 ? `${ms.toFixed(2)} ms` : `${ms.toFixed(1)} ms`

function YesNo({ value, yes = 'Yes', no = 'No' }: { value: boolean | null | undefined, yes?: string, no?: string }) {
  if (value === null || value === undefined) return <Badge bg={'light'} text={'dark'}>n/a</Badge>
  return <Badge bg={value ? 'success' : 'secondary'}>{value ? yes : no}</Badge>
}

function KeyValueTable({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <Table size={'sm'} className={'mb-0'}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope={'row'} className={'fw-normal text-body-secondary w-50'}>{label}</th>
            <td className={'text-break'}>{value}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function InfoCard({ title, children }: { title: string, children: ReactNode }) {
  return (
    <Col>
      <Card className={'h-100'}>
        <Card.Header><h5 className={'mb-0'}>{title}</h5></Card.Header>
        <Card.Body>{children}</Card.Body>
      </Card>
    </Col>
  )
}

const STATUS_VARIANT: Record<StatusClass_t, string> = {
  hardware   : 'success',
  enabled    : 'success',
  reduced    : 'warning',
  software   : 'danger',
  unavailable: 'danger',
  disabled   : 'secondary',
  unknown    : 'light',
}

const RELEVANCE_VARIANT: Record<Relevance_t, string> = { high: 'primary', medium: 'info', low: 'secondary', none: 'light' }

function RelevanceBadge({ relevance }: { relevance: Relevance_t | undefined }) {
  if (relevance === undefined) return <Badge bg={'light'} text={'dark'}>?</Badge>
  return <Badge bg={RELEVANCE_VARIANT[relevance]} text={relevance === 'none' || relevance === 'medium' ? 'dark' : undefined}>{relevance}</Badge>
}

/** Fila resaltada cuando el estado es un problema para N4L (según lo que importa cada línea) */
function rowVariant(statusClass: StatusClass_t, relevance: Relevance_t | undefined) {
  const bad = statusClass === 'software' || statusClass === 'unavailable' || statusClass === 'disabled'
  if (relevance === 'high' && bad) return 'table-danger'
  if (relevance === 'high' && statusClass === 'reduced') return 'table-warning'
  if (relevance === 'medium' && (statusClass === 'software' || statusClass === 'unavailable')) return 'table-warning'
  return undefined
}

const adapterLabel = (adapter: WebGPUAdapterInfo_t) => [adapter.vendor, adapter.architecture, adapter.description].filter(Boolean).join(' / ') || 'unknown'

const hardwareCodecs = (codecs: CodecCheck_t[]) => {
  const names = codecs.filter((codec) => codec.hardware).map((codec) => codec.label)
  return names.length > 0 ? `WebCodecs hardware: ${names.join(', ')}` : 'WebCodecs reports no hardware codec'
}

/** Texto de las descripciones con las flags (--…) y las páginas chrome:// en <code> */
function Description({ text }: { text: string }) {
  return <>{text.split(/(chrome:\/\/[\w/#-]+|--[\w-]+)/).map((part, i) => i % 2 === 1 ? <code key={i}>{part}</code> : part)}</>
}

/** Lo que esta página puede comprobar por su cuenta de cada línea de chrome://gpu */
function detectedFor(name: string, d: Diagnostics_t | null): string | null {
  if (d === null) return null
  const renderer = d.webgl.unmaskedRenderer ?? d.webgl.renderer ?? 'unknown renderer'
  const adapter = d.webgpu.highPerformance
  switch (findGraphicsFeature(name)?.name) {
    case 'WebGL':
      if (!d.webgl.webgl1 && !d.webgl.webgl2) return 'Not available'
      return `${d.webgl.software ? 'Software' : 'GPU'}: ${renderer}`
    case 'WebGL2':
      return d.webgl.webgl2 ? 'Available' : 'Not available'
    case 'WebGPU':
      if (!d.webgpu.api) return 'No navigator.gpu'
      if (adapter === null) return 'navigator.gpu, but no adapter'
      return `${adapter.fallback ? 'Software adapter' : 'GPU adapter'}: ${adapterLabel(adapter)}`
    case 'Vulkan':
    case 'OpenGL':
      return d.webgl.angleBackend ? `WebGL runs on ${d.webgl.angleBackend}` : null
    case 'Video Decode':
      return hardwareCodecs(d.media.decode)
    case 'Video Encode':
      return hardwareCodecs(d.media.encode)
    case 'WebNN':
      return d.apis.find((api) => api.name === 'WebNN')?.available ? 'navigator.ml available' : 'No navigator.ml'
    default:
      return null
  }
}

// endregion

// region Tarjetas

function TFCard({ d }: { d: Diagnostics_t }) {
  const tf = d.tfjs
  const flags = Object.entries(tf.flags).sort(([a], [b]) => a.localeCompare(b))
  return (
    <InfoCard title={'TensorFlow.js'}>
      <KeyValueTable rows={[
        ['Version', tf.version],
        ['Selected in the menu', <code key={'app'}>{tf.appBackend}</code>],
        ['Saved choice', tf.savedBackend === null ? <span className={'text-body-secondary'}>none (default: {tf.defaultBackend})</span> : <code>{tf.savedBackend}</code>],
        ['Running in TF.js', <Badge key={'active'} bg={tf.activeBackend === tf.appBackend ? 'success' : 'warning'}>{tf.activeBackend}</Badge>],
        ['Registered backends', tf.registered.map((name) => (
          <Badge key={name} bg={tf.initialized.includes(name) ? 'primary' : 'secondary'} className={'me-1'} title={tf.initialized.includes(name) ? 'initialized' : 'registered'}>{name}</Badge>
        ))],
        ['Tensors in memory', tf.numTensors],
        ['Tensor memory', formatBytes(tf.numBytes)],
        ['GPU memory (webgl)', formatBytes(tf.numBytesInGPU)],
        ...(tf.webgpuAdapter ? [['WebGPU adapter in use', tf.webgpuAdapter] as [string, ReactNode]] : []),
      ]} />
      <p className={'small text-body-secondary mt-2 mb-2'}>
        Blue backends are initialized; grey ones are only registered. WebGPU and WebAssembly are registered when they are first
        selected (and WebGPU also when the pose models are loaded).
      </p>
      <Accordion>
        <Accordion.Item eventKey={'flags'}>
          <Accordion.Header>TF.js flags ({flags.length} evaluated)</Accordion.Header>
          <Accordion.Body className={'p-0'}>
            <KeyValueTable rows={flags.map(([name, value]) => [name, <code key={name}>{JSON.stringify(value)}</code>])} />
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </InfoCard>
  )
}

function ApisCard({ d }: { d: Diagnostics_t }) {
  return (
    <InfoCard title={'Browser APIs'}>
      <Table size={'sm'} className={'mb-0'}>
        <thead>
          <tr><th>API</th><th>Available</th><th>Used by</th></tr>
        </thead>
        <tbody>
          {d.apis.map((api) => (
            <tr key={api.name}>
              <td title={api.detail}>{api.name}<div className={'small text-body-secondary'}>{api.detail}</div></td>
              <td><YesNo value={api.available} /></td>
              <td className={'small'}>{api.usedBy}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </InfoCard>
  )
}

function WebGLCard({ d }: { d: Diagnostics_t }) {
  const gl = d.webgl
  return (
    <InfoCard title={'WebGL'}>
      <KeyValueTable rows={[
        ['WebGL 2 / WebGL 1', <><YesNo value={gl.webgl2} /> <YesNo value={gl.webgl1} /></>],
        ['GPU (unmasked renderer)', gl.unmaskedRenderer ?? 'n/a'],
        ['GPU vendor (unmasked)', gl.unmaskedVendor ?? 'n/a'],
        ['Renderer / vendor (masked)', [gl.renderer, gl.vendor].filter(Boolean).join(' / ') || 'n/a'],
        ['ANGLE runs on', gl.angleBackend ?? 'n/a'],
        ['Software renderer', <YesNo key={'sw'} value={gl.webgl1 || gl.webgl2 ? gl.software : null} yes={'Yes (slow)'} />],
        ['Major performance caveat', <YesNo key={'caveat'} value={gl.majorPerformanceCaveat} yes={'Yes (slow)'} />],
        ['Version', gl.version ?? 'n/a'],
        ['GLSL version', gl.shadingLanguageVersion ?? 'n/a'],
        ['Max texture size', gl.maxTextureSize ?? 'n/a'],
        ['Max renderbuffer size', gl.maxRenderbufferSize ?? 'n/a'],
        ['Float color buffer', <YesNo key={'float'} value={gl.floatColorBuffer} />],
      ]} />
      <p className={'small text-body-secondary mt-2 mb-2'}>
        "Major performance caveat" is what the browser answers to <code>failIfMajorPerformanceCaveat</code>: yes when WebGL would run
        in software or on a blocklisted GPU.
      </p>
      <Accordion>
        <Accordion.Item eventKey={'extensions'}>
          <Accordion.Header>Extensions ({gl.extensions.length})</Accordion.Header>
          <Accordion.Body className={'small'}>{gl.extensions.join(', ') || 'none'}</Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </InfoCard>
  )
}

function WebGPUCard({ d }: { d: Diagnostics_t }) {
  const { highPerformance, lowPower } = d.webgpu
  const adapters: Array<[string, WebGPUAdapterInfo_t | null]> = [['High-performance (used by TF.js)', highPerformance], ['Low-power', lowPower]]
  const limitNames = Object.keys(highPerformance?.limits ?? lowPower?.limits ?? {})
  const type = (adapter: WebGPUAdapterInfo_t | null) => adapter === null
    ? <Badge bg={'secondary'}>No adapter</Badge>
    : <Badge bg={adapter.fallback ? 'warning' : 'success'}>{adapter.fallback ? 'Software (SwiftShader)' : 'Hardware'}</Badge>
  return (
    <InfoCard title={'WebGPU'}>
      {!d.webgpu.api && <p className={'mb-0'}>This browser has no <code>navigator.gpu</code>.</p>}
      {d.webgpu.api && <>
        <Table size={'sm'} className={'mb-2'}>
          <thead>
            <tr><th></th>{adapters.map(([label]) => <th key={label}>{label}</th>)}</tr>
          </thead>
          <tbody>
            <tr><th scope={'row'} className={'fw-normal text-body-secondary'}>Type</th>{adapters.map(([label, adapter]) => <td key={label}>{type(adapter)}</td>)}</tr>
            {(['vendor', 'architecture', 'device', 'description'] as const).map((field) => (
              <tr key={field}>
                <th scope={'row'} className={'fw-normal text-body-secondary'}>{field}</th>
                {adapters.map(([label, adapter]) => <td key={label} className={'text-break'}>{adapter?.[field] || '—'}</td>)}
              </tr>
            ))}
            {limitNames.map((limit) => (
              <tr key={limit}>
                <th scope={'row'} className={'fw-normal text-body-secondary small'}>{limit}</th>
                {adapters.map(([label, adapter]) => <td key={label} className={'small'}>{adapter?.limits[limit]?.toLocaleString('en') ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </Table>
        <KeyValueTable rows={[
          ['Preferred canvas format', d.webgpu.preferredCanvasFormat ?? 'n/a'],
        ]} />
        <p className={'small text-body-secondary mt-2 mb-2'}>
          TF.js asks for the high-performance adapter. A software adapter (SwiftShader) emulates the GPU on the CPU: it works, but the
          webgpu backend becomes extremely slow. Chrome may return no adapter on the very first request while the GPU process starts;
          this page (like N4L) asks twice.
        </p>
        <Accordion>
          <Accordion.Item eventKey={'features'}>
            <Accordion.Header>Adapter features ({highPerformance?.features.length ?? 0})</Accordion.Header>
            <Accordion.Body className={'small'}>{highPerformance?.features.join(', ') || 'none'}</Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey={'wgsl'}>
            <Accordion.Header>WGSL language features ({d.webgpu.wgslLanguageFeatures.length})</Accordion.Header>
            <Accordion.Body className={'small'}>{d.webgpu.wgslLanguageFeatures.join(', ') || 'none'}</Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </>}
    </InfoCard>
  )
}

function WasmCard({ d }: { d: Diagnostics_t }) {
  const wasm = d.wasm
  return (
    <InfoCard title={'WebAssembly'}>
      <KeyValueTable rows={[
        ['WebAssembly', <YesNo key={'wasm'} value={wasm.supported} />],
        ['SIMD', <YesNo key={'simd'} value={wasm.simd} />],
        ['Threads (atomics)', <YesNo key={'threads'} value={wasm.threads} />],
        ['SharedArrayBuffer', <YesNo key={'sab'} value={wasm.sharedArrayBuffer} />],
        ['Cross-origin isolated', <YesNo key={'coi'} value={d.system.crossOriginIsolated} />],
        ['Multi-threaded TF.js', <YesNo key={'mt'} value={wasm.threadsUsable} />],
        ['TF.js binary downloaded', wasm.binaryInUse ?? <span className={'text-body-secondary'}>none yet (select WebAssembly in the menu)</span>],
        ['TF.js threads', wasm.threadsCount ?? <span className={'text-body-secondary'}>n/a (wasm is not the active backend)</span>],
      ]} />
      <p className={'small text-body-secondary mt-2 mb-0'}>
        TF.js downloads the fastest build the browser can run: <em>threaded SIMD</em> needs cross-origin isolation (the
        headers <code>Cross-Origin-Opener-Policy: same-origin</code> and <code>Cross-Origin-Embedder-Policy</code>), otherwise
        it uses <em>SIMD</em> on a single thread, and <em>plain</em> without SIMD.
      </p>
    </InfoCard>
  )
}

function CodecTable({ title, codecs }: { title: string, codecs: CodecCheck_t[] }) {
  return (
    <Table size={'sm'} className={'mb-3'}>
      <thead>
        <tr><th>{title}</th><th>Supported</th><th>Hardware</th><th>Power efficient</th></tr>
      </thead>
      <tbody>
        {codecs.map((codec) => (
          <tr key={codec.codec}>
            <td title={codec.codec}>{codec.label}</td>
            <td><YesNo value={codec.supported} /></td>
            <td><YesNo value={codec.hardware} /></td>
            <td><YesNo value={codec.powerEfficient} /></td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function MediaCard({ d }: { d: Diagnostics_t }) {
  return (
    <InfoCard title={'Video and camera'}>
      <CodecTable title={'Decode'} codecs={d.media.decode} />
      <CodecTable title={'Encode'} codecs={d.media.encode} />
      <KeyValueTable rows={[
        ['Cameras', d.media.cameras ?? 'n/a'],
        ['Camera permission', d.media.cameraPermission ?? 'n/a'],
      ]} />
      <p className={'small text-body-secondary mt-2 mb-0'}>
        "Hardware" asks WebCodecs for <code>hardwareAcceleration: &apos;prefer-hardware&apos;</code> (Chrome answers yes only when a
        hardware codec exists); "Power efficient" comes from the Media Capabilities API. They match the "Video Decode" and "Video
        Encode" lines of chrome://gpu. Without camera permission the browser may report fewer cameras than there are.
      </p>
    </InfoCard>
  )
}

function SystemCard({ d }: { d: Diagnostics_t }) {
  const s = d.system
  return (
    <InfoCard title={'System'}>
      <KeyValueTable rows={[
        ['Browser', s.brands ?? 'n/a'],
        ['Platform', [s.platform, s.platformVersion].filter(Boolean).join(' ')],
        ['Architecture', s.architecture ?? 'n/a'],
        ['Mobile', <YesNo key={'mobile'} value={s.mobile} />],
        ['CPU threads', s.cores ?? 'n/a'],
        ['Device memory', s.memoryGB === null ? 'n/a' : `≥ ${s.memoryGB} GB (rounded by the browser)`],
        ['Screen / pixel ratio', `${s.screen} @ ${s.devicePixelRatio}x`],
        ['Language', s.language],
        ['Secure context', <YesNo key={'secure'} value={s.secureContext} />],
        ['User agent', <span key={'ua'} className={'small'}>{s.userAgent}</span>],
      ]} />
    </InfoCard>
  )
}

function BenchmarkCard({ onDone }: { onDone: () => void }) {
  const [results, setResults] = useState<BenchmarkResult_t[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const handleClick_Run = async () => {
    setResults([])
    setIsRunning(true)
    try {
      await benchmarkBackends((result) => setResults((previous) => [...previous, result]))
    } finally {
      setIsRunning(false)
      onDone()
    }
  }

  const fastest = Object.fromEntries(BENCHMARK_CASES.map(({ key }) => {
    const medians = results.map((result) => result.timings[key]?.medianMs).filter((ms): ms is number => ms !== undefined)
    return [key, medians.length > 1 ? Math.min(...medians) : undefined]
  }))

  return (
    <Card className={'mt-3'}>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h5 className={'mb-0'}>Backend benchmark</h5>
        <Button size={'sm'} onClick={handleClick_Run} disabled={isRunning}>
          {isRunning && <Spinner size={'sm'} className={'me-2'} />}
          {isRunning ? 'Running…' : 'Run benchmark'}
        </Button>
      </Card.Header>
      <Card.Body>
        <p className={'small text-body-secondary'}>
          Runs two typical operations on every backend this browser can use, one backend after another, and then goes back to the one
          selected in the menu. Times include reading the result back (<code>data()</code>). The first run also compiles shaders or
          kernels; the median comes from repeating the operation for about a second. CPU and software adapters can take a while.
        </p>
        <Table size={'sm'} responsive className={'mb-0'}>
          <thead>
            <tr>
              <th>Backend</th>
              {BENCHMARK_CASES.map(({ key, label }) => <th key={key}>{label}<div className={'small fw-normal'}>first / median (runs)</div></th>)}
            </tr>
          </thead>
          <tbody>
            {results.length === 0 && (
              <tr><td colSpan={BENCHMARK_CASES.length + 1} className={'text-body-secondary'}>{isRunning ? 'Measuring…' : 'Not run yet.'}</td></tr>
            )}
            {results.map((result) => (
              <tr key={result.backend}>
                <td><code>{result.backend}</code></td>
                {result.status !== 'ok' && (
                  <td colSpan={BENCHMARK_CASES.length} className={'text-body-secondary'}>
                    {result.status === 'unavailable' ? 'Not available in this browser' : `Error: ${result.error}`}
                  </td>
                )}
                {result.status === 'ok' && BENCHMARK_CASES.map(({ key }) => {
                  const timing = result.timings[key]
                  return (
                    <td key={key} className={timing && timing.medianMs === fastest[key] ? 'table-success' : undefined}>
                      {formatMs(timing?.firstMs)} / <strong>{formatMs(timing?.medianMs)}</strong> ({timing?.runs ?? 0})
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  )
}

function GraphicsFeatureStatusCard({ d }: { d: Diagnostics_t | null }) {
  const [pasted, setPasted] = useState(readStoredGpuStatus)
  const parsed = parseGraphicsFeatureStatus(pasted)

  const handleChange_Pasted = (text: string) => {
    setPasted(text)
    storeGpuStatus(text)
  }

  const referenceTable = (
    <Table size={'sm'} responsive className={'mb-0'}>
      <thead>
        <tr><th>Feature</th><th>Relevance</th><th>What it means</th><th>Detected by this page</th></tr>
      </thead>
      <tbody>
        {GRAPHICS_FEATURES.map((feature) => (
          <tr key={feature.name}>
            <td className={'text-nowrap'}>{feature.name}</td>
            <td><RelevanceBadge relevance={feature.relevance} /></td>
            <td className={'small'}><Description text={feature.description} /></td>
            <td className={'small'}>{detectedFor(feature.name, d) ?? <span className={'text-body-secondary'}>not detectable from a web page</span>}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )

  return (
    <Card className={'mt-3'}>
      <Card.Header><h5 className={'mb-0'}>Graphics Feature Status (chrome://gpu)</h5></Card.Header>
      <Card.Body>
        <p>
          A web page cannot read <code>chrome://gpu</code>. Type it in the address bar (Chrome, Edge, Brave, Opera…), click
          &quot;Copy Report to Clipboard&quot; (or select the &quot;Graphics Feature Status&quot; section) and paste it here to see
          what each line means for N4L.
        </p>
        <Form.Group className={'mb-3'} controlId={'debug-gpu-status'}>
          <Form.Label className={'small text-body-secondary'}>chrome://gpu report or its &quot;Graphics Feature Status&quot; section</Form.Label>
          <Form.Control as={'textarea'} rows={6} value={pasted} onChange={(e) => handleChange_Pasted(e.target.value)}
            placeholder={'Graphics Feature Status\n=======================\n*   Canvas: Hardware accelerated\n*   WebGL: Hardware accelerated\n…'}
            className={'font-monospace small'} />
        </Form.Group>
        {pasted !== '' && <Button size={'sm'} variant={'outline-secondary'} className={'mb-3'} onClick={() => handleChange_Pasted('')}>Clear</Button>}

        {parsed.length > 0 && (
          <Table size={'sm'} responsive className={'mb-4'}>
            <thead>
              <tr><th>Feature</th><th>Status</th><th>Relevance</th><th>What it means</th><th>Detected by this page</th></tr>
            </thead>
            <tbody>
              {parsed.map(({ name, status, statusClass, feature }) => (
                <tr key={name} className={rowVariant(statusClass, feature?.relevance)}>
                  <td className={'text-nowrap'}>{name}</td>
                  <td><Badge bg={STATUS_VARIANT[statusClass]} text={statusClass === 'unknown' ? 'dark' : undefined} className={'text-wrap text-start'}>{status}</Badge></td>
                  <td><RelevanceBadge relevance={feature?.relevance} /></td>
                  <td className={'small'}>{feature ? <Description text={feature.description} /> : <span className={'text-body-secondary'}>No description for this feature yet.</span>}</td>
                  <td className={'small'}>{detectedFor(name, d) ?? <span className={'text-body-secondary'}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {pasted !== '' && parsed.length === 0 && <Alert variant={'warning'}>No &quot;Feature: status&quot; lines found in the pasted text.</Alert>}

        <h6>Status values</h6>
        <Table size={'sm'} className={'mb-4'}>
          <tbody>
            {STATUS_MEANINGS.map(({ status, statusClass, meaning }) => (
              <tr key={status}>
                <td className={'w-25'}><Badge bg={STATUS_VARIANT[statusClass]} className={'text-wrap text-start'}>{status}</Badge></td>
                <td className={'small'}>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className={'small text-body-secondary'}>
          Relevance is how much each line matters for N4L (training and predicting with TF.js, the webcam in object detection). Rows
          are highlighted when a relevant feature is not running on the GPU.
        </p>

        {parsed.length > 0
          ? (
            <Accordion>
              <Accordion.Item eventKey={'reference'}>
                <Accordion.Header>All known features</Accordion.Header>
                <Accordion.Body className={'p-0'}>{referenceTable}</Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )
          : <><h6>All known features</h6>{referenceTable}</>}
      </Card.Body>
    </Card>
  )
}

// endregion

export default function BackendDiagnostics() {
  const appBackend = useSyncExternalStore(subscribeActiveTFBackend, getActiveTFBackend)
  const [diagnostics, setDiagnostics] = useState<Diagnostics_t | null>(null)
  const [isCollecting, setIsCollecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // Cada vez que cambia se vuelve a leer todo (botón "Refresh" y al acabar el benchmark)
  const [refreshCount, setRefreshCount] = useState(0)

  // También al cambiar de backend en el menú
  useEffect(() => {
    let isCancelled = false
    collectDiagnostics()
      .then((collected) => {
        if (isCancelled) return
        setDiagnostics(collected)
        setError(null)
      })
      .catch((e: unknown) => {
        console.error(e)
        if (!isCancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!isCancelled) setIsCollecting(false)
      })
    return () => { isCancelled = true }
  }, [appBackend, refreshCount])

  const handleClick_Refresh = () => {
    setIsCollecting(true)
    setRefreshCount((count) => count + 1)
  }

  const handleClick_Copy = async () => {
    if (diagnostics === null) return
    const report = {
      diagnostics,
      recommendations      : buildRecommendations(diagnostics),
      graphicsFeatureStatus: parseGraphicsFeatureStatus(readStoredGpuStatus()).map(({ name, status }) => ({ name, status })),
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const recommendations = diagnostics ? buildRecommendations(diagnostics) : []

  return (
    <section className={'mt-4'} aria-labelledby={'backend-diagnostics-title'}>
      <div className={'d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'}>
        <h3 id={'backend-diagnostics-title'} className={'mb-0'}>TensorFlow.js backend and graphics</h3>
        <div>
          <Button size={'sm'} variant={'outline-primary'} className={'me-2'} onClick={handleClick_Refresh} disabled={isCollecting}>
            {isCollecting && <Spinner size={'sm'} className={'me-2'} />}
            Refresh
          </Button>
          <Button size={'sm'} variant={'outline-secondary'} onClick={handleClick_Copy} disabled={diagnostics === null}>
            {copied ? 'Copied' : 'Copy report (JSON)'}
          </Button>
        </div>
      </div>
      <p className={'text-body-secondary'}>
        Which backend TF.js is using, what this browser offers (WebGL, WebGPU, WebAssembly, video) and what to check when a backend
        is slow. The backend is chosen in the &quot;Backend&quot; menu of the navigation bar.
      </p>

      {error !== null && <Alert variant={'danger'}>Could not collect the diagnostics: {error}</Alert>}
      {diagnostics === null && error === null && <div className={'mb-3'}><Spinner size={'sm'} className={'me-2'} />Collecting…</div>}

      {diagnostics !== null && <>
        <Card className={'mb-3'}>
          <Card.Header><h5 className={'mb-0'}>Diagnosis</h5></Card.Header>
          <Card.Body className={'pb-1'}>
            {recommendations.map((recommendation) => (
              <Alert key={recommendation.text} variant={recommendation.level} className={'py-2'}>{recommendation.text}</Alert>
            ))}
          </Card.Body>
        </Card>

        <Row xs={1} lg={2} className={'g-3'}>
          <TFCard d={diagnostics} />
          <ApisCard d={diagnostics} />
          <WebGLCard d={diagnostics} />
          <WebGPUCard d={diagnostics} />
          <WasmCard d={diagnostics} />
          <MediaCard d={diagnostics} />
          <SystemCard d={diagnostics} />
        </Row>

        <BenchmarkCard onDone={handleClick_Refresh} />
      </>}

      <GraphicsFeatureStatusCard d={diagnostics} />
      <p className={'small text-body-secondary mt-2'}>Collected at {diagnostics?.collectedAt ?? '—'}.</p>
    </section>
  )
}
