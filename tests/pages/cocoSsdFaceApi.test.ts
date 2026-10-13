import { describe, expect, test } from 'vitest'
import type { TFunction } from 'i18next'
import type * as coCoSsdDetection from '@tensorflow-models/coco-ssd'

import MODEL_4_COCO_SSD from '@pages/playground/2_ObjectDetection/models/MODEL_4_COCO_SSD'
import MODEL_5_FACE_API from '@pages/playground/2_ObjectDetection/models/MODEL_5_FACE_API'

// t con la clave y sus valores, para ver qué se escribe
const t = ((key: string, values?: Record<string, unknown>) => {
  const shown = Object.entries(values ?? {}).filter(([name]) => name !== 'defaultValue').map(([, value]) => value)
  return shown.length > 0 ? `${key.split('.').at(-1)}:${shown.join(',')}` : key.split('.').at(-1)
}) as unknown as TFunction

/** Un lienzo de 640 × 480 que no dibuja: guarda cada texto escrito, dónde y el color de lo último rellenado */
function recordingContext() {
  const texts: Array<{ text: string, x: number, y: number }> = []
  const fills: string[] = []
  const state: Record<string | symbol, unknown> = { canvas: { width: 640, height: 480 } }
  const ctx = new Proxy(state, {
    get: (target, property) => {
      if (property in target) return target[property]
      if (property === 'measureText') return (text: string) => ({ width: text.length * 6 })
      if (property === 'fillText') return (text: string, x: number, y: number) => texts.push({ text, x, y })
      if (property === 'fill') return () => fills.push(String(target.fillStyle))
      return () => undefined
    },
    set: (target, property, value) => {
      target[property] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, texts, fills }
}

const object = (name: string, x: number, score = 0.9): coCoSsdDetection.DetectedObject =>
  ({ class: name, score, bbox: [x, 100, 80, 160] })

describe('MODEL_4_COCO_SSD: cada objeto con su nombre y su confianza', () => {
  test('los de la misma clase, numerados de izquierda a derecha y del mismo color; los demás, sin número', () => {
    const model = new MODEL_4_COCO_SSD(t as never)
    const { ctx, texts, fills } = recordingContext()
    model.RENDER(ctx, [object('person', 400, 0.8), object('dog', 250), object('person', 50, 0.95)])
    const tags = texts.map(({ text }) => text)
    expect(tags).toEqual(expect.arrayContaining(['numbered:person,1', 'numbered:person,2', 'dog', 'score:95', 'score:80']))
    // La persona de la izquierda (x = 50) es la 1
    const first = texts.find(({ text }) => text === 'numbered:person,1')
    expect(first?.x).toBeLessThan(200)
    // Dos colores: uno para las personas y otro para el perro
    expect(new Set(fills.filter((fill) => fill.startsWith('#'))).size).toBe(2)
  })

  test('con la webcam en espejo, los recuadros se reflejan', async () => {
    const model = new MODEL_4_COCO_SSD(t as never)
    model._modelDetector = { detect: async () => [object('cup', 100)] } as never
    const video = { videoWidth: 640 } as HTMLVideoElement
    const [plain] = await model.PREDICTION(video)
    const [mirrored] = await model.PREDICTION(video, { flipHorizontal: true })
    expect(plain.bbox).toEqual([100, 100, 80, 160])
    expect(mirrored.bbox).toEqual([460, 100, 80, 160])
  })
})

const face = (x: number, width: number, expressions: Record<string, number>) => ({
  detection: { score: 0.99, box: { x, y: 120, width, height: width } },
  age      : 33.6,
  expressions,
})

describe('MODEL_5_FACE_API: cada cara con su edad y sus expresiones', () => {
  const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']
  const expressions = { neutral: 0.2, happy: 0.7, sad: 0.05, angry: 0.05, fearful: 0, disgusted: 0, surprised: 0 }

  test('su edad y, a la derecha de la cara, las siete expresiones con su porcentaje, siempre en el mismo orden', () => {
    const model = new MODEL_5_FACE_API(t as never)
    const { ctx, texts } = recordingContext()
    model.RENDER(ctx, [face(200, 200, expressions)])
    const written = texts.map(({ text }) => text)
    expect(written).toEqual(expect.arrayContaining(['face', 'age:34']))
    expect(written.filter((text) => EXPRESSIONS.includes(text))).toEqual(EXPRESSIONS)
    expect(written.filter((text) => text.startsWith('percent:'))).toEqual(['percent:20', 'percent:70', 'percent:5', 'percent:5', 'percent:0', 'percent:0', 'percent:0'])
    expect(texts.filter(({ text }) => EXPRESSIONS.includes(text)).every(({ x }) => x > 400)).toBe(true)
  })

  test('una cara pequeña: también las siete, a su derecha', () => {
    const model = new MODEL_5_FACE_API(t as never)
    const { ctx, texts } = recordingContext()
    model.RENDER(ctx, [face(300, 60, expressions)])
    const names = texts.filter(({ text }) => EXPRESSIONS.includes(text))
    expect(names).toHaveLength(7)
    expect(names.every(({ x }) => x > 360)).toBe(true)
  })

  test('una cara en el borde derecho: el panel, pegado al borde, sin salirse del dibujo', () => {
    const model = new MODEL_5_FACE_API(t as never)
    const { ctx, texts } = recordingContext()
    model.RENDER(ctx, [face(500, 130, expressions)])
    const percents = texts.filter(({ text }) => text.startsWith('percent:'))
    expect(percents).toHaveLength(7)
    expect(percents.every(({ x }) => x <= 640)).toBe(true)
  })

  test('varias caras: numeradas', () => {
    const model = new MODEL_5_FACE_API(t as never)
    const { ctx, texts } = recordingContext()
    model.RENDER(ctx, [face(20, 80, expressions), face(400, 80, expressions)])
    expect(texts.map(({ text }) => text).filter((text) => text.startsWith('face'))).toEqual(['face-number:1', 'face-number:2'])
  })
})
