import { useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'

import { chartColor } from '@core/chartColors'
import { useTheme } from '@hooks/useTheme'
import N4LChartData from '@components/chart/N4LChartData'

interface ShapExplanationChartProps {
  shapValues    : number[][]
  predictedClass: number
  features      : string[]
  sortOrder?    : 'desc' | 'asc' | 'none'
}

/** Barras con el valor SHAP de cada feature para la clase (o el objetivo) `predictedClass` */
export default function ShapExplanationChart({
  shapValues,
  predictedClass,
  features,
  sortOrder = 'desc',
}: ShapExplanationChartProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const values = shapValues[predictedClass] ?? []
  const data = features.map((name, i) => ({ name, shap: values[i] ?? 0 }))

  // El orden lo decide quien usa el componente vía `sortOrder`, por magnitud del efecto:
  //   desc → más importante primero (convención SHAP)
  //   asc  → menos importante primero
  //   none → orden original de las features
  if (sortOrder === 'desc') {
    data.sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
  } else if (sortOrder === 'asc') {
    data.sort((a, b) => Math.abs(a.shap) - Math.abs(b.shap))
  }

  // Para quien no ve la gráfica: cada variable con su valor, de la que más influye a la que menos
  const description = t('ui.explain.bar-description', {
    values: [...data].sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap)).map(({ name, shap }) => `${name} ${shap >= 0 ? '+' : ''}${shap.toFixed(3)}`).join('; '),
  })

  return (
    <div style={{ width: '100%', maxWidth: '700px' }}>
      <Bar
        role={'img'}
        aria-label={description}
        options={{
          responsive : true,
          aspectRatio: 1.618,
          animation  : false,
        }}
        data={{
          labels  : data.map(({ name }) => name),
          datasets: [{ label: t('ui.explain.shap-value'), data: data.map(({ shap }) => shap), backgroundColor: chartColor('purple', theme) }],
        }}
      />
      <N4LChartData caption={t('ui.explain.bar-data')} columns={[t('ui.explain.variable'), t('ui.explain.shap-value')]}
        rows={data.map(({ name, shap }) => [name, shap])} />
    </div>
  )
}
