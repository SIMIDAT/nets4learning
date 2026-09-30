import { waitFor } from '@testing-library/react'
import { renderApp } from '../setup/utils'

describe('TestPage', () => {

  test('App with lazy load / TestPage Easy', async () => {
    const { getByText } = renderApp({ path: ['test-page-easy-lazy'] })
    await waitFor(() => expect(getByText('TestPage-Easy')).toBeInTheDocument())
  })

  test('App with lazy load / TestPage Advanced', async () => {
    const { getByText, getByTestId } = renderApp({ path: ['test-page-advanced-lazy', '0', 'pi', 'example'] })
    await waitFor(() => expect(getByText('TestPage-Advanced')).toBeInTheDocument())
    await waitFor(() => expect(getByTestId('Test-TestPageAdvanced-id')).toBeInTheDocument())
    await waitFor(() => expect(getByTestId('Test-TestPageAdvanced-option')).toBeInTheDocument())
    await waitFor(() => expect(getByTestId('Test-TestPageAdvanced-example')).toBeInTheDocument())
  })

})
