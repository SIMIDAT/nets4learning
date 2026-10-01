import { describe, test, expect } from 'vitest'
import { beeswarmLayout, shapColor } from '../../src/core/explainability/beeswarmLayout'

describe('beeswarmLayout', () => {
  // 3 instancias × 2 features: la feature "b" tiene más efecto (|SHAP| medio mayor)
  const shap = [[0.1, -0.9], [0.0, 0.8], [-0.1, 0.7]]
  const values = [[1, 10], [2, 20], [3, 30]]

  test('un punto por instancia y feature, con la feature más importante en la fila de arriba', () => {
    const { points, order } = beeswarmLayout(shap, values, undefined, ['a', 'b'])
    expect(points).toHaveLength(6)
    expect(order).toStrictEqual([0, 1])
    // Cada punto queda cerca de su fila (el desplazamiento no invade la de al lado)
    for (const point of points) {
      const row = point.feature === 'a' ? 0 : 1
      expect(Math.abs(point.y - row)).toBeLessThan(0.5)
    }
  })

  test('el color va de azul (valor bajo) a rojo (valor alto) y el tooltip usa el valor legible', () => {
    const { points } = beeswarmLayout(shap, values, [['x', 'p'], ['y', 'q'], ['z', 'r']], ['a', 'b'])
    const featureB = points.filter(({ feature }) => feature === 'b')
    expect(featureB.map(({ color }) => color)).toStrictEqual([shapColor(0), shapColor(0.5), shapColor(1)])
    expect(featureB.map(({ value }) => value)).toStrictEqual(['p', 'q', 'r'])
  })
})
