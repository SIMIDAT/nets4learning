import { useTranslation } from 'react-i18next'

import type { BackwardTrace_t, ForwardTrace_t, StepNetwork_t, StepPhase_t } from '@core/nn-utils/stepByStep'

/** Una neurona: layer -1 son las de entrada */
export type StepNode_t = { layer: number, index: number }

type StepByStepDiagramProps = {
  network     : StepNetwork_t
  trace       : ForwardTrace_t
  gradients   : BackwardTrace_t
  phase       : StepPhase_t
  /** La tasa de aprendizaje ya escrita (0,0005 no se puede redondear a dos decimales) */
  learningRate: string
  featureNames: string[]
  outputNames : string[]
  /** Clasificación: la clase correcta del ejemplo, para marcarla en la salida */
  targetIndex : number | null
  selected    : StepNode_t | null
  onSelect    : (node: StepNode_t) => void
  format      : (value: number) => string
}

const WIDTH = 760
const LABEL_LEFT = 118
const LABEL_RIGHT = 120

/** Hasta qué capa se ha calculado la activación (-1: solo la entrada), y desde cuál se conocen los deltas */
function progress(phase: StepPhase_t, layers: number) {
  switch (phase.kind) {
    case 'input': return { forwardUntil: -1, backwardFrom: layers }
    case 'forward': return { forwardUntil: phase.layer, backwardFrom: layers }
    case 'loss': return { forwardUntil: layers - 1, backwardFrom: layers }
    case 'backward': return { forwardUntil: layers - 1, backwardFrom: phase.layer }
    case 'update': return { forwardUntil: layers - 1, backwardFrom: 0 }
  }
}

const maxAbs = (values: number[]) => values.reduce((max, value) => Math.max(max, Math.abs(value)), 0) || 1
const truncate = (text: string, length: number) => (text.length > length ? text.slice(0, length - 1) + '…' : text)

/** Un color del tema mezclado con el fondo: más intenso cuanto mayor es el valor */
const tint = (color: string, amount: number) => `color-mix(in srgb, ${color} ${Math.round(Math.min(1, amount) * 100)}%, var(--bs-body-bg))`
const signColor = (value: number) => (value >= 0 ? 'var(--bs-primary)' : 'var(--bs-danger)')

/**
 * La red en columnas: la entrada a la izquierda, cada capa y la salida a la derecha. El color de una neurona es su
 * activación (azul, positiva; rojo, negativa) y el de una conexión, el signo de su peso, más gruesa cuanto mayor. Al ir
 * hacia delante se resaltan las conexiones que llegan a la capa que se calcula; al ir hacia atrás, en naranja, sus
 * gradientes, y el borde de cada neurona es su delta.
 */
