import { describe, test, expect } from 'vitest'
import { getFaceSegmentMap } from '../../src/utils/facialSegment'

const SKIN = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
  379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
  127, 162, 21, 54, 103, 67, 109,
]
const NOSE = [168, 351, 329, 326, 2, 97, 100, 122]

/** Keypoints de FaceMesh: piel en un círculo, nariz en otro más pequeño; el resto fuera. */
function buildKeypoints() {
  const points = Array.from({ length: 468 }, () => ({ x: -50, y: -50 }))
  const circle = (indices: number[], cx: number, cy: number, r: number) =>
    indices.forEach((idx, k) => {
      const a = (2 * Math.PI * k) / indices.length
      points[idx] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
    })
  circle(SKIN, 50, 50, 40.3)
  circle(NOSE, 50, 50, 10.7)
  return points
}

describe('getFaceSegmentMap', () => {
  test('sin keypoints devuelve 0 segmentos', () => {
    expect(getFaceSegmentMap([], 10, 10).numSegments).toBe(0)
  })

  test('los bordes no mezclan ids de otras capas', () => {
    const { mapArray, numSegments } = getFaceSegmentMap(buildKeypoints(), 100, 100)
    expect(numSegments).toBe(8)
    // Solo fondo (0), piel (1) y nariz (7): nada de ids intermedios en los bordes.
    expect(new Set(mapArray)).toStrictEqual(new Set([0, 1, 7]))
    expect(mapArray[50 * 100 + 50]).toBe(7) // centro → nariz
    expect(mapArray[50 * 100 + 30]).toBe(1) // entre nariz y borde → piel
    expect(mapArray[0]).toBe(0) // esquina → fondo
  })

  test('flipHorizontal refleja el mapa en X', () => {
    const points = buildKeypoints().map((p) => (p.x < 0 ? p : { x: p.x + 20, y: p.y }))
    const normal = getFaceSegmentMap(points, 120, 100).mapArray
    const flipped = getFaceSegmentMap(points, 120, 100, true).mapArray
    // Centro de la nariz en x=70 → al reflejar queda en x=50.
    expect(normal[50 * 120 + 70]).toBe(7)
    expect(flipped[50 * 120 + 50]).toBe(7)
  })
})
