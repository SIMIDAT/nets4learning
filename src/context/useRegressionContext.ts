import { useContext } from 'react'
import RegressionContext, { type CustomRegressionContext_t } from './RegressionContext'

/** Estado compartido de la página de Regresión; lanza un error si se usa fuera de <RegressionProvider>. */
export function useRegressionContext(): CustomRegressionContext_t {
  const context = useContext(RegressionContext)
  if (context === null) {
    throw new Error('useRegressionContext must be used within a <RegressionProvider>')
  }
  return context
}
