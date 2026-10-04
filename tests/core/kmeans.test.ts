import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

import { compareWithLabels, elbow, kmeans, pca2, silhouette, standardize } from '@core/clustering/kmeans'

// Iris del proyecto: 4 medidas y la especie
const [, ...rows] = readFileSync('public/models/00-tabular-classification/iris/iris.csv', 'utf-8').trim().split(/\r?\n/).map((line) => line.split(','))
const irisPoints = rows.map((row) => row.slice(0, 4).map(Number))
const irisLabels = rows.map((row) => row[4])

describe('kmeans: agrupar sin etiquetas', () => {
  test('dos nubes bien separadas: dos grupos perfectos, silueta alta y converge', () => {
    const points = [[0, 0], [0.2, 0.1], [0.1, 0.3], [10, 10], [10.2, 9.9], [9.9, 10.1]]
    const result = kmeans(points, { k: 2, seed: 3 })
    expect(result.converged).toBe(true)
    expect(new Set(result.assignments.slice(0, 3)).size).toBe(1)
    expect(result.assignments[0]).not.toBe(result.assignments[3])
    expect(silhouette(points, result.assignments)).toBeGreaterThan(0.9)
    expect(compareWithLabels(result.assignments, ['a', 'a', 'a', 'b', 'b', 'b'], 2)).toMatchObject({ purity: 1, ari: 1 })
  })

  test('la comparación con las clases: totales, la clase mayoritaria de cada grupo y los grupos mezclados', () => {
    // Grupo 0: 3 «a» y 1 «b» (75 %); grupo 1: 2 «b» y 2 «c» (50 %, mezcla); grupo 2: vacío
    const comparison = compareWithLabels([0, 0, 0, 0, 1, 1, 1, 1], ['a', 'a', 'b', 'a', 'b', 'c', 'c', 'b'], 3)
    expect(comparison.classes).toStrictEqual(['a', 'b', 'c'])
    expect(comparison.table).toStrictEqual([[3, 1, 0], [0, 2, 2], [0, 0, 0]])
    expect(comparison.classTotals).toStrictEqual([3, 3, 2])
    expect(comparison.groups).toStrictEqual([
      { size: 4, majority: 0, share: 0.75, isMixed: false },
      { size: 4, majority: 1, share: 0.5, isMixed: true },
      { size: 0, majority: 0, share: 0, isMixed: false },
    ])
    expect(comparison.purity).toBeCloseTo(5 / 8)
  })

  test('la misma semilla da los mismos grupos; cada paso se guarda y la inercia no sube', () => {
    const a = kmeans(standardize(irisPoints), { k: 3, seed: 7 })
    const b = kmeans(standardize(irisPoints), { k: 3, seed: 7 })
    expect(a.assignments).toStrictEqual(b.assignments)
    expect(a.steps.length).toBeGreaterThan(1)
    a.steps.slice(1).forEach((step, index) => expect(step.inertia).toBeLessThanOrEqual(a.steps[index].inertia + 1e-9))
  })

  test('Iris escalado con k = 3: se parece bastante a las especies (sin haberlas visto)', () => {
    const points = standardize(irisPoints)
    const result = kmeans(points, { k: 3, seed: 1 })
    const { purity, ari, table } = compareWithLabels(result.assignments, irisLabels, 3)
    expect(table.flat().reduce((sum, value) => sum + value, 0)).toBe(150)
    expect(purity).toBeGreaterThan(0.75)
    expect(ari).toBeGreaterThan(0.5)
    const score = silhouette(points, result.assignments)
    expect(score).toBeGreaterThan(0.35)
    expect(score).toBeLessThan(0.6)
  })

  test('el codo: la inercia baja al subir k', () => {
    const values = elbow(standardize(irisPoints), [1, 2, 3, 4, 5]).map(({ inertia }) => inertia)
    values.slice(1).forEach((value, index) => expect(value).toBeLessThan(values[index]))
  })

  test('PCA de Iris escalado: las dos primeras componentes recogen casi toda la varianza', () => {
    const { explained, project } = pca2(standardize(irisPoints))
    expect(explained[0]).toBeGreaterThan(0.7)
    expect(explained[0]).toBeLessThan(0.76)
    expect(explained[0] + explained[1]).toBeGreaterThan(0.94)
    expect(project([0, 0, 0, 0])).toHaveLength(2)
  })
})
