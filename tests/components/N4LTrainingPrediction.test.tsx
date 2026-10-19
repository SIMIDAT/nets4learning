import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import N4LTrainingPrediction from '@components/neural-network/N4LTrainingPrediction'
import N4LTrainingDiagnosis from '@components/neural-network/N4LTrainingDiagnosis'
import { diagnoseTraining } from '@core/training/diagnoseTraining'
import { isRightPrediction, setPrediction } from '@core/training/trainingPrediction'

// La pérdida de entrenamiento baja siempre; la de prueba baja hasta la época 8 y luego sube: sobreajuste
const epochs = Array.from({ length: 20 }, (_, i) => i)
const OVERFITTING = { loss: epochs.map((i) => 1 / (1 + i)), val_loss: epochs.map((i) => (i < 8 ? 1 - i * 0.08 : 0.36 + (i - 8) * 0.06)) }
// Las dos bajan y se estabilizan: aprende bien
const GOOD = { loss: epochs.map((i) => 0.2 + 0.8 * Math.exp(-i / 2)), val_loss: epochs.map((i) => 0.25 + 0.8 * Math.exp(-i / 2)) }

function renderAt(path: string, ui: React.ReactNode) {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
}

describe('Predice antes de entrenar', () => {
  afterEach(() => cleanup())

  test('los historiales de prueba dan el diagnóstico que se espera', () => {
    expect(diagnoseTraining(OVERFITTING).map(({ kind }) => kind)).toContain('overfitting')
    expect(diagnoseTraining(GOOD).map(({ kind }) => kind)).toContain('good')
  })

  test('«apenas aprenderá» también se acierta si la pérdida empeoró', () => {
    expect(isRightPrediction('not-learning', ['worse'])).toBe(true)
    expect(isRightPrediction('good', ['overfitting'])).toBe(false)
  })

  test('se elige antes de entrenar y el diagnóstico de ese modelo dice si se acertó', () => {
    const page = '/playground/tabular-classification/dataset/IRIS'
    renderAt(page, <N4LTrainingPrediction nextModel={1} />)
    fireEvent.click(screen.getByLabelText('training-prediction.options.overfitting'))
    expect(screen.getByText('training-prediction.chosen')).toBeInTheDocument()
    cleanup()

    renderAt(page, <N4LTrainingDiagnosis history={OVERFITTING} model={1} />)
    expect(screen.getByTestId('Test-TrainingPrediction-Result')).toHaveTextContent('training-prediction.right')
  })

  test('si pasó otra cosa, lo dice; y la predicción es de ese modelo y de esa página', () => {
    const page = '/playground/regression/dataset/SALARY'
    setPrediction(page, 2, 'diverged')
    renderAt(page, <N4LTrainingDiagnosis history={GOOD} model={2} />)
    expect(screen.getByTestId('Test-TrainingPrediction-Result')).toHaveTextContent('training-prediction.wrong')
    cleanup()
    // Otro modelo u otra página: sin predicción
    renderAt(page, <N4LTrainingDiagnosis history={GOOD} model={3} />)
    expect(screen.queryByTestId('Test-TrainingPrediction-Result')).toBeNull()
    cleanup()
    renderAt('/playground/regression/dataset/AUTO_MPG', <N4LTrainingDiagnosis history={GOOD} model={2} />)
    expect(screen.queryByTestId('Test-TrainingPrediction-Result')).toBeNull()
  })

  test('mientras se entrena no se puede cambiar', () => {
    renderAt('/x', <N4LTrainingPrediction nextModel={1} disabled={true} />)
    expect(screen.getByLabelText('training-prediction.options.good')).toBeDisabled()
  })
})
