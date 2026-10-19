import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as dfd from 'danfojs'

import N4LDataFrameTable from '@components/dataframe/N4LDataFrameTable'
import N4LDataFrameDescribe from '@components/dataframe/N4LDataFrameDescribe'
import { DataFrameTablePlot } from '@core/dataframe/DataFrameTable'

// jsdom no puede dibujar con Plotly: se comprueba con qué se llama
vi.mock('@core/dataframe/DataFrameTable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@core/dataframe/DataFrameTable')>()
  return { ...actual, DataFrameTablePlot: vi.fn(), DataFrameTablePurge: vi.fn(), DataFrameTableResize: vi.fn() }
})

const dataframe = () => new dfd.DataFrame({ x: [1, 2, 3], y: [0.5, 1.5, 2.5], class: ['a', 'b', 'a'] })

describe('N4LDataFrameTable', () => {

  beforeEach(() => vi.mocked(DataFrameTablePlot).mockClear())

  test('dibuja la tabla (cuando el navegador está libre) con la última columna como objetivo y explica su color y el tamaño', async () => {
    render(<N4LDataFrameTable dataframe={dataframe()} subtitles={'dtype'} />)
    expect(DataFrameTablePlot).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(DataFrameTablePlot).toHaveBeenCalledWith(expect.any(HTMLElement), expect.any(dfd.DataFrame),
      expect.objectContaining({ target: undefined, subtitles: 'dtype', theme: 'light' })))
    expect(screen.getByTestId('Test-DataFrameTable-target')).toHaveTextContent('dataframe.table.target')
    expect(screen.getByText('dataframe.table.shape')).toBeInTheDocument()
  })

  test('sin objetivo no hay leyenda de color', () => {
    render(<N4LDataFrameTable dataframe={dataframe()} target={null} />)
    expect(screen.queryByTestId('Test-DataFrameTable-target')).toBeNull()
  })

  test('avisa de que hay más filas que las que se ven', () => {
    render(<N4LDataFrameTable dataframe={dataframe()} maxRows={2} />)
    expect(screen.getByText(/dataframe.table.scroll-rows/)).toBeInTheDocument()
  })
})

describe('N4LDataFrameDescribe', () => {

  beforeEach(() => vi.mocked(DataFrameTablePlot).mockClear())

  test('una fila por columna numérica, con la del objetivo resaltada', async () => {
    render(<N4LDataFrameDescribe dataframe={dataframe()} target={'y'} />)
    await vi.waitFor(() => expect(DataFrameTablePlot).toHaveBeenCalled())
    const [, describe, options] = vi.mocked(DataFrameTablePlot).mock.lastCall!
    expect(describe.index).toEqual(['x', 'y'])
    expect(options).toEqual(expect.objectContaining({ target: 'y', targetAxis: 'row' }))
  })

  test('sin columnas numéricas lo dice', () => {
    render(<N4LDataFrameDescribe dataframe={new dfd.DataFrame({ a: ['x', 'y'] })} />)
    expect(screen.getByText('dataframe.describe.no-numeric')).toBeInTheDocument()
  })
})
