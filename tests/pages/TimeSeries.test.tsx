import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import TimeSeries from '@pages/playground/5_TimeSeries/TimeSeries'
import { stubPublicFetch } from '../helpers/n4l'

// jsdom no dibuja en un canvas: las gráficas, con lo que describen para quien no las ve
vi.mock('react-chartjs-2', () => ({
  Line: ({ 'aria-label': label }: { 'aria-label': string }) => <div role={'img'} aria-label={label} />,
}))

const prefix = 'pages.playground.time-series.'

const renderPage = (dataset: string, search = '') => render(
  <MemoryRouter initialEntries={[`/playground/time-series/dataset/${dataset}${search}`]}>
    <TimeSeries dataset={dataset} />
  </MemoryRouter>,
)

describe('Series temporales (/playground/time-series/dataset/…)', () => {
  beforeEach(() => { stubPublicFetch() })
  afterEach(() => { vi.unstubAllGlobals() })

  test('la serie del paquete con su preparación: las primeras ventanas, y sin datos suficientes no se entrena', async () => {
    const { findByTestId, getByTestId, getByLabelText, queryByTestId } = renderPage('AIRLINE-PASSENGERS')
    expect(await findByTestId('Test-TimeSeries-Summary', {}, { timeout: 5000 })).toHaveTextContent(prefix + 'frequency.month')
    // La del manifiesto: ventana de 24, estación de 12 y un 20 % de prueba
    expect(getByLabelText(prefix + 'prep.window')).toHaveValue(24)
    expect(getByLabelText(prefix + 'prep.season')).toHaveValue(12)
    const rows = within(getByTestId('Test-TimeSeries-Windows')).getAllByRole('row') as HTMLTableRowElement[]
    expect(rows.slice(1).map((row) => row.cells[0].textContent)).toEqual(['1951-01', '1951-02', '1951-03'])
    expect(rows[1].cells[2]).toHaveTextContent('145')
    // La red del manifiesto: Dense de 32 y la salida
    expect(getByTestId('Test-TrainButton')).toBeEnabled()

    fireEvent.change(getByLabelText(prefix + 'prep.window'), { target: { value: '120' } })
    expect(getByTestId('Test-TimeSeries-TooShort')).toBeInTheDocument()
    expect(queryByTestId('Test-TimeSeries-Windows')).toBeNull()
    expect(getByTestId('Test-TrainButton')).toBeDisabled()
  })

  test('al diferenciar, la red ve los cambios: el primer ejemplo empieza un valor después', async () => {
    const { findByTestId, getByTestId, getByLabelText } = renderPage('AIRLINE-PASSENGERS')
    await findByTestId('Test-TimeSeries-Windows', {}, { timeout: 5000 })
    fireEvent.click(getByLabelText(prefix + 'prep.difference'))
    const rows = within(getByTestId('Test-TimeSeries-Windows')).getAllByRole('row') as HTMLTableRowElement[]
    expect(rows[1].cells[0]).toHaveTextContent('1951-02')
    // Marzo de 1951 (178) menos febrero (150)
    expect(rows[2].cells[2]).toHaveTextContent('+28')
  })

  test('una serie propia: desde /datasets (?dataset=…) se carga con su columna de valores y la de fechas', async () => {
    const { findByLabelText, getByTestId } = renderPage('UPLOAD', '?dataset=daily-min-temperatures')
    expect(getByTestId('Test-TimeSeries-Upload')).toBeInTheDocument()
    expect(await findByLabelText(prefix + 'upload.value-column', {}, { timeout: 5000 })).toHaveValue('Temp')
    expect(await findByLabelText(prefix + 'upload.date-column')).toHaveValue('Date')
    // Cada día: la estación por defecto es una semana
    expect(await findByLabelText(prefix + 'prep.season')).toHaveValue(7)
    expect(getByTestId('Test-TimeSeries-Summary')).toHaveTextContent(prefix + 'frequency.day')
  })
})
