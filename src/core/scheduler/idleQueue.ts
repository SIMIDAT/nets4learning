// Cola de trabajos para cuando el navegador está libre: uno por hueco, en orden. Sirve para repartir el pintado de
// una página con muchos gráficos (cada uno en su propia tarea corta) en vez de hacerlo todo en una tarea larga que
// congela la página (TODO-worker.md, fase 6).

type IdleDeadline_t = { timeRemaining: () => number, didTimeout: boolean }
type Job_t = () => void

const queue: Job_t[] = []
let scheduled = false

// Sin requestIdleCallback (Safari, jsdom), en la siguiente vuelta del bucle de eventos
const requestIdle = (callback: (deadline: IdleDeadline_t) => void) => {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(callback, { timeout: 300 })
  else setTimeout(() => callback({ timeRemaining: () => 0, didTimeout: true }), 16)
}

function schedule() {
  if (scheduled || queue.length === 0) return
  scheduled = true
  requestIdle(run)
}

// Un solo trabajo por hueco: si fueran varios, React juntaría sus actualizaciones en una única tarea larga
function run() {
  scheduled = false
  const job = queue.shift()
  try {
    job?.()
  } catch (error) {
    // Un trabajo que falla (un gráfico que no se pudo pintar) no para los demás
    console.error('Idle job failed', error)
  }
  schedule()
}

/** Ejecuta `job` cuando el navegador esté libre, después de los que ya esperan. Devuelve cómo cancelarlo */
export function scheduleIdle(job: Job_t): () => void {
  queue.push(job)
  schedule()
  return () => {
    const index = queue.indexOf(job)
    if (index !== -1) queue.splice(index, 1)
  }
}

/** Trabajos que esperan (para los tests) */
export const pendingIdleJobs = () => queue.length
