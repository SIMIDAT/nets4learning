import { RegressionProvider } from '@context/RegressionContext'
import Regression from './Regression'

/**
 * La página de entrenamiento con su contexto. Va aparte para que el contexto (que importa danfo.js) se descargue con
 * ella y no con el playground: las demás tareas no lo necesitan
 */
export default function RegressionPage({ dataset }: { dataset: string }) {
  return (
    <RegressionProvider>
      <Regression dataset={dataset} />
    </RegressionProvider>
  )
}
