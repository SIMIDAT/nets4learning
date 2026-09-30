import { useContext } from 'react'
import TabularClassificationContext, { type TabularClassificationContext_t } from './TabularClassificationContext'

/** Estado compartido de la página de clasificación tabular; lanza un error si se usa fuera de <TabularClassificationProvider>. */
export function useTabularClassificationContext(): TabularClassificationContext_t {
  const context = useContext(TabularClassificationContext)
  if (context === null) {
    throw new Error('useTabularClassificationContext must be used within a <TabularClassificationProvider>')
  }
  return context
}
