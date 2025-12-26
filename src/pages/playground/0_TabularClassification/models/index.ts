import I_MODEL_TABULAR_CLASSIFICATION from './_model'
import MODEL__UPLOAD from './MODEL__UPLOAD'
import MODEL_CAR from './MODEL_CAR'
import MODEL_IRIS from './MODEL_IRIS'
import MODEL_LYMPHOGRAPHY from './MODEL_LYMPHOGRAPHY'
import * as _Types from '@core/types'

/**
 * @type {_Types.MAP_TC_CLASSES_t}
 * [x: string]: typeof MODEL_IRIS | typeof MODEL_CAR | typeof MODEL_LYMPHOGRAPHY;
 */
const MAP_TC_CLASSES: Record<string, typeof MODEL__UPLOAD | typeof MODEL_CAR | typeof MODEL_IRIS | typeof MODEL_LYMPHOGRAPHY>  = {
  [MODEL__UPLOAD.KEY]     : MODEL__UPLOAD,
  [MODEL_CAR.KEY]         : MODEL_CAR,
  [MODEL_IRIS.KEY]        : MODEL_IRIS,
  [MODEL_LYMPHOGRAPHY.KEY]: MODEL_LYMPHOGRAPHY,
}

export {
  MAP_TC_CLASSES,

  I_MODEL_TABULAR_CLASSIFICATION,
  MODEL_CAR,
  MODEL_IRIS,
  MODEL_LYMPHOGRAPHY
}