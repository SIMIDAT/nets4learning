import { describe, test, expect, vi, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

import N4LHelpTerm from '@components/helpLink/N4LHelpTerm'

describe('N4LHelpTerm: la ayuda al pasar el ratón o con el foco (WCAG 1.4.13)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('aparece con el ratón, no se cierra al llevarlo hasta ella y se cierra al salir de las dos', () => {
    vi.useFakeTimers()
    render(<N4LHelpTerm label={'Época'} help={'Una pasada por todos los datos'} />)
    const term = screen.getByRole('button', { name: 'Época' })
    fireEvent.mouseEnter(term)
    const popover = screen.getByTestId('Test-HelpTerm-Popover')
    expect(term).toHaveAccessibleDescription('Una pasada por todos los datos')
    // Del término a la ayuda: hay tiempo para llegar
    fireEvent.mouseLeave(term)
    fireEvent.mouseEnter(popover)
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByTestId('Test-HelpTerm-Popover')).toBeInTheDocument()
    fireEvent.mouseLeave(popover)
    act(() => vi.advanceTimersByTime(1000))
    // Cerrada: ya no describe el término (en jsdom el fundido de salida no termina, así que no se quita del todo)
    expect(term).toHaveAccessibleDescription('')
  })

  test('con el foco aparece y Escape la cierra sin quitar el foco', () => {
    render(<N4LHelpTerm label={'Época'} help={'Una pasada por todos los datos'} />)
    const term = screen.getByRole('button', { name: 'Época' })
    act(() => term.focus())
    expect(screen.getByTestId('Test-HelpTerm-Popover')).toBeInTheDocument()
    fireEvent.keyDown(term, { key: 'Escape' })
    expect(term).toHaveAccessibleDescription('')
    expect(term).toHaveFocus()
  })

  test('también se abre al pulsarlo (en pantallas táctiles no hay «pasar el ratón») y se cierra al ir a otra parte', () => {
    vi.useFakeTimers()
    render(<N4LHelpTerm label={'Época'} help={'Una pasada por todos los datos'} />)
    const term = screen.getByRole('button', { name: 'Época' })
    fireEvent.click(term)
    expect(term).toHaveAccessibleDescription('Una pasada por todos los datos')
    fireEvent.blur(term)
    act(() => vi.advanceTimersByTime(1000))
    expect(term).toHaveAccessibleDescription('')
  })
})
