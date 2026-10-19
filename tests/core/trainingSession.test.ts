import { describe, test, expect } from 'vitest'
import { parseSession, sessionFileName, sessionFromHash, sessionHash, type TrainingSession_t } from '../../src/core/session/trainingSession'

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

  test('enlace para compartir: la sesión va comprimida tras #n4z= y se recupera igual (también con caracteres no ASCII)', async () => {
    const hash = await sessionHash(session)
    expect(hash).toMatch(/^#n4z=[A-Za-z0-9_-]+$/)
    expect(hash.length).toBeLessThan(JSON.stringify(session).length)
    expect(parseSession((await sessionFromHash(hash))!, 'tabular-classification')).toStrictEqual(session)

    const japanese = { ...session, dataset: 'お試し' }
    expect(JSON.parse((await sessionFromHash(await sessionHash(japanese)))!)).toStrictEqual(japanese)
  })

  test('sin compresión en el navegador: el JSON tal cual tras #n4l=, que también se lee', async () => {
    const plain = '#n4l=' + btoa(JSON.stringify(session)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(parseSession((await sessionFromHash(plain))!, 'tabular-classification')).toStrictEqual(session)
  })

  test('enlace sin sesión (otro #) o cortado', async () => {
    expect(await sessionFromHash('')).toBeNull()
    expect(await sessionFromHash('#modelos')).toBeNull()
    await expect(sessionFromHash('#n4l=%%%')).rejects.toThrow('session.error-link')
    await expect(sessionFromHash((await sessionHash(session)).slice(0, 40))).rejects.toThrow('session.error-link')
  })
})
