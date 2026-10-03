import './N4LStepByStep.css'
import { useEffect, useMemo, useState } from 'react'
import { Button, ButtonGroup, Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowCounterclockwise, ChevronLeft, ChevronRight, FastForwardFill, PauseFill, PlayFill } from 'react-bootstrap-icons'

import {
  activationBackward, backward, countNodes, forward, initNetwork, lossOf, MAX_STEP_NODES, stepPhases, update,
  type StepLayer_t, type StepLoss_t, type StepNetwork_t,
} from '@core/nn-utils/stepByStep'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import N4LMaximizeButton from '@components/maximize/N4LMaximizeButton'
import { useMaximize } from '@components/maximize/useMaximize'
import N4LVirtualSelect from '@components/select/N4LVirtualSelect'
import StepByStepDiagram, { type StepNode_t } from './StepByStepDiagram'

type N4LStepByStepProps = {
  /** Clasificación (softmax y entropía cruzada) o regresión (un número y error cuadrático) */
  kind           : 'classification' | 'regression'
  /** Las capas del editor, la de salida incluida (con initialNetwork, las de ese modelo) */
  layers?        : StepLayer_t[]
  /**
   * Los pesos de un modelo ya entrenado (páginas de los modelos): se empieza con ellos y Reiniciar vuelve a ellos; null
   * si el modelo no es una red densa. Sin él (páginas de entrenamiento), los pesos empiezan al azar.
   */
  initialNetwork?: StepNetwork_t | null
  /** Las filas del conjunto de datos tal como las recibe la red */
  X              : number[][]
  /** El número de cada fila en el conjunto de datos, si no son todas (como en los selectores de fila: desde 0) */
  rowNumbers?    : number[]
  /** Clasificación: cada fila en one-hot; regresión: el valor real de cada fila */
  y              : number[][]
  featureNames   : string[]
  /** Clasificación: las clases; regresión: el nombre de lo que se predice */
  outputNames    : string[]
  learningRate   : number
}

const SPEEDS = { slow: 1800, normal: 900, fast: 300 } as const
type Speed_t = keyof typeof SPEEDS
// Cuántas actualizaciones se ven en la gráfica de la pérdida
const HISTORY = 60
// La pérdida media se mide con estas filas como mucho (siempre las mismas): con todas, un conjunto grande tardaría
const LOSS_SAMPLE = 200
// Cuántos términos de la suma se escriben antes de "…"
const TERMS = 4

type Run_t = {
  /** La red para la que son estos pesos: si cambian las capas o las entradas, se empieza de nuevo */
  signature : string
  /** El modelo ya entrenado del que salen (null: pesos al azar); si cambia de modelo, también */
  source    : StepNetwork_t | null
  seed      : number
  network   : StepNetwork_t
  phase     : number
  example   : number
  iterations: number
  /** La pérdida media de la muestra antes de empezar y después de cada actualización */
  losses    : number[]
}

const signatureOf = (inputs: number, layers: StepLayer_t[]) => inputs + '|' + layers.map(({ units, activation }) => units + ':' + activation).join(',')
const newRun = (inputs: number, layers: StepLayer_t[], seed: number, example: number, source: StepNetwork_t | null): Run_t => ({
  signature : signatureOf(inputs, layers),
  source,
  seed,
  network   : source ?? initNetwork(inputs, layers, seed),
  phase     : 0,
  example,
  iterations: 0,
  losses    : [],
})

/** Las filas barajadas, siempre igual: como al entrenar, los ejemplos no van en el orden del fichero (que puede estar
 * ordenado por clase y llevaría la red hacia una sola) */
