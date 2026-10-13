import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { pageTitle, pageTitleParts } from '@core/pageTitle'

/**
 * El título de la pestaña según la página y lo que hay abierto en ella (WCAG 2.4.2), en el idioma elegido: es lo
 * primero que anuncia el lector de pantalla al cambiar de página
 */
export default function N4LPageTitle() {
  const { pathname, search } = useLocation()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = pageTitle(pageTitleParts(pathname, search, t))
  }, [pathname, search, t, i18n.language])

  return null
}
