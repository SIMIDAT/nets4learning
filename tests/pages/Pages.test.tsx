import { fireEvent, render, within, waitFor } from '@testing-library/react'
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

  test('App / Glossary lleva al apartado del enlace de ayuda', async () => {
    const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView)
    scrollIntoView.mockClear()
    const { container } = render(
      <MemoryRouter initialEntries={['/glossary?action=task-00-editor-hyperparameters-open']}><Glossary /></MemoryRouter>,
    )
    // La vista va al grupo del editor de hiperparámetros
    const group = container.querySelector('#glossary-editor-hyperparameters')
    expect(group).not.toBeNull()
    expect(scrollIntoView.mock.contexts).toContain(group)
  })

  test('App with lazy load / Glossary', async () => {
    const { getByText, debug: _debug } = renderApp({ path: ['glossary'] })
    await waitFor(() => expect(getByText('pages.glossary.title')).toBeInTheDocument())
    // _debug()
  })

  test('App / Datasets', async () => {
    const { getByText, debug: _debug } = render(<MemoryRouter><Datasets /></MemoryRouter>)
    expect(getByText(/datasets.title/i)).toBeInTheDocument()
    // _debug()
  })

  test('Datasets: cada CSV se abre en el AED; con varios ficheros, uno por fichero', async () => {
    const { getByTestId, getByText, queryAllByText } = render(<MemoryRouter><Datasets /></MemoryRouter>)
    expect(getByTestId('Test-DatasetAnalyze-iris')).toHaveAttribute('href', '/analyze?dataset=iris')
    // Ya no hay columna de referencia: el enlace a la fuente va en el modal de información
    expect(queryAllByText('datasets.dataset-reference')).toHaveLength(0)
    // Regresión: el vino tiene dos CSV (tinto y blanco)
    fireEvent.click(getByText('pages.index.regression.1-title'))
    expect(getByTestId('Test-DatasetAnalyze-wine-quality-red')).toHaveTextContent('wine-quality-red')
    expect(getByTestId('Test-DatasetAnalyze-wine-quality-white')).toHaveAttribute('href', '/analyze?dataset=wine-quality-white')
  })

  test('Datasets: el botón de información abre un modal con los datos y la descarga', async () => {
    const { getByTestId, findByRole } = render(<MemoryRouter><Datasets /></MemoryRouter>)
    fireEvent.click(getByTestId('Test-DatasetInfo-IRIS'))
    const modal = await findByRole('dialog')
    expect(modal).toHaveTextContent('n4l-iris:tasks.tabular-classification.name')
    expect(modal).toHaveTextContent('pages.menu.info.rows')
    expect(modal.querySelector('a[download]')).toHaveAttribute('href', expect.stringContaining('iris.csv'))
  })

  test('Datasets: el modal de un CSV tiene sus datos y sus estadísticas; el de imágenes, no', async () => {
    const { getByTestId, getByText, findByRole } = render(<MemoryRouter><Datasets /></MemoryRouter>)
    fireEvent.click(getByTestId('Test-DatasetInfo-IRIS'))
    const modal = await findByRole('dialog')
    const tabs = within(modal).getAllByRole('tab').map((tab) => tab.textContent)
    expect(tabs).toEqual(['datasets.dataset-details', 'datasets.variables.title', 'datasets.data.title', 'datasets.data.describe'])
    fireEvent.click(within(modal).getByRole('button', { name: /close|cerrar/i }))

    fireEvent.click(getByText('pages.index.image-classification.1-title'))
    fireEvent.click(getByTestId('Test-DatasetInfo-IMAGE-MNIST'))
    const imagesModal = await findByRole('dialog')
    expect(within(imagesModal).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['datasets.dataset-details'])
  })

  test('Datasets: cada conjunto se entrena desde su tarjeta, y se prueba su modelo si lo hay', () => {
    const { getByTestId, queryByTestId, getByText } = render(<MemoryRouter><Datasets /></MemoryRouter>)
    expect(getByTestId('Test-DatasetTrain-IRIS')).toHaveAttribute('href', '/playground/tabular-classification/dataset/IRIS')
    expect(getByTestId('Test-DatasetModel-IRIS')).toHaveAttribute('href', '/playground/tabular-classification/model/IRIS')
    // Uno de práctica: en la página de subir datos, ya cargado (como en el AED, por su clave)
    expect(getByTestId('Test-DatasetTrain-n4l/wine.n4l/data/wine.csv')).toHaveAttribute('href', '/playground/tabular-classification/dataset/UPLOAD?dataset=wine')
    expect(queryByTestId('Test-DatasetModel-n4l/wine.n4l/data/wine.csv')).toBeNull()
    // Regresión: Salary, con su modelo ya entrenado (en su paquete .n4l)
    fireEvent.click(getByText('pages.index.regression.1-title'))
    expect(getByTestId('Test-DatasetTrain-SALARY')).toHaveAttribute('href', '/playground/regression/dataset/SALARY')
    expect(getByTestId('Test-DatasetModel-SALARY')).toHaveAttribute('href', '/playground/regression/model/SALARY')
  })

  test('Datasets: un dataset extra explica para qué sirve', async () => {
    const { getByTestId, findByRole } = render(<MemoryRouter><Datasets /></MemoryRouter>)
    fireEvent.click(getByTestId('Test-DatasetInfo-datasets/hepatitis-c.csv'))
    expect(await findByRole('dialog')).toHaveTextContent('datasets.extra-text')
  })

  test('Datasets: los del agrupamiento se agrupan (sin modelo) y su información no espera a ningún modelo', async () => {
    // La pestaña, desde la dirección (/datasets?task=clustering)
    const { getByTestId, queryByTestId, getByText, findByRole } = render(<MemoryRouter initialEntries={['/datasets?task=clustering']}><Datasets /></MemoryRouter>)
    expect(getByTestId('Test-DatasetTrain-IRIS')).toHaveAttribute('href', '/playground/clustering/dataset/IRIS')
    expect(getByTestId('Test-DatasetTrain-IRIS')).toHaveTextContent('datasets.clustering.run')
    expect(queryByTestId('Test-DatasetModel-IRIS')).toBeNull()
    expect(getByText('datasets.clustering.examples-title')).toBeInTheDocument()
    // Los de práctica, en la página de subir datos del agrupamiento, con su frase de agrupamiento
    expect(getByTestId('Test-DatasetTrain-n4l/breast-cancer.n4l/data/wdbc.csv'))
      .toHaveAttribute('href', '/playground/clustering/dataset/UPLOAD?dataset=wdbc')
    expect(getByTestId('Test-Dataset-datasets/hepatitis-c.csv')).toHaveTextContent('datasets.summary.clustering.hepatitis-c')
    fireEvent.click(getByTestId('Test-DatasetInfo-WINE'))
    const dialog = await findByRole('dialog')
    expect(dialog).toHaveTextContent('n4l-wine:tasks.clustering.summary')
    expect(dialog).toHaveTextContent('datasets.clustering.examples-text')
  })

  test('Datasets: la pestaña de variables enseña las columnas del CSV', async () => {
    const { getByTestId, findByRole, findByTestId } = render(<MemoryRouter><Datasets /></MemoryRouter>)
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
