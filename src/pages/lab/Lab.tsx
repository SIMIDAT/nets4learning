import './Lab.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, ButtonGroup, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { ArrowCounterclockwise, PauseFill, PlayFill, SkipEndFill } from 'react-bootstrap-icons'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { trackEvent } from '@core/analytics'
import {
  boundaryGrid, createLabNetwork, evaluate, LAB_DATASETS, LAB_FEATURES, makeDataset, seededRandom, splitDataset, trainEpoch,
  type LabConfig_t, type LabDataset_t, type LabFeature_t, type LabPoint_t,
} from '@core/learning/lab'
import type { StepNetwork_t } from '@core/nn-utils/stepByStep'

const prefix = 'pages.lab.'

const ACTIVATIONS = ['tanh', 'relu', 'sigmoid', 'linear'] as const
const LEARNING_RATES = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3]
const BATCH_SIZES = [1, 5, 10, 25]
const COUNTS = [60, 100, 200, 400]
const MAX_LAYERS = 4
const MAX_UNITS = 8
/** Sin pasar de unos milisegundos en cada fotograma (la página no se traba) */
const FRAME_BUDGET_MS = 8
/** Las épocas de cada fotograma (unos 60 por segundo): despacio se ve cómo se forma la frontera */
const SPEEDS = { slow: 1, normal: 4, fast: Infinity } as const
type Speed_t = keyof typeof SPEEDS
/** Se para sola tras tantas épocas */
const MAX_EPOCHS = 3000
/** Cada cuánto se refrescan las cifras de la página mientras entrena */
const STATS_EVERY_MS = 120
const GRID = 40

/** Los colores de cada clase: naranja (0) y azul (1); los puntos, además, con forma distinta (círculo y cuadrado) */
const COLORS = ['245, 158, 11', '37, 99, 235'] as const

type Data_t = { dataset: LabDataset_t, noise: number, count: number, seed: number }
type Stats_t = { epoch: number, trainLoss: number, testLoss: number, trainAccuracy: number, testAccuracy: number }
type Experiment_t = { id: string, data: Partial<Data_t>, config: Partial<LabConfig_t> }

const DEFAULT_DATA: Data_t = { dataset: 'circles', noise: 0.1, count: 200, seed: 1 }
const EMPTY_STATS: Stats_t = { epoch: 0, trainLoss: NaN, testLoss: NaN, trainAccuracy: 0, testAccuracy: 0 }
const DEFAULT_CONFIG: LabConfig_t = { features: ['x', 'y'], hidden: [4, 4], activation: 'tanh', learningRate: 0.1, batchSize: 10 }

/** «Prueba esto»: cada uno enseña una idea (tests/core/lab.test.ts comprueba que pasa lo que dicen) */
const EXPERIMENTS: Experiment_t[] = [
  { id: 'xor-line', data: { dataset: 'xor', noise: 0.1, count: 200 }, config: { features: ['x', 'y'], hidden: [], activation: 'tanh', learningRate: 0.1, batchSize: 10 } },
  { id: 'xor-hidden', data: { dataset: 'xor', noise: 0.1, count: 200 }, config: { features: ['x', 'y'], hidden: [4], activation: 'tanh', learningRate: 0.1, batchSize: 10 } },
  { id: 'circles-features', data: { dataset: 'circles', noise: 0.1, count: 200 }, config: { features: ['x2', 'y2'], hidden: [], activation: 'tanh', learningRate: 0.1, batchSize: 10 } },
  { id: 'spiral', data: { dataset: 'spiral', noise: 0.1, count: 400 }, config: { features: ['x', 'y', 'x2', 'y2', 'xy'], hidden: [8, 8], activation: 'tanh', learningRate: 0.1, batchSize: 10 } },
  { id: 'learning-rate', data: { dataset: 'xor', noise: 0.1, count: 200 }, config: { features: ['x', 'y'], hidden: [4], activation: 'tanh', learningRate: 3, batchSize: 10 } },
  { id: 'overfitting', data: { dataset: 'circles', noise: 0.45, count: 60 }, config: { features: ['x', 'y'], hidden: [8, 8, 8], activation: 'relu', learningRate: 0.1, batchSize: 10 } },
]

