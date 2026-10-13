import fs from 'node:fs'
import path from 'node:path'
import { describe, test, expect } from 'vitest'
import type { TFunction } from 'i18next'

import { APP_NAME, pageTitle, pageTitleParts } from '@core/pageTitle'

// Con las traducciones de verdad (en español): así la prueba también falla si una clave del título no existe
const PUBLIC = path.join(__dirname, '..', '..', 'public')
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(PUBLIC, file), 'utf-8'))
const LANGUAGES = ['es', 'en', 'ja']
const TRANSLATIONS = Object.fromEntries(LANGUAGES.map((language) => [language, read(`locales/${language}/translation.json`)]))

const lookup = (language: string, fullKey: string): string | undefined => {
  // «n4l-<id>:clave»: las traducciones de un paquete .n4l (public/n4l/<id>.n4l/locales)
  const [namespace, key] = fullKey.includes(':') ? fullKey.split(':') : [undefined, fullKey]
  const root = namespace === undefined ? TRANSLATIONS[language] : read(`n4l/${namespace.slice('n4l-'.length)}.n4l/locales/${language}.json`)
  const value = key.split('.').reduce<any>((node, part) => node?.[part], root)
  return typeof value === 'string' ? value : undefined
}

const tIn = (language: string) => ((key: string) => {
  const value = lookup(language, key)
  if (value === undefined) throw new Error(`falta la traducción «${key}» (${language})`)
  return value
}) as unknown as TFunction

const title = (pathname: string, search = '', language = 'es') => pageTitle(pageTitleParts(pathname, search, tIn(language)))

describe('pageTitle: el título de cada página (WCAG 2.4.2)', () => {
  test.each([
    ['/', '', `Inicio - ${APP_NAME}`],
    ['/home', '', `Inicio - ${APP_NAME}`],
    ['/manual/', '', `Manual - ${APP_NAME}`],
    ['/glossary', '', `Glosario - ${APP_NAME}`],
    ['/datasets', '', `Conjuntos de datos - ${APP_NAME}`],
    ['/datasets', '?task=time-series', `Conjuntos de datos - Series temporales - ${APP_NAME}`],
    ['/packages', '', `Paquetes .n4l - ${APP_NAME}`],
    ['/analyze', '', `Analizar conjunto de datos - ${APP_NAME}`],
    ['/contribute/', '', `Contribuye - ${APP_NAME}`],
    ['/terms-and-conditions', '', `Términos y condiciones - ${APP_NAME}`],
    ['/version', '', `Versión - ${APP_NAME}`],
    ['/settings', '', `Configuración - ${APP_NAME}`],
    ['/accessibility', '', `Accesibilidad - ${APP_NAME}`],
    ['/learn', '', `Empieza aquí - ${APP_NAME}`],
    ['/report', '', `Informe de entrenamiento - ${APP_NAME}`],
    ['/404', '', `Página no encontrada - ${APP_NAME}`],
    ['/playground/description-regression', '', `Regresión lineal - ${APP_NAME}`],
    ['/task/regression', '', `Regresión - ${APP_NAME}`],
    ['/select-model/tabular-classification', '', `Modelos pre-entrenados - Clasificación tabular - ${APP_NAME}`],
    ['/select-dataset/clustering', '', `Entrenar un modelo - Agrupamiento - ${APP_NAME}`],
    ['/playground/time-series/dataset/UPLOAD', '', `Subir el tuyo - Entrenar un modelo - Series temporales - ${APP_NAME}`],
    ['/playground/object-detection/model/COCO-SSD', '', `COCO SSD - Detector de objetos - Modelos pre-entrenados - Identificación de objetos - ${APP_NAME}`],
  ])('%s%s', (pathname, search, expected) => {
    expect(title(pathname, search)).toBe(expected)
  })

  test('los modelos y conjuntos de los paquetes .n4l llevan su nombre', () => {
    expect(title('/playground/time-series/dataset/AIRLINE-PASSENGERS')).toBe(`Pasajeros de avión - Entrenar un modelo - Series temporales - ${APP_NAME}`)
  })

  test('el AED con un conjunto del proyecto lleva su nombre delante', () => {
    const parts = pageTitleParts('/analyze', '?dataset=auto-mpg', tIn('es'))
    expect(parts).toHaveLength(2)
    expect(parts[1]).toBe('Analizar conjunto de datos')
  })

  test('una ruta que no es de ninguna página solo lleva el nombre de la aplicación', () => {
    expect(title('/otra-cosa')).toBe(APP_NAME)
  })

  test.each(LANGUAGES)('todas las claves de los títulos están traducidas (%s)', (language) => {
    const routes = ['/', '/manual', '/glossary', '/datasets', '/packages', '/analyze', '/contribute', '/terms-and-conditions',
      '/version', '/settings', '/learn', '/report', '/404', '/playground/description-regression', '/task/time-series',
      '/select-model/image-classification', '/select-dataset/regression', '/playground/regression/dataset/UPLOAD']
    for (const route of routes) expect(() => title(route, '', language), route).not.toThrow()
  })
})
