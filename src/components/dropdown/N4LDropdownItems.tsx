import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'

// Para el `as` de Dropdown.Item y NavDropdown.Item. React-Bootstrap pone aria-selected en todos sus elementos, y ese
// atributo no vale en un enlace ni en un botón (WCAG 4.1.2; axe: aria-allowed-attr): estos lo quitan. El elegido se
// marca con aria-current (la página actual o la opción activa), que sí vale.

type WithoutSelected_t = { 'aria-selected'?: boolean | 'true' | 'false' }

/** Un enlace de un desplegable (react-router) */
export const N4LDropdownLink = forwardRef<HTMLAnchorElement, LinkProps & WithoutSelected_t>(
  ({ 'aria-selected': _selected, ...props }, ref) => <Link ref={ref} {...props} />)
N4LDropdownLink.displayName = 'N4LDropdownLink'

/** Una opción de un desplegable que hace algo sin cambiar de página (idioma, tema…) */
export const N4LDropdownButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & WithoutSelected_t>(
  ({ 'aria-selected': _selected, type = 'button', ...props }, ref) => <button ref={ref} type={type} {...props} />)
N4LDropdownButton.displayName = 'N4LDropdownButton'