/** El plano: el color de cada zona es la clase que predice la red (más intenso, más segura) y encima, los puntos */
function drawLab(canvas: HTMLCanvasElement, grid: Float32Array, train: LabPoint_t[], test: LabPoint_t[], showTest: boolean) {
  const ctx = canvas.getContext('2d')
  if (ctx === null) return
  const size = canvas.width
  const cell = size / GRID
  const styles = getComputedStyle(canvas)
  ctx.fillStyle = styles.getPropertyValue('--bs-body-bg').trim() || '#ffffff'
  ctx.fillRect(0, 0, size, size)
  for (let row = 0; row < GRID; row++) {
    for (let column = 0; column < GRID; column++) {
      const p = grid[row * GRID + column]
      const confidence = Math.abs(p - 0.5) * 2
      ctx.fillStyle = `rgba(${COLORS[p >= 0.5 ? 1 : 0]}, ${0.12 + 0.5 * confidence})`
      ctx.fillRect(Math.floor(column * cell), Math.floor(row * cell), Math.ceil(cell), Math.ceil(cell))
    }
  }
  // Los ejes
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(size / 2, 0)
  ctx.lineTo(size / 2, size)
  ctx.moveTo(0, size / 2)
  ctx.lineTo(size, size / 2)
  ctx.stroke()
  const radius = Math.max(3.5, size / 110)
  const draw = (points: LabPoint_t[], filled: boolean) => {
    for (const { x, y, label } of points) {
      const px = ((x + 1) / 2) * size
      const py = ((1 - y) / 2) * size
      ctx.beginPath()
      if (label === 0) ctx.arc(px, py, radius, 0, 2 * Math.PI)
      else ctx.rect(px - radius, py - radius, radius * 2, radius * 2)
      // Los de entrenamiento, rellenos de su color con borde oscuro; los de prueba, blancos con borde de su color: se ven
      // sobre cualquier fondo
      ctx.fillStyle = filled ? `rgb(${COLORS[label]})` : '#ffffff'
      ctx.fill()
      ctx.lineWidth = filled ? 1.25 : 2
      ctx.strokeStyle = filled ? 'rgba(15, 23, 42, 0.75)' : `rgb(${COLORS[label]})`
      ctx.stroke()
    }
  }
  draw(train, true)
  if (showTest) draw(test, false)
}

/** Las pérdidas de entrenamiento y de prueba de cada época, como dos líneas (el texto de la página dice lo mismo) */
function LossChart({ train, test, label }: { train: number[], test: number[], label: string }) {
  const width = 300
  const height = 120
  const all = [...train, ...test].filter(Number.isFinite)
  if (all.length < 2) return <div className={'n4l-lab-chart-empty small text-body-secondary'}>{label}</div>
  const max = Math.max(...all, 0.01)
  const path = (values: number[]) => values
    .map((value, index) => `${(index / Math.max(1, values.length - 1)) * width},${height - (Math.min(value, max) / max) * (height - 4) - 2}`)
    .join(' ')
  return (
    <svg className={'n4l-lab-chart'} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={'none'} aria-hidden={true}>
      <polyline points={path(train)} className={'n4l-lab-chart-train'} />
      <polyline points={path(test)} className={'n4l-lab-chart-test'} />
    </svg>
  )
}

/**
 * El laboratorio 2D: una red pequeña aprende a separar dos clases de puntos y la frontera de decisión se ve mientras
 * entrena. Se cambian los datos, lo que entra en la red, sus capas y cómo aprende, y «Prueba esto» lleva a ejemplos que
 * enseñan una idea cada uno. Todo se calcula en el navegador, sin TF.js (las mismas cuentas que Paso a paso)
 */
