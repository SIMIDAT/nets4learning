import { waitFor } from '@testing-library/react'
import { renderApp } from '../setup/utils'

describe('RegressionDescription', () => {
  test('App / DescriptionRegression', async () => {
    const { getByTestId } = renderApp({ path: ['playground', 'description-regression'] })
    await waitFor(() => expect(getByTestId('Test-DescriptionLinearRegression')).toBeInTheDocument())
  })
})