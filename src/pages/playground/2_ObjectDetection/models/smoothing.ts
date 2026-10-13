// El seguimiento y el suavizado de las detecciones de la webcam. Cada predicción trae su ruido: los puntos tiemblan unos
// píxeles aunque nada se mueva, una detección falta en un fotograma suelto o aparece una falsa durante uno solo y, como
// el lienzo solo cambiaba con cada predicción (20 por segundo como mucho), todo iba a saltos. Aquí cada detección se
// sigue de un fotograma al siguiente y:
// - se filtra con un filtro One Euro (Casiez, Roussel y Vogel, CHI 2012): mucho suavizado si está quieta (sin temblor)
//   y poco si se mueve deprisa (sin quedarse atrás)
// - se mantiene un momento si deja de verse (sin parpadeos) y no se muestra hasta verla dos veces (sin falsas sueltas)
// - lo dibujado se acerca poco a poco a la última predicción en cada fotograma de la pantalla (frame), no a saltos

/** Cómo suavizar las detecciones de un modelo: qué números son sus posiciones y cómo hacer una copia con otros */
export interface Smoothing_t<T> {
  /** Las posiciones que se dibujan, [x0, y0, x1, y1…], en píxeles: con ellas se sigue y se suaviza cada detección */
  positions(detection: T): number[]
  /** Otros números que conviene suavizar para que no salten (la confianza de cada punto, la edad…) */
  extras?(detection: T): number[]
  /** Si el modelo ya sigue sus detecciones (MoveNet), su identificador: entonces se siguen por él */
  id?(detection: T): number | string | undefined
  /** Una copia de la detección con esas posiciones y esos números */
  update(detection: T, positions: number[], extras: number[]): T
}

export type SmootherOptions_t = {
  /** La frecuencia de corte con la detección quieta, en Hz: cuanto más baja, más suave (y más retraso) */
  minCutoff     : number
  /** Cuánto sube la frecuencia de corte con la velocidad, en tamaños de la detección por segundo */
  beta          : number
  /** La frecuencia de corte de la velocidad, en Hz */
  velocityCutoff: number
  /** Cuánto se sigue mostrando una detección que ha dejado de verse, en ms */
  holdMs        : number
  /** Cuántas veces hay que ver una detección nueva para mostrarla */
  minHits       : number
  /** Cuánto tarda lo dibujado en acercarse a la última predicción, en ms (la constante de tiempo) */
  easeMs        : number
}

export const SMOOTHER_DEFAULTS: SmootherOptions_t = { minCutoff: 0.5, beta: 4, velocityCutoff: 1, holdMs: 300, minHits: 2, easeMs: 30 }

type Extent_t = { x: number, y: number, size: number }

// Una detección de la predicción nueva, con sus números
type Entry_t<T> = { detection: T, values: number[], count: number, key: number | string | undefined, extent: Extent_t }

type Track_t<T> = {
  // La última detección: lo que no se suaviza (nombres, clases…) es siempre lo último
  detection: T
  key      : number | string | undefined
  extent   : Extent_t
  // Las posiciones y los extras filtrados, y lo dibujado (null: aún nada)
  filtered : number[]
  count    : number
  shown    : number[] | null
  // La velocidad filtrada, en píxeles por segundo: cuánto se desplaza (x, y) y cuánto crece
  velocity : [number, number, number]
  hits     : number
  seenAt   : number
  shownAt  : number
}

/** El centro y el tamaño (la diagonal) de unas posiciones */
function extent(positions: number[]): Extent_t {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let i = 0; i + 1 < positions.length; i += 2) {
    minX = Math.min(minX, positions[i])
    maxX = Math.max(maxX, positions[i])
    minY = Math.min(minY, positions[i + 1])
    maxY = Math.max(maxY, positions[i + 1])
  }
  if (minX > maxX) return { x: 0, y: 0, size: 1 }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, size: Math.max(1, Math.hypot(maxX - minX, maxY - minY)) }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** El peso de un valor nuevo en un filtro de paso bajo con esa frecuencia de corte, tras `dt` segundos */
