import { afterEach, describe, expect, test } from 'vitest'

import { historyNumbers, readReport, REPORT_STORAGE_KEY, saveReport, type TrainingReport_t } from '@core/report/trainingReport'

const report: TrainingReport_t = {
  version   : 1,
  task      : 'tabular-classification',
  dataset   : 'IRIS',
  model     : 2,
  createdAt : '2026-10-03T10:00:00.000Z',
  layers    : ['Dense · 10 neuronas · ReLU', 'Dense · 3 neuronas · Softmax'],
  parameters: { 'learning-rate': '0.01', 'n-of-epochs': '20' },
  history   : { loss: [1, 0.5], val_loss: [1.1, 0.6] },
  evaluation: { classes: ['a', 'b'], labels: [0, 1], predictions: [0, 0] },
}

describe('trainingReport: el informe de un modelo, de la tabla a /report', () => {
  afterEach(() => localStorage.clear())

  test('se guarda y se lee igual', () => {
    expect(saveReport(report)).toBe(true)
    expect(readReport()).toStrictEqual(report)
  })

  test('sin informe, o con uno de otra versión o roto, no hay nada que enseñar', () => {
    expect(readReport()).toBeNull()
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify({ ...report, version: 2 }))
    expect(readReport()).toBeNull()
    localStorage.setItem(REPORT_STORAGE_KEY, '{roto')
    expect(readReport()).toBeNull()
  })

  test('el historial de TF.js, en números', () => {
    expect(historyNumbers({ loss: [1, 0.5], acc: [0.5, 0.9] })).toStrictEqual({ loss: [1, 0.5], acc: [0.5, 0.9] })
  })
})
