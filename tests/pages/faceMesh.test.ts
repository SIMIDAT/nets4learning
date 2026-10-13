import { describe, expect, test } from 'vitest'
import type { TFunction } from 'i18next'
import type * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'

import MODEL_2_FACE_MESH from '@pages/playground/2_ObjectDetection/models/MODEL_2_FACE_MESH'
import { personSide } from '@pages/playground/2_ObjectDetection/models/drawing'

const PREFIX = 'datasets-models.2-object-detection.face-mesh.render.'
const t = ((key: string, values?: Record<string, unknown>) =>
  values?.count === undefined ? key : `${key}:${values.count}`) as unknown as TFunction

/**
 * Una cara de `width` píxeles centrada en x = 320, sin espejo: el ojo derecho de la persona (33, 133) a la izquierda
 * de la imagen, el izquierdo (263, 362) a la derecha y la boca (61, 291) debajo. El resto de puntos, en el centro
 */
function face(width: number): faceLandmarksDetection.Face {
  const half = width / 2
  const keypoints = Array.from({ length: 478 }, () => ({ x: 320, y: 240 }))
  const at = (index: number, x: number, y: number) => { keypoints[index] = { x: 320 + x * half, y: 240 + y * half } }
  at(33, -0.7, -0.3); at(133, -0.3, -0.3); at(263, 0.7, -0.3); at(362, 0.3, -0.3); at(61, -0.4, 0.5); at(291, 0.4, 0.5)
  return {
    keypoints,
    box: { xMin: 320 - half, xMax: 320 + half, yMin: 240 - half, yMax: 240 + half, width, height: width },
  }
}

/** Un lienzo de 640 × 480 que no dibuja: guarda cada texto escrito y dónde */
function recordingContext() {
  const texts: Array<{ text: string, x: number }> = []
  const ctx = new Proxy({ canvas: { width: 640, height: 480 } } as Record<string | symbol, unknown>, {
    get: (target, property) => {
      if (property in target) return target[property]
      // Las claves son largas: cada texto, del ancho de un nombre como «Ojo izquierdo»
      if (property === 'measureText') return () => ({ width: 80 })
      if (property === 'fillText') return (text: string, x: number) => texts.push({ text, x })
      return () => undefined
    },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D
  return { ctx, texts }
}

function render(faces: faceLandmarksDetection.Face[], { mirrored = false } = {}) {
  const model = new MODEL_2_FACE_MESH(t as never)
  model._mirrored = mirrored
  const { ctx, texts } = recordingContext()
  model.RENDER(ctx, faces)
  return texts
}

const xOf = (texts: Array<{ text: string, x: number }>, key: string) => texts.find(({ text }) => text === PREFIX + key)?.x

describe('personSide: el lado de la persona de lo que MediaPipe llama derecha o izquierda', () => {
  test('sin espejo, el mismo; con la webcam en espejo, el contrario', () => {
    expect(personSide('right', false)).toBe('right')
    expect(personSide('left', false)).toBe('left')
    expect(personSide('right', true)).toBe('left')
    expect(personSide('left', true)).toBe('right')
  })
})

describe('MODEL_2_FACE_MESH: lo que se escribe sobre cada cara', () => {
  test('una cara grande: su nombre con los puntos, y los ojos y los labios fuera del recuadro', () => {
    const texts = render([face(240)])
    expect(texts.map(({ text }) => text)).toEqual(expect.arrayContaining([
      PREFIX + 'face', PREFIX + 'points:478', PREFIX + 'eye-right', PREFIX + 'eye-left', PREFIX + 'lips',
    ]))
    // El ojo derecho de la persona, a la izquierda de la imagen, fuera del recuadro; el izquierdo, a la derecha
    expect(xOf(texts, 'eye-right')).toBeLessThan(200)
    expect(xOf(texts, 'eye-left')).toBeGreaterThan(440)
    expect(xOf(texts, 'lips')).toBeGreaterThan(440)
  })

  test('con la webcam en espejo, el ojo de la izquierda de la imagen es el izquierdo de la persona', () => {
    const texts = render([face(240)], { mirrored: true })
    expect(xOf(texts, 'eye-left')).toBeLessThan(200)
    expect(xOf(texts, 'eye-right')).toBeGreaterThan(440)
  })

  test('una cara pequeña: solo su nombre, sin los de las partes', () => {
    const texts = render([face(90)]).map(({ text }) => text)
    expect(texts).toContain(PREFIX + 'face')
    expect(texts.filter((text) => /eye|lips/.test(text))).toEqual([])
  })

  test('varias caras: numeradas', () => {
    const texts = render([face(240), face(90)]).map(({ text }) => text)
    expect(texts.filter((text) => text === PREFIX + 'face-number')).toHaveLength(2)
    expect(texts).not.toContain(PREFIX + 'face')
  })
})
