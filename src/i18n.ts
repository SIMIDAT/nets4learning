import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import { browserLanguages, DEFAULT_LANGUAGE, detectLanguage, readSavedLanguage, SUPPORTED_LANGUAGES } from '@core/i18n/language'
import { N4L_NAMESPACES } from '@core/n4l/catalog'
import { N4L_PACKAGES_DIR } from '@core/n4l/format'

// Los textos de un paquete .n4l (espacio de nombres n4l-<id>) están en su carpeta: public/n4l/<id>.n4l/locales/
const N4L_PREFIX = 'n4l-'
const loadPath = (_languages: string[], namespaces: string[]) => (namespaces[0]?.startsWith(N4L_PREFIX)
  ? `${import.meta.env.VITE_PATH}/${N4L_PACKAGES_DIR}/${namespaces[0].slice(N4L_PREFIX.length)}.n4l/locales/{{lng}}.json`
  : `${import.meta.env.VITE_PATH}/locales/{{lng}}/{{ns}}.json`)

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    // Idioma guardado por el usuario, si no el del navegador, y si no lo tenemos traducido, inglés
    lng          : detectLanguage(readSavedLanguage(), browserLanguages()),
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng  : DEFAULT_LANGUAGE,
    load         : 'languageOnly',
    debug        : import.meta.env.VITE_ENVIRONMENT === 'development',
    // Los de la aplicación y los de todos los paquetes (sus títulos salen en los menús)
    ns           : ['translation', ...N4L_NAMESPACES],
    defaultNS    : 'translation',
    backend      : { loadPath },
    react        : {
      useSuspense               : true,
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'b', 'kbd'],
    },
    interpolation: {
      escapeValue: false, // not needed for react!!
    },
  })
  .then((_r) => {
  })

// `<html lang>` sigue al idioma activo (lectores de pantalla, traductor del navegador, guiones…).
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n