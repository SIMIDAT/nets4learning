import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '@pages/_home/Home'

describe('Page Home', () => {
  test('App / HOME', async () => {
    const { getByTestId, findByTestId } = render(<MemoryRouter><Home /></MemoryRouter>)
    expect(getByTestId('Test-InitialMenu')).toBeInTheDocument()

    // Al elegir regresión aparece su tarjeta con el acceso a los modelos.
    fireEvent.click(getByTestId('Test-InitialMenu-LinearRegression'))
    expect(await findByTestId('Test-GoTo-SelectModel-LinearRegression')).toBeInTheDocument()
  })
})
