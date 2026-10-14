import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import Lab from '@pages/lab/Lab'

// jsdom no dibuja en un canvas (getContext da null): se comprueba lo que dice la página
function renderLab() {
  render(<MemoryRouter initialEntries={['/lab']}><Lab /></MemoryRouter>)
}

describe('Lab: el laboratorio 2D', () => {
  afterEach(() => cleanup())

  test('sin entrenar, lo dice; con una época, cuenta cómo va (para quien no ve el plano)', () => {
    renderLab()
    expect(screen.getByTestId('Test-Lab-Summary')).toHaveTextContent('pages.lab.not-trained')
    fireEvent.click(screen.getByTestId('Test-Lab-Step'))
    expect(screen.getByTestId('Test-Lab-Summary')).toHaveTextContent('pages.lab.summary')
    // y el lector de pantalla lo oye
    expect(screen.getByRole('status')).toHaveTextContent('pages.lab.summary')
  })

  test('«Prueba esto» pone sus datos y su red y explica qué enseña', () => {
    renderLab()
    fireEvent.click(screen.getByTestId('Test-Lab-Experiment-xor-line'))
    expect(screen.getByTestId('Test-Lab-Experiment-xor-line')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('Test-Lab-Lesson')).toHaveTextContent('pages.lab.experiments.xor-line.lesson')
    expect(screen.getByLabelText('pages.lab.data.dataset')).toHaveValue('xor')
    expect(screen.getByText('pages.lab.network.none')).toBeInTheDocument()
  })

  test('cambiar la red la empieza de cero; cambiar la tasa de aprendizaje, no', () => {
    renderLab()
    fireEvent.click(screen.getByTestId('Test-Lab-Step'))
    fireEvent.change(screen.getByLabelText('pages.lab.training.learning-rate'), { target: { value: '0.3' } })
    expect(screen.getByTestId('Test-Lab-Summary')).toHaveTextContent('pages.lab.summary')
    fireEvent.click(screen.getByRole('button', { name: 'pages.lab.network.add' }))
    expect(screen.getByTestId('Test-Lab-Summary')).toHaveTextContent('pages.lab.not-trained')
  })

  test('siempre entra algo en la red: la última característica no se puede quitar', () => {
    renderLab()
    fireEvent.click(screen.getByLabelText('pages.lab.features.y'))
    expect(screen.getByLabelText('pages.lab.features.x')).toBeDisabled()
  })
})
