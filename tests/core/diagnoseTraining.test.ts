import { describe, test, expect } from 'vitest'
import { diagnoseTraining } from '@core/training/diagnoseTraining'

const kinds = (history: Record<string, number[]>) => diagnoseTraining(history).map(({ kind }) => kind)

describe('diagnoseTraining: qué ha pasado en un entrenamiento', () => {
  test('la pérdida se dispara (NaN o infinito): lo primero y lo único que se dice', () => {
    expect(diagnoseTraining({ loss: [1.2, 0.9, NaN, NaN], val_loss: [1.2, 1, NaN, NaN] })).toEqual([
      { kind: 'diverged', severity: 'danger', values: { epoch: 3 } },
    ])
    expect(kinds({ loss: [1, Infinity] })).toEqual(['diverged'])
  })

  test('apenas aprende: la pérdida baja menos de un 5 %', () => {
    expect(kinds({ loss: [1.1, 1.09, 1.08, 1.07, 1.06], val_loss: [1.1, 1.1, 1.09, 1.09, 1.08] })).toEqual(['not-learning'])
  })

  test('la pérdida ha subido: la tasa de aprendizaje es demasiado alta', () => {
    expect(diagnoseTraining({ loss: [5.1, 7.2, 4.9, 6.8, 6.2] })).toEqual([{ kind: 'worse', severity: 'warning', values: { first: 5.1, last: 6.2 } }])
  })

  test('sobreajuste: la de prueba vuelve a subir desde su mínimo mientras la de entrenamiento sigue bajando', () => {
    const [diagnosis] = diagnoseTraining({
      loss    : [1, 0.6, 0.4, 0.3, 0.2, 0.12, 0.08],
      val_loss: [1, 0.65, 0.5, 0.48, 0.55, 0.62, 0.7],
    })
    expect(diagnosis).toEqual({ kind: 'overfitting', severity: 'warning', values: { epoch: 4, min: 0.48, last: 0.7 } })
  })

  // Entrenamientos de verdad: Auto MPG con tasa de aprendizaje 0,01 (a saltos) y 0,001 (baja sin parar)
  const autoMpgFast = {
    loss    : [267, 43.2, 26.4, 20.8, 21.3, 19.8, 22.1, 17.2, 13.1, 18.2, 10.7, 14.8, 12.5, 13.3, 14.0, 13.0, 13.9, 12.9, 12.2, 8.78],
    val_loss: [81.8, 55.9, 23.7, 27.4, 17.5, 53.9, 16.0, 32.2, 37.0, 13.3, 24.8, 22.9, 13.0, 24.9, 23.4, 41.4, 11.9, 14.8, 10.8, 70.0],
  }
  const autoMpgSlow = {
    loss    : [588, 547, 495, 429, 355, 280, 217, 174, 147, 124, 105, 89.3, 75.7, 64.1, 54.4, 45.5, 38.0, 32.1, 27.4, 23.8, 21.8, 20.3, 19.0, 18.2, 17.8, 16.6, 16.1, 15.5, 14.9, 14.6, 13.9, 13.6, 13.2, 12.8, 12.4, 12.1, 11.8, 11.6, 11.1, 11.0],
    val_loss: [616, 566, 500, 422, 336, 256, 197, 160, 131, 110, 94.0, 78.5, 64.6, 55.6, 47.9, 39.2, 34.7, 28.4, 24.7, 23.4, 21.3, 20.0, 19.3, 19.1, 18.5, 17.1, 18.4, 17.3, 15.5, 18.4, 15.0, 18.4, 14.7, 14.1, 13.5, 15.8, 13.7, 14.6, 12.6, 12.8],
  }

  test('inestable: la de prueba va a saltos (no es sobreajuste aunque acabe más alta que su mínimo)', () => {
    expect(kinds(autoMpgFast)).toEqual(['unstable'])
  })

  test('con algo de ruido, pero bajando: seguía mejorando (ni inestable ni sobreajuste)', () => {
    expect(kinds(autoMpgSlow)).toEqual(['still-improving'])
  })

  test('seguía mejorando al terminar: con más épocas aprendería más', () => {
    expect(kinds({ loss: [1, 0.8, 0.65, 0.5, 0.4], val_loss: [1, 0.82, 0.68, 0.55, 0.45] })).toEqual(['still-improving'])
  })

  test('ha aprendido bien: baja y se estabiliza sin separarse la de prueba', () => {
    expect(kinds({ loss: [1, 0.4, 0.2, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15], val_loss: [1, 0.45, 0.25, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2] }))
      .toEqual(['good'])
  })

  test('sin datos de prueba se mira solo la de entrenamiento; con muy pocas épocas, seguía mejorando', () => {
    expect(kinds({ loss: [1, 0.5, 0.3, 0.2, 0.12] })).toEqual(['still-improving'])
    expect(kinds({ loss: [1, 0.5] })).toEqual(['still-improving'])
    expect(kinds({})).toEqual([])
  })
})
