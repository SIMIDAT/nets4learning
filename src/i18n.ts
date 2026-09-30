import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import { browserLanguages, DEFAULT_LANGUAGE, detectLanguage, readSavedLanguage, SUPPORTED_LANGUAGES } from '@core/i18n/language'

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
    backend      : {
      loadPath: import.meta.env.VITE_PATH + '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
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