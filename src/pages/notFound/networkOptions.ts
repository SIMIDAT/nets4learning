import type { IParticlesOptions, ISourceOptions, RecursivePartial } from '@tsparticles/engine'

/** Cuántas neuronas hay y hasta qué distancia (px) se conectan: menos y más cortas cuanto más estrecha es la pantalla */
export type NetworkLayout_t = { count: number, linkDistance: number, linkFrequency: number, fpsLimit: number }

export const NETWORK_LAYOUTS = {
  desktop: { count: 60, linkDistance: 150, linkFrequency: 0.85, fpsLimit: 60 },
  tablet : { count: 42, linkDistance: 130, linkFrequency: 0.8, fpsLimit: 60 },
  // El movimiento es tan lento que a 30 fps no se nota, y gasta la mitad de batería
  mobile : { count: 26, linkDistance: 110, linkFrequency: 0.7, fpsLimit: 30 },
} satisfies Record<string, NetworkLayout_t>

export type NetworkColors_t = { node: string, hub: string, link: string }

/**
 * La red: neuronas pequeñas que flotan despacio y se conectan con las cercanas. La línea se desvanece al alejarse y
 * desaparece a linkDistance; no se conectan todas las parejas cercanas (linkFrequency), así no queda una malla. Cada
 * neurona se enciende y se apaga a su ritmo, y una de cada cuatro brilla un poco (hub). Sin movimiento (reducedMotion)
 * es una imagen fija.
 */
export function networkOptions(layout: NetworkLayout_t, colors: NetworkColors_t, reducedMotion: boolean): ISourceOptions {
  const animate = !reducedMotion
  const node = { fill: { enable: true, color: { value: colors.node } } }
  // El brillo es el trazo del círculo, ancho y casi transparente: un halo alrededor
  const hub = { fill: { enable: true, color: { value: colors.hub } }, stroke: { width: 6, color: { value: colors.hub }, opacity: 0.15 } }
  return {
    fullScreen: { enable: false },
    // Fija no hace falta repintarla a cada fotograma; solo al cambiar de tamaño, que borra el canvas
    fpsLimit  : reducedMotion ? 4 : layout.fpsLimit,
    particles : {
      number : { value: layout.count },
      shape  : { type: 'circle' },
      paint  : [node, node, node, hub],
      size   : { value: { min: 1.5, max: 3 }, animation: { enable: animate, speed: 1.5, sync: false, startValue: 'random' } },
      opacity: { value: { min: 0.35, max: 0.9 }, animation: { enable: animate, speed: { min: 0.3, max: 1.2 }, sync: false, startValue: 'random' } },
      move   : { enable: animate, speed: { min: 0.1, max: 0.4 }, direction: 'none', straight: false, outModes: 'out' },
      links  : { enable: true, distance: layout.linkDistance, frequency: layout.linkFrequency, color: colors.link, opacity: 0.3, width: 0.8 },
    },
  }
}

/**
 * El cursor es una neurona más, invisible (radio 0) y quieta: las cercanas se conectan con él como entre ellas (sus
 * enlaces los decide la otra neurona, que va antes), sin moverse
 */
export const CURSOR_OPTIONS: RecursivePartial<IParticlesOptions> = {
  move: { enable: false },
  size: { value: 0, animation: { enable: false } },
}
