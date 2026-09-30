import { describe, test, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import N4LPagination from '@components/table/N4LPagination'

// Texto de los números de página (sin First, Prev, Next ni Last)
const pageNumbers = (container: HTMLElement) => Array.from(container.querySelectorAll('.page-item'))
  .slice(2, -2)
  .map((li) => li.textContent?.replace(/\(current\)/g, '').trim())

describe('N4LPagination', () => {

  test('enseña las páginas desde 1 y solo las que existen', () => {
    const { container } = render(<N4LPagination activePage={1} pageCount={3} onChange={() => {}} />)
    expect(pageNumbers(container)).toStrictEqual(['1', '2', '3'])
    expect(container.querySelector('.page-item.active')?.textContent).toContain('2')
  })

  test('hasta tres páginas a cada lado de la actual', () => {
    const { container } = render(<N4LPagination activePage={5} pageCount={15} onChange={() => {}} />)
    expect(pageNumbers(container)).toStrictEqual(['3', '4', '5', '6', '7', '8', '9'])
  })

  test('desactiva la navegación en los extremos y avisa de la página elegida', () => {
    const onChange = vi.fn()
    const { container, getByText } = render(<N4LPagination activePage={0} pageCount={2} onChange={onChange} />)
    const items = container.querySelectorAll('.page-item')
    expect(items[0].classList.contains('disabled')).toBe(true)                 // First
    expect(items[items.length - 1].classList.contains('disabled')).toBe(false) // Last
    fireEvent.click(getByText('2'))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  test('con una sola página no se muestra', () => {
    const { container } = render(<N4LPagination activePage={0} pageCount={1} onChange={() => {}} />)
    expect(container.querySelector('.pagination')).toBeNull()
  })
})
