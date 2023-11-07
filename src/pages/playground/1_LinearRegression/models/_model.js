import React from 'react'
import { ACTIONS, LIFECYCLE } from 'react-joyride'
import { delay } from '@utils/utils'
import Errors from '@shared/Errors'

export default class I_MODEL_LINEAR_REGRESSION {
  _KEY = ''
  i18n_TITLE = ''
  URL_DATASET = ''

  constructor (_t, _setAccordionActive) {
    this.t = _t
    this.setAccordionActive = _setAccordionActive
  }

  DESCRIPTION () {
    return <></>
  }

  ATTRIBUTE_INFORMATION () {
    return <></>
  }

  LAYERS () {

  }

  COMPILE () {

  }

  /**
   * @typedef {Object} CustomPreprocessDataset_t
   * @property {string} column_name
   * @property {string} column_transform
   *
   * @typedef {Object} CustomDatasetInfo_t
   * @property {string} csv
   * @property {string} info
   * @property {string} path
   * @property {dataframe} dataframe_original
   * @property {dataframe} dataframe_processed
   * @property {boolean} is_dataset_processed
   * @property {Array<CustomPreprocessDataset_t>} dataframe_transforms
   *
   *
   * @return {Array<CustomDatasetInfo_t>}
   */
  async DATASETS () {
    return []
  }

  /**
   * @typedef {Object} CustomModel_t
   * @property {string} column_name_X
   * @property {string} column_name_Y
   * @property {string} model_path
   *
   * @param {string} [_dataset='']
   * @return {Promise<CustomModel_t[]>}
   * @constructor
   */
  async MODELS (_dataset = '') {
    return []
  }

  /**
   *
   * callback: (e) => {
   *   e.action    : "start" | "update",
   *   e.controlled: boolean,
   *   e.index     : number,
   *   e.lifecycle : "init" | "ready" | "beacon" | "tooltip" | "complete",
   *   e.size      : 3,
   *   e.status    : "running",
   *   e.type      :"tour:start"
   * }
   *
   * @return {{
   *    run                   : boolean,
   *    continuous            : boolean,
   *    handleJoyrideCallback : (data) => Promise<void>,
   *    steps                 : Array<{content: string, target: string}>
   * }}
   * @constructor
   */
  JOYRIDE () {
    const handleJoyrideCallback = async (data) => {
      const { action, lifecycle, step/*, status, type*/ } = data
      const { target } = step
      // const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1)

      if (
        ([ACTIONS.UPDATE.toString()]).includes(action) &&
        ([LIFECYCLE.TOOLTIP.toString()]).includes(lifecycle)) {
        switch (target) {
          case '.joyride-step-1-manual': {
            this.setAccordionActive(['manual'])
            break
          }
          case '.joyride-step-2-dataset-info': {
            this.setAccordionActive(['manual', 'dataset_info'])
            break
          }
          case '.joyride-step-3-dataset': {
            this.setAccordionActive(['manual', 'dataset_info'])
            break
          }
          case '.joyride-step-4-dataset-plot': {
            this.setAccordionActive(['manual', 'dataset_info'])
            break
          }
          case '.joyride-step-5-layer': {
            this.setAccordionActive(['manual', 'dataset_info'])
            break
          }
          case '.joyride-step-6-editor-layers': {
            this.setAccordionActive(['manual', 'dataset_info'])
            break
          }
          case '.joyride-step-7-editor-trainer': {
            this.setAccordionActive(['manual', 'dataset_info'])
            break
          }
          case '.joyride-step-8-list-of-models': {
            this.setAccordionActive(['manual', 'dataset_info'])
            break
          }
          case '.joyride-step-9-predict-visualization': {
            this.setAccordionActive(['manual', 'dataset_info'])
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

    const prefix = 'datasets-models.1-linear-regression.joyride.steps.'
    return {
      run                  : true,
      continuous           : true,
      handleJoyrideCallback: handleJoyrideCallback,
      steps                : [
        {
          title    : this.t(prefix + 'manual.title'),
          content  : this.t(prefix + 'manual.content'),
          target   : '.joyride-step-1-manual',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'dataset-info.title'),
          content  : this.t(prefix + 'dataset-info.content'),
          target   : '.joyride-step-2-dataset-info',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'dataset.title'),
          content  : this.t(prefix + 'dataset.content'),
          target   : '.joyride-step-3-dataset',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'dataset-plot.title'),
          content  : this.t(prefix + 'dataset-plot.content'),
          target   : '.joyride-step-4-dataset-plot',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'layer-visualizer.title'),
          content  : this.t(prefix + 'layer-visualizer.content'),
          target   : '.joyride-step-5-layer',
          placement: 'top',
        },
        {
          title    : this.t(prefix + 'layer-editor.title'),
          content  : this.t(prefix + 'layer-editor.content'),
          target   : '.joyride-step-6-editor-layers',
          placement: 'right'
        },
        {
          title    : this.t(prefix + 'params-editor.title'),
          content  : this.t(prefix + 'params-editor.content'),
          target   : '.joyride-step-7-editor-trainer',
          placement: 'left-start'
        },
        {
          title    : this.t(prefix + 'list-of-models.title'),
          content  : this.t(prefix + 'list-of-models.content'),
          target   : '.joyride-step-8-list-of-models',
          placement: 'bottom'
        },
        {
          title    : this.t(prefix + 'predict-and-visualizer.title'),
          content  : this.t(prefix + 'predict-and-visualizer.content'),
          target   : '.joyride-step-9-predict-visualization',
          placement: 'top'
        },
      ]
    }
  }
}
