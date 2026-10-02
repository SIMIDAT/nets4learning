import { describe, test, expect } from 'vitest'
import { glossaryTarget } from '../../src/pages/glossary/glossaryTarget'
import { GLOSSARY_ACTIONS } from '../../src/CONSTANTS_ACTIONS'

describe('glossaryTarget', () => {
  test('los pasos de datos llevan al término de su tarea', () => {
    expect(glossaryTarget(GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_1_UPLOAD_AND_PROCESS)).toBe('task-tabular-classification')
    expect(glossaryTarget(GLOSSARY_ACTIONS.REGRESSION.STEP_2_DATASET)).toBe('task-regression')
    expect(glossaryTarget(GLOSSARY_ACTIONS.IMAGE_CLASSIFICATION.STEP_2_DATASET)).toBe('task-image-classification')
  })

  test('los editores y la tabla de modelos llevan a su grupo de términos', () => {
    expect(glossaryTarget(GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_0_LAYER_DESIGN)).toBe('editor-layers')
    expect(glossaryTarget(GLOSSARY_ACTIONS.REGRESSION.STEP_3_LAYERS)).toBe('editor-layers')
    expect(glossaryTarget(GLOSSARY_ACTIONS.IMAGE_CLASSIFICATION.STEP_4_HYPERPARAMETERS)).toBe('editor-hyperparameters')
    expect(glossaryTarget(GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_5_TABLE_OF_MODELS)).toBe('metrics')
  })

  test('sin acción o con una desconocida no se abre nada', () => {
    expect(glossaryTarget(null)).toBeNull()
    expect(glossaryTarget('otra-cosa')).toBeNull()
  })
})
