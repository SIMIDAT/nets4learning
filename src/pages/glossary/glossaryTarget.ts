// Apartado de la tarea según el prefijo de la acción (task-00 tabular, task-01 regresión, task-03 imágenes)
const TASK_SECTIONS: Record<string, string> = {
  'task-00': 'classification-tabular',
  'task-01': 'regression',
  'task-03': 'classification-imagen',
}

// Apartado según el paso del playground desde el que se abre la ayuda
const STEP_SECTIONS: Record<string, string> = {
  'layer-design'          : 'item-0',
  'editor-layers'         : 'item-0',
  'editor-hyperparameters': 'item-1',
  'table-of-models'       : 'functions-metrics',
}

/**
 * Apartado del glosario (eventKey de su acordeón) que se abre al llegar desde un enlace de ayuda del playground
 * (`?action=task-00-editor-layers-open`); null si la acción no tiene apartado.
 */
export function glossaryTarget(action: string | null): string | null {
  const match = action?.match(/^(task-\d\d)-(.+)-open$/)
  if (!match) return null
  const [, task, step] = match
  if (step === 'upload-and-process' || step === 'dataset') return TASK_SECTIONS[task] ?? null
  return STEP_SECTIONS[step] ?? null
}