function shuffledRows(count: number) {
  const order = Array.from({ length: count }, (_, index) => index)
  let state = 7
  for (let i = count - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) % 2147483648
    const j = state % (i + 1);
    [order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/** El objetivo de una fila; en regresión, escalado entre 0 y 1 (ver range) */
const targetOf = (y: number[][], range: { min: number, span: number } | null, row: number) =>
  (range === null ? y[row] : [(y[row][0] - range.min) / range.span])

const argMax = (values: number[]) => values.reduce((best, value, index) => (value > values[best] ? index : best), 0)

/**
 * El entrenamiento de la red diseñada, paso a paso y con un ejemplo cada vez: el ejemplo entra, recorre la red hacia
 * delante capa a capa, se mide el error y el error vuelve hacia atrás hasta cambiar cada peso. Se puede avanzar fase a
 * fase, dejar que avance solo o pasar 10 ejemplos de golpe para ver bajar la pérdida. Solo con redes de menos de
 * MAX_STEP_NODES neuronas (contando las de entrada): más no se pueden seguir. En el entrenamiento, los pesos empiezan al
 * azar; en un modelo ya entrenado (initialNetwork), son los suyos y se ve cómo calcula su respuesta y qué haría un paso
 * más de entrenamiento (el modelo de la página no cambia). La actualización es descenso del gradiente simple.
 */
export default function N4LStepByStep({ kind, layers: editorLayers, initialNetwork, X, rowNumbers, y, featureNames, outputNames, learningRate }: N4LStepByStepProps) {
  const pretrained = initialNetwork !== undefined
  const source = initialNetwork ?? null
  const layers = useMemo(() => initialNetwork?.layers ?? editorLayers ?? [], [initialNetwork, editorLayers])
  const prefix = 'pages.playground.step-by-step.'
  const { t, i18n } = useTranslation()
  const maximize = useMaximize()
  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2, minimumFractionDigits: 2 }), [i18n.language])
  const precise = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 4, minimumFractionDigits: 4 }), [i18n.language])
  // Con el signo menos de verdad (−) en vez del guion
  const format = (value: number) => formatter.format(Math.abs(value) < 0.005 ? 0 : value).replace('-', '−')
  const formatPrecise = (value: number) => precise.format(value).replace('-', '−')
  // En una suma, los negativos entre paréntesis: 0,13·0,22 + (−0,07)·0,63
  const term = (value: number) => (value < -0.005 ? `(${format(value)})` : format(value))
  const formatRate = (value: number) => value.toLocaleString(i18n.language, { maximumSignificantDigits: 3 })

  const inputs = initialNetwork?.inputs ?? X[0]?.length ?? featureNames.length
  const lossKind: StepLoss_t = kind === 'classification' ? 'cross-entropy' : 'mse'
  const nodes = countNodes(inputs, layers)
  const outputUnits = layers.at(-1)?.units ?? 0
  const expectedOutputs = kind === 'classification' ? outputNames.length : 1
  const ready = initialNetwork !== null && X.length > 0 && layers.length > 0 && nodes < MAX_STEP_NODES && outputUnits === expectedOutputs

  // Al entrenar en regresión, el objetivo se escala entre 0 y 1: con los valores reales (salarios, precios) un paso de
  // descenso del gradiente simple saltaría lejísimos. Se enseña también en sus unidades. Un modelo ya entrenado predice
  // en las unidades reales: con él no se escala
  const range = useMemo(() => {
    if (kind !== 'regression' || pretrained || y.length === 0) return null
    const values = y.map(([value]) => value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    return { min, span: max - min || 1 }
  }, [kind, pretrained, y])
  const realValue = (scaled: number) => (range === null ? scaled : scaled * range.span + range.min)

  // Empieza por el primer ejemplo del orden barajado
  const [run, setRun] = useState<Run_t>(() => newRun(inputs, layers, 42, shuffledRows(X.length)[0] ?? 0, source))
  const [selected, setSelected] = useState<StepNode_t | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed_t>('normal')
  const [sameExample, setSameExample] = useState(false)
  // Otra red (otras capas o entradas, u otro modelo): pesos nuevos y desde el principio
  const current = run.signature === signatureOf(inputs, layers) && run.source === source
  if (!current) {
    setRun(newRun(inputs, layers, run.seed, shuffledRows(X.length)[0] ?? 0, source))
    setSelected(null)
  }
  if (playing && !ready) setPlaying(false)

  const phases = useMemo(() => stepPhases(layers.length), [layers.length])
  const order = useMemo(() => shuffledRows(X.length), [X.length])
  const position = useMemo(() => {
    const positions = new Array<number>(order.length)
    order.forEach((row, index) => { positions[row] = index })
    return positions
  }, [order])
  /** La pérdida media de una muestra fija de filas: baja si la red aprende (la de un solo ejemplo da saltos) */
  const meanLoss = (network: StepNetwork_t) => {
    const rows = order.slice(0, LOSS_SAMPLE)
    return rows.reduce((sum, row) => sum + lossOf(lossKind, forward(network, X[row]).a.at(-1)!, targetOf(y, range, row)), 0) / Math.max(1, rows.length)
  }
  const phase = phases[Math.min(run.phase, phases.length - 1)]
  const example = Math.min(run.example, Math.max(0, X.length - 1))

  const step = useMemo(() => {
    if (!ready || !current) return null
    const target = targetOf(y, range, example)
    const trace = forward(run.network, X[example])
    const gradients = backward(run.network, trace, target, lossKind)
    const loss = lossOf(lossKind, trace.a.at(-1)!, target)
    const next = update(run.network, gradients, learningRate)
    const lossAfter = lossOf(lossKind, forward(next, X[example]).a.at(-1)!, target)
    return { target, trace, gradients, loss, next, lossAfter }
  }, [ready, current, run, X, y, range, example, lossKind, learningRate])

  /** Termina el ejemplo: los pesos nuevos se quedan y se pasa al siguiente (o se repite el mismo) */
  const finishExample = (current: Run_t, network: StepNetwork_t): Run_t => ({
    ...current,
    network,
    phase     : 0,
    iterations: current.iterations + 1,
    losses    : [...(current.losses.length === 0 ? [meanLoss(current.network)] : current.losses), meanLoss(network)].slice(-HISTORY - 1),
    example   : sameExample ? current.example : order[(position[current.example] + 1) % order.length],
  })

  const next = () => {
    if (step === null) return
    if (run.phase < phases.length - 1) setRun({ ...run, phase: run.phase + 1 })
    else setRun(finishExample(run, step.next))
  }

  /** 10 ejemplos de golpe, sin enseñar cada fase: para ver cómo baja la pérdida */
  const nextTen = () => {
    if (step === null) return
    let current = run
    for (let i = 0; i < 10; i++) {
      const target = targetOf(y, range, current.example)
      const trace = forward(current.network, X[current.example])
      const gradients = backward(current.network, trace, target, lossKind)
      current = finishExample(current, update(current.network, gradients, learningRate))
    }
    setRun(current)
  }

  const rowOptions = useMemo(() => y.map((row, index) => ({
    value: index,
    label: `#${rowNumbers?.[index] ?? index} · ${kind === 'classification' ? outputNames[argMax(row)] : `${outputNames[0]}: ${formatter.format(row[0])}`}`,
  })), [kind, y, rowNumbers, outputNames, formatter])

  // Avanza solo, fase a fase, a la velocidad elegida
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(next, SPEEDS[speed])
    return () => window.clearTimeout(timer)
  })

  // La neurona que se explica: la elegida o, si no está en la capa de la fase, la primera de esa capa
  const activeLayer = phase.kind === 'forward' || phase.kind === 'backward' ? phase.layer : phase.kind === 'input' ? -1 : layers.length - 1
  const focus: StepNode_t = selected ?? { layer: activeLayer, index: 0 }

  const header = (
    <Card.Header className={'d-flex align-items-center justify-content-between gap-2'}>
      <h3 className={'mb-0'}><Trans i18nKey={prefix + 'title'} /></h3>
      <N4LMaximizeButton maximized={maximize.maximized} onToggle={maximize.toggle} disabled={step === null} />
    </Card.Header>
  )

  if (step === null) {
    const detail = [inputs, ...layers.map(({ units }) => units)].join(' + ')
    return (
      <Card data-testid={'Test-StepByStep'}>
        {header}
        <Card.Body>
          <p className={'text-body-secondary'}>{t(prefix + (pretrained ? 'intro-pretrained' : 'intro'))}</p>
          {initialNetwork === null && <p className={'mb-0'} data-testid={'Test-StepByStep-NotDense'}>{t(prefix + 'not-dense')}</p>}
          {initialNetwork !== null && X.length === 0 && <N4LEmptyState i18nKey={'pages.playground.generator.waiting-for-process'} />}
          {initialNetwork !== null && X.length > 0 && nodes >= MAX_STEP_NODES &&
            <p className={'mb-0'} data-testid={'Test-StepByStep-TooBig'}>
              {t(prefix + (pretrained ? 'too-big-pretrained' : 'too-big'), { nodes, detail, max: MAX_STEP_NODES })}
            </p>}
          {initialNetwork !== null && X.length > 0 && nodes < MAX_STEP_NODES && outputUnits !== expectedOutputs &&
            <p className={'mb-0'}>{t(prefix + 'mismatch', { units: outputUnits, classes: expectedOutputs })}</p>}
        </Card.Body>
      </Card>
    )
  }

  const { trace, gradients, loss, lossAfter, target } = step
  const L = layers.length
  const output = trace.a[L - 1]
  const targetIndex = kind === 'classification' ? argMax(target) : null
  const activation = (layer: number) => layers[layer]?.activation ?? 'linear'

  const phaseText = (() => {
    switch (phase.kind) {
      case 'input':
        return t(prefix + (pretrained ? 'phase.input-pretrained' : 'phase.input'), { row: rowNumbers?.[example] ?? example, count: inputs })
      case 'forward':
        return t(prefix + (activation(phase.layer) === 'softmax' ? 'phase.forward-softmax' : 'phase.forward'),
          { layer: phase.layer + 1, activation: activation(phase.layer) })
      case 'loss':
        return kind === 'classification'
          ? t(prefix + 'phase.loss-classification', {
            probability: format(output[targetIndex!]), target: outputNames[targetIndex!], loss: format(loss), predicted: outputNames[argMax(output)],
          })
          : t(prefix + (range === null ? 'phase.loss-regression-raw' : 'phase.loss-regression'), {
            prediction: format(realValue(output[0])), actual: format(realValue(target[0])), output: format(output[0]), target: format(target[0]), loss: format(loss),
          })
      case 'backward':
        return t(prefix + (phase.layer === L - 1 ? 'phase.backward-output' : 'phase.backward'),
          { layer: phase.layer + 1, activation: activation(phase.layer) })
      case 'update':
        return t(prefix + 'phase.update', { rate: formatRate(learningRate), before: format(loss), after: format(lossAfter) })
    }
  })()

  // Las cuentas de la neurona que se explica, con sus números
  const formula = (() => {
    const { layer, index } = focus
    if (layer === -1) return t(prefix + 'formula-input', { name: featureNames[index] ?? index + 1, value: format(trace.input[index]) })
    const previous = layer === 0 ? trace.input : trace.a[layer - 1]
    const weights = run.network.weights[layer][index]
    const terms = weights.slice(0, TERMS).map((w, i) => `${term(w)}·${term(previous[i])}`).join(' + ')
    const sum = `z = ${terms}${weights.length > TERMS ? ' + …' : ''} + ${term(run.network.biases[layer][index])} = ${format(trace.z[layer][index])}`
    const computed = phase.kind !== 'input' && !(phase.kind === 'forward' && layer > phase.layer)
    if (!computed) return t(prefix + 'formula-pending', { index: index + 1, layer: layer + 1 })
    const act = activation(layer)
    const forwardPart = `${sum} → ${act}(z) = ${format(trace.a[layer][index])}`
    const showDelta = (phase.kind === 'backward' && layer >= phase.layer) || phase.kind === 'update'
    if (!showDelta) return forwardPart
    const delta = gradients.deltas[layer][index]
    let deltaPart: string
    if (layer === L - 1) {
      deltaPart = kind === 'classification' && act === 'softmax'
        ? `δ = a − y = ${format(output[index])} − ${format(target[index])} = ${format(delta)}`
        : `δ = ${format(delta)}`
    } else {
      const back = run.network.weights[layer + 1].reduce((total, row, j) => total + row[index] * gradients.deltas[layer + 1][j], 0)
      const derivative = act === 'softmax' ? null : activationBackward(act, [trace.z[layer][index]], [trace.a[layer][index]], [1])[0]
      deltaPart = derivative === null
        ? `δ = ${format(delta)}`
        : `δ = (Σ w·δ) · ${act}′(z) = ${term(back)} · ${term(derivative)} = ${format(delta)}`
    }
    if (phase.kind !== 'update') return `${forwardPart}\n${deltaPart}`
    const bias = run.network.biases[layer][index]
    // El peso de esta neurona que más cambia: el de la entrada con mayor gradiente
    const gradientsIn = gradients.gradWeights[layer][index]
    const biggest = gradientsIn.reduce((best, g, i) => (Math.abs(g) > Math.abs(gradientsIn[best]) ? i : best), 0)
    const updated = {
      before     : formatPrecise(bias),
      after      : formatPrecise(step.next.biases[layer][index]),
      from       : layer === 0 ? featureNames[biggest] ?? String(biggest + 1) : t(prefix + 'from-neuron', { index: biggest + 1, layer }),
      weight     : formatPrecise(weights[biggest]),
      weightAfter: formatPrecise(step.next.weights[layer][index][biggest]),
    }
    return `${deltaPart}\n${t(prefix + 'formula-update', updated)}`
  })()

  return (
    <Card className={maximize.className} data-testid={'Test-StepByStep'}>
      {header}
      <Card.Body className={'n4l-sbs'}>
        <p className={'text-body-secondary'}>{t(prefix + (pretrained ? 'intro-pretrained' : 'intro'))}</p>

        <div className={'d-flex flex-wrap align-items-center gap-2 mb-3'}>
          <div className={'n4l-instance-select'}>
            <N4LVirtualSelect options={rowOptions} value={example} size={'sm'}
              onChange={(row) => {
                setRun({ ...run, example: row, phase: 0 })
                setPlaying(false)
              }}
              placeholder={t(prefix + 'example')} searchPlaceholder={t(prefix + 'search')} noResultsText={t(prefix + 'no-results')} />
          </div>
          <ButtonGroup size={'sm'}>
            <Button variant={'outline-primary'} disabled={run.phase === 0} onClick={() => setRun({ ...run, phase: run.phase - 1 })}
              aria-label={t(prefix + 'back')} title={t(prefix + 'back')} data-testid={'Test-StepByStep-Back'}><ChevronLeft aria-hidden={true} /></Button>
            <Button variant={'primary'} onClick={next} data-testid={'Test-StepByStep-Next'}>
              {t(prefix + 'next')} <ChevronRight aria-hidden={true} />
            </Button>
            <Button variant={'outline-primary'} onClick={() => setPlaying(!playing)} aria-label={t(prefix + (playing ? 'pause' : 'play'))}
              title={t(prefix + (playing ? 'pause' : 'play'))} data-testid={'Test-StepByStep-Play'}>
              {playing ? <PauseFill aria-hidden={true} /> : <PlayFill aria-hidden={true} />}
            </Button>
            <Button variant={'outline-primary'} onClick={nextTen} title={t(prefix + 'ten')} data-testid={'Test-StepByStep-Ten'}>
              <FastForwardFill aria-hidden={true} /> 10
            </Button>
          </ButtonGroup>
          <Form.Select size={'sm'} className={'w-auto'} value={speed} aria-label={t(prefix + 'speed')}
            onChange={(event) => setSpeed(event.target.value as Speed_t)}>
            {(Object.keys(SPEEDS) as Speed_t[]).map((key) => <option key={key} value={key}>{t(prefix + 'speeds.' + key)}</option>)}
          </Form.Select>
          <Form.Check type={'switch'} id={'n4l-sbs-same'} className={'mb-0'} label={t(prefix + 'same-example')}
            checked={sameExample} onChange={(event) => setSameExample(event.target.checked)} />
          <Button size={'sm'} variant={'outline-secondary'} className={'ms-auto'} data-testid={'Test-StepByStep-Reset'}
            onClick={() => {
              // Al azar, otros pesos; de un modelo ya entrenado, los suyos otra vez
              setRun(newRun(inputs, layers, pretrained ? run.seed : run.seed + 1, example, source))
              setPlaying(false)
            }}>
            <ArrowCounterclockwise aria-hidden={true} /> {t(prefix + (pretrained ? 'reset-pretrained' : 'reset'))}
          </Button>
        </div>

        <div className={'n4l-sbs-body'}>
          <div className={'n4l-sbs-figure'}>
            <StepByStepDiagram network={run.network} trace={trace} gradients={gradients} phase={phase}
              learningRate={formatRate(learningRate)} featureNames={featureNames} outputNames={outputNames}
              targetIndex={targetIndex} selected={selected} onSelect={setSelected} format={format} />
            <p className={'small text-body-secondary mb-0'}>{t(prefix + 'legend')}</p>
          </div>
          <div className={'n4l-sbs-panel'} aria-live={'polite'} data-testid={'Test-StepByStep-Panel'}>
            <p className={'small text-body-secondary mb-1'}>
              {t(prefix + 'phase-count', { current: run.phase + 1, total: phases.length })}
            </p>
            <h4 className={'h6'} data-testid={'Test-StepByStep-Phase'}>{t(prefix + 'phase-title.' + phase.kind, { layer: 'layer' in phase ? phase.layer + 1 : '' })}</h4>
            <p>{phaseText}</p>
            <p className={'small mb-1 fw-semibold'}>
              {focus.layer === -1
                ? t(prefix + 'focus-input', { index: focus.index + 1 })
                : t(prefix + 'focus', { index: focus.index + 1, layer: focus.layer + 1 })}
            </p>
            <pre className={'n4l-sbs-formula'} data-testid={'Test-StepByStep-Formula'}>{formula}</pre>
            <LossHistory losses={run.losses} iterations={run.iterations} sample={Math.min(LOSS_SAMPLE, X.length)} format={format} />
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

type LossHistoryProps = { losses: number[], iterations: number, sample: number, format: (value: number) => string }

/** La pérdida media de la muestra antes de empezar y tras cada actualización: si la red aprende, la línea baja */
function LossHistory({ losses, iterations, sample, format }: LossHistoryProps) {
  const { t } = useTranslation()
  const prefix = 'pages.playground.step-by-step.'
  if (losses.length === 0) return <p className={'small text-body-secondary mb-0'}>{t(prefix + 'history-empty')}</p>
  // Entre la menor y la mayor: los cambios pequeños también se ven
  const min = Math.min(...losses)
  const span = Math.max(...losses) - min || 1
  const points = losses.map((loss, index) => `${(index / Math.max(1, losses.length - 1)) * 200},${46 - ((loss - min) / span) * 42}`).join(' ')
  const caption = t(prefix + 'history', { count: iterations, sample, first: format(losses[0]), last: format(losses.at(-1)!) })
  return (
    <figure className={'mb-0'} data-testid={'Test-StepByStep-History'}>
      <svg viewBox={'0 0 200 50'} className={'n4l-sbs-history'} role={'img'} aria-label={caption}>
        <polyline points={points} fill={'none'} />
      </svg>
      <figcaption className={'small text-body-secondary'}>{caption}</figcaption>
    </figure>
  )
}