const lowPassWeight = (cutoff: number, dt: number) => 1 / (1 + 1 / (2 * Math.PI * cutoff * dt))

// Por encima de este coste, dos detecciones de fotogramas seguidos no son la misma: su centro se ha movido más de tres
// cuartos de su tamaño o su tamaño ha cambiado mucho
const MAX_MATCH_COST = 0.75

export class DetectionSmoother<T> {
  readonly smoothing: Smoothing_t<T>
  readonly options  : SmootherOptions_t
  _tracks           : Array<Track_t<T>> = []

  constructor(smoothing: Smoothing_t<T>, options: Partial<SmootherOptions_t> = {}) {
    this.smoothing = smoothing
    this.options = { ...SMOOTHER_DEFAULTS, ...options }
  }

  /** Una predicción nueva, en el instante `now` (ms): sigue cada detección y la filtra */
  update(detections: T[], now: number) {
    const entries = detections.map((detection): Entry_t<T> => {
      const positions = this.smoothing.positions(detection)
      return {
        detection,
        values: [...positions, ...(this.smoothing.extras?.(detection) ?? [])],
        count : positions.length,
        key   : this.smoothing.id?.(detection),
        extent: extent(positions),
      }
    })

    // Cada detección, con la seguida más parecida: primero las parejas más claras
    const pairs: Array<{ track: Track_t<T>, entry: number, cost: number }> = []
    for (const track of this._tracks) {
      entries.forEach((entry, index) => {
        if (entry.count !== track.count) return
        if (entry.key !== undefined && track.key !== undefined) {
          if (entry.key === track.key) pairs.push({ track, entry: index, cost: 0 })
          return
        }
        const size = Math.max(entry.extent.size, track.extent.size)
        const cost = Math.hypot(entry.extent.x - track.extent.x, entry.extent.y - track.extent.y) / size +
          Math.abs(Math.log(entry.extent.size / track.extent.size))
        if (cost < MAX_MATCH_COST) pairs.push({ track, entry: index, cost })
      })
    }
    pairs.sort((a, b) => a.cost - b.cost)
    const matched = new Set<Track_t<T>>()
    const used = new Set<number>()
    for (const { track, entry } of pairs) {
      if (matched.has(track) || used.has(entry)) continue
      matched.add(track)
      used.add(entry)
      this._filter(track, entries[entry], now)
    }

    // Las que dejan de verse se mantienen un momento, si ya se mostraban; las nuevas, al final (el orden no cambia)
    this._tracks = this._tracks.filter((track) =>
      matched.has(track) || (track.hits >= this.options.minHits && now - track.seenAt <= this.options.holdMs))
    entries.forEach((entry, index) => {
      if (used.has(index)) return
      this._tracks.push({
        detection: entry.detection,
        key      : entry.key,
        extent   : entry.extent,
        filtered : [...entry.values],
        count    : entry.count,
        shown    : null,
        velocity : [0, 0, 0],
        hits     : 1,
        seenAt   : now,
        shownAt  : now,
      })
    })
  }

