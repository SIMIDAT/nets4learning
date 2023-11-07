import React from 'react'
import { ACTIONS, LIFECYCLE } from 'react-joyride'
import { delay } from '@utils/utils'
import Errors from '@shared/Errors'
// eslint-disable-next-line no-unused-vars
import * as dfd from 'danfojs'

export default class I_MODEL_TABULAR_CLASSIFICATION {
  TITLE = ''
  LIST_EXAMPLES_RESULTS = []
  LIST_EXAMPLES = []
  DATA_OBJECT = {}
  TABLE_HEADER = []
  CLASSES = []
  FORM = []
  DATA_DEFAULT_KEYS = []
  DATA_DEFAULT = {}
  DATA = [[]]

  constructor (_t, _callbacks) {
    this.t = _t
    this.callbacks = _callbacks
  }

  DESCRIPTION () {
    return <></>
  }

  /**
   * @typedef {Object} DataFrameColumnTypeTransform_t
   * @property {'drop'|'ignore'|'int32'|'float32'|'label-encoder'} type
   * @property {string} name
   * @property {Array<{value: string, text: string}>} options
   */

  /**
   * @typedef {Object} DataProcessed_t
   * @property {boolean} missing_values
   * @property {string} missing_value_key
   * @property {string[]} classes
   * @property {Object<string, any>} encoders
   * @property {dfd.MinMaxScaler|dfd.StandardScaler} scaler
   * @property {string} column_name_target
   * @property {Array<DataFrameColumnTypeTransform_t>} attributes
   * @property {dfd.DataFrame} X
   * @property {dfd.DataFrame|dfd.Series} y
   */

  /**
   * @typedef {Object} DatasetProcessed_t
   * @property {boolean} is_dataset_processed
   * @property {boolean} is_dataset_upload
   * @property {string} path
   * @property {string} info
   * @property {string} csv
   * @property {Array<DataFrameColumnTransform_t>} dataset_transforms
   * @property {dfd.DataFrame} dataframe_original
   * @property {dfd.DataFrame} dataframe_processed
   * @property {DataProcessed_t?} data_processed
   */

  /**
   *
   * @returns {Promise<DatasetProcessed_t[]>}
   * @constructor
   */
  async DATASETS () {
    return []
  }

  async LOAD_GRAPH_MODEL (_callbacks) {
    // throw new Error('Error')
  }

  async LOAD_LAYERS_MODEL (_callbacks) {
    // throw new Error('Error')
  }

  DEFAULT_LAYERS () {
    return []
  }

  HTML_EXAMPLE () {
    return <></>
  }

  JOYRIDE () {
    const handleJoyrideCallback = async (data) => {
      const { action, lifecycle, step/*, status, type*/ } = data
      const { target } = step
      if (
        ([ACTIONS.UPDATE.toString()]).includes(action) &&
        ([LIFECYCLE.TOOLTIP.toString()]).includes(lifecycle)) {
        switch (target) {
          case '.joyride-step-manual': {
            break
          }
          case '.joyride-step-dataset-info': {
            break
          }
          case '.joyride-step-dataset': {
            break
          }
          case '.joyride-step-layer': {
            break
          }
          case '.joyride-step-editor-layers': {
            break
          }
          case '.joyride-step-editor-trainer': {
            break
          }
          case '.joyride-step-list-of-models': {
            break
          }
          case '.joyride-step-classify-visualization': {
            break
          }
          default: {
            console.warn('Error, option not valid')
            break
          }
        }
        await delay(500)
        const isDispatchedEvent = window.dispatchEvent(new Event('resize'))
        if (!isDispatchedEvent) {
          Errors.notDispatchedEvent()
        }
      }
    }

    const prefix = 'datasets-models.0-tabular-classification.joyride.steps.'
    return {
      run                  : false,
      continuous           : true,
      handleJoyrideCallback: handleJoyrideCallback,
      steps                : [
        {
          title    : this.t(prefix + 'manual.title'),
          content  : this.t(prefix + 'manual.content'),
          target   : '.joyride-step-manual',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'dataset-info.title'),
          content  : this.t(prefix + 'dataset-info.content'),
          target   : '.joyride-step-dataset-info',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'dataset.title'),
          content  : this.t(prefix + 'dataset.content'),
          target   : '.joyride-step-dataset',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'layer-visualizer.title'),
          content  : this.t(prefix + 'layer-visualizer.content'),
          target   : '.joyride-step-layer',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'layer-editor.title'),
          content  : this.t(prefix + 'layer-editor.content'),
          target   : '.joyride-step-editor-layers',
          placement: 'right',
        },
        {
          title    : this.t(prefix + 'params-editor.title'),
          content  : this.t(prefix + 'params-editor.content'),
          target   : '.joyride-step-editor-trainer',
          placement: 'left-start',
        },
        {
          title    : this.t(prefix + 'list-of-models.title'),
          content  : this.t(prefix + 'list-of-models.content'),
          target   : '.joyride-step-list-of-models',
          placement: 'bottom',
        },
        {
          title    : this.t(prefix + 'classify-and-visualizer.title'),
          content  : this.t(prefix + 'classify-and-visualizer.content'),
          target   : '.joyride-step-classify-visualization',
          placement: 'top',
        },
      ],
    }
  }

}
