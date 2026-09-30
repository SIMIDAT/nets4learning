import { waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { renderApp } from '../setup/utils'

describe('Regression', () => {

  test('Init', async () => {
    // No entiendo nada pero he de iniciar esto, ya que la primera vez falla
    renderApp({ path: ['home']})
  })

  test('renders GoTo ModelReviewRegression Review AUTO_MPG', async () => {
    const { getByTestId } = renderApp({ path: ['home']})
    // Seleccionamos el botón de Regresión lineal
    await waitFor(() => {
      expect(getByTestId('Test-InitialMenu')).toBeInTheDocument()
    })
    // Seleccionamos el botón de Regresión y después el de sus modelos preentrenados
    await waitFor(() => fireEvent.click(getByTestId('Test-InitialMenu-LinearRegression')))
    const Button_GoTo_SelectModel_Regression = await waitFor(() => getByTestId('Test-GoTo-SelectModel-LinearRegression'))
    await waitFor(() => fireEvent.click(Button_GoTo_SelectModel_Regression))

    // Esperamos a que se cargue la galería de modelos y abrimos AUTO_MPG
    await waitFor(() => getByTestId('Test-MenuSelectModel'))
    const Link_Open_AUTO_MPG = await waitFor(() => getByTestId('Test-MenuSelectModel-Open-AUTO_MPG'))
    await waitFor(() => fireEvent.click(Link_Open_AUTO_MPG))

    await waitFor(() => expect(getByTestId('Test-ModelReviewRegression')).toBeInTheDocument())
    // debug_ModelReviewRegression()
  })

})
