import { describe, test, expect, vi, beforeEach } from 'vitest'

// El visor de tfjs-vis: al crearlo (primera llamada a visor()) mete su contenedor en la página, ya abierto
const visor = { open: vi.fn(), close: vi.fn() }
vi.mock('@tensorflow/tfjs-vis', () => ({
  visor: () => {
    if (document.getElementById('tfjs-visor-container') === null) {
      const container = document.createElement('div')
      container.id = 'tfjs-visor-container'
      document.body.appendChild(container)
    }
    return visor
  },
}))

const { showTrainingVisor } = await import('@core/nn-utils/trainingVisor')

function screen(small: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: small }) as unknown as typeof window.matchMedia
}

describe('visor al entrenar', () => {

  beforeEach(() => {
    document.getElementById('tfjs-visor-container')?.remove()
    visor.open.mockClear()
    visor.close.mockClear()
  })

  test('en escritorio se abre', () => {
    screen(false)
    showTrainingVisor()
    expect(visor.open).toHaveBeenCalled()
    expect(visor.close).not.toHaveBeenCalled()
  })

  test('en el móvil no se abre: se cierra al crearlo (tfjs-vis lo crea abierto)', () => {
    screen(true)
    showTrainingVisor()
    expect(visor.open).not.toHaveBeenCalled()
    expect(visor.close).toHaveBeenCalled()
  })

  test('en el móvil, si el visor ya estaba en la página, se queda como lo tenga el usuario', () => {
    screen(true)
    showTrainingVisor()
    visor.close.mockClear()
    showTrainingVisor()
    expect(visor.open).not.toHaveBeenCalled()
    expect(visor.close).not.toHaveBeenCalled()
  })
})
