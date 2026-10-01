import { fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { renderApp } from '../setup/utils'
import Glossary from '@pages/glossary/Glossary'
import Datasets from '@pages/datasets/Datasets'

describe('Tests for Pages', () => {
  beforeAll(() => {
    // jsdom no implementa scrollIntoView (el glosario lo usa para llevar la vista al apartado abierto)
    Element.prototype.scrollIntoView = vi.fn()
  })

  test('App / Home', async () => {
    const { getByText, debug: _debug } = renderApp({})
    // Esto se da por bueno, porque el primero que se carga es el Home
    await waitFor(() => expect(getByText(/header.home/i)).toBeInTheDocument())
    await waitFor(() => expect(getByText(/welcome-2/i)).toBeInTheDocument())
    await waitFor(() => expect(getByText(/footer.about-us/i)).toBeInTheDocument())
  })

  test('App / Error404', async () => {
    const { getByTestId, debug: _debug } = renderApp({ path: ['other-page'] })
    await waitFor(() => expect(getByTestId('Test-NotFoundPage')).toBeInTheDocument())
    // _debug()
  })

  test('App / Glossary', async () => {
    const { getByText, debug: _debug } = render(<MemoryRouter><Glossary /></MemoryRouter>)
    expect(getByText(/pages.glossary.title/i)).toBeInTheDocument()
  })

  test('App / Glossary abre el apartado del enlace de ayuda', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/glossary?action=task-00-editor-hyperparameters-open']}><Glossary /></MemoryRouter>,
    )
    // El acordeón del editor de hiperparámetros está abierto (su botón no está colapsado)
    expect(container.querySelector('#glossary-item-1 .accordion-button')).not.toHaveClass('collapsed')
    expect(container.querySelector('#glossary-item-0 .accordion-button')).toHaveClass('collapsed')
    // _debug()
  })

  test('App with lazy load / Glossary', async () => {
    const { getByText, debug: _debug } = renderApp({ path: ['glossary'] })
    await waitFor(() => expect(getByText('pages.glossary.title')).toBeInTheDocument())
    // _debug()
  })

  test('App / Datasets', async () => {
    const { getByText, debug: _debug } = render(<Datasets />)
    expect(getByText(/datasets.title/i)).toBeInTheDocument()
    // _debug()
  })

  test('Datasets: el botón de información abre un modal con los datos y la descarga', async () => {
    const { getByTestId, findByRole } = render(<Datasets />)
    fireEvent.click(getByTestId('Test-DatasetInfo-IRIS'))
    const modal = await findByRole('dialog')
    expect(modal).toHaveTextContent('datasets-models.0-tabular-classification.list-datasets.0-option-2')
    expect(modal).toHaveTextContent('pages.menu.info.rows')
    expect(modal.querySelector('a[download]')).toHaveAttribute('href', expect.stringContaining('iris.csv'))
  })

  test('Datasets: un dataset extra explica para qué sirve', async () => {
    const { getByTestId, findByRole } = render(<Datasets />)
    fireEvent.click(getByTestId('Test-DatasetInfo-datasets/hepatitis-c.csv'))
    expect(await findByRole('dialog')).toHaveTextContent('datasets.extra-text')
  })

  test('Datasets: la pestaña de variables enseña las columnas del CSV', async () => {
    const { getByTestId, findByRole, findByTestId } = render(<Datasets />)
    fireEvent.click(getByTestId('Test-DatasetInfo-datasets/hepatitis-c.csv'))
    fireEvent.click(await findByRole('tab', { name: 'datasets.variables.title' }))
    const table = await findByTestId('Test-DatasetVariables')
    expect(table).toHaveTextContent('GGT')
    expect(table).toHaveTextContent('datasets.variables.roles.Target')
  })

  test('App with lazy load / Datasets', async () => {
    const { getByText, debug: _debug } = renderApp({ path: ['datasets'] })
    await waitFor(() => expect(getByText(/datasets.title/i)).toBeInTheDocument())
    // _debug()
  })

})
