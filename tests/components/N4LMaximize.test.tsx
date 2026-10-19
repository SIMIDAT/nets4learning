import { describe, test, expect, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Card } from 'react-bootstrap'
import N4LMaximizeButton from '@components/maximize/N4LMaximizeButton'
import { useMaximize } from '@components/maximize/useMaximize'

// Como en N4LLayerDesign: la clase va en la tarjeta y el botón en su cabecera
function MaximizableCard() {
  const maximize = useMaximize()
  return (
    <Card className={maximize.className} data-testid={'card'}>
      <Card.Header>
        <N4LMaximizeButton maximized={maximize.maximized} onToggle={maximize.toggle} />
      </Card.Header>
    </Card>
  )
}

describe('useMaximize y N4LMaximizeButton', () => {
  afterEach(() => {
    document.body.classList.remove('modal-open')
  })

  test('el botón maximiza la tarjeta, bloquea el desplazamiento de la página y la vuelve a su sitio', () => {
    render(<MaximizableCard />)
    expect(screen.getByTestId('card')).not.toHaveClass('n4l-maximized')

    fireEvent.click(screen.getByRole('button', { name: 'ui.maximize' }))
    expect(screen.getByTestId('card')).toHaveClass('n4l-maximized')
    expect(document.body).toHaveClass('n4l-maximized-open')

    fireEvent.click(screen.getByRole('button', { name: 'ui.minimize' }))
    expect(screen.getByTestId('card')).not.toHaveClass('n4l-maximized')
    expect(document.body).not.toHaveClass('n4l-maximized-open')
  })

  test('Escape la devuelve a su sitio, salvo con un modal abierto encima', () => {
    render(<MaximizableCard />)
    fireEvent.click(screen.getByRole('button', { name: 'ui.maximize' }))

    document.body.classList.add('modal-open')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('card')).toHaveClass('n4l-maximized')

    document.body.classList.remove('modal-open')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('card')).not.toHaveClass('n4l-maximized')
    expect(document.body).not.toHaveClass('n4l-maximized-open')
  })

  test('al desmontar la tarjeta maximizada, la página se puede volver a desplazar', () => {
    const { unmount } = render(<MaximizableCard />)
    fireEvent.click(screen.getByRole('button', { name: 'ui.maximize' }))
    unmount()
    expect(document.body).not.toHaveClass('n4l-maximized-open')
  })
})
