import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import MenuSelect from '@pages/menu/MenuSelect'
import N4LBreadcrumb from '@components/breadcrumb/N4LBreadcrumb'

function LocationDisplay() {
  return <p data-testid={'location'}>{useLocation().pathname}</p>
}

const renderAt = (path: string, ui: React.ReactElement | null = null) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path={'/select-model/:id'} element={<MenuSelect kind={'model'} />} />
      <Route path={'/select-dataset/:id'} element={<MenuSelect kind={'dataset'} />} />
      <Route path={'/404'} element={<p>404</p>} />
      <Route path={'*'} element={ui} />
    </Routes>
    <LocationDisplay />
  </MemoryRouter>,
)

describe('MenuSelect', () => {
  test('una tarjeta por dataset y cada una abre su playground', () => {
    const { getByTestId } = renderAt('/select-dataset/tabular-classification')
    expect(getByTestId('Test-MenuSelectDataset-Open-IRIS')).toHaveAttribute('href', '/playground/tabular-classification/dataset/IRIS')
    expect(getByTestId('Test-MenuSelectDataset-Open-UPLOAD')).toHaveAttribute('href', '/playground/tabular-classification/dataset/UPLOAD')
  })

  test('las migas de pan terminan en la página de selección', () => {
    const { getByTestId } = renderAt('/select-model/regression')
    expect(getByTestId('Test-Breadcrumb')).toHaveTextContent('breadcrumb.models')
  })

  test('sin datasets (detección de objetos) lleva a la 404', () => {
    expect(renderAt('/select-dataset/object-detection').getByTestId('location')).toHaveTextContent('/404')
  })

  test('tarea desconocida lleva a la 404', () => {
    expect(renderAt('/select-model/no-existe').getByTestId('location')).toHaveTextContent('/404')
  })
})

describe('N4LBreadcrumb', () => {
  // El nombre de cada modelo, en los textos de su paquete .n4l
  const MODEL: Record<string, string> = { 1: 'n4l-car:tasks.tabular-classification.name', 2: 'n4l-iris:tasks.tabular-classification.name' }

  test('en el playground enlaza a la página de la tarea y a la selección, y permite cambiar de modelo', async () => {
    const { getByTestId, getByText, findByText } = renderAt('/playground/tabular-classification/model/IRIS',
      <N4LBreadcrumb task={'tabular-classification'} kind={'model'} example={'IRIS'} />)

    expect(getByText('header.home').closest('a')).toHaveAttribute('href', '/')
    expect(getByText('pages.index.tabular-classification.1-title').closest('a')).toHaveAttribute('href', '/task/tabular-classification')
    expect(getByText('breadcrumb.models').closest('a')).toHaveAttribute('href', '/select-model/tabular-classification')

    // El desplegable enseña el modelo abierto y lista los demás de la tarea: son enlaces
    fireEvent.click(getByText(MODEL[2]))
    const car = await findByText(MODEL[1])
    expect(car.closest('a')).toHaveAttribute('href', '/playground/tabular-classification/model/CAR')
    expect((await findByText(MODEL[2], { selector: '.dropdown-item' })).closest('a')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(car)
    expect(getByTestId('location')).toHaveTextContent('/playground/tabular-classification/model/CAR')
  })

  test('del modelo preentrenado se puede ir a entrenar con su dataset, y al revés', async () => {
    const model = renderAt('/', <N4LBreadcrumb task={'tabular-classification'} kind={'model'} example={'IRIS'} />)
    fireEvent.click(model.getByText(MODEL[2]))
    expect(await model.findByTestId('Test-Breadcrumb-OtherKind')).toHaveAttribute('href', '/playground/tabular-classification/dataset/IRIS')
    model.unmount()

    const dataset = renderAt('/', <N4LBreadcrumb task={'regression'} kind={'dataset'} example={'AUTO_MPG'} />)
    fireEvent.click(dataset.getByText('n4l-auto-mpg:tasks.regression.name'))
    expect(await dataset.findByTestId('Test-Breadcrumb-OtherKind')).toHaveAttribute('href', '/playground/regression/model/AUTO_MPG')
  })

  test('sin el otro lado no hay enlace: CSV propio y detección de objetos (no tiene datasets)', async () => {
    const upload = renderAt('/', <N4LBreadcrumb task={'tabular-classification'} kind={'dataset'} example={'UPLOAD'} />)
    fireEvent.click(upload.getByText('pages.menu-selection-dataset.0-tabular-classification.csv'))
    // Subir un CSV va primero y separado de los datasets de ejemplo
    expect(await upload.findByText('pages.menu-selection-dataset.example-datasets')).toHaveClass('dropdown-header')
    expect(upload.queryByTestId('Test-Breadcrumb-OtherKind')).not.toBeInTheDocument()
    upload.unmount()

    const detection = renderAt('/', <N4LBreadcrumb task={'object-detection'} kind={'model'} example={'COCO-SSD'} />)
    fireEvent.click(detection.getByText('datasets-models.2-object-detection.list-models.2-option-4'))
    await detection.findAllByRole('button')
    expect(detection.queryByTestId('Test-Breadcrumb-OtherKind')).not.toBeInTheDocument()
  })
})
