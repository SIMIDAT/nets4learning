import { describe, test, expect } from 'vitest'
import { parseSession, sessionFileName, type TrainingSession_t } from '../../src/core/session/trainingSession'

const session: TrainingSession_t = {
  app            : 'nets4learning',
  version        : 1,
  task           : 'tabular-classification',
  dataset        : 'IRIS',
  layers         : [{ _class: 'dense', units: 10, activation: 'relu' }, { _class: 'dense', units: 3, activation: 'softmax' }],
  hyperparameters: { learningRate: 0.01, epochs: 30, testSize: 10, optimizer: 'adam', loss: 'losses-categoricalCrossentropy', metrics: ['categoricalAccuracy'] },
}

describe('trainingSession', () => {
  test('una sesión exportada se vuelve a importar igual', () => {
    expect(parseSession(JSON.stringify(session), 'tabular-classification')).toStrictEqual(session)
  })

  test('el nombre del fichero lleva la tarea y el dataset', () => {
    expect(sessionFileName(session)).toBe('nets4learning-tabular-classification-iris.json')
  })

  test('rechaza ficheros que no son una sesión de esta tarea', () => {
    expect(() => parseSession('no es json', 'tabular-classification')).toThrow('session.error-not-json')
    expect(() => parseSession('{"a": 1}', 'tabular-classification')).toThrow('session.error-not-session')
    expect(() => parseSession(JSON.stringify(session), 'regression')).toThrow('session.error-other-task')
    expect(() => parseSession(JSON.stringify({ ...session, layers: [] }), 'tabular-classification')).toThrow('session.error-not-session')
    const badEpochs = { ...session, hyperparameters: { ...session.hyperparameters, epochs: '30' } }
    expect(() => parseSession(JSON.stringify(badEpochs), 'tabular-classification')).toThrow('session.error-not-session')
  })
})
