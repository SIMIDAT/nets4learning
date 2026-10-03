import { describe, test, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import * as dfd from 'danfojs'
import N4LDatasetProcessForm from '@components/dataframe/N4LDatasetProcessForm'

const prefix = 'dataset-process.'
const dataframe = () => new dfd.DataFrame({
  color : ['red', 'blue', 'red', 'green'],
  size  : [1, 2, 3, 4],
  weight: [1.5, 2.5, 3.5, 4.5],
  label : ['a', 'b', 'a', 'b'],
})

describe('N4LDatasetProcessForm: preparar un conjunto de datos subido', () => {
  test('clasificación: la última columna es la clase, el texto va como categoría y lo que no se usa se descarta', async () => {
    const onProcess = vi.fn()
    render(<N4LDatasetProcessForm kind={'classification'} dataframe={dataframe()} processed={null} onProcess={onProcess} />)
    // Cuántas clases tiene la columna elegida
    expect(screen.getByTestId('Test-DatasetProcess-TargetInfo')).toHaveTextContent(prefix + 'target-classes')
    // "size" no se usa y "weight" se usa como categoría
    fireEvent.click(within(screen.getByTestId('Test-DatasetProcess-Column-size')).getByRole('checkbox'))
    fireEvent.change(within(screen.getByTestId('Test-DatasetProcess-Column-weight')).getByRole('combobox'), { target: { value: 'label-encoder' } })
    fireEvent.click(screen.getByLabelText(new RegExp(prefix + 'scalers.standard-scaler.name')))
    fireEvent.click(screen.getByTestId('Test-DatasetProcess-Submit'))
    await waitFor(() => expect(onProcess).toHaveBeenCalledTimes(1))
    expect(onProcess).toHaveBeenCalledWith({
      target    : 'label',
      scaler    : 'standard-scaler',
      transforms: [
        { column_name: 'color', column_transform: 'label-encoder' },
        { column_name: 'size', column_transform: 'drop' },
        { column_name: 'weight', column_transform: 'label-encoder' },
        { column_name: 'label', column_transform: 'label-encoder' },
      ],
    })
  })

  test('una columna de texto solo se puede usar como categoría', () => {
    render(<N4LDatasetProcessForm kind={'classification'} dataframe={dataframe()} processed={null} onProcess={vi.fn()} />)
    const color = screen.getByTestId('Test-DatasetProcess-Column-color')
    expect(within(color).queryByRole('combobox')).toBeNull()
    expect(color).toHaveTextContent(prefix + 'transforms.label-encoder')
  })

  test('regresión: un objetivo de texto no se puede predecir; uno numérico sí, y se queda como está', async () => {
    const onProcess = vi.fn()
    render(<N4LDatasetProcessForm kind={'regression'} dataframe={dataframe()} processed={null} onProcess={onProcess} />)
    expect(screen.getByTestId('Test-DatasetProcess-TargetInfo')).toHaveTextContent(prefix + 'target-not-numeric')
    expect(screen.getByTestId('Test-DatasetProcess-Submit')).toBeDisabled()
    fireEvent.change(screen.getByLabelText(prefix + 'regression.target-title'), { target: { value: 'weight' } })
    expect(screen.getByTestId('Test-DatasetProcess-TargetInfo')).toHaveTextContent(prefix + 'target-range')
    fireEvent.click(screen.getByTestId('Test-DatasetProcess-Submit'))
    await waitFor(() => expect(onProcess).toHaveBeenCalledTimes(1))
    expect(onProcess.mock.calls[0][0].transforms).toContainEqual({ column_name: 'weight', column_transform: 'float32' })
    // La columna que antes era el objetivo vuelve a ser una entrada
    expect(onProcess.mock.calls[0][0].transforms).toContainEqual({ column_name: 'label', column_transform: 'label-encoder' })
  })

  test('sin ninguna columna de entrada no se puede procesar', () => {
    render(<N4LDatasetProcessForm kind={'classification'} dataframe={dataframe()} processed={null} onProcess={vi.fn()} />)
    for (const column of ['color', 'size', 'weight']) {
      fireEvent.click(within(screen.getByTestId('Test-DatasetProcess-Column-' + column)).getByRole('checkbox'))
    }
    expect(screen.getByTestId('Test-DatasetProcess-Summary')).toHaveTextContent(prefix + 'no-inputs')
    expect(screen.getByTestId('Test-DatasetProcess-Submit')).toBeDisabled()
  })
})
