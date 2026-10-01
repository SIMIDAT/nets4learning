import { describe, test, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import N4LSectionNav from '@components/divider/N4LSectionNav'
import N4LDivider from '@components/divider/N4LDivider'

const STEPS = ['hr.information', 'hr.model', 'hr.classify']

// jsdom no maqueta: cada separador dice a qué altura de la ventana está
function placeDividers(tops: number[]) {
  STEPS.forEach((step, index) => {
    const element = document.getElementById(`n4l-section-${step.replace(/[^a-z0-9]+/gi, '-')}`)!
    element.getBoundingClientRect = () => ({ top: tops[index] } as DOMRect)
  })
}

async function scroll() {
  await act(async () => {
    fireEvent.scroll(window)
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })
}

function renderPage() {
  return render(<>
    <N4LSectionNav steps={STEPS} />
    {STEPS.map((step) => <N4LDivider key={step} i18nKey={step} steps={STEPS} />)}
  </>)
}

const activeLink = () => screen.getAllByRole('link').find((link) => link.getAttribute('aria-current') === 'location')?.textContent

describe('N4LSectionNav', () => {

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 5000 })
  })

  test('un enlace numerado por sección, al separador de cada una', () => {
    renderPage()
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['1. hr.information', '2. hr.model', '3. hr.classify'])
    expect(links[1]).toHaveAttribute('href', '#n4l-section-hr-model')
    expect(document.getElementById('n4l-section-hr-model')).toHaveTextContent('2. hr.model')
  })

  test('marca la última sección cuyo título ya ha subido por encima de la cuarta parte de la ventana', async () => {
    renderPage()
    placeDividers([-900, 150, 700])
    await scroll()
    expect(activeLink()).toBe('2. hr.model')
    placeDividers([-1500, -400, 100])
    await scroll()
    expect(activeLink()).toBe('3. hr.classify')
  })

  test('arriba del todo, la primera', async () => {
    renderPage()
    placeDividers([50, 900, 1800])
    await scroll()
    expect(activeLink()).toBe('1. hr.information')
  })

  test('al hacer clic lleva a la sección y le da el foco', () => {
    renderPage()
    const divider = document.getElementById('n4l-section-hr-classify')!
    divider.scrollIntoView = vi.fn()
    fireEvent.click(screen.getByRole('link', { name: '3. hr.classify' }))
    expect(divider.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'start' }))
    expect(divider).toHaveFocus()
  })
})
