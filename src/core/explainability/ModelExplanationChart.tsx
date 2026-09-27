import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ShapExplanationChartProps {
  shapValues: number[][];
  predictedClass: number;
  predictionProbs?: unknown;
  features: string[];
  sortOrder?: 'desc' | 'asc' | 'none';
}

export default function ShapExplanationChart({
  shapValues,
  predictedClass,
  features,
  sortOrder = 'desc',
}: ShapExplanationChartProps) {
  const data: Array<{ name: string; pv: number }> = [];

  for (let i = 0; i < features.length; i++) {
    data.push({
      name: features[i],
      pv: shapValues[predictedClass][i],
    });
  }

  // El orden lo decide quien usa el componente vía `sortOrder`:
  //   desc → mayor a menor (importancia arriba, convención SHAP)
  //   asc  → menor a mayor
  //   none → orden original de las features
  if (sortOrder === 'desc') {
    data.sort((a, b) => b.pv - a.pv);
  } else if (sortOrder === 'asc') {
    data.sort((a, b) => a.pv - b.pv);
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '70vh',
        aspectRatio: 1.618,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 25,
            right: 0,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pv" fill="#8884d8" background={{ fill: '#eee' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
