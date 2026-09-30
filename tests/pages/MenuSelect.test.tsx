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
  test('en el playground enlaza a la selección y permite cambiar de modelo', async () => {
    const { getByTestId, getByText, findByText } = renderAt('/playground/tabular-classification/model/IRIS',
      <N4LBreadcrumb task={'tabular-classification'} kind={'model'} example={'IRIS'} />)

    expect(getByText('breadcrumb.models').closest('a')).toHaveAttribute('href', '/select-model/tabular-classification')

    // El desplegable enseña el modelo abierto y lista los demás de la tarea
    fireEvent.click(getByText('datasets-models.0-tabular-classification.list-models.0-option-2'))
    fireEvent.click(await findByText('datasets-models.0-tabular-classification.list-models.0-option-1'))
    expect(getByTestId('location')).toHaveTextContent('/playground/tabular-classification/model/CAR')
  })
})
