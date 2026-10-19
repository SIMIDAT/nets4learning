import * as tfjs from '@tensorflow/tfjs'

import { forecastErrors, oneStepValues, recursiveForecast, type ForecastErrors_t, type PreparedSeries_t } from '@core/timeSeries/series'

// Lo que predice un modelo ya entrenado de una serie temporal: a un paso, recursivamente y el futuro, con sus errores
// (los de las líneas base, que no dependen del modelo, los da baselineErrors)

/** Lo que predice la red con varias ventanas a la vez (escalado, como lo aprendió) */
export async function predictWindows(model: tfjs.LayersModel, X: number[][], window: number): Promise<number[]> {
  if (X.length === 0) return []
  const input = tfjs.tensor2d(X, [X.length, window])
  const output = model.predict(input) as tfjs.Tensor
  try {
    return Array.from(await output.data())
  } finally {
    tfjs.dispose([input, output])
  }
}

export type SeriesEvaluation_t = {
  /** A un paso, con los valores reales de antes: la predicción de cada valor de entrenamiento y de prueba */
  trainOneStep : number[]
  testOneStep  : number[]
  /** Toda la prueba seguida, desde el final del entrenamiento: cada valor con los ya predichos */
  testRecursive: number[]
  errors: {
    /** A un paso, con los datos de entrenamiento (si es mucho menor que el de prueba, se los ha aprendido de memoria) */
    train    : ForecastErrors_t
    oneStep  : ForecastErrors_t
    recursive: ForecastErrors_t
  }
}

/** Una ventana cada vez: para la predicción recursiva (cada valor necesita el anterior ya predicho) */
const windowPredictor = (model: tfjs.LayersModel, window: number) => async (values: number[]) => (await predictWindows(model, [values], window))[0]

/** Cómo predice el modelo la parte de prueba: a un paso y entera desde el final del entrenamiento */
export async function evaluateSeriesModel(model: tfjs.LayersModel, values: number[], prepared: PreparedSeries_t): Promise<SeriesEvaluation_t> {
  const { prep, scale, train, test } = prepared
  const [trainPredicted, testPredicted] = await Promise.all([predictWindows(model, train.X, prep.window), predictWindows(model, test.X, prep.window)])
  const trainOneStep = oneStepValues(values, train.targets, trainPredicted, prep, scale)
  const testOneStep = oneStepValues(values, test.targets, testPredicted, prep, scale)
  const testRecursive = await recursiveForecast(values, test.targets[0], test.targets.length, prep, scale, windowPredictor(model, prep.window))
  const actual = test.targets.map((t) => values[t])
  return {
    trainOneStep,
    testOneStep,
    testRecursive,
    errors: {
      train    : forecastErrors(train.targets.map((t) => values[t]), trainOneStep),
      oneStep  : forecastErrors(actual, testOneStep),
      recursive: forecastErrors(actual, testRecursive),
    },
  }
}

/** Los `steps` valores que siguen al final de la serie, cada uno con los ya predichos */
export function forecastFuture(model: tfjs.LayersModel, values: number[], prepared: PreparedSeries_t, steps: number): Promise<number[]> {
  return recursiveForecast(values, values.length, steps, prepared.prep, prepared.scale, windowPredictor(model, prepared.prep.window))
}
