import { screen } from '@testing-library/react'
import { renderApp, renderWithRouter } from './setup/utils'
import TestPageEasy from '@pages/TestPageEasy'

describe('App', () => {

  test('renders App', async () => {
    renderApp()
    // Mientras llega el código de la página se ve el indicador de carga; después, la portada
    expect(await screen.findByText(/pages\.index\.regression\.1-title/i)).toBeInTheDocument()
    expect(screen.queryByTestId('Test-PageLoading')).not.toBeInTheDocument()
  })

  test('renders TestPage', () => {
    const { getByText } = renderWithRouter(<TestPageEasy />)
    expect(getByText(/TestPage-Easy/i)).toBeInTheDocument()
  })

})