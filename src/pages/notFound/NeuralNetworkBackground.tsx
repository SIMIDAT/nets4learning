import { useCallback, useEffect, useId, useRef, useSyncExternalStore } from 'react'
import { particles } from '@tsparticles/particles'
import { tsParticles, type Container, type Particle } from '@tsparticles/engine'

import { useTheme } from '@hooks/useTheme'
import { CURSOR_OPTIONS, NETWORK_LAYOUTS, networkOptions } from './networkOptions'
import styles from './NotFoundPage.module.css'

/** Si se cumple la media query; cambia con ella (al girar el móvil, al pedir menos movimiento al sistema…) */
function useMediaQuery(query: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia?.(query)
    list?.addEventListener('change', onChange)
    return () => list?.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false)
}

/**
 * Fondo de la página 404: una red neuronal que sigue procesando. Lo pinta tsParticles (con los plugins del bundle
 * @tsparticles/particles) en un canvas detrás del contenido; los colores salen del tema (--n4l-network-* en el CSS). Se
 * vuelve a crear al cambiar el tema, el tamaño de pantalla o la preferencia de movimiento, y se destruye al salir.
 */
export default function NeuralNetworkBackground() {
  const id = useId()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useTheme()
  const isDesktop = useMediaQuery('(min-width: 992px)')
  const isTablet = useMediaQuery('(min-width: 576px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const layout = isDesktop ? NETWORK_LAYOUTS.desktop : isTablet ? NETWORK_LAYOUTS.tablet : NETWORK_LAYOUTS.mobile

  useEffect(() => {
    const canvas = canvasRef.current
    // tsParticles 4 pinta en un OffscreenCanvas: sin él (navegadores antiguos, jsdom) la página se queda sin fondo
    if (canvas === null || typeof canvas.transferControlToOffscreen !== 'function') return
    const style = getComputedStyle(canvas)
    const color = (name: string) => style.getPropertyValue(name).trim()
    const colors = { node: color('--n4l-network-node'), hub: color('--n4l-network-hub'), link: color('--n4l-network-link') }

    let container: Container | undefined
    let cursor: Particle | undefined
    let isCancelled = false

    const removeCursor = () => {
      if (cursor !== undefined && container !== undefined && !container.destroyed) container.particles.remove(cursor)
      cursor = undefined
    }
    // Solo con ratón o lápiz: con el dedo, pointermove es desplazar la página
    const onPointerMove = (event: PointerEvent) => {
      if (container === undefined || event.pointerType === 'touch') return
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        removeCursor()
        return
      }
      // Las posiciones de tsParticles van en píxeles del canvas (los de CSS por devicePixelRatio)
      const ratio = container.retina.pixelRatio
      if (cursor === undefined || cursor.destroyed) {
        cursor = container.particles.addParticle({ x: x * ratio, y: y * ratio }, CURSOR_OPTIONS)
      } else {
        cursor.position.x = x * ratio
        cursor.position.y = y * ratio
      }
    }

    particles.init()
      .then(() => tsParticles.load({ id, element: canvas, options: networkOptions(layout, colors, reducedMotion) }))
      .then((loaded) => {
        if (isCancelled) loaded?.destroy()
        else container = loaded
      })
      .catch((error: unknown) => {
        // Es decoración: si no se puede pintar, la página sigue igual
        console.warn('NeuralNetworkBackground', error)
      })
    if (!reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', removeCursor)
    }

    return () => {
      isCancelled = true
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', removeCursor)
      container?.destroy()
    }
  }, [id, layout, theme, reducedMotion])

  return <canvas ref={canvasRef} className={styles.network} aria-hidden={true} data-testid={'Test-NotFoundNetwork'} />
}
