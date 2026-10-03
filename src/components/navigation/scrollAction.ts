import { NavigationType, type Location } from 'react-router'

// Qué hace el scroll al cambiar de página (N4LScrollManager)

export type ScrollAction_t =
  | { type: 'none' }
  | { type: 'top' }
  | { type: 'hash', id: string }
  | { type: 'restore', y: number }

export type Place_t = Pick<Location, 'pathname' | 'hash'>

const SECTION_ID = /^[A-Za-z][\w:.-]*$/

/**
 * Qué hacer al llegar a `next` desde `previous` (null: la primera página de la visita). Atrás y adelante vuelven a donde
 * se estaba; un enlace con #sección, a la sección; cualquier otra página nueva, arriba del todo.
 */
export function scrollAction(previous: Place_t | null, next: Place_t, navigationType: NavigationType, saved: number | undefined): ScrollAction_t {
  // Solo si es el id de una sección (no, p. ej., la configuración de un enlace compartido: #n4z=…)
  const id = decodeURIComponent(next.hash.slice(1))
  const hash = SECTION_ID.test(id) ? { type: 'hash' as const, id } : null
  // Al entrar (o recargar) el navegador ya pone el scroll; solo falta la sección, que aún no existía
  if (previous === null) return hash ?? { type: 'none' }
  if (previous.pathname === next.pathname) return { type: 'none' }
  if (navigationType === NavigationType.Pop && saved !== undefined) return { type: 'restore', y: saved }
  return hash ?? { type: 'top' }
}
