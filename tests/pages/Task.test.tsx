import { describe, test, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import Task from '@pages/task/Task'

const renderTask = (task: string) => render(
  <MemoryRouter initialEntries={[`/task/${task}`]}>
    <Routes>
      <Route path={'/task/:id'} element={<Task />} />
      <Route path={'/404'} element={<p>404</p>} />
    </Routes>
  </MemoryRouter>,
)

describe('Página de una tarea (/task/<tarea>)', () => {
  test('elige entre los modelos ya entrenados y diseñar una red; cada modelo o conjunto se abre desde aquí', () => {
    const { getByTestId, queryByText } = renderTask('regression')
    expect(getByTestId('Test-Breadcrumb')).toHaveTextContent('pages.index.regression.1-title')

    const pretrained = within(getByTestId('Test-Task-Pretrained'))
    expect(pretrained.getByText('pages.task.pretrained-title')).toBeInTheDocument()
    expect(pretrained.getByTestId('Test-Task-Choose-model')).toHaveAttribute('href', '/select-model/regression')
    expect(pretrained.getAllByRole('link').map((link) => link.getAttribute('href'))).toContain('/playground/regression/model/AUTO_MPG')

    const design = within(getByTestId('Test-Task-Design'))
    expect(design.getByText('pages.task.design-title')).toBeInTheDocument()
    expect(design.getByTestId('Test-Task-Choose-dataset')).toHaveAttribute('href', '/select-dataset/regression')
    // Los conjuntos de ejemplo y subir uno propio
    const hrefs = design.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/playground/regression/dataset/SALARY', '/playground/regression/dataset/UPLOAD']))
    expect(queryByText('pages.task.only-pretrained')).toBeNull()
  })

  test('identificación de objetos solo tiene modelos ya entrenados, y se dice', () => {
    const { getByTestId, queryByTestId, getByText } = renderTask('object-detection')
    expect(getByTestId('Test-Task-Pretrained')).toBeInTheDocument()
    expect(queryByTestId('Test-Task-Design')).toBeNull()
    expect(getByText('pages.task.only-pretrained')).toBeInTheDocument()
  })

  test('el agrupamiento solo tiene conjuntos de datos (sin red): se agrupan', () => {
    const { getByTestId, queryByTestId, getByText } = renderTask('clustering')
    expect(queryByTestId('Test-Task-Pretrained')).toBeNull()
    expect(within(getByTestId('Test-Task-Design')).getByText('pages.task.cluster-title')).toBeInTheDocument()
    expect(getByText('pages.task.only-cluster')).toBeInTheDocument()
  })

  test('una tarea que no existe lleva a la página 404', () => {
    const { getByText } = renderTask('no-existe')
    expect(getByText('404')).toBeInTheDocument()
  })
})
