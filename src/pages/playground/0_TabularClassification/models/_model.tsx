import type * as _tfjs from '@tensorflow/tfjs'
import { buildJoyride } from '@components/joyride/buildJoyride'

import * as _Types from '@core/types'
import type { TFunction } from 'i18next'

/** Valores de una instancia del dataset, por nombre de columna */
export type TabularInstance_t = Record<string, string | number>

/** Campo del formulario de predicción: numérico o categórico (con sus valores posibles) */
export type TabularFormField_t =
  | { type: 'int32' | 'float32', name: string }
  | { type: 'label-encoder', name: string, options: Array<{ value: string, text: string }> }

export type LoadModelCallbacks_t = { onProgress: (fraction: number) => void }

export default abstract class I_MODEL_TABULAR_CLASSIFICATION {
  KEY                  : string = 'I_MODEL_TABULAR_CLASSIFICATION'
  TITLE                : string = ''
  i18n_TITLE           : string = ''
  LIST_EXAMPLES_RESULTS: string[] = []
  LIST_EXAMPLES        : TabularInstance_t[] = []
  TABLE_HEADER         : string[] = []
  CLASSES              : string[] = []
  FORM                 : TabularFormField_t[] = []
  DATA_DEFAULT_KEYS    : string[] = []
  DATA_DEFAULT         : TabularInstance_t = {}
  t                    : TFunction<"translation", undefined>
  callbacks            : () => void

  constructor(t: TFunction<"translation", undefined>, callbacks: () => void) {
    this.t = t
    this.callbacks = callbacks
  }

  DESCRIPTION(): React.ReactNode {
    return <></>
  }

  /**
   * Salida del modelo (posición en CLASSES) de una clase tal como aparece en el conjunto de datos; -1 si no se
   * reconoce. Por defecto, la de CLASSES con ese nombre (lo que sigue al último punto de la clave) o, si no hay, la
   * que termina igual ("Setosa" o "0 Iris-setosa" → "00-tc.iris.Iris-setosa").
   */
  CLASS_INDEX(target: unknown): number {
    const name = String(target).toLowerCase()
    const names = this.CLASSES.map((key) => key.slice(key.lastIndexOf('.') + 1).toLowerCase())
    const exact = names.indexOf(name)
    return exact !== -1 ? exact : names.findIndex((className) => className.endsWith(name) || name.endsWith(className))
  }

  /**
   * @returns {Promise<_Types.DatasetProcessed_t[]>}
   */
  async DATASETS(): Promise<_Types.DatasetProcessed_t[]> {
    return []
  }

  /** Modelo preentrenado; null si la tarea no tiene (p. ej. al subir un CSV propio) */
  async LOAD_LAYERS_MODEL(_callbacks: LoadModelCallbacks_t): Promise<_tfjs.LayersModel | null> {
    return null
  }

  DEFAULT_LAYERS(): _Types.Layer_t[] {
    return []
  }

  HTML_EXAMPLE() {
    return <></>
  }

  JOYRIDE(): _Types.Joyride_t {
    return buildJoyride(this.t, 'datasets-models.0-tabular-classification.joyride.steps.', [
      { key: 'manual', target: '.joyride-step-manual', placement: 'top' },
      { key: 'dataset-info', target: '.joyride-step-dataset-info', placement: 'top' },
      { key: 'dataset', target: '.joyride-step-dataset', placement: 'top' },
      { key: 'layer-visualizer', target: '.joyride-step-layer', placement: 'top' },
      { key: 'layer-editor', target: '.joyride-step-editor-layers', placement: 'right' },
      { key: 'params-editor', target: '.joyride-step-editor-trainer', placement: 'left-start' },
      { key: 'list-of-models', target: '.joyride-step-list-of-models', placement: 'bottom' },
      { key: 'classify-and-visualizer', target: '.joyride-step-classify-visualization', placement: 'top' },
    ])
  }

}
