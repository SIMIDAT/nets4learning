import { render } from '@testing-library/react'
import * as dfd from 'danfojs'

import DataFramePlot from '@components/dataframe/DataFramePlot'
import { DataFramePlotProvider } from '@components/_context/DataFramePlotContext'

describe('DataFramePlot', () => {
  test('renders DataFramePlot', () => {
    const dataframe = new dfd.DataFrame()
    const { getByText } = render(
      <DataFramePlotProvider>
        <DataFramePlot dataframe={dataframe} />
      </DataFramePlotProvider>
    )
    expect(getByText(/dataframe-plot.title/)).toBeInTheDocument()
  })
})