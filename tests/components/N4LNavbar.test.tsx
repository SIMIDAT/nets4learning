import { describe, test, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import N4LNavbar from '@components/header/N4LNavbar'

function LocationDisplay() {
  return <p data-testid={'location'}>{useLocation().pathname}</p>
}

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <N4LNavbar />
    <LocationDisplay />
  </MemoryRouter>,
)

const link = (name: string) => screen.getByRole('link', { name })
const toggler = () => screen.getByRole('button', { name: 'header.menu' })

describe('N4LNavbar', () => {

  test('marca la página actual (y Inicio solo en la home)', () => {
    renderAt('/manual')
    expect(link('header.manual')).toHaveAttribute('aria-current', 'page')
    expect(link('header.manual')).toHaveClass('active')
    expect(link('header.home')).not.toHaveAttribute('aria-current')

    renderAt('/')
    expect(screen.getAllByRole('link', { name: 'header.home' }).at(-1)).toHaveAttribute('aria-current', 'page')
  })

  test('en el móvil el menú se cierra al ir a otra página', () => {
    renderAt('/')
    expect(toggler()).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggler())
    expect(toggler()).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(link('header.glossary'))
    expect(screen.getByTestId('location')).toHaveTextContent('/glossary')
    expect(toggler()).toHaveAttribute('aria-expanded', 'false')
  })

  test('también se cierra al pulsar la página en la que ya se está', () => {
    renderAt('/datasets')
    fireEvent.click(toggler())
    fireEvent.click(link('header.datasets'))
    expect(toggler()).toHaveAttribute('aria-expanded', 'false')
  })

  test('cada ajuste enseña su valor actual', () => {
    renderAt('/')
    expect(document.getElementById('change-theme-nav-dropdown')).toHaveTextContent(/header\.theme\s*header\.theme-(light|dark)/)
    expect(document.getElementById('change-tf-backend-nav-dropdown')).toHaveTextContent(/header\.backend\s*(WebGL|WebGPU|WebAssembly|CPU)/)
    // GitHub con su nombre (en el menú del móvil el icono solo no se entiende)
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/SIMIDAT/nets4learning')
  })
})
