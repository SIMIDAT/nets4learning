import { useCallback, useSyncExternalStore } from 'react'

/** Si se cumple la media query; cambia con ella (al girar el móvil, al pedir menos movimiento al sistema…) */
export function useMediaQuery(query: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia?.(query)
    list?.addEventListener('change', onChange)
    return () => list?.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false, () => false)
}
