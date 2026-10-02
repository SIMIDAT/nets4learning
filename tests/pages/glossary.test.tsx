import { describe, test, expect, vi, beforeAll } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import fs from 'node:fs'
import path from 'node:path'

// Las fórmulas, sin KaTeX: aquí se comprueban la estructura y la búsqueda (y así el test no pinta unas 70 fórmulas)
vi.mock('@components/latex/N4LLatex', () => ({ default: ({ children }: { children: string }) => <span>{children}</span> }))
// jsdom no tiene canvas: la gráfica animada guarda sus puntos en el DOM para comprobar hasta dónde se dibuja
vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: { data: { datasets: Array<{ data: Array<{ x: number, y: number }> }> } }) => (
    <div data-testid={'Test-ChartLine'} data-last-x={String(data.datasets[0].data.at(-1)?.x)} />
  ),
}))

import Glossary from '@pages/glossary/Glossary'
import { GLOSSARY_SECTIONS, GLOSSARY_UI_KEYS, glossaryKeys, matchesSearch, normalizeSearch } from '@pages/glossary/glossaryTerms'
import { ACTIVATION_FUNCTIONS, activationCurve, activationRange, activationX } from '@pages/glossary/activationFunctions'

const LANGUAGES = ['es', 'en', 'ja']
const translations = Object.fromEntries(LANGUAGES.map((language) => [
  language,
  JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../public/locales/${language}/translation.json`), 'utf8')),
]))
const lookup = (object: unknown, key: string) => key.split('.').reduce<unknown>((value, part) => (value as Record<string, unknown> | undefined)?.[part], object)

const allTerms = GLOSSARY_SECTIONS.flatMap((section) => section.groups.flatMap((group) => group.terms))

describe('datos del glosario', () => {

  test('cada término tiene un ancla distinta', () => {
    const ids = allTerms.map((term) => term.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('todos los textos existen en los tres idiomas', () => {
    for (const language of LANGUAGES) {
      const missing = [...glossaryKeys(), ...GLOSSARY_UI_KEYS].filter((key) => typeof lookup(translations[language], key) !== 'string')
      expect(missing, language).toEqual([])
      // Las características de las activaciones son objetos de textos
      for (const term of allTerms.filter((item) => item.characteristicsKey !== undefined)) {
        expect(typeof lookup(translations[language], term.characteristicsKey!), `${language} ${term.characteristicsKey}`).toBe('object')
      }
    }
  })

  test('la búsqueda no distingue tildes ni mayúsculas y pide todas las palabras', () => {
    const text = normalizeSearch('Número de Épocas (Number of Epochs)')
    expect(matchesSearch(text, 'epocas')).toBe(true)
    expect(matchesSearch(text, 'NÚMERO épocas')).toBe(true)
    expect(matchesSearch(text, 'épocas adam')).toBe(false)
  })
})

describe('activaciones animadas', () => {
  const value = (key: string, x: number) => ACTIVATION_FUNCTIONS[key].fn(x)

  test('cada función da lo que dice su fórmula', () => {
    expect(value('linear', -2.5)).toBe(-2.5)
    expect(value('sigmoid', 0)).toBe(0.5)
    expect(value('hard-sigmoid', -3)).toBe(0)
    expect(value('hard-sigmoid', 3)).toBe(1)
    expect(value('hard-sigmoid', 0)).toBe(0.5)
    expect(value('relu', -1)).toBe(0)
    expect(value('relu6', 7)).toBe(6)
    expect(value('leaky-relu', -1)).toBeCloseTo(-0.01)
    expect(value('elu', -1)).toBeCloseTo(Math.exp(-1) - 1)
    expect(value('tanh', 0)).toBe(0)
    expect(value('soft-plus', 0)).toBeCloseTo(Math.LN2)
    expect(value('mish', 0)).toBe(0)
    expect(value('selu', 1)).toBeCloseTo(1.0507009873554805)
  })

  test('todas las activaciones con gráfica se pueden animar', () => {
    const withImage = allTerms.filter((term) => term.id.startsWith('activation-') && term.image !== undefined)
    expect(withImage.length).toBeGreaterThan(0)
    for (const term of withImage) expect(ACTIVATION_FUNCTIONS[term.activation ?? '']).toBeDefined()
  })

  test('el deslizador va de -6 a 6 y la curva se dibuja hasta x', () => {
    expect(activationX(0)).toBe(-6)
    expect(activationX(0.5)).toBe(0)
    expect(activationX(1)).toBe(6)
    const curve = activationCurve(Math.tanh, 0)
    expect(curve[0]).toEqual({ x: -6, y: Math.tanh(-6) })
    expect(curve.at(-1)).toEqual({ x: 0, y: 0 })
    expect(curve.every((point) => point.x <= 0)).toBe(true)
    // El eje y es fijo y cubre toda la curva
    const [min, max] = activationRange(ACTIVATION_FUNCTIONS['relu6'].fn)
    expect(min).toBeLessThan(0)
    expect(max).toBeGreaterThan(6)
  })
})

describe('página del glosario', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  test('enseña todos los términos con su enlace y los filtra al buscar', async () => {
    render(<MemoryRouter initialEntries={['/glossary']}><Glossary /></MemoryRouter>)
    expect(screen.getAllByTestId('Test-GlossaryTerm')).toHaveLength(allTerms.length)
    expect(document.getElementById('glossary-optimizer-adam')).toHaveTextContent('Adam')

    // En los tests t devuelve la clave: "adam" solo aparece en el título del optimizador
    await act(async () => {
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Adam' } })
    })
    const titles = screen.getAllByTestId('Test-GlossaryTerm').map((term) => term.id)
    expect(titles).toContain('glossary-optimizer-adam')
    expect(titles).toContain('glossary-optimizer-adamax')
    expect(titles).not.toContain('glossary-activation-relu')
    expect(screen.getByTestId('Test-GlossaryResults')).toHaveTextContent('pages.glossary.results')

    await act(async () => {
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no-existe-este-termino' } })
    })
    expect(screen.queryAllByTestId('Test-GlossaryTerm')).toHaveLength(0)
    expect(screen.getByTestId('Test-GlossaryResults')).toHaveTextContent('pages.glossary.no-results')
  })

  test('la gráfica de una activación va en pestañas: la imagen primero y la animación con su deslizador', async () => {
    render(<MemoryRouter initialEntries={['/glossary']}><Glossary /></MemoryRouter>)
    const relu = within(document.getElementById('glossary-activation-relu')!)
    expect(relu.getByRole('tab', { name: 'pages.glossary.plot-tabs.image' })).toHaveAttribute('aria-selected', 'true')
    expect(relu.getByRole('img', { name: 'pages.glossary.plot' })).toBeInTheDocument()
    expect(relu.queryByRole('slider')).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.click(relu.getByRole('tab', { name: 'pages.glossary.plot-tabs.animation' }))
    })
    const slider = relu.getByRole('slider')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '1')
    expect(slider).toHaveAttribute('step', '0.01')
    // Los números en el idioma del navegador (coma o punto decimal)
    fireEvent.change(slider, { target: { value: '0.75' } })
    expect(relu.getByTestId('Test-GlossaryAnimationValue')).toHaveTextContent(/x = 3[.,]00 → ReLU\(x\) = 3[.,]00/)
    // La curva llega hasta la x del deslizador
    expect(relu.getByTestId('Test-ChartLine')).toHaveAttribute('data-last-x', '3')
    fireEvent.change(slider, { target: { value: '0.25' } })
    expect(relu.getByTestId('Test-GlossaryAnimationValue')).toHaveTextContent(/x = [-−]3[.,]00 → ReLU\(x\) = 0[.,]00/)

    // Softmax no tiene gráfica: sin pestañas
    expect(within(document.getElementById('glossary-activation-softmax')!).queryByRole('tab')).not.toBeInTheDocument()
  })
})
