// Lo que tiene que decir el lector de pantalla sin que se mueva el foco (WCAG 4.1.3): el resultado de una predicción,
// los datos cargados, cómo va un entrenamiento… Lo lee N4LAnnouncer, una región aria-live que está en la página desde
// el principio: una región que aparece a la vez que su texto no siempre se anuncia.

type Listener_t = (message: string) => void

const listeners = new Set<Listener_t>()

/** Lo anuncia el lector de pantalla cuando termine lo que esté diciendo (aria-live="polite") */
export function announce(message: string) {
  if (typeof message !== 'string' || message.trim() === '') return
  listeners.forEach((listener) => listener(message))
}

/** Para N4LAnnouncer (y las pruebas): recibe cada mensaje; devuelve cómo dejar de recibirlos */
export function subscribeAnnouncements(listener: Listener_t): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
