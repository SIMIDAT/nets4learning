import { useEffect } from 'react'

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

/** El diálogo modal abierto que está encima de los demás (el último en la página), si hay alguno */
const topDialog = () => Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'))
  .filter((dialog) => dialog.getClientRects().length > 0)
  .at(-1)

/**
 * Con un diálogo modal abierto, el tabulador da la vuelta dentro de él (de lo último a lo primero y al revés), como
 * pide el patrón de diálogo de ARIA. Los modales de React-Bootstrap devuelven el foco si sale a otra parte de la
 * página, pero no si pasa de su último elemento: entonces se iba a la barra del navegador.
 */
export default function N4LDialogFocusWrap() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented) return
      const dialog = topDialog()
      if (dialog === undefined) return
      const tabbables = Array.from(dialog.querySelectorAll<HTMLElement>(TABBABLE)).filter((element) => element.getClientRects().length > 0)
      if (tabbables.length === 0) return
      const first = tabbables[0]
      const last = tabbables[tabbables.length - 1]
      const active = document.activeElement
      const isOutside = active === null || !dialog.contains(active)
      if (event.shiftKey && (active === first || active === dialog || isOutside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || isOutside)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  return null
}
