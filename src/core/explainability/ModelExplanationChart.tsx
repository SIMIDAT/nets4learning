import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ShapExplanationChartProps {
  shapValues    : number[][];
  predictedClass: number;
  features      : string[];
  sortOrder?    : 'desc' | 'asc' | 'none';
}

export default function ShapExplanationChart({
  shapValues,
  predictedClass,
  features,
  sortOrder = 'desc',
}: ShapExplanationChartProps) {
  const { t } = useTranslation();
  const values = shapValues[predictedClass] ?? [];
  const data = features.map((name, i) => ({ name, shap: values[i] ?? 0 }));

  // El orden lo decide quien usa el componente vía `sortOrder`, por magnitud del efecto:
  //   desc → más importante primero (convención SHAP)
  //   asc  → menos importante primero
  //   none → orden original de las features
  if (sortOrder === 'desc') {
    data.sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));
  } else if (sortOrder === 'asc') {
    data.sort((a, b) => Math.abs(a.shap) - Math.abs(b.shap));
  }

  // `responsive` dimensiona el SVG con CSS normal (ancho del contenedor + aspect-ratio);
  // ResponsiveContainer medía -1×-1 en el primer render y avisaba por consola.
  return (
    <BarChart
      responsive
      data={data}
      style={{
        width      : '100%',
        maxWidth   : '700px',
        maxHeight  : '70vh',
        aspectRatio: 1.618,
      }}
      margin={{
        top   : 25,
        right : 0,
        left  : 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="shap"
        name={t('ui.explain.shap-value')}
        fill="#8884d8"
        background={{ fill: 'var(--bs-tertiary-bg)' }}
      />
    </BarChart>
  );
}
