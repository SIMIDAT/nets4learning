import { describe, test, expect } from 'vitest'
import { glossaryTarget } from '../../src/pages/glossary/glossaryTarget'
import { GLOSSARY_ACTIONS } from '../../src/CONSTANTS_ACTIONS'

describe('glossaryTarget', () => {
  test('los pasos de datos abren el apartado de su tarea', () => {
    expect(glossaryTarget(GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS)).toBe('classification-tabular')
    expect(glossaryTarget(GLOSSARY_ACTIONS.REGRESSION.STEP_2_DATASET)).toBe('regression')
    expect(glossaryTarget(GLOSSARY_ACTIONS.IMAGE_CLASSIFICATION.STEP_2_DATASET)).toBe('classification-imagen')
  })

  test('los editores y la tabla de modelos abren su apartado', () => {
    expect(glossaryTarget(GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN)).toBe('item-0')
    expect(glossaryTarget(GLOSSARY_ACTIONS.REGRESSION.STEP_3_LAYERS)).toBe('item-0')
    expect(glossaryTarget(GLOSSARY_ACTIONS.IMAGE_CLASSIFICATION.STEP_4_HYPERPARAMETERS)).toBe('item-1')
    expect(glossaryTarget(GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_5_TABLE_OF_MODELS)).toBe('functions-metrics')
  })

  test('sin acción o con una desconocida no se abre nada', () => {
    expect(glossaryTarget(null)).toBeNull()
    expect(glossaryTarget('otra-cosa')).toBeNull()
  })
})
