import { describe, test, expect, beforeAll } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import * as tfjs from '@tensorflow/tfjs'

import N4LModelSummaryButton from '@components/neural-network/N4LModelSummaryButton'

const model = () => tfjs.sequential({
  layers: [
    tfjs.layers.dense({ inputShape: [4], units: 3, activation: 'relu', name: 'oculta' }),
    tfjs.layers.dense({ units: 2, activation: 'softmax', name: 'salida' }),
  ],
})

describe('N4LModelSummaryButton', () => {
  // En jsdom no hay WebGL
  beforeAll(async () => {
    await tfjs.setBackend('cpu')
  })

  test('el botón despliega una tabla con cada capa, su forma de salida y sus parámetros', () => {
    render(<N4LModelSummaryButton model={model()} title={'Iris'} />)
    const toggle = screen.getByTestId('Test-ModelSummary-Toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const table = within(screen.getByTestId('Test-ModelSummary')).getByRole('table')
    const rows = within(table).getAllByRole('row').map((row) => row.textContent)
    // Cabecera, dos capas y el total: 4 × 3 + 3 = 15 y 3 × 2 + 2 = 8
    expect(rows).toHaveLength(4)
    expect(rows[1]).toContain('oculta')
    expect(rows[1]).toContain('(—, 3)')
    expect(rows[1]).toContain('15')
    expect(rows[2]).toContain('(—, 2)')
    expect(rows[3]).toContain('23')
    fireEvent.click(toggle)
    expect(screen.queryByTestId('Test-ModelSummary')).toBeNull()
  })

  test('sin un LayersModel (MobileNet, los detectores) no aparece', () => {
    const { container } = render(<N4LModelSummaryButton model={{}} title={'MobileNet'} />)
    expect(container).toBeEmptyDOMElement()
  })
})
