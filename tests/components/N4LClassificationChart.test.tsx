import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import N4LClassificationChart from '@components/neural-network/N4LClassificationChart'
import { argMax, isProbabilityDistribution } from '@core/nn-utils/classificationOutput'
import { makeImagePrediction } from '@pages/playground/3_ImageClassification/utils/imagePrediction'

// jsdom no tiene canvas: la gráfica se sustituye por un elemento con lo que recibiría Chart.js
vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options, ...props }: any) => (
    <div data-testid={'bar'}
      data-values={JSON.stringify(data.datasets[0].data)}
      data-colors={JSON.stringify(data.datasets[0].backgroundColor)}
      data-y-max={options.scales.y.max}
      aria-label={props['aria-label']} />
  ),
}))

describe('argMax, makeImagePrediction e isProbabilityDistribution', () => {

  test('la clase elegida es la de mayor valor', () => {
    expect(argMax([0.1, 0.7, 0.2])).toBe(1)
    expect(argMax([])).toBe(-1)
    expect(makeImagePrediction([0.1, 0.7, 0.2], 2)).toEqual({ values: [0.1, 0.7, 0.2], index: 1, modelIndex: 2 })
  })

  test('solo es una distribución de probabilidad si los valores están entre 0 y 1 y suman 1', () => {
    expect(isProbabilityDistribution([0.1, 0.7, 0.2])).toBe(true)
    expect(isProbabilityDistribution([0.5, 0.5, 0.5])).toBe(false)
    expect(isProbabilityDistribution([2.3, -1, 0.1])).toBe(false)
    expect(isProbabilityDistribution([])).toBe(false)
  })
})

describe('N4LClassificationChart', () => {

  const classLabels = ['お', 'き', 'す']

  test('con softmax: clase predicha, su probabilidad y las barras en porcentaje con la elegida resaltada', () => {
    const { getByTestId, getByText } = render(
      <N4LClassificationChart values={[0.05, 0.9, 0.05]} classLabels={classLabels} />,
    )
    expect(getByTestId('Test-ClassificationChart-class').textContent).toBe('き')
    expect(getByText('pages.playground.generator.classify.chart-title')).toBeInTheDocument()
    const bar = getByTestId('bar')
    expect(JSON.parse(bar.dataset.values!).map(Math.round)).toEqual([5, 90, 5])
    expect(bar.dataset.yMax).toBe('100')
    const colors = JSON.parse(bar.dataset.colors!)
    expect(colors[1]).not.toBe(colors[0])
    expect(colors[0]).toBe(colors[2])
    // Sin espacios: el porcentaje se formatea en el idioma del sistema ("5%" o "5 %")
    expect(bar.getAttribute('aria-label')?.replace(/\s/g, '')).toBe('お:5%,き:90%,す:5%')
  })

  test('sin softmax: valores tal cual, sin probabilidad ni eje hasta 100', () => {
    const { getByTestId, getByText, queryByText } = render(
      <N4LClassificationChart values={[-1.5, 0.2, 3.1]} classLabels={classLabels} />,
    )
    expect(getByTestId('Test-ClassificationChart-class').textContent).toBe('す')
    expect(getByText('pages.playground.generator.classify.chart-title-output')).toBeInTheDocument()
    expect(queryByText('pages.playground.generator.classify.confidence')).toBeNull()
    expect(JSON.parse(getByTestId('bar').dataset.values!)).toEqual([-1.5, 0.2, 3.1])
    expect(getByTestId('bar').dataset.yMax).toBeUndefined()
  })

  test('nombres de clase largos (tabular) y clase elegida indicada desde fuera', () => {
    const { getByTestId } = render(
      <N4LClassificationChart values={[0.6, 0.4]} index={1} classLabels={['Iris-setosa', 'Iris-versicolor']} />,
    )
    expect(getByTestId('Test-ClassificationChart-class').textContent).toBe('Iris-versicolor')
  })

  test('con la clase real dice si el modelo acierta', () => {
    const { getByTestId, rerender } = render(<N4LClassificationChart values={[0.1, 0.9]} classLabels={['7', '2']} actualIndex={1} />)
    expect(getByTestId('Test-ClassificationChart-actual')).toHaveClass('bg-success')
    expect(getByTestId('Test-ClassificationChart-actual').textContent).toBe('pages.playground.generator.classify.actual-class')
    rerender(<N4LClassificationChart values={[0.1, 0.9]} classLabels={['7', '2']} actualIndex={0} />)
    expect(getByTestId('Test-ClassificationChart-actual')).toHaveClass('bg-danger')
  })

  test('una clase real sin salida en el modelo (CAR «good») se nombra y cuenta como fallo', () => {
    const { getByTestId } = render(
      <N4LClassificationChart values={[0.1, 0.2, 0.7]} classLabels={['unacc', 'acc', 'vgood', 'good']} actualIndex={3} />,
    )
    expect(getByTestId('Test-ClassificationChart-actual')).toHaveClass('bg-danger')
    expect(JSON.parse(getByTestId('bar').dataset.values!)).toHaveLength(3)
  })

  test('sin clase real no se indica nada', () => {
    const { queryByTestId } = render(<N4LClassificationChart values={[0.1, 0.9]} classLabels={['7', '2']} />)
    expect(queryByTestId('Test-ClassificationChart-actual')).toBeNull()
  })
})
