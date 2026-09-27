import { describe, expect, test } from 'vitest'
import { trainTestSplit } from '../../src/utils/trainTestSplit'

const X = Array.from({ length: 10 }, (_, i) => [i, i * 10])
const y = Array.from({ length: 10 }, (_, i) => `row-${i}`)

describe('trainTestSplit', () => {
  test('reparte todas las filas una sola vez, con testSize redondeado hacia arriba', () => {
    const [XTrain, XTest, yTrain, yTest] = trainTestSplit(X, y, 0.25)
    expect(XTest).toHaveLength(3)
    expect(XTrain).toHaveLength(7)
    const ids = [...XTrain, ...XTest].map((row) => row[0]).sort((a, b) => a - b)
    expect(ids).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    // X e y siguen emparejados
    XTrain.forEach((row, i) => expect(yTrain[i]).toBe(`row-${row[0]}`))
    XTest.forEach((row, i) => expect(yTest[i]).toBe(`row-${row[0]}`))
  })

  test('con semilla es reproducible', () => {
    expect(trainTestSplit(X, y, 0.3, 42)).toEqual(trainTestSplit(X, y, 0.3, 42))
  })

  test('no modifica las entradas', () => {
    const copy = structuredClone(X)
    trainTestSplit(X, y, 0.5, 1)
    expect(X).toEqual(copy)
  })

  test('valida los argumentos', () => {
    expect(() => trainTestSplit(X, y.slice(1), 0.2)).toThrow()
    expect(() => trainTestSplit(X, y, 0)).toThrow()
    expect(() => trainTestSplit(X, y, 1)).toThrow()
  })
})
