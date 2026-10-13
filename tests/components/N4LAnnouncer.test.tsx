import { describe, test, expect, vi, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import N4LAnnouncer from '@components/a11y/N4LAnnouncer'
import { announce } from '@core/a11y/announce'

describe('N4LAnnouncer: lo que se anuncia al lector de pantalla', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('una región aria-live que está desde el principio y dice cada mensaje', () => {
    vi.useFakeTimers()
    render(<N4LAnnouncer />)
    const region = screen.getByTestId('Test-Announcer')
    expect(region).toHaveAttribute('aria-live', 'polite')
    act(() => announce('Modelo cargado.'))
    act(() => vi.advanceTimersByTime(200))
    expect(region).toHaveTextContent('Modelo cargado.')
  })

  test('lo que llega casi a la vez se dice junto (el último no tapa a los demás) y sin repetir', () => {
    vi.useFakeTimers()
    render(<N4LAnnouncer />)
    act(() => {
      announce('Capa 3 eliminada.')
      announce('Las capas ya no tienen nada que revisar.')
      announce('Las capas ya no tienen nada que revisar.')
    })
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByTestId('Test-Announcer')).toHaveTextContent('Capa 3 eliminada. Las capas ya no tienen nada que revisar.')
  })
})
