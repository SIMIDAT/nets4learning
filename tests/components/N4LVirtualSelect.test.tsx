import { describe, test, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import N4LVirtualSelect from '@components/select/N4LVirtualSelect'
import { filterVirtualSelectOptions } from '@components/select/filterVirtualSelectOptions'

const CLASSES = ['unacc', 'acc', 'good', 'vgood']
// Como las filas de un conjunto de datos grande: "#número · clase"
const OPTIONS = Array.from({ length: 5000 }, (_, index) => ({ value: index, label: `#${index} · ${CLASSES[index % 4]}` }))

function renderSelect(onChange = vi.fn(), value: number | null = null) {
  render(<N4LVirtualSelect options={OPTIONS} value={value} onChange={onChange}
    placeholder={'Selecciona la entidad'} searchPlaceholder={'Buscar'} noResultsText={'Nada'}
    countText={(shown, total) => `${shown} de ${total}`} />)
  return onChange
}

const open = () => fireEvent.click(screen.getByRole('button', { name: /Selecciona la entidad|#/ }))

describe('filterVirtualSelectOptions', () => {

  test('sin búsqueda, todas; con búsqueda, primero las que empiezan por ella (sin contar el "#")', () => {
    expect(filterVirtualSelectOptions(OPTIONS, '  ')).toBe(OPTIONS)
    const found = filterVirtualSelectOptions(OPTIONS, '12')
    expect(found.slice(0, 3).map((o) => o.label)).toEqual(['#12 · unacc', '#120 · unacc', '#121 · acc'])
    expect(found.some((o) => o.label === '#112 · unacc')).toBe(true)
    expect(found.findIndex((o) => o.label === '#112 · unacc')).toBeGreaterThan(found.findIndex((o) => o.label === '#1299 · vgood'))
  })

  test('también busca por la clase, sin distinguir mayúsculas', () => {
    expect(filterVirtualSelectOptions(OPTIONS, 'VGOOD')).toHaveLength(1250)
  })
})

describe('N4LVirtualSelect', () => {

  test('con miles de opciones solo pinta las que se ven', () => {
    renderSelect()
    expect(screen.getByRole('button')).toHaveTextContent('Selecciona la entidad')
    open()
    expect(screen.getByRole('combobox')).toHaveFocus()
    expect(screen.getByText('5000 de 5000')).toBeInTheDocument()
    const options = screen.getAllByRole('option')
    expect(options.length).toBeLessThan(30)
    expect(options[0]).toHaveAttribute('aria-setsize', '5000')
    expect(options[0]).toHaveAttribute('aria-posinset', '1')
  })

  test('al hacer scroll aparecen las filas de esa altura', () => {
    renderSelect()
    open()
    const list = screen.getByRole('listbox')
    list.scrollTop = 32 * 4000
    fireEvent.scroll(list)
    expect(screen.getByText('#4000 · unacc')).toBeInTheDocument()
    expect(screen.queryByText('#0 · unacc')).toBeNull()
  })

  test('se busca y se elige con el teclado', () => {
    const onChange = renderSelect()
    open()
    const search = screen.getByRole('combobox')
    fireEvent.change(search, { target: { value: '4999' } })
    expect(screen.getByText('1 de 5000')).toBeInTheDocument()
    expect(search).toHaveAttribute('aria-activedescendant', screen.getByRole('option').id)
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(4999)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  test('las flechas mueven la opción activa y Esc cierra sin elegir', () => {
    const onChange = renderSelect()
    open()
    const search = screen.getByRole('combobox')
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    expect(search.getAttribute('aria-activedescendant')).toBe(screen.getByText('#2 · good').id)
    fireEvent.keyDown(search, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).toHaveFocus()
  })

  test('se elige con el ratón, y abre en la opción elegida', () => {
    const onChange = renderSelect(vi.fn(), 2500)
    expect(screen.getByRole('button')).toHaveTextContent('#2500 · unacc')
    open()
    expect(screen.getByRole('option', { name: '#2500 · unacc' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('option', { name: '#2501 · acc' }))
    expect(onChange).toHaveBeenCalledWith(2501)
  })

  test('sin coincidencias lo dice', () => {
    renderSelect()
    open()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } })
    expect(screen.getByText('Nada')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  test('deshabilitado no se abre', () => {
    render(<N4LVirtualSelect options={OPTIONS} value={null} onChange={vi.fn()} disabled
      placeholder={'Selecciona la entidad'} searchPlaceholder={'Buscar'} noResultsText={'Nada'} />)
    expect(screen.getByRole('button')).toBeDisabled()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
