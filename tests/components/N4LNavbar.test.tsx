import { describe, test, expect, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import N4LNavbar from '@components/header/N4LNavbar'
import { IndexedDBPackageStore, MemoryPackageStore, setN4LPackageStore, type LocalPackage_t } from '@core/n4l/localPackages'

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
  afterEach(() => setN4LPackageStore(new IndexedDBPackageStore()))

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

  test('«Tareas» enlaza a la página de cada una y se marca en la tarea en la que se está', () => {
    renderAt('/playground/regression/dataset/AUTO_MPG')
    const tasks = document.getElementById('tasks-nav-dropdown')!
    expect(tasks).toHaveTextContent('header.tasks')
    expect(tasks).toHaveClass('active')
    fireEvent.click(tasks)
    expect(link('pages.index.tabular-classification.1-title')).toHaveAttribute('href', '/task/tabular-classification')
    expect(link('pages.index.clustering.1-title')).toHaveAttribute('href', '/task/clustering')
    expect(link('pages.index.regression.1-title')).toHaveClass('active')
    expect(screen.getAllByRole('link').filter((element) => element.getAttribute('href')?.startsWith('/task/'))).toHaveLength(5)

    fireEvent.click(link('pages.index.object-detection.1-title'))
    expect(screen.getByTestId('location')).toHaveTextContent('/task/object-detection')
  })

  test('fuera de las tareas, «Tareas» no se marca', () => {
    renderAt('/glossary')
    expect(document.getElementById('tasks-nav-dropdown')).not.toHaveClass('active')
  })

  test('«Paquetes .n4l», aparte: lleva a su página y dice cuántos hay guardados', async () => {
    const store = new MemoryPackageStore()
    const info = (id: string): LocalPackage_t => ({ id, version: '1.0.0', importedAt: 0, bytes: 1, tasks: [{ task: 'regression', names: {}, models: 1 }] })
    await store.save(info('a'), new ArrayBuffer(1))
    await store.save(info('b'), new ArrayBuffer(1))
    setN4LPackageStore(store)
    renderAt('/packages')
    const packages = screen.getByTestId('Test-Navbar-Packages')
    expect(packages).toHaveAttribute('href', '/packages')
    expect(packages).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByTitle('header.packages-saved')).toHaveTextContent('2')
  })

  test('cada ajuste enseña su valor actual', () => {
    renderAt('/')
    expect(document.getElementById('change-theme-nav-dropdown')).toHaveTextContent(/header\.theme\s*header\.theme-(light|dark)/)
    expect(document.getElementById('change-tf-backend-nav-dropdown')).toHaveTextContent(/header\.backend\s*(WebGL|WebGPU|WebAssembly|CPU)/)
    // GitHub con su nombre (en el menú del móvil el icono solo no se entiende)
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/SIMIDAT/nets4learning')
  })
})
