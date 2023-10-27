import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithRouter } from '@/__tests__/setup/utils'
import App from '@/App'

describe('LinearRegression', () => {

  test('App / DescriptionLinearRegression', async () => {
    const { getByTestId } = renderWithRouter(<App />, { path: ['playground', 'description-linear-regression'] })
    await waitFor(() => expect(getByTestId('Test-DescriptionLinearRegression')).toBeInTheDocument())
  })

  test('renders GoTo ModelReviewLinearRegression Review SALARY', async () => {
    const { getByTestId, debug } = renderWithRouter(<App />)
    // Seleccionamos el botón de Regresión lineal
    const Button_InitialMenu_LinearRegression = await waitFor(() => getByTestId('Test-InitialMenu-LinearRegression'))
    await waitFor(() => fireEvent.click(Button_InitialMenu_LinearRegression))

    // Seleccionamos el botón de Modelos de Regresión lineal
    const Button_GoTo_SelectModel_LinearRegression = await waitFor(() => getByTestId('Test-GoTo-SelectModel-LinearRegression'))
    await waitFor(() => fireEvent.click(Button_GoTo_SelectModel_LinearRegression))

    // Esperamos a que se cargue el menu de selección de modelos
    await waitFor(() => getByTestId('Test-MenuSelectModel'))

    // Cambiamos el selector de los modelos a DATASET_SALARY
    const Select_SelectModel = await waitFor(() => getByTestId('Test-MenuSelectModel-Select'))
    await waitFor(() => fireEvent.change(Select_SelectModel, { target: { value: 'SALARY' } }))

    // Cargamos la nueva página con el modelo de regresión lineal con el conjunto de datos de SALARY
    const Button_Submit_GoTo_ModelReviewLinearRegression = await waitFor(() => getByTestId('Test-MenuSelectModel-Submit'))
    await waitFor(() => fireEvent.click(Button_Submit_GoTo_ModelReviewLinearRegression))

    await waitFor(() => expect(getByTestId('Test-ModelReviewLinearRegression')).toBeInTheDocument())
    // debug_ModelReviewLinearRegression()
  })

})
