import { describe, test, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import N4LPagination from '@components/table/N4LPagination'

describe('N4LPagination', () => {

  test('muestra la página actual, sus vecinas existentes y "-" para las que no existen', () => {
    const { container } = render(<N4LPagination activePage={1} pageCount={3} onChange={() => {}} />)
    const items = Array.from(container.querySelectorAll('.page-item')).map((li) => li.textContent?.replace(/[«‹›»]|First|Previous|Next|Last|\(current\)/g, '').trim())
    // First, Prev, -3, -2, -1, actual, +1, +2, +3, Next, Last
    expect(items.slice(2, 9)).toStrictEqual(['-', '-', '0', '1', '2', '-', '-'])
    expect(container.querySelector('.page-item.active')?.textContent).toContain('1')
  })

  test('desactiva la navegación en los extremos y avisa de la página elegida', () => {
    const onChange = vi.fn()
    const { container, getByText } = render(<N4LPagination activePage={0} pageCount={2} onChange={onChange} />)
    const items = container.querySelectorAll('.page-item')
    expect(items[0].classList.contains('disabled')).toBe(true)                 // First
    expect(items[items.length - 1].classList.contains('disabled')).toBe(false) // Last
    fireEvent.click(getByText('1'))
    expect(onChange).toHaveBeenCalledWith(1)
  })
})
