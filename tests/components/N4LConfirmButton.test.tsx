import { describe, test, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import N4LConfirmButton from '@components/form/N4LConfirmButton'

const renderButton = (onConfirm = vi.fn()) => {
  render(<N4LConfirmButton label={'Borrar los modelos'} question={'Se borrarán 3 modelos.'} confirmLabel={'Borrarlos'} onConfirm={onConfirm} />)
  return onConfirm
}

describe('N4LConfirmButton: pregunta antes de lo que no se puede deshacer (WCAG 3.3.4)', () => {
  test('primero pregunta, con el foco en «Cancelar»; cancelar no hace nada y devuelve el foco al botón', async () => {
    const onConfirm = renderButton()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar los modelos' }))
    expect(screen.getByRole('group', { name: 'Se borrarán 3 modelos.' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'form.cancel' })).toHaveFocus())
    fireEvent.click(screen.getByRole('button', { name: 'form.cancel' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Borrar los modelos' })).toHaveFocus())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('al confirmar lo hace', async () => {
    const onConfirm = renderButton()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar los modelos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Borrarlos' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })
})