export default function Lab() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<Data_t>(DEFAULT_DATA)
  const [config, setConfig] = useState<LabConfig_t>(DEFAULT_CONFIG)
  const [running, setRunning] = useState(false)
  const [showTest, setShowTest] = useState(true)
  const [speed, setSpeed] = useState<Speed_t>('slow')
  const [stats, setStats] = useState<Stats_t>(EMPTY_STATS)
  const [curves, setCurves] = useState<{ train: number[], test: number[] }>({ train: [], test: [] })
  const [experiment, setExperiment] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [diverged, setDiverged] = useState(false)
  // Cambia cada vez que la red empieza de cero: para dibujarla
  const [version, setVersion] = useState(0)

  const canvas_ref = useRef<HTMLCanvasElement>(null)
  const network_ref = useRef<StepNetwork_t>(createLabNetwork(DEFAULT_CONFIG, 1))
  const epoch_ref = useRef(0)
  // La semilla de los pesos iniciales: otra cada vez que la red empieza de cero (y la misma secuencia en cada visita)
  const seed_ref = useRef(1)
  const random_ref = useRef(seededRandom(101))
  const curves_ref = useRef<{ train: number[], test: number[] }>({ train: [], test: [] })

  const points = useMemo(() => splitDataset(makeDataset(data.dataset, data)), [data])
  const percent = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 0 }), [i18n.language])
  const number = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }), [i18n.language])

  const measure = useCallback((): Stats_t => {
    const trained = evaluate(network_ref.current, points.train, config.features)
    const tested = evaluate(network_ref.current, points.test, config.features)
    return { epoch: epoch_ref.current, trainLoss: trained.loss, testLoss: tested.loss, trainAccuracy: trained.accuracy, testAccuracy: tested.accuracy }
  }, [points, config.features])

  const render = useCallback(() => {
    if (canvas_ref.current !== null) {
      drawLab(canvas_ref.current, boundaryGrid(network_ref.current, config.features, GRID), points.train, points.test, showTest)
    }
  }, [config.features, points, showTest])

  const summaryOf = useCallback((current: Stats_t) => t(prefix + 'summary', {
    epoch        : current.epoch,
    testAccuracy : percent.format(current.testAccuracy),
    trainAccuracy: percent.format(current.trainAccuracy),
    trainLoss    : number.format(current.trainLoss),
    testLoss     : number.format(current.testLoss),
  }), [t, percent, number])

  const publish = useCallback(() => {
    const current = measure()
    setStats(current)
    setCurves({ train: [...curves_ref.current.train], test: [...curves_ref.current.test] })
    return current
  }, [measure])

  /** Pesos nuevos al azar (con la arquitectura o los datos cambiados, o al pedirlo): parada y desde la época 0 */
  const resetNetwork = (nextConfig: LabConfig_t) => {
    setRunning(false)
    seed_ref.current += 1
    network_ref.current = createLabNetwork(nextConfig, seed_ref.current)
    epoch_ref.current = 0
    random_ref.current = seededRandom(101)
    curves_ref.current = { train: [], test: [] }
    setStats(EMPTY_STATS)
    setCurves({ train: [], test: [] })
    setDiverged(false)
    setVersion((current) => current + 1)
  }

  // Lo dibujado sigue a la red, a los datos, a «Ver los de prueba» y al tema
  useEffect(() => { render() }, [render, version])

  /** Una época y lo que se mide tras ella */
  const step = useCallback(() => {
    network_ref.current = trainEpoch(network_ref.current, points.train, config, random_ref.current)
    epoch_ref.current += 1
    const trained = evaluate(network_ref.current, points.train, config.features)
    const tested = evaluate(network_ref.current, points.test, config.features)
    curves_ref.current.train.push(trained.loss)
    curves_ref.current.test.push(tested.loss)
    // Las curvas, como mucho con 300 puntos (cada vez que se llenan, se quedan con uno de cada dos)
    if (curves_ref.current.train.length > 300) {
      curves_ref.current = {
        train: curves_ref.current.train.filter((_, index) => index % 2 === 0),
        test : curves_ref.current.test.filter((_, index) => index % 2 === 0),
      }
    }
    return Number.isFinite(trained.loss)
  }, [points, config])

  // Entrenar: en cada fotograma, las épocas que quepan en unos milisegundos
  useEffect(() => {
    if (!running) return
    let frame = 0
    let lastStats = 0
    const loop = () => {
      const start = performance.now()
      let healthy = true
      for (let done = 0; done < SPEEDS[speed] && epoch_ref.current < MAX_EPOCHS && performance.now() - start < FRAME_BUDGET_MS; done++) {
        healthy = step()
        if (!healthy) break
      }
      render()
      if (!healthy || epoch_ref.current >= MAX_EPOCHS) {
        setDiverged(!healthy)
        setRunning(false)
        setAnnouncement(summaryOf(publish()))
        return
      }
      if (performance.now() - lastStats > STATS_EVERY_MS) {
        lastStats = performance.now()
        publish()
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [running, speed, step, render, publish, summaryOf])

  const toggle = () => {
    if (running) {
      // Al parar, las cifras al día y, para el lector de pantalla, cómo ha quedado
      setRunning(false)
      setAnnouncement(summaryOf(publish()))
      return
    }
    trackEvent('lab_train', { dataset: data.dataset, layers: config.hidden.length, features: config.features.length })
    setRunning(true)
  }
  const stepOnce = () => {
    setDiverged(!step())
    render()
    setAnnouncement(summaryOf(publish()))
  }
  const restart = () => {
    resetNetwork(config)
    setAnnouncement(t(prefix + 'restarted'))
  }
  const apply = ({ id, data: nextData, config: nextConfig }: Experiment_t) => {
    const merged = { ...config, ...nextConfig }
    setData((current) => ({ ...current, ...nextData }))
    setConfig(merged)
    resetNetwork(merged)
    setExperiment(id)
    trackEvent('lab_experiment', { id })
    setAnnouncement(t(prefix + 'experiments.' + id + '.title') + '. ' + t(prefix + 'experiments.' + id + '.lesson'))
  }

  /** La tasa y el lote se cambian sobre la marcha; lo demás (lo que entra, las capas, la activación) es otra red */
  const updateConfig = (changes: Partial<LabConfig_t>) => {
    const next = { ...config, ...changes }
    setExperiment(null)
    setConfig(next)
    if ('features' in changes || 'hidden' in changes || 'activation' in changes) resetNetwork(next)
  }
  const updateData = (changes: Partial<Data_t>) => {
    setExperiment(null)
    setData((current) => ({ ...current, ...changes }))
    resetNetwork(config)
  }
  const setUnits = (layer: number, units: number) => updateConfig({ hidden: config.hidden.map((value, index) => (index === layer ? units : value)) })
  const toggleFeature = (feature: LabFeature_t, checked: boolean) => {
    const features = LAB_FEATURES.filter((item) => (item === feature ? checked : config.features.includes(item)))
    if (features.length > 0) updateConfig({ features })
  }

  return (
    <main className={'mb-4'} data-title={'Lab'} data-testid={'Test-Lab'}>
      <Container className={'n4l-container-wide'}>
        <h1 className={'mt-3'}>{t(prefix + 'title')}</h1>
        <p className={'lead'}>{t(prefix + 'intro')}</p>

        <Row className={'g-3'}>
          {/* Lo que se puede cambiar */}
          <Col lg={3}>
            <Card>
              <Card.Body className={'d-grid gap-3'}>
                <fieldset>
                  <legend className={'h6'}>{t(prefix + 'data.title')}</legend>
                  <Form.Group controlId={'lab-dataset'} className={'mb-2'}>
                    <Form.Label className={'small mb-1'}>{t(prefix + 'data.dataset')}</Form.Label>
                    <Form.Select size={'sm'} value={data.dataset} onChange={(event) => updateData({ dataset: event.target.value as LabDataset_t })}>
                      {LAB_DATASETS.map((dataset) => <option key={dataset} value={dataset}>{t(prefix + 'datasets.' + dataset)}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId={'lab-noise'} className={'mb-2'}>
                    <Form.Label className={'small mb-1'}>{t(prefix + 'data.noise', { value: percent.format(data.noise * 2) })}</Form.Label>
                    <Form.Range min={0} max={0.5} step={0.05} value={data.noise} onChange={(event) => updateData({ noise: Number(event.target.value) })} />
                  </Form.Group>
                  <Form.Group controlId={'lab-count'} className={'mb-2'}>
                    <Form.Label className={'small mb-1'}>{t(prefix + 'data.count')}</Form.Label>
                    <Form.Select size={'sm'} value={data.count} onChange={(event) => updateData({ count: Number(event.target.value) })}>
                      {COUNTS.map((count) => <option key={count} value={count}>{count}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Button size={'sm'} variant={'outline-secondary'} onClick={() => updateData({ seed: data.seed + 1 })}>{t(prefix + 'data.new')}</Button>
                </fieldset>

                <fieldset>
                  <legend className={'h6 mb-1'}>{t(prefix + 'features.title')}</legend>
                  <p className={'small text-body-secondary mb-1'}>{t(prefix + 'features.help')}</p>
                  {LAB_FEATURES.map((feature) => (
                    <Form.Check key={feature} inline={true} type={'checkbox'} id={'lab-feature-' + feature} className={'small'}
                      label={t(prefix + 'features.' + feature)}
                      checked={config.features.includes(feature)}
                      disabled={config.features.length === 1 && config.features.includes(feature)}
                      onChange={(event) => toggleFeature(feature, event.target.checked)} />
                  ))}
                </fieldset>

                <fieldset>
                  <legend className={'h6 mb-1'}>{t(prefix + 'network.title')}</legend>
                  <p className={'small text-body-secondary mb-2'}>{t(prefix + 'network.help')}</p>
                  {config.hidden.length === 0 && <p className={'small mb-2'}>{t(prefix + 'network.none')}</p>}
                  <ol className={'list-unstyled d-grid gap-1 mb-2'}>
                    {config.hidden.map((units, layer) => (
                      <li key={layer} className={'d-flex align-items-center justify-content-between gap-2 small'}>
                        <span>{t(prefix + 'network.layer', { number: layer + 1, units })}</span>
                        <ButtonGroup size={'sm'}>
                          <Button variant={'outline-secondary'} disabled={units <= 1} onClick={() => setUnits(layer, units - 1)}
                            aria-label={t(prefix + 'network.fewer', { number: layer + 1 })}>−</Button>
                          <Button variant={'outline-secondary'} disabled={units >= MAX_UNITS} onClick={() => setUnits(layer, units + 1)}
                            aria-label={t(prefix + 'network.more', { number: layer + 1 })}>+</Button>
                        </ButtonGroup>
                      </li>
                    ))}
                  </ol>
                  <div className={'d-flex flex-wrap gap-2 mb-2'}>
                    <Button size={'sm'} variant={'outline-primary'} disabled={config.hidden.length >= MAX_LAYERS}
                      onClick={() => updateConfig({ hidden: [...config.hidden, 4] })}>{t(prefix + 'network.add')}</Button>
                    <Button size={'sm'} variant={'outline-secondary'} disabled={config.hidden.length === 0}
                      onClick={() => updateConfig({ hidden: config.hidden.slice(0, -1) })}>{t(prefix + 'network.remove')}</Button>
                  </div>
                  <Form.Group controlId={'lab-activation'}>
                    <Form.Label className={'small mb-1'}>{t(prefix + 'network.activation')}</Form.Label>
                    <Form.Select size={'sm'} value={config.activation} disabled={config.hidden.length === 0}
                      onChange={(event) => updateConfig({ activation: event.target.value })}>
                      {ACTIVATIONS.map((activation) => <option key={activation} value={activation}>{activation}</option>)}
                    </Form.Select>
                  </Form.Group>
                </fieldset>

                <fieldset>
                  <legend className={'h6 mb-1'}>{t(prefix + 'training.title')}</legend>
                  <Form.Group controlId={'lab-learning-rate'} className={'mb-2'}>
                    <Form.Label className={'small mb-1'}>{t(prefix + 'training.learning-rate')}</Form.Label>
                    <Form.Select size={'sm'} value={config.learningRate} onChange={(event) => updateConfig({ learningRate: Number(event.target.value) })}>
                      {LEARNING_RATES.map((rate) => <option key={rate} value={rate}>{rate}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId={'lab-speed'} className={'mb-2'}>
                    <Form.Label className={'small mb-1'}>{t(prefix + 'training.speed')}</Form.Label>
                    <Form.Select size={'sm'} value={speed} onChange={(event) => setSpeed(event.target.value as Speed_t)}>
                      {(Object.keys(SPEEDS) as Speed_t[]).map((id) => <option key={id} value={id}>{t(prefix + 'training.speeds.' + id)}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId={'lab-batch-size'}>
                    <Form.Label className={'small mb-1'}>{t(prefix + 'training.batch-size')}</Form.Label>
                    <Form.Select size={'sm'} value={config.batchSize} onChange={(event) => updateConfig({ batchSize: Number(event.target.value) })}>
                      {BATCH_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </Form.Select>
                  </Form.Group>
                </fieldset>
              </Card.Body>
            </Card>
          </Col>

          {/* El plano, mientras entrena */}
          <Col lg={6}>
            <Card>
              <Card.Body>
                <div className={'d-flex flex-wrap align-items-center gap-2 mb-3'}>
                  <Button variant={running ? 'outline-primary' : 'primary'} onClick={toggle} data-testid={'Test-Lab-Run'}>
                    {running ? <PauseFill aria-hidden={true} /> : <PlayFill aria-hidden={true} />} {t(prefix + (running ? 'pause' : 'train'))}
                  </Button>
                  <Button variant={'outline-secondary'} onClick={stepOnce} disabled={running} data-testid={'Test-Lab-Step'}>
                    <SkipEndFill aria-hidden={true} /> {t(prefix + 'step')}
                  </Button>
                  <Button variant={'outline-secondary'} onClick={restart} data-testid={'Test-Lab-Restart'}>
                    <ArrowCounterclockwise aria-hidden={true} /> {t(prefix + 'restart')}
                  </Button>
                  <Form.Check type={'switch'} id={'lab-show-test'} className={'ms-auto small'} label={t(prefix + 'show-test')}
                    checked={showTest} onChange={(event) => setShowTest(event.target.checked)} />
                </div>
                <canvas ref={canvas_ref} width={480} height={480} className={'n4l-lab-canvas'} role={'img'}
                  aria-label={t(prefix + 'canvas', { dataset: t(prefix + 'datasets.' + data.dataset) })} aria-describedby={'lab-summary'} />
                <p className={'small text-body-secondary mt-2 mb-1'}>{t(prefix + 'legend')}</p>
                <p id={'lab-summary'} className={'mb-0'} data-testid={'Test-Lab-Summary'}>{stats.epoch === 0 ? t(prefix + 'not-trained') : summaryOf(stats)}</p>
                <div className={'visually-hidden'} role={'status'}>{announcement}</div>
                {diverged && <Alert variant={'warning'} className={'mt-2 mb-0 small'}>{t(prefix + 'diverged')}</Alert>}
              </Card.Body>
            </Card>
          </Col>

          {/* Cómo va y qué probar */}
          <Col lg={3}>
            <Card className={'mb-3'}>
              <Card.Body>
                <h2 className={'h6'}>{t(prefix + 'loss.title')}</h2>
                <LossChart train={curves.train} test={curves.test} label={t(prefix + 'loss.empty')} />
                <p className={'small mb-0 mt-1'}>
                  <span className={'n4l-lab-key n4l-lab-key-train'} aria-hidden={true} /> {t(prefix + 'loss.train')}{' '}
                  <span className={'n4l-lab-key n4l-lab-key-test'} aria-hidden={true} /> {t(prefix + 'loss.test')}
                </p>
                <p className={'small text-body-secondary mb-0 mt-1'}>{t(prefix + 'loss.help')}</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <h2 className={'h6'}>{t(prefix + 'experiments.title')}</h2>
                <ul className={'list-unstyled d-grid gap-2 mb-0'}>
                  {EXPERIMENTS.map((item) => (
                    <li key={item.id}>
                      <Button size={'sm'} variant={experiment === item.id ? 'primary' : 'outline-primary'} className={'w-100 text-start'}
                        aria-pressed={experiment === item.id} onClick={() => apply(item)} data-testid={'Test-Lab-Experiment-' + item.id}>
                        {t(prefix + 'experiments.' + item.id + '.title')}
                      </Button>
                      {experiment === item.id && (
                        <p className={'small mt-1 mb-0'} data-testid={'Test-Lab-Lesson'}>
                          {t(prefix + 'experiments.' + item.id + '.lesson')}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <p className={'small text-body-secondary mt-3 mb-0'}>
                  {t(prefix + 'next')} <Link to={'/learn'}>{t('pages.learn.title')}</Link>
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  )
}
