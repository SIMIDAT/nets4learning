import { render, waitFor } from '@testing-library/react'
import { renderWithRouter } from '@/__tests__/setup/utils'
import App from '@/App'
import Glossary from '@pages/glossary/Glossary'
import Datasets from '@pages/datasets/Datasets'

describe('Tests for Pages', () => {

  test('App / Home', async () => {
    const { getByText, debug: _debug } = renderWithRouter(<App />, {})
    // Esto se da por bueno, porque el primero que se carga es el Home
    await waitFor(() => expect(getByText(/header.home/i)).toBeInTheDocument())
    await waitFor(() => expect(getByText(/welcome-2/i)).toBeInTheDocument())
    await waitFor(() => expect(getByText(/footer.about-us/i)).toBeInTheDocument())
  })

  test('App / Error404', async () => {
    const { getByTestId, debug: _debug } = renderWithRouter(<App />, { path: ['other-page'] })
    await waitFor(() => expect(getByTestId('Test-NotFoundPage')).toBeInTheDocument())
    // _debug()
  })

  test('App / Glossary', async () => {
    const { getByText, debug: _debug } = render(<Glossary />)
    expect(getByText(/pages.glossary.title/i)).toBeInTheDocument()
    // _debug()
  })

  test('App with lazy load / Glossary', async () => {
    const { getByText, debug: _debug } = renderWithRouter(<App />, { path: ['glossary'] })
    await waitFor(() => expect(getByText('pages.glossary.title')).toBeInTheDocument())
    // _debug()
  })

  test('App / Datasets', async () => {
    const { getByText, debug: _debug } = render(<Datasets />)
    expect(getByText(/datasets.title/i)).toBeInTheDocument()
    // _debug()
  })

  test('App with lazy load / Datasets', async () => {
    const { getByText, debug: _debug } = renderWithRouter(<App />, { path: ['datasets'] })
    await waitFor(() => expect(getByText(/datasets.title/i)).toBeInTheDocument())
    // _debug()
  })

})
