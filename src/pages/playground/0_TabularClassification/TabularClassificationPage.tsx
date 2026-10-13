import { TabularClassificationProvider } from '@context/TabularClassificationContext'
import TabularClassification from './TabularClassification'

/**
 * La página de entrenamiento con su contexto. Va aparte para que el contexto (que importa danfo.js) se descargue con
 * ella y no con el playground: las demás tareas no lo necesitan
 */
export default function TabularClassificationPage({ dataset }: { dataset: string }) {
  return (
    <TabularClassificationProvider>
      <TabularClassification dataset={dataset} />
    </TabularClassificationProvider>
  )
}
