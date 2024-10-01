import React from 'react'
import { ACTIONS, LIFECYCLE } from 'react-joyride'
import * as _tfjs from '@tensorflow/tfjs'

import { delay } from '@utils/utils'
import Errors from '@shared/Errors'
import * as _Types from '@/core/types'

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
   *
   * @returns {Promise<_Types.DatasetProcessed_t[]>}
   */
  async DATASETS () {
    return []
  }

  /**
   * 
   * @param {any} _callbacks 
   * @returns {Promise<ReturnType<typeof _tfjs.LayersModel>>}
   */
  async LOAD_GRAPH_MODEL (_callbacks) {
   // throw new Error('Error')
  }
  
  /**
   * 
   * @param {any} _callbacks 
   * @returns {Promise<ReturnType<typeof _tfjs.LayersModel>>}
   */
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
