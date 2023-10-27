import { getByTestId, render, waitFor } from '@testing-library/react'
import { renderWithRouter } from '@/__tests__/setup/utils'
import App from '@/App'
import Glossary from '@pages/glossary/Glossary'
import Datasets from '@pages/datasets/Datasets'

describe('Tests for Pages', () => {

  test('App / Home', async () => {
    const { getByText, debug } = renderWithRouter(<App />, {})
    // Esto se da por bueno, porque el primero que se carga es el Home
    await waitFor(() => expect(getByText(/header.home/i)).toBeInTheDocument())
    await waitFor(() => expect(getByText(/welcome-2/i)).toBeInTheDocument())
    await waitFor(() => expect(getByText(/footer.about-us/i)).toBeInTheDocument())
  })

  test('App / Error404', async () => {
    const { getByTestId, debug } = renderWithRouter(<App />, { path: ['other-page'] })
    await waitFor(() => expect(getByTestId('Test-NotFoundPage')).toBeInTheDocument())
    // debug()
  })


  test('App / Glossary', async () => {
    const { getByText, debug } = render(<Glossary />)
    expect(getByText(/pages.glossary.title/i)).toBeInTheDocument()
  })

  test('App with lazy load / Glossary', async () => {
    const { getByText, debug } = renderWithRouter(<App />, { path: ['glossary'] })
    await waitFor(() => expect(getByText('pages.glossary.title')).toBeInTheDocument())
    // debug()
  })

  test('App / Datasets', async () => {
    const { getByText, debug } = render(<Datasets />)
    expect(getByText(/datasets.title/i)).toBeInTheDocument()
  })

  test('App with lazy load / Datasets', async () => {
    const { getByText, debug } = renderWithRouter(<App />, { path: ['datasets'] })
    await waitFor(() => expect(getByText(/datasets.title/i)).toBeInTheDocument())
    // debug()
  })

})
