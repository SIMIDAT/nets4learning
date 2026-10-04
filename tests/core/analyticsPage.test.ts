import { describe, test, expect } from 'vitest'
import { clickTargetName, pageContextFromPath, pageTitle } from '@core/analyticsPage'

describe('analyticsPage: el contexto de cada ruta', () => {
  test.each([
    ['/', '', { page_type: 'home' }],
    ['/home', '', { page_type: 'home' }],
    ['/select-model/regression', '', { page_type: 'select_model', task: 'regression' }],
    ['/task/regression', '', { page_type: 'task', task: 'regression' }],
    ['/select-dataset/tabular-classification', '', { page_type: 'select_dataset', task: 'tabular-classification' }],
    ['/playground/tabular-classification/model/CAR', '', { page_type: 'playground', task: 'tabular-classification', mode: 'pretrained', item: 'CAR' }],
    ['/playground/regression/dataset/UPLOAD', '', { page_type: 'playground', task: 'regression', mode: 'train', item: 'UPLOAD' }],
    ['/playground/description-regression', '', { page_type: 'regression_description', task: 'regression' }],
    ['/analyze', '?dataset=car', { page_type: 'analyze', item: 'car' }],
    ['/analyze', '', { page_type: 'analyze' }],
    ['/terms-and-conditions', '', { page_type: 'terms' }],
    ['/404', '', { page_type: 'not_found' }],
    ['/test-page-easy-lazy', '', { page_type: 'dev' }],
    ['/otra-cosa', '', { page_type: 'other' }],
  ])('%s%s', (pathname, search, context) => {
    expect(pageContextFromPath(pathname, search)).toEqual(context)
  })

  test('el título de la página no depende del idioma', () => {
    expect(pageTitle({ page_type: 'playground', task: 'regression', mode: 'train', item: 'AUTO_MPG' })).toBe('playground / regression / train / AUTO_MPG')
    expect(pageTitle({ page_type: 'glossary' })).toBe('glossary')
  })
})

describe('analyticsPage: el nombre de lo que se pulsa', () => {
  const render = (html: string) => {
    document.body.innerHTML = html
    return document.body
  }

  test('data-analytics, data-testid o id estable; también si se pulsa algo de dentro (un icono)', () => {
    const body = render(`
      <button data-testid="Test-TrainButton"><svg><path id="icon"/></svg></button>
      <button data-analytics="guide-voice" data-testid="Test-X">Voz</button>
      <input type="checkbox" id="settings-privacy-analytics">
      <button id=":r1:">Generado</button>
      <button>Sin nombre</button>`)
    expect(clickTargetName(body.querySelector('path'))).toBe('Test-TrainButton')
    expect(clickTargetName(body.querySelector('[data-analytics]'))).toBe('guide-voice')
    expect(clickTargetName(body.querySelector('input'))).toBe('settings-privacy-analytics')
    expect(clickTargetName(body.querySelector('[id=":r1:"]'))).toBeNull()
    expect(clickTargetName(body.querySelectorAll('button')[3])).toBeNull()
  })

  test('un enlace interno, por su ruta sin el basename; uno a otra web (ya lo mide GA) o a "#" no', () => {
    const body = render(`
      <a href="/n4l/manual">Manual</a>
      <a href="https://github.com/SIMIDAT/nets4learning">GitHub</a>
      <a href="#">Oscuro</a>
      <p>Texto</p>`)
    expect(clickTargetName(body.querySelector('a'), '/n4l')).toBe('link:/manual')
    expect(clickTargetName(body.querySelectorAll('a')[1], '/n4l')).toBeNull()
    expect(clickTargetName(body.querySelectorAll('a')[2], '/n4l')).toBeNull()
    expect(clickTargetName(body.querySelector('p'))).toBeNull()
  })
})
