import { describe, test, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import N4LNumberField from '@components/form/N4LNumberField'

// t devuelve la clave (tests/setupTests.ts)
const field = (props: Partial<Parameters<typeof N4LNumberField>[0]> = {}) => {
  const onChange = vi.fn()
  const view = render(<N4LNumberField controlId={'epochs'} label={'Épocas'} help={'Cuántas veces'} value={20} min={1} max={100} onChange={onChange} {...props} />)
  return { onChange, input: screen.getByRole('spinbutton', { name: 'Épocas' }), ...view }
}

describe('N4LNumberField', () => {
  test('un valor válido se usa y el campo no tiene error', () => {
    const { onChange, input } = field()
    fireEvent.change(input, { target: { value: '30' } })
    expect(onChange).toHaveBeenCalledWith(30)
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).toHaveAccessibleDescription('Cuántas veces')
  })

  test('lo que no vale no se recorta en silencio: se dice junto al campo y se sigue usando el último valor bueno', () => {
    const { onChange, input } = field()
    fireEvent.change(input, { target: { value: '500' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue(500)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Cuántas veces form.number.range form.number.in-use')
    expect(screen.getByTestId('Test-NumberField-Error')).toHaveAttribute('aria-live', 'polite')
  })

  test('se puede borrar el número para escribir otro', () => {
    const { onChange, input } = field()
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue(null)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '7' } })
    expect(onChange).toHaveBeenLastCalledWith(7)
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  test('sin máximo, el mensaje dice el mínimo; los decimales no valen', () => {
    const { onChange, input } = field({ max: undefined })
    fireEvent.change(input, { target: { value: '2.5' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('Test-NumberField-Error')).toHaveTextContent('form.number.at-least')
  })

  test('si el valor cambia desde fuera, el campo lo enseña', () => {
    const { input, rerender, onChange } = field()
    rerender(<N4LNumberField controlId={'epochs'} label={'Épocas'} value={42} min={1} max={100} onChange={onChange} />)
    expect(input).toHaveValue(42)
  })
})
