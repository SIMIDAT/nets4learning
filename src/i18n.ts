import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    preload    : ['en'],
    load       : 'languageOnly',
    fallbackLng: ['en', 'es'],
    debug      : import.meta.env.VITE_ENVIRONMENT === 'development',
    backend    : {
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