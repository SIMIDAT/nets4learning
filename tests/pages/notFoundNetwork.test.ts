import { describe, test, expect } from 'vitest'
import { particles } from '@tsparticles/particles'
import { tsParticles } from '@tsparticles/engine'
import { NETWORK_LAYOUTS, networkOptions } from '@pages/notFound/networkOptions'

const COLORS = { node: '#0d6efd', hub: '#0dcaf0', link: '#0d6efd' }

/** Las opciones de las neuronas tal como las recibe tsParticles (las de los plugins no tienen tipo en el motor) */
type NetworkParticles_t = {
  number : { value: number }
  opacity: { value: { min: number }, animation: { enable: boolean } }
  size   : { value: { min: number, max: number }, animation: { enable: boolean } }
  move   : { enable: boolean }
  links  : { enable: boolean, opacity: number, frequency: number }
}
const particlesOf = (...args: Parameters<typeof networkOptions>) => networkOptions(...args).particles as unknown as NetworkParticles_t

describe('fondo de la 404 (red neuronal)', () => {
  test('el motor es el mismo que trae @tsparticles/particles: con dos copias, sus plugins no llegarían y no se pintaría nada', () => {
    expect(tsParticles.version).toBe(particles.version)
  })

  test('menos neuronas cuanto más estrecha es la pantalla, y conexiones más cortas y escasas', () => {
    const { desktop, tablet, mobile } = NETWORK_LAYOUTS
    expect(desktop.count).toBeGreaterThanOrEqual(40)
    expect(desktop.count).toBeLessThanOrEqual(70)
    expect(mobile.count).toBeGreaterThanOrEqual(20)
    expect(mobile.count).toBeLessThanOrEqual(35)
    expect(tablet.count).toBeLessThan(desktop.count)
    expect(tablet.count).toBeGreaterThan(mobile.count)
    expect(mobile.linkDistance).toBeLessThan(tablet.linkDistance)
    expect(mobile.linkFrequency).toBeLessThan(desktop.linkFrequency)
    expect(particlesOf(mobile, COLORS, false).number.value).toBe(mobile.count)
  })

  test('neuronas pequeñas, líneas más tenues que ellas y no todas las parejas cercanas conectadas', () => {
    const options = particlesOf(NETWORK_LAYOUTS.desktop, COLORS, false)
    expect(options.size.value).toEqual({ min: 1.5, max: 3 })
    expect(options.links.enable).toBe(true)
    expect(options.links.opacity).toBeLessThan(options.opacity.value.min)
    expect(options.links.frequency).toBeLessThan(1)
  })

  test('con movimiento reducido es una imagen fija: ni se mueve ni parpadea', () => {
    const moving = particlesOf(NETWORK_LAYOUTS.desktop, COLORS, false)
    expect(moving.move.enable).toBe(true)
    expect(moving.opacity.animation.enable).toBe(true)
    const still = particlesOf(NETWORK_LAYOUTS.desktop, COLORS, true)
    expect(still.move.enable).toBe(false)
    expect(still.opacity.animation.enable).toBe(false)
    expect(still.size.animation.enable).toBe(false)
    expect(still.links.enable).toBe(true)
  })
})
