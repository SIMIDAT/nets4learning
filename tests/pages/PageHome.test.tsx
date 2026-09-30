import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Home from '@pages/_home/Home'

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

  test('recuerda la última tarea elegida al volver a la home', async () => {
    const first = render(<MemoryRouter><Home /></MemoryRouter>)
    fireEvent.click(first.getByTestId('Test-InitialMenu-LinearRegression'))
    first.unmount()

    const { findByTestId } = render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await findByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeInTheDocument()
  })
})
