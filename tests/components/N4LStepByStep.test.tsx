import { describe, test, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import N4LStepByStep from '@components/neural-network/stepByStep/N4LStepByStep'

const prefix = 'pages.playground.step-by-step.'
// Cuatro características y tres clases, como IRIS
const X = [[0.1, 0.5, 0.2, 0.9], [0.8, 0.3, 0.7, 0.1], [0.4, 0.4, 0.5, 0.5], [0.9, 0.9, 0.1, 0.2]]
const y = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0]]
const props = {
  kind        : 'classification' as const,
  X, y,
  featureNames: ['a', 'b', 'c', 'd'],
  outputNames : ['uno', 'dos', 'tres'],
  learningRate: 0.1,
}
const small = [{ units: 5, activation: 'relu' }, { units: 3, activation: 'softmax' }]

describe('N4LStepByStep: el entrenamiento paso a paso', () => {
  test('recorre la entrada, cada capa hacia delante, el error, cada capa hacia atrás y la actualización', () => {
    render(<N4LStepByStep {...props} layers={small} />)
    const phase = () => screen.getByTestId('Test-StepByStep-Phase').textContent
    const seen = [phase()]
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByTestId('Test-StepByStep-Next'))
      seen.push(phase())
    }
    expect(seen).toEqual(['input', 'forward', 'forward', 'loss', 'backward', 'backward', 'update'].map((kind) => prefix + 'phase-title.' + kind))
    // Con la actualización termina el ejemplo: aparece la pérdida y se vuelve a la entrada con el siguiente
    expect(screen.queryByTestId('Test-StepByStep-History')).toBeNull()
    fireEvent.click(screen.getByTestId('Test-StepByStep-Next'))
    expect(phase()).toBe(prefix + 'phase-title.input')
    expect(screen.getByTestId('Test-StepByStep-History')).toBeInTheDocument()
  })

  test('al pulsar una neurona se explican sus cuentas, y la de antes se puede volver a ver con Atrás', () => {
    render(<N4LStepByStep {...props} layers={small} />)
    fireEvent.click(screen.getByTestId('Test-StepByStep-Next'))
    fireEvent.click(document.querySelectorAll('.n4l-sbs-node')[6])
    // La 3.ª neurona de la capa 1 (las 4 primeras son las de entrada): su suma ponderada y su activación
    expect(screen.getByTestId('Test-StepByStep-Formula').textContent).toMatch(/^z = .* → relu\(z\) = /)
    fireEvent.click(screen.getByTestId('Test-StepByStep-Back'))
    expect(screen.getByTestId('Test-StepByStep-Phase').textContent).toBe(prefix + 'phase-title.input')
    expect(screen.getByTestId('Test-StepByStep-Back')).toBeDisabled()
  })

  test('10 ejemplos de golpe: la pérdida media queda apuntada y se sigue desde la entrada', () => {
    render(<N4LStepByStep {...props} layers={small} />)
    fireEvent.click(screen.getByTestId('Test-StepByStep-Ten'))
    expect(screen.getByTestId('Test-StepByStep-History')).toBeInTheDocument()
    expect(screen.getByTestId('Test-StepByStep-Phase').textContent).toBe(prefix + 'phase-title.input')
  })

  test('con 64 neuronas o más (contando las de entrada) no se dibuja: dice cuántas tiene y cómo reducirla', () => {
    render(<N4LStepByStep {...props} layers={[{ units: 57, activation: 'relu' }, { units: 3, activation: 'softmax' }]} />)
    const card = screen.getByTestId('Test-StepByStep')
    expect(within(card).getByTestId('Test-StepByStep-TooBig')).toHaveTextContent(prefix + 'too-big')
    expect(within(card).queryByTestId('Test-StepByStep-Next')).toBeNull()
  })

  test('si la salida no tiene una neurona por clase, avisa en lugar de dibujar', () => {
    render(<N4LStepByStep {...props} layers={[{ units: 5, activation: 'relu' }, { units: 2, activation: 'softmax' }]} />)
    expect(screen.getByTestId('Test-StepByStep')).toHaveTextContent(prefix + 'mismatch')
    expect(screen.queryByTestId('Test-StepByStep-Next')).toBeNull()
  })
})
