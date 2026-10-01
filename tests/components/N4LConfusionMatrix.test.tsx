import { describe, test, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import N4LConfusionMatrix from '@components/neural-network/N4LConfusionMatrix'

// Sin espacios: el porcentaje se formatea en el idioma del sistema ("50%" o "50 %")
const text = (element: Element) => (element.textContent ?? '').replace(/\s/g, '')

describe('N4LConfusionMatrix', () => {

  // Reales: A, A, B, C, C — predichas: A, B, B, C, A
  const props = { classes: ['A', 'B', 'C'], labels: [0, 0, 1, 2, 2], predictions: [0, 1, 1, 2, 0] }

  test('cada celda tiene el recuento y su parte de la fila', () => {
    const { getByTestId } = render(<N4LConfusionMatrix {...props} />)
    expect(text(getByTestId('Test-ConfusionMatrix-0-0'))).toBe('150%')
    expect(text(getByTestId('Test-ConfusionMatrix-2-0'))).toBe('150%')
    expect(text(getByTestId('Test-ConfusionMatrix-1-1'))).toBe('1100%')
    expect(text(getByTestId('Test-ConfusionMatrix-1-0'))).toBe('00%')
  })

  test('aciertos en verde, errores en rojo y las celdas vacías sin color', () => {
    const { getByTestId } = render(<N4LConfusionMatrix {...props} />)
    expect(getByTestId('Test-ConfusionMatrix-0-0').style.backgroundColor).toContain('--bs-success-rgb')
    expect(getByTestId('Test-ConfusionMatrix-0-1').style.backgroundColor).toContain('--bs-danger-rgb')
    expect(getByTestId('Test-ConfusionMatrix-1-0').style.backgroundColor).toBe('')
  })

  test('sensibilidad por clase real, precisión por clase predicha y exactitud', () => {
    const { container } = render(<N4LConfusionMatrix {...props} />)
    const rows = container.querySelectorAll('tbody tr')
    // Fila A: 2 ejemplos, 1 acierto
    expect(within(rows[0] as HTMLElement).getAllByRole('cell').slice(-2).map(text)).toStrictEqual(['2', '50%'])
    const footer = within(container.querySelector('tfoot tr') as HTMLElement).getAllByRole('cell').map(text)
    expect(footer).toStrictEqual(['50%', '50%', '100%', '5', '60%'])
  })
})
