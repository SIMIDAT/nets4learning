import * as tfvis from '@tensorflow/tfjs-vis'

// Id del contenedor del visor en tfjs-vis
const VISOR_CONTAINER_ID = 'tfjs-visor-container'

// Pantallas en las que el visor (550 px de ancho, fijo a la derecha) taparía casi toda la página: móviles en vertical
// (estrechas) y en horizontal (bajas)
const SMALL_SCREEN = '(max-width: 767.98px), (max-height: 500px)'

export const isSmallScreen = () => typeof window !== 'undefined' && window.matchMedia?.(SMALL_SCREEN).matches === true

/**
 * El visor al empezar un entrenamiento: en escritorio se abre; en el móvil no, porque no dejaría ver la página (las
 * gráficas se dibujan igual y se ven con "Abrir visor"). tfvis.visor() crea el visor ya abierto si aún no existe: en el
 * móvil se cierra nada más crearlo, y si ya existía se deja como lo tenga el usuario.
 */
export function showTrainingVisor() {
  if (!isSmallScreen()) {
    tfvis.visor().open()
    return
  }
  const exists = document.getElementById(VISOR_CONTAINER_ID) !== null
  const visor = tfvis.visor()
  if (!exists) visor.close()
}