  _filter(track: Track_t<T>, entry: Entry_t<T>, now: number) {
    const dt = Math.max((now - track.seenAt) / 1000, 1 / 240)
    if (entry.values.length !== track.filtered.length) {
      track.filtered = [...entry.values]
    } else {
      // La velocidad: lo que se ha desplazado el punto típico (la mediana, que no cambian unos pocos puntos erráticos,
      // como los que MoveNet no ve bien) y lo que ha crecido. Con su signo y filtrada: el temblor va y viene y se anula,
      // así que no cuenta como movimiento
      const [dxs, dys]: [number[], number[]] = [[], []]
      for (let i = 0; i + 1 < entry.count; i += 2) {
        dxs.push(entry.values[i] - track.filtered[i])
        dys.push(entry.values[i + 1] - track.filtered[i + 1])
      }
      const velocity = [median(dxs) / dt, median(dys) / dt, (entry.extent.size - track.extent.size) / dt]
      const velocityWeight = lowPassWeight(this.options.velocityCutoff, dt)
      track.velocity = track.velocity.map((v, i) => v + velocityWeight * (velocity[i] - v)) as [number, number, number]
      // En tamaños por segundo: lo mismo para una cara lejos que cerca
      const speed = Math.hypot(...track.velocity) / Math.max(entry.extent.size, track.extent.size)
      const weight = lowPassWeight(this.options.minCutoff + this.options.beta * speed, dt)
      for (let i = 0; i < entry.values.length; i++) track.filtered[i] += weight * (entry.values[i] - track.filtered[i])
    }
    track.detection = entry.detection
    track.key = entry.key ?? track.key
    track.extent = extent(track.filtered.slice(0, track.count))
    track.hits += 1
    track.seenAt = now
  }

  _copy(track: Track_t<T>, values: number[]): T {
    return this.smoothing.update(track.detection, values.slice(0, track.count), values.slice(track.count))
  }

  _shown(): Array<Track_t<T>> {
    return this._tracks.filter((track) => track.hits >= this.options.minHits)
  }

  /** Lo que se dibuja en el instante `now` (ms), en cada fotograma de la pantalla: acercándose a la última predicción */
  frame(now: number): T[] {
    return this._shown().map((track) => {
      if (track.shown === null || track.shown.length !== track.filtered.length) {
        track.shown = [...track.filtered]
      } else {
        const weight = 1 - Math.exp(-Math.max(0, now - track.shownAt) / this.options.easeMs)
        for (let i = 0; i < track.filtered.length; i++) track.shown[i] += weight * (track.filtered[i] - track.shown[i])
      }
      track.shownAt = now
      return this._copy(track, track.shown)
    })
  }

  /** La última predicción, filtrada: lo que se dibuja si solo se dibuja con cada predicción */
  latest(): T[] {
    return this._shown().map((track) => this._copy(track, track.filtered))
  }
}

type Point_t = { x: number, y: number, score?: number }
type Box_t = { xMin: number, yMin: number, xMax: number, yMax: number, width: number, height: number }

/**
 * El suavizado de las detecciones con puntos (y, si `box`, con recuadro): los de los modelos de MediaPipe y MoveNet.
 * Con `scores`, también la confianza de cada punto (que no aparezcan y desaparezcan); con `id`, seguidas por él
 */
export function keypointSmoothing<T extends { keypoints: Point_t[], box?: Box_t }>(
  { box = false, scores = false, id }: { box?: boolean, scores?: boolean, id?: (detection: T) => number | string | undefined } = {}
): Smoothing_t<T> {
  // El recuadro, si se suaviza, va delante de los puntos
  const boxOf = (detection: T) => (box ? detection.box : undefined)
  return {
    positions: (detection) => {
      const frame = boxOf(detection)
      const positions = frame ? [frame.xMin, frame.yMin, frame.xMax, frame.yMax] : []
      for (const { x, y } of detection.keypoints) positions.push(x, y)
      return positions
    },
    extras: scores ? (detection) => detection.keypoints.map(({ score }) => score ?? 1) : undefined,
    id,
    update: (detection, positions, extras) => {
      const frame = boxOf(detection)
      const offset = frame ? 4 : 0
      const [xMin, yMin, xMax, yMax] = positions
      return {
        ...detection,
        ...(frame && { box: { ...frame, xMin, yMin, xMax, yMax, width: xMax - xMin, height: yMax - yMin } }),
        keypoints: detection.keypoints.map((keypoint, index) => ({
          ...keypoint,
          x: positions[offset + 2 * index],
          y: positions[offset + 2 * index + 1],
          ...(scores && { score: extras[index] }),
        })),
      }
    },
  }
}
