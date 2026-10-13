import { describe, expect, test } from 'vitest'

import { DetectionSmoother, keypointSmoothing, type Smoothing_t } from '@pages/playground/2_ObjectDetection/models/smoothing'

// Un recuadro de 100 × 100 píxeles con su esquina en (x, y), como los de COCO-SSD
type Box_t = { x: number, y: number, label?: string }
const BOXES: Smoothing_t<Box_t> = {
  positions: ({ x, y }) => [x, y, x + 100, y + 100],
  update   : (box, [x, y]) => ({ ...box, x, y }),
}

// Ruido de ±4 píxeles, distinto en cada fotograma y siempre el mismo (el hash pseudoaleatorio clásico)
const noise = (i: number) => {
  const hash = Math.sin(i * 12.9898 + 78.233) * 43758.5453
  return 8 * (hash - Math.floor(hash) - 0.5)
}
const FRAME_MS = 50

/** Una predicción cada 50 ms (20 por segundo, como la página): lo que se dibuja tras cada una */
function play(smoother: DetectionSmoother<Box_t>, frames: Box_t[][]) {
  return frames.map((boxes, i) => {
    smoother.update(boxes, i * FRAME_MS)
    return smoother.latest()
  })
}

const spread = (values: number[]) => Math.max(...values) - Math.min(...values)

describe('DetectionSmoother: las detecciones de la webcam, sin temblar ni parpadear', () => {
  test('un objeto quieto con ruido: lo dibujado apenas tiembla', () => {
    const frames = Array.from({ length: 60 }, (_, i) => [{ x: 200 + noise(i), y: 100 + noise(i + 7) }])
    const shown = play(new DetectionSmoother(BOXES), frames).slice(20).map(([box]) => box.x)
    const raw = frames.slice(20).map(([box]) => box.x)
    expect(spread(shown)).toBeLessThan(spread(raw) * 0.4)
  })

  test('un objeto que se mueve deprisa (600 px/s): lo dibujado no se queda atrás', () => {
    const frames = Array.from({ length: 20 }, (_, i) => [{ x: 30 * i, y: 100 }])
    const last = play(new DetectionSmoother(BOXES), frames).at(-1)?.[0]
    expect(30 * 19 - (last?.x ?? 0)).toBeLessThan(15)
  })

  test('una detección que falta en un fotograma suelto sigue dibujándose', () => {
    const box = { x: 200, y: 100 }
    const shown = play(new DetectionSmoother(BOXES), [[box], [box], [box], [], [box]])
    expect(shown.map((boxes) => boxes.length)).toEqual([0, 1, 1, 1, 1])
  })

  test('una que deja de verse desaparece tras un momento (300 ms)', () => {
    const box = { x: 200, y: 100 }
    const shown = play(new DetectionSmoother(BOXES), [[box], [box], ...Array.from({ length: 8 }, () => [])])
    expect(shown.map((boxes) => boxes.length)).toEqual([0, 1, 1, 1, 1, 1, 1, 1, 0, 0])
  })

  test('una detección falsa en un solo fotograma no se dibuja', () => {
    const box = { x: 200, y: 100 }
    const ghost = { x: 500, y: 300 }
    const shown = play(new DetectionSmoother(BOXES), [[box], [box], [box, ghost], [box], [box]])
    expect(shown.every((boxes) => boxes.length <= 1)).toBe(true)
  })

  test('dos objetos que cambian de orden en la predicción: cada uno sigue siendo el mismo, en el mismo orden', () => {
    const [a, b] = [{ x: 100, y: 100, label: 'a' }, { x: 400, y: 100, label: 'b' }]
    const shown = play(new DetectionSmoother(BOXES), [[a, b], [b, a], [a, b], [b, a]])
    for (const boxes of shown.slice(1)) {
      expect(boxes.map(({ label }) => label)).toEqual(['a', 'b'])
      expect(boxes.map(({ x }) => Math.round(x))).toEqual([100, 400])
    }
  })

  test('con el identificador del modelo (MoveNet), se siguen por él aunque se crucen', () => {
    type Pose_t = { id: number, keypoints: Array<{ x: number, y: number }> }
    const pose = (id: number, x: number): Pose_t => ({ id, keypoints: [{ x, y: 100 }, { x: x + 50, y: 300 }] })
    const smoother = new DetectionSmoother(keypointSmoothing<Pose_t>({ id: (detection) => detection.id }))
    // La persona 1 pasa de x = 300 a x = 330 y la 2, de 320 a 290: por la posición se confundirían
    smoother.update([pose(1, 300), pose(2, 320)], 0)
    smoother.update([pose(1, 300), pose(2, 320)], 50)
    smoother.update([pose(2, 290), pose(1, 330)], 100)
    const [first, second] = smoother.latest()
    expect(first.id).toBe(1)
    expect(first.keypoints[0].x).toBeGreaterThan(300)
    expect(second.id).toBe(2)
    expect(second.keypoints[0].x).toBeLessThan(320)
  })

  test('entre una predicción y la siguiente, lo dibujado se acerca a ella poco a poco en cada fotograma', () => {
    const smoother = new DetectionSmoother(BOXES, { minCutoff: 1000 })
    smoother.update([{ x: 0, y: 0 }], 0)
    smoother.update([{ x: 0, y: 0 }], 50)
    expect(smoother.frame(50)[0].x).toBe(0)
    smoother.update([{ x: 100, y: 0 }], 100)
    const steps = [116, 133, 150, 300].map((now) => smoother.frame(now)[0].x)
    expect(steps[0]).toBeGreaterThan(0)
    expect(steps[0]).toBeLessThan(steps[1])
    expect(steps[1]).toBeLessThan(steps[2])
    expect(steps[3]).toBeCloseTo(smoother.latest()[0].x, 0)
  })
})

describe('keypointSmoothing: las detecciones con puntos', () => {
  type Face_t = {
    box      : { xMin: number, yMin: number, xMax: number, yMax: number, width: number, height: number }
    keypoints: Array<{ x: number, y: number, score?: number, name?: string }>
  }
  const face = (x: number, score: number): Face_t => ({
    box      : { xMin: x, yMin: 50, xMax: x + 100, yMax: 150, width: 100, height: 100 },
    keypoints: [{ x: x + 30, y: 80, score, name: 'rightEye' }, { x: x + 70, y: 80, score, name: 'leftEye' }],
  })

  test('el recuadro y los puntos, con su ancho, su alto y sus nombres', () => {
    const smoothing = keypointSmoothing<Face_t>({ box: true })
    expect(smoothing.positions(face(10, 1))).toEqual([10, 50, 110, 150, 40, 80, 80, 80])
    const moved = smoothing.update(face(10, 1), [20, 40, 140, 160, 50, 70, 90, 70], [])
    expect(moved.box).toEqual({ xMin: 20, yMin: 40, xMax: 140, yMax: 160, width: 120, height: 120 })
    expect(moved.keypoints).toEqual([{ x: 50, y: 70, score: 1, name: 'rightEye' }, { x: 90, y: 70, score: 1, name: 'leftEye' }])
  })

  test('con scores, la confianza de los puntos también se suaviza: no salta de golpe', () => {
    const smoother = new DetectionSmoother(keypointSmoothing<Face_t>({ scores: true }))
    smoother.update([face(10, 0.9)], 0)
    smoother.update([face(10, 0.9)], 50)
    smoother.update([face(10, 0.1)], 100)
    const score = smoother.latest()[0].keypoints[0].score ?? 0
    expect(score).toBeGreaterThan(0.5)
    expect(score).toBeLessThan(0.9)
  })
})
