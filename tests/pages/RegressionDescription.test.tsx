import { waitFor } from '@testing-library/react'
import { renderWithRouter } from '../setup/utils'
import App from '@/App'

describe('RegressionDescription', () => {
  test('App / DescriptionRegression', async () => {
    const { getByTestId } = renderWithRouter(<App />, { path: ['playground', 'description-regression'] })
    await waitFor(() => expect(getByTestId('Test-DescriptionRegression')).toBeInTheDocument())
  })
})