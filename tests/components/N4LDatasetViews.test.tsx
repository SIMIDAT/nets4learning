import { describe, test, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import * as dfd from 'danfojs'
import N4LDatasetViews from '@components/dataframe/N4LDatasetViews'
import type * as _Types from '@core/types'

const original = new dfd.DataFrame({ color: ['red', 'blue', 'red'], size: [10, 20, 30], price: [1.5, 2.5, 3.5] })
const encoded = new dfd.DataFrame({ color: [1, 0, 1], size: [10, 20, 30], price: [1.5, 2.5, 3.5] })
const X = new dfd.DataFrame({ color: [1, 0, 1], size: [0, 0.5, 1] })
const dataset = {
  is_dataset_processed: true,
  dataframe_original  : original,
  dataframe_processed : encoded,
  data_processed      : { X, y: new dfd.Series([1.5, 2.5, 3.5]), column_name_target: 'price', scaler: {} },
} as unknown as _Types.DatasetProcessed_t

describe('N4LDatasetViews: original, codificado y escalado', () => {
  test('lo escalado son las entradas de la red y, al final, lo que se predice sin escalar', () => {
    const { container } = render(<N4LDatasetViews dataset={dataset} />)
    expect(screen.getByRole('columnheader', { name: 'color' })).toBeInTheDocument()
    expect(screen.getAllByText('red', { selector: 'td' })).toHaveLength(2)

    fireEvent.click(screen.getByText('dataset-view.encoded'))
    expect(screen.queryAllByText('red', { selector: 'td' })).toHaveLength(0)

    fireEvent.click(screen.getByText('dataset-view.scaled'))
    const headers = [...container.querySelectorAll('thead th')].map((cell) => cell.textContent)
    expect(headers.slice(-3)).toEqual(['color', 'size', 'price'])
    expect(screen.getByText('0.5', { selector: 'td' })).toBeInTheDocument()
    expect(screen.getByText('2.5', { selector: 'td' })).toBeInTheDocument()
  })
})
