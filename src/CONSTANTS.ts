import * as _Types from '@core/types'

const CONSOLE_LOG_h1 = 'background: #222; color: #bada55; font-size: 1.8em'
const CONSOLE_LOG_h2 = 'background: #222; color: #bada55; font-size: 1.6em'
const CONSOLE_LOG_h3 = 'background: #222; color: #bada55; font-size: 1.4em'
const VERBOSE = false

const DEFAULT_SELECTOR_DATASET_INDEX = -1
const DEFAULT_SELECTOR_DATASET = 'select-dataset'
const DEFAULT_SELECTOR_MODEL_INDEX = -1
const DEFAULT_SELECTOR_MODEL = 'select-model'
const DEFAULT_SELECTOR_INSTANCE_INDEX = -1
const DEFAULT_SELECTOR_INSTANCE = 'select-instance'

/**
 * @type {_Types.ScalerKey_t}
 */
const DEFAULT_SCALER: _Types.ScalerKey_t = 'min-max-scaler'

const TAB_00_TABULAR_CLASSIFICATION = 'Tabular classification'
const TAB_01_LINEAR_REGRESSION = 'Tabular classification'
const TAB_02_OJECT_DETECTION = 'Object Detection'
const TAB_03_IMAGE_CLASSIFICATION = 'Image classification'


/**
 * @type {Object<string, _Types.ColumnTransform_t>}
 */
const E_TRANSFORMS = {
  LABEL_ENCODER  : 'label-encoder',
  ONE_HOT_ENCODER: 'one-hot-encoder'
}

export {
  VERBOSE,
  CONSOLE_LOG_h1,
  CONSOLE_LOG_h2,
  CONSOLE_LOG_h3,

  DEFAULT_SELECTOR_DATASET_INDEX,
  DEFAULT_SELECTOR_DATASET,
  DEFAULT_SELECTOR_MODEL_INDEX,
  DEFAULT_SELECTOR_MODEL,
  DEFAULT_SELECTOR_INSTANCE_INDEX,
  DEFAULT_SELECTOR_INSTANCE,

  DEFAULT_SCALER,

  TAB_00_TABULAR_CLASSIFICATION,
  TAB_01_LINEAR_REGRESSION,
  TAB_02_OJECT_DETECTION,
  TAB_03_IMAGE_CLASSIFICATION,

  E_TRANSFORMS
}