import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

import N4LModelCode from '@components/neural-network/N4LModelCode'
import type { ModelCode_t } from '@core/nn-utils/modelCode'

const SPEC: ModelCode_t = {
  inputShape  : [4],
  layers      : [{ kind: 'dense', units: 10, activation: 'relu' }, { kind: 'dense', units: 3, activation: 'softmax' }],
  optimizer   : 'train-adam',
  learningRate: 0.01,
  loss        : 'categoricalCrossentropy',
  metrics     : ['accuracy'],
  epochs      : 20,
  batchSize   : 32,
  dataComment : 'X e y',
}

describe('N4LModelCode: Ver el código', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  test('sin datos (no se sabe cuántas entradas tiene la red), no se enseña', () => {
    render(<N4LModelCode spec={null} task={'tabular-classification'} />)
    expect(screen.queryByTestId('Test-ModelCode')).toBeNull()
  })

  test('el código en TensorFlow.js y, al cambiar, en Keras; y se copia', async () => {
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<N4LModelCode spec={SPEC} task={'tabular-classification'} />)
    const code = () => screen.getByTestId('Test-ModelCode-Code').textContent ?? ''
    expect(code()).toContain("model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [4] }))")

    fireEvent.click(screen.getByRole('button', { name: 'Keras (Python)' }))
    expect(screen.getByRole('button', { name: 'Keras (Python)' })).toHaveAttribute('aria-pressed', 'true')
    expect(code()).toContain('layers.Dense(10, activation="relu")')

    await act(async () => { fireEvent.click(screen.getByTestId('Test-ModelCode-Copy')) })
    expect(writeText).toHaveBeenCalledWith(code())
    expect(screen.getByRole('status')).toHaveTextContent('model-code.copied')
  })
})
