import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Plot from 'react-plotly.js'
import * as dfd from 'danfojs'

import math from '@utils/math'
import { pearsonCorrelation } from '@utils/statistics'

type CorrelationMatrix_t = {
  xValues    : string[],
  yValues    : string[],
  zValues    : number[][],
  annotations: any[]
}

const DEFAULT_CORRELATION_MATRIX: CorrelationMatrix_t = {
  xValues    : [],
  yValues    : [],
  zValues    : [],
  annotations: []
}

export default function DataFrameCorrelationMatrix({ dataframe }: { dataframe: dfd.DataFrame }) {
  const { t } = useTranslation()
  // Usamos useRef con tipo 'any' o el tipo específico de Plotly si lo tienes
  const refPlotly = useRef<any>(null)

  // REFACTORIZACIÓN: Usamos useMemo en lugar de useState + useEffect
  const correlationMatrix = useMemo((): CorrelationMatrix_t => {
    // 1. Filtrar columnas numéricas
    const columns: string[] = dataframe.columns.filter((column_name) => {
      // Nota: Asegúrate de que tu versión de danfojs soporte esta comprobación de dtype
      return dataframe[column_name].dtype !== 'string'
    })

    if (columns.length === 0) return DEFAULT_CORRELATION_MATRIX

    const columns_X: string[] = Array.from(columns)
    const columns_Y: string[] = Array.from(columns).reverse()

    const _matrix: number[][] = []
    const _annotations: any[] = []

    // 2. Calcular matriz y anotaciones
    for (let i = 0; i < columns_X.length; i++) {
      const column_name_x = columns_X[i]
      _matrix.push([])

      for (let j = 0; j < columns_Y.length; j++) {
        const column_name_y = columns_Y[j]

        const correlation = pearsonCorrelation(dataframe, column_name_x, column_name_y)
        _matrix[i][j] = correlation

        // Lógica de anotación (color del texto según valor)
        const textColor = (correlation <= 0.0) ? 'white' : 'black'

        _annotations.push({
          xref: 'x1',
          yref: 'y1',
          x   : column_name_x,
          y   : column_name_y,
          text: (correlation.toFixed(4)).toString(),
          font: {
            family: 'Arial',
            size  : 12,
            color : textColor
          },
          showarrow: false,
        })
      }
    }

    // 3. Transponer si es necesario (según tu lógica original)
    const new_matrix: number[][] = math.transpose(_matrix)

    return {
      xValues    : columns_X,
      yValues    : columns_Y,
      zValues    : new_matrix,
      annotations: _annotations
    }

  }, [dataframe]) // 👈 Solo recalculamos si cambia el dataframe

  return <>
    <Plot ref={refPlotly}
      data={[{
        x        : correlationMatrix.xValues,
        y        : correlationMatrix.yValues,
        z        : correlationMatrix.zValues,
        type     : 'heatmap',
        showscale: true
      }]}
      useResizeHandler={true}
      style={{ width: '100%', height: '100%' }}
      layout={{
        title: {
          text: t('dataframe.correlation-matrix.plot')
        },
        height: undefined,
        width : undefined,
        xaxis : {
          ticks     : '',
          ticksuffix: ' ',
          side      : 'top',
        },
        yaxis: {
          ticks     : '',
          ticksuffix: ' ',
        },
        annotations: correlationMatrix.annotations
      }}
    />
  </>

}