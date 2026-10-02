import { useEffect, useState } from 'react'
import { scheduleIdle } from '@core/scheduler/idleQueue'

/**
 * `value`, pero aplicado cuando el navegador está libre (cola de `scheduleIdle`): lo que se pinta con él se repinta en
 * su propia tarea corta. Hasta el primer hueco devuelve undefined
 */
export function useIdleValue<T>(value: T): T | undefined {
  const [shown, setShown] = useState<T | undefined>(undefined)
  useEffect(() => scheduleIdle(() => setShown(() => value)), [value])
  return shown
}
