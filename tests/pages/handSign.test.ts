import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { TFunction } from 'i18next'
import type * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import { createHandSignEstimator, HandSignsSSL } from 'handsign-multilingual'

import MODEL_6_HAND_SIGN from '@pages/playground/2_ObjectDetection/models/MODEL_6_HAND_SIGN'
import { detectionSummary } from '@pages/playground/2_ObjectDetection/detectionSummary'

// t con la clave y la letra, para ver qué etiquetas salen
const t = ((key: string, values?: Record<string, unknown>) => (values?.sign ? `${key}:${values.sign}` : key)) as unknown as TFunction

// Una mano sintética (como en las pruebas de handsign-multilingual): una L, con la palma a la cámara, vista como una
// mano derecha sin espejo. Cada dedo sale de su base hacia su ángulo y, doblado, gira hacia la palma
const BASES = [[0.35, -0.25], [0.3, -1], [0.1, -1.05], [-0.1, -1], [-0.3, -0.9]]
const L_HAND = [{ angle: 45, turns: [0, 3, 6] }, { angle: 90, turns: [0, 3, 6] }, { angle: 90, turns: [0, 90, 180] }, { angle: 90, turns: [0, 90, 180] }, { angle: 90, turns: [0, 90, 180] }]
const LENGTHS = [0.45, 0.3, 0.25]
const PIXELS = 100

function landmarks(): number[][] {
  const points = [[0, 0, 0]]
  L_HAND.forEach(({ angle, turns }, finger) => {
    const [dx, dy] = [Math.cos((angle * Math.PI) / 180), -Math.sin((angle * Math.PI) / 180)]
    let point = [...BASES[finger], 0]
    points.push(point)
    LENGTHS.forEach((length, joint) => {
      const turn = (turns[joint] * Math.PI) / 180
      point = [point[0] + dx * Math.cos(turn) * length, point[1] + dy * Math.cos(turn) * length, point[2] - Math.sin(turn) * length]
      points.push(point)
    })
  })
  return points
}

/**
 * La L como la da hand-pose-detection, con la muñeca en `x` píxeles. Sin espejo, una mano derecha se etiqueta «Left»;
 * con la webcam en espejo (`mirrored`), «Right», y se ve reflejada
 */
function hand(x: number, { mirrored = false } = {}): handPoseDetection.Hand {
  const points = landmarks().map(([px, py, pz]) => [mirrored ? -px : px, py, pz])
  return {
    keypoints  : points.map(([px, py]) => ({ x: x + px * PIXELS, y: 360 + py * PIXELS })),
    keypoints3D: points.map(([px, py, pz]) => ({ x: px / 10, y: py / 10, z: pz / 10 })),
    handedness : mirrored ? 'Right' : 'Left',
    score      : 0.98,
  }
}

// Un lienzo que no dibuja: solo comprueba que RENDER no falla
const fakeContext = () =>
  new Proxy({ canvas: { width: 640, height: 480 } } as Record<string | symbol, unknown>, {
    get: (target, property) => (property in target ? target[property] : property === 'measureText' ? () => ({ width: 20 }) : () => undefined),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D

function model({ mirrored = false } = {}) {
  const instance = new MODEL_6_HAND_SIGN(t as never)
  // Lo que hace ENABLE_MODEL en español, sin el detector de MediaPipe
  instance.signLanguage = HandSignsSSL
  instance.signEstimator = createHandSignEstimator(HandSignsSSL, { minScore: 0 })
  instance._mirrored = mirrored
  return instance
}

/** Un fotograma cada 50 ms (20 por segundo, como la página): lo dibujado y, como la página, el texto de lo detectado */
function play(instance: MODEL_6_HAND_SIGN, positions: number[], options = {}) {
  return positions.map((x) => {
    vi.advanceTimersByTime(50)
    const predictions = [hand(x, options)]
    instance.RENDER(fakeContext(), predictions)
    const summary = detectionSummary(instance, predictions).map(({ label }) => label)
    return { views: instance._lastViews?.views ?? [], summary }
  })
}

const still = (x: number, frames: number) => Array.from({ length: frames }, () => x)
const slide = (from: number, to: number, frames: number) => Array.from({ length: frames }, (_, i) => from + ((to - from) * (i + 1)) / frames)

describe('MODEL_6_HAND_SIGN: la letra de cada mano y las de movimiento', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['performance'] }))
  afterEach(() => vi.useRealTimers())

  test('la L quieta: se ve la L, en la pantalla y en el texto de la página', () => {
    const instance = model()
    const frames = play(instance, still(400, 12))
    const { views, summary } = frames[frames.length - 1]
    expect(views).toMatchObject([{ letter: 'L', moving: false, side: 'right' }])
    expect(summary).toContain('ui.explain.labels.sign:L')
  })

  test('la L desplazándose hacia su lado (a la izquierda de la imagen sin espejo): LL, también en el texto', () => {
    const instance = model()
    const frames = play(instance, [...still(400, 10), ...slide(400, 250, 8), ...still(250, 4)])
    const moved = frames.find(({ views }) => views[0]?.letter === 'LL')
    expect(moved?.views[0]).toMatchObject({ letter: 'LL', moving: true, score: 1 })
    expect(moved?.summary).toContain('ui.explain.labels.sign:LL')
  })

  test('con la webcam en espejo, la mano derecha se mueve hacia la derecha de la imagen: también LL', () => {
    const instance = model({ mirrored: true })
    const frames = play(instance, [...still(250, 10), ...slide(250, 400, 8), ...still(400, 4)], { mirrored: true })
    expect(frames.some(({ views }) => views[0]?.letter === 'LL')).toBe(true)
  })

  test('hacia el otro lado, o quieta, no es LL', () => {
    const instance = model()
    const frames = play(instance, [...still(250, 10), ...slide(250, 400, 8), ...still(400, 4)])
    expect(frames.some(({ views }) => views[0]?.letter === 'LL')).toBe(false)
  })

  test('una imagen suelta: la letra de ese fotograma, sin esperar a los siguientes', () => {
    const instance = model()
    instance.RENDER(fakeContext(), [hand(400)])
    expect(instance._lastViews?.views).toMatchObject([{ letter: 'L' }])
  })
})
