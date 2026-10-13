import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Home from '@pages/_home/Home'
import { sectionId } from '@components/divider/sectionId'

describe('Page Home', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('App / HOME', async () => {
    const { getByTestId, findByTestId } = render(<MemoryRouter><Home /></MemoryRouter>)
    expect(getByTestId('Test-InitialMenu')).toBeInTheDocument()

    // Al elegir regresión aparece su tarjeta con el acceso a los modelos.
    fireEvent.click(getByTestId('Test-InitialMenu-LinearRegression'))
    expect(await findByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeInTheDocument()
  })

  test('al elegir una tarea, la página baja hasta sus tarjetas con el foco en su separador (al entrar, no se mueve)', async () => {
    // El scrollIntoView vacío de tests/setupTests.ts (jsdom no lo tiene), sin lo de las pruebas anteriores
    const scroll = vi.mocked(Element.prototype.scrollIntoView)
    scroll.mockClear()
    const { getByTestId, findByTestId } = render(<MemoryRouter initialEntries={['/?task=regression']}><Home /></MemoryRouter>)
    expect(await findByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeInTheDocument()
    expect(scroll).not.toHaveBeenCalled()

    fireEvent.click(getByTestId('Test-InitialMenu-Clustering'))
    expect(await findByTestId('Test-GoTo-SelectDataset-Clustering')).toBeInTheDocument()
    const divider = document.getElementById(sectionId('hr.tasks'))
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(divider)
    expect(divider).toHaveFocus()
  })

  test('series temporales: como la clasificación tabular, sus modelos ya entrenados y diseñar una red', async () => {
    const { getByTestId, findByTestId } = render(<MemoryRouter><Home /></MemoryRouter>)
    fireEvent.click(getByTestId('Test-InitialMenu-TimeSeries'))
    expect(await findByTestId('Test-GoTo-SelectModel-TimeSeries')).toHaveTextContent('pages.index.time-series.1-button')
    expect(getByTestId('Test-GoTo-SelectDataset-TimeSeries')).toHaveTextContent('pages.index.time-series.2-button')
  })

  test('recuerda la última tarea elegida al volver a la home', async () => {
    const first = render(<MemoryRouter><Home /></MemoryRouter>)
    fireEvent.click(first.getByTestId('Test-InitialMenu-LinearRegression'))
    first.unmount()

    const { findByTestId } = render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await findByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeInTheDocument()
  })

  test('?task= (la miga de pan de la tarea) abre esa tarea y la recuerda', async () => {
    localStorage.setItem('selected-task', 'tabular-classification')
    const first = render(<MemoryRouter initialEntries={['/?task=regression']}><Home /></MemoryRouter>)
    expect(await first.findByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeInTheDocument()
    first.unmount()

    const { findByTestId } = render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await findByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeInTheDocument()
  })

  test('con ?task= se puede elegir otra tarea', async () => {
    const { getByTestId, queryByTestId } = render(<MemoryRouter initialEntries={['/?task=regression']}><Home /></MemoryRouter>)
    fireEvent.click(getByTestId('Test-InitialMenu-TabularClassification'))
    expect(queryByTestId('Test-GoTo-SelectModel-LinearRegression')).not.toBeInTheDocument()
    expect(localStorage.getItem('selected-task')).toBe('tabular-classification')
  })
})
