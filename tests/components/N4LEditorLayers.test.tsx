import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import N4LEditorLayers from '@components/neural-network/N4LEditorLayers'
import { moveLayer } from '@components/neural-network/moveLayer'

type Layer_t = { name: string, locked?: boolean }

/** El editor con sus capas en un estado, como en los entrenadores; la última, fija (como la salida de regresión) */
function Editor({ initial }: { initial: Layer_t[] }) {
  const [layers, setLayers] = useState(initial)
  return <>
    <N4LEditorLayers layers={layers} summary={(layer) => layer.name} renderFields={(layer) => <p>{'campos de ' + layer.name}</p>}
      isLocked={(layer) => layer.locked === true}
      onAddEnd={() => undefined} onRemove={() => undefined}
      onMove={(from, to) => setLayers((current) => moveLayer(current, from, to))} />
    <output data-testid={'order'}>{layers.map(({ name }) => name).join(',')}</output>
  </>
}

const LAYERS: Layer_t[] = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'salida', locked: true }]
const move = (direction: 'up' | 'down', index: number) => document.querySelector<HTMLButtonElement>(`[data-move="${direction}-${index}"]`)!
const header = (index: number) => screen.getAllByRole('button').find((element) => element.classList.contains('accordion-button') && element.textContent?.startsWith('pages.playground.generator.editor-layers.layer-id') && element.closest('[data-guide="layer-' + index + '"]'))!

describe('N4LEditorLayers: ordenar las capas', () => {
  afterEach(() => cleanup())

  test('moveLayer: la capa a su nuevo puesto y las demás en su orden', () => {
    expect(moveLayer(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveLayer(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b'])
    const same = ['a', 'b']
    expect(moveLayer(same, 1, 5)).toBe(same)
  })

  test('se sube y se baja con botones; la capa sigue abierta y el foco, en ella', () => {
    render(<Editor initial={LAYERS} />)
    fireEvent.click(header(0))
    expect(screen.getByText('campos de a')).toBeVisible()
    // La primera no sube
    expect(move('up', 0)).toBeDisabled()

    fireEvent.click(move('down', 0))
    expect(screen.getByTestId('order')).toHaveTextContent('b,a,c,salida')
    // Abierta en su nuevo puesto (el 2) y con el foco en «Bajar»
    expect(screen.getByText('campos de a')).toBeVisible()
    expect(document.activeElement).toHaveAttribute('data-move', 'down-1')

    fireEvent.click(move('down', 1))
    expect(screen.getByTestId('order')).toHaveTextContent('b,c,a,salida')
    // Ya no puede bajar más (la salida es fija): el foco pasa a «Subir»
    expect(document.querySelector('[data-move="down-2"]')).toBeDisabled()
    expect(document.activeElement).toHaveAttribute('data-move', 'up-2')
  })

  test('una capa fija no se mueve', () => {
    render(<Editor initial={LAYERS} />)
    fireEvent.click(header(3))
    expect(document.querySelector('[data-move="up-3"]')).toBeDisabled()
    expect(document.querySelector('[data-move="down-3"]')).toBeDisabled()
  })

  describe('arrastrando', () => {
    beforeAll(() => {
      // jsdom no tiene PointerEvent
      if (window.PointerEvent === undefined) {
        class PointerEventPolyfill extends MouseEvent {
          pointerId: number
          constructor(type: string, init: PointerEventInit = {}) {
            super(type, init)
            this.pointerId = init.pointerId ?? 0
          }
        }
        window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent
      }
    })
    afterEach(() => vi.restoreAllMocks())

    /** Cada capa, de 40 px de alto, una debajo de otra (jsdom no coloca nada) */
    const stack = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const index = Number(this.getAttribute('data-layer-item'))
      return { top: index * 40, height: 40, bottom: index * 40 + 40, left: 0, right: 300, width: 300, x: 0, y: index * 40, toJSON: () => ({}) } as DOMRect
    })
    const handle = (index: number) => document.querySelector<HTMLElement>(`[data-drag="${index}"]`)!
    const item = (index: number) => document.querySelector<HTMLElement>(`[data-layer-item="${index}"]`)!
    const drag = (from: number, y: number) => {
      fireEvent.pointerDown(handle(from), { button: 0, pointerId: 1, clientY: from * 40 + 20 })
      fireEvent.pointerMove(handle(from), { pointerId: 1, clientY: y })
    }

    test('la capa cae donde se suelta, con una raya que lo marca mientras se arrastra', () => {
      stack()
      render(<Editor initial={LAYERS} />)
      // La primera, por debajo del centro de la tercera (100 px)
      drag(0, 110)
      expect(item(0)).toHaveClass('n4l-layer-dragging')
      expect(item(2)).toHaveClass('n4l-layer-drop-after')
      fireEvent.pointerUp(handle(0), { pointerId: 1, clientY: 110 })
      expect(screen.getByTestId('order')).toHaveTextContent('b,c,a,salida')
      expect(item(0)).not.toHaveClass('n4l-layer-dragging')
    })

    test('no pasa por encima de una capa fija: al soltarla al final, se queda justo antes de la salida', () => {
      stack()
      render(<Editor initial={LAYERS} />)
      drag(0, 1000)
      fireEvent.pointerUp(handle(0), { pointerId: 1, clientY: 1000 })
      expect(screen.getByTestId('order')).toHaveTextContent('b,c,a,salida')
    })

    test('una capa fija no se arrastra, y soltar en el mismo sitio no cambia nada', () => {
      stack()
      render(<Editor initial={LAYERS} />)
      drag(3, 0)
      expect(item(3)).not.toHaveClass('n4l-layer-dragging')
      drag(1, 60)
      fireEvent.pointerUp(handle(1), { pointerId: 1, clientY: 60 })
      expect(screen.getByTestId('order')).toHaveTextContent('a,b,c,salida')
    })

    test('el panel abierto sigue con su capa', () => {
      stack()
      render(<Editor initial={LAYERS} />)
      fireEvent.click(header(1))
      drag(0, 1000)
      fireEvent.pointerUp(handle(0), { pointerId: 1, clientY: 1000 })
      // b estaba abierta en el puesto 2 y ahora está en el 1: sigue abierta
      expect(screen.getByText('campos de b')).toBeVisible()
    })
  })

  test('sin onMove, no hay botones para mover', () => {
    render(<N4LEditorLayers layers={LAYERS} summary={(layer) => layer.name} renderFields={() => null} onAddEnd={() => undefined} onRemove={() => undefined} />)
    fireEvent.click(header(0))
    expect(document.querySelector('[data-move]')).toBeNull()
  })
})