export default function StepByStepDiagram(props: StepByStepDiagramProps) {
  const { network, trace, gradients, phase, learningRate, featureNames, outputNames, targetIndex, selected, onSelect, format } = props
  const { t } = useTranslation()
  const prefix = 'pages.playground.step-by-step.'

  const columns = [network.inputs, ...network.layers.map(({ units }) => units)]
  const tallest = Math.max(...columns)
  const spacing = Math.max(22, Math.min(46, 420 / tallest))
  const height = Math.max(220, tallest * spacing + 70)
  const radius = Math.min(15, spacing * 0.38)
  const showValues = radius >= 10
  const x = (column: number) => LABEL_LEFT + (column * (WIDTH - LABEL_LEFT - LABEL_RIGHT)) / (columns.length - 1)
  const y = (column: number, index: number) => 46 + (height - 70) / 2 + (index - (columns[column] - 1) / 2) * spacing

  const L = network.layers.length
  const { forwardUntil, backwardFrom } = progress(phase, L)
  const activeForward = phase.kind === 'forward' ? phase.layer : null
  const activeBackward = phase.kind === 'backward' ? phase.layer : null

  const edges = network.weights.flatMap((layer, l) => {
    const maxWeight = maxAbs(layer.flat())
    const maxGradient = maxAbs(gradients.gradWeights[l].flat())
    const showGradient = activeBackward === l || phase.kind === 'update'
    const dim = (activeForward !== null && activeForward !== l) || (activeBackward !== null && activeBackward !== l)
    return layer.flatMap((row, j) => row.map((w, i) => {
      const relative = showGradient ? Math.abs(gradients.gradWeights[l][j][i]) / maxGradient : Math.abs(w) / maxWeight
      const opacity = (showGradient ? 0.25 + 0.7 * relative : 0.12 + 0.55 * relative) * (dim ? 0.35 : 1) * (activeForward === l ? 1.4 : 1)
      const flow = activeForward === l ? 'n4l-sbs-flow-forward' : activeBackward === l ? 'n4l-sbs-flow-backward' : undefined
      return (
        <line key={`${l}-${j}-${i}`} className={flow}
          x1={x(l)} y1={y(l, i)} x2={x(l + 1)} y2={y(l + 1, j)}
          stroke={showGradient ? 'var(--n4l-sbs-gradient)' : signColor(w)}
          strokeOpacity={Math.min(0.95, opacity)}
          strokeWidth={0.6 + (showGradient ? 3 : 2.4) * relative} />
      )
    }))
  })

  const node = (column: number, index: number) => {
    const layer = column - 1
    const isInput = layer === -1
    const value = isInput ? trace.input[index] : trace.a[layer][index]
    const computed = isInput || layer <= forwardUntil
    const columnValues = isInput ? trace.input : trace.a[layer]
    const delta = !isInput && layer >= backwardFrom ? gradients.deltas[layer][index] : null
    const maxDelta = isInput ? 1 : maxAbs(gradients.deltas[layer])
    const isSelected = selected?.layer === layer && selected.index === index
    const label = isInput
      ? t(prefix + 'node-input', { name: featureNames[index] ?? index + 1, value: format(value) })
      : t(prefix + 'node', { index: index + 1, layer: layer + 1, value: computed ? format(value) : '?' })
    return (
      <g key={`${column}-${index}`} className={'n4l-sbs-node'} role={'button'} tabIndex={0} aria-label={label} aria-pressed={isSelected}
        onClick={() => onSelect({ layer, index })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect({ layer, index })
          }
        }}>
        <title>{label}</title>
        {isSelected && <circle cx={x(column)} cy={y(column, index)} r={radius + 4.5} className={'n4l-sbs-selected'} />}
        <circle cx={x(column)} cy={y(column, index)} r={radius}
          fill={computed ? tint(signColor(value), 0.15 + 0.7 * Math.abs(value) / maxAbs(columnValues)) : 'var(--bs-body-bg)'}
          stroke={delta !== null ? 'var(--n4l-sbs-gradient)' : 'var(--bs-border-color)'}
          strokeWidth={delta !== null ? 1.5 + 3 * Math.abs(delta) / maxDelta : 1.2} />
        {showValues && computed &&
          <text x={x(column)} y={y(column, index)} className={'n4l-sbs-value'} dominantBaseline={'central'} textAnchor={'middle'}>{format(value)}</text>}
      </g>
    )
  }

  const outputLabel = (index: number) => {
    const name = truncate(outputNames[index] ?? String(index + 1), 14)
    const probability = forwardUntil === L - 1 ? ' · ' + format(trace.a[L - 1][index]) : ''
    return (index === targetIndex ? '✓ ' : '') + name + probability
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className={'n4l-sbs-diagram'} role={'group'} aria-label={t(prefix + 'diagram')}>
      {columns.map((_, column) => (
        <text key={column} x={x(column)} y={16} className={'n4l-sbs-column'} textAnchor={'middle'}>
          {column === 0
            ? t(prefix + 'column-input')
            : t(prefix + (column === columns.length - 1 ? 'column-output' : 'column-layer'), { layer: column, activation: network.layers[column - 1].activation })}
        </text>
      ))}
      <g>{edges}</g>
      {featureNames.slice(0, network.inputs).map((name, index) => (
        <text key={name + index} x={x(0) - radius - 6} y={y(0, index)} className={'n4l-sbs-label'} textAnchor={'end'} dominantBaseline={'central'}>
          <title>{name}</title>{truncate(name, 16)}
        </text>
      ))}
      {Array.from({ length: columns.at(-1)! }, (_, index) => (
        <text key={'out' + index} x={x(columns.length - 1) + radius + 6} y={y(columns.length - 1, index)} dominantBaseline={'central'}
          className={'n4l-sbs-label' + (index === targetIndex ? ' n4l-sbs-target' : '')}>
          <title>{outputNames[index]}</title>{outputLabel(index)}
        </text>
      ))}
      {columns.map((count, column) => Array.from({ length: count }, (_, index) => node(column, index)))}
      {phase.kind === 'update' &&
        <text x={WIDTH / 2} y={height - 10} className={'n4l-sbs-column'} textAnchor={'middle'}>
          {t(prefix + 'update-rule', { rate: learningRate })}
        </text>}
    </svg>
  )
}
