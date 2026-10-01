import { useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'

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

  return (
    <div style={{ width: '100%', maxWidth: '700px' }}>
      <Bar
        options={{
          responsive : true,
          aspectRatio: 1.618,
          animation  : false,
        }}
        data={{
          labels  : data.map(({ name }) => name),
          datasets: [{ label: t('ui.explain.shap-value'), data: data.map(({ shap }) => shap), backgroundColor: '#8884d8' }],
        }}
      />
    </div>
  )
}
