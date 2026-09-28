import { randomLcg } from 'd3-random'

/**
 * Divide las filas en entrenamiento y test al azar y sin repetir, como `train_test_split` de
 * scikit-learn. Devuelve `[XTrain, XTest, yTrain, yTest]`.
 *
 * - `testSize`: fracción de filas para test, en (0, 1). Se redondea hacia arriba.
 * - `seed`: con semilla la división es reproducible; sin ella, cambia en cada llamada.
 *
 * Función pura: no modifica `X` ni `y`.
 */
export function trainTestSplit<X, Y>(
  X: readonly X[],
  y: readonly Y[],
  testSize: number,
  seed?: number,
): [X[], X[], Y[], Y[]] {
  if (X.length !== y.length) {
    throw new Error(`trainTestSplit: X (${X.length}) e y (${y.length}) no tienen el mismo número de filas`)
  }
  if (!(testSize > 0 && testSize < 1)) {
    throw new Error(`trainTestSplit: testSize=${testSize} debe estar en (0, 1)`)
  }
  const n = X.length
  const nTest = Math.ceil(testSize * n)
  const nTrain = n - nTest
  if (nTrain <= 0) {
    throw new Error(`trainTestSplit: con ${n} filas y testSize=${testSize} no queda ninguna para entrenar`)
  }

  // Barajado de Fisher-Yates sobre los índices.
  const random = seed === undefined ? Math.random : randomLcg(seed)
  const indices = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }

  const trainIndices = indices.slice(0, nTrain)
  const testIndices = indices.slice(nTrain)
  const pick = <T,>(rows: readonly T[], idx: number[]) => idx.map((i) => rows[i])
  return [pick(X, trainIndices), pick(X, testIndices), pick(y, trainIndices), pick(y, testIndices)]
}
