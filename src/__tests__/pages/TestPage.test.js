import { waitFor } from '@testing-library/react'
import { renderWithRouter } from '@/__tests__/setup/utils'
import App from '@/App'

describe('TestPage', () => {

  test('App / TestPage Easy', async () => {
    const { getByText, debug } = renderWithRouter(<App />, { path: ['test-page-easy'] })
    expect(getByText('TestPage-Easy')).toBeInTheDocument()
  })

  test('App with lazy load / TestPage Easy', async () => {
    const { getByText, debug } = renderWithRouter(<App />, { path: ['test-page-easy-lazy'] })
    await waitFor(() => expect(getByText('TestPage-Easy')).toBeInTheDocument())
    // debug()
  })

  test('App / TestPage Advanced', async () => {
    const { getByText, getByTestId, debug } = renderWithRouter(<App />, { path: ['test-page-advanced', '0', 'pi', 'example'] })
    expect(getByText('TestPage-Advanced')).toBeInTheDocument()
    expect(getByTestId('Test-TestPageAdvanced-id')).toBeInTheDocument()
    expect(getByTestId('Test-TestPageAdvanced-option')).toBeInTheDocument()
    expect(getByTestId('Test-TestPageAdvanced-example')).toBeInTheDocument()
    // debug()
  })

  test('App with lazy load / TestPage Advanced', async () => {
    const { getByText, getByTestId, debug } = renderWithRouter(<App />, { path: ['test-page-advanced-lazy', '0', 'pi', 'example'] })
    await waitFor(() => expect(getByText('TestPage-Advanced')).toBeInTheDocument())
    await waitFor(() => expect(getByTestId('Test-TestPageAdvanced-id')).toBeInTheDocument())
    await waitFor(() => expect(getByTestId('Test-TestPageAdvanced-option')).toBeInTheDocument())
    await waitFor(() => expect(getByTestId('Test-TestPageAdvanced-example')).toBeInTheDocument())
    // debug()
  })

})
