import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest'
import { fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import * as tfjs from '@tensorflow/tfjs'

import ModelReviewTimeSeries from '@pages/playground/5_TimeSeries/ModelReviewTimeSeries'
import { stubPublicFetch } from '../helpers/n4l'

// jsdom no dibuja en un canvas: las gráficas, con lo que describen para quien no las ve
vi.mock('react-chartjs-2', () => ({
  Line: ({ 'aria-label': label }: { 'aria-label': string }) => <div role={'img'} aria-label={label} />,
}))

const prefix = 'pages.playground.time-series.review.'

describe('Modelo ya entrenado de una serie (/playground/time-series/model/…)', () => {
  beforeAll(async () => {
    stubPublicFetch()
    await tfjs.setBackend('cpu')
  })
  afterAll(() => { vi.unstubAllGlobals() })

  test('como en las demás tareas: su ficha, la serie y un formulario con la ventana que predice un valor', async () => {
    const { findByTestId, getByTestId, queryByTestId } = render(
      <MemoryRouter><ModelReviewTimeSeries dataset={'AIRLINE-PASSENGERS'} /></MemoryRouter>,
    )
    // La ficha: el resumen de la red, el paquete, cómo predice lo que no vio y la descripción
    expect(getByTestId('Test-ModelCard')).toHaveTextContent('n4l-airline-passengers:tasks.time-series.name')
    expect(getByTestId('Test-TimeSeries-TestMetrics')).toHaveTextContent(prefix + 'metrics-seasonal')
    expect(getByTestId('Test-TimeSeries-TrainYours')).toHaveAttribute('href', '/playground/time-series/dataset/AIRLINE-PASSENGERS')

    // El formulario empieza con el primer valor de la prueba (1958-08): los 24 meses anteriores
    const form = await findByTestId('Test-TimeSeries-PredictForm', {}, { timeout: 10_000 })
    const inputs = within(form).getAllByRole('spinbutton')
    expect(inputs).toHaveLength(24)
    expect(within(form).getByLabelText('1956-08')).toHaveValue(405)
    expect(within(form).getByLabelText('1958-07')).toHaveValue(491)

    fireEvent.click(getByTestId('Test-TimeSeries-PredictButton'))
    const result = await findByTestId('Test-TimeSeries-PredictResult')
    expect(within(result).getByTestId('Test-TimeSeries-PredictValue').textContent).toMatch(/\d/)
    expect(within(result).getByTestId('Test-TimeSeries-PredictActual')).toBeInTheDocument()

    // Con un valor cambiado ya no es el de la serie: sin valor real
    fireEvent.change(within(form).getByLabelText('1958-07'), { target: { value: '600' } })
    fireEvent.click(getByTestId('Test-TimeSeries-PredictButton'))
    await vi.waitFor(() => expect(queryByTestId('Test-TimeSeries-PredictActual')).toBeNull())
  }, 30_000)
})
