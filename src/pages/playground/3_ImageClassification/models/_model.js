import React from 'react'
import { ACTIONS, LIFECYCLE } from 'react-joyride'
import { delay } from '@utils/utils'
import Errors from '@shared/Errors'

export default class I_MODEL_IMAGE_CLASSIFICATION {
  TITLE = ''
  i18n_TITLE = ''

  constructor (_t) {
    this.t = _t
  }

  DESCRIPTION () {
    return <>

    </>
  }

  DEFAULT_LAYERS () {
    return []
  }

  DEFAULT_HYPERPARAMETERS () {
    return {}
  }

  async ENABLE_MODEL () {

  }

  LIST_IMAGES_EXAMPLES () {
    return []
  }

  async CLASSIFY (_model, _imageData) {
    return { predictions: [], index: 0 }
  }

  async CLASSIFY_IMAGE (_model, _imageData) {
    return { predictions: [], index: 0 }
  }

  async PREDICTION_FORMAT (_predictions) {
    return {
      labels  : [],
      datasets: []
    }
  }

  async TRAIN_MODEL () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('I_MODEL_IMAGE_CLASSIFICATION')
      }, 1000)
    })
  }

  JOYRIDE () {
    const handleJoyrideCallback = async (data) => {
      const { action, lifecycle, step/*, status, type*/ } = data
      const { target } = step
      if (
        ([ACTIONS.UPDATE.toString()]).includes(action) &&
        ([LIFECYCLE.TOOLTIP.toString()]).includes(lifecycle)) {
        switch (target) {
          case '.joyride-step-1-manual': {
            break
          }
          case '.joyride-step-2-dataset-info': {
            break
          }
          case '.joyride-step-3-dataset': {
            break
          }
          case '.joyride-step-4-dataset-plot': {
            break
          }
          case '.joyride-step-5-layer': {
            break
          }
          case '.joyride-step-6-editor-layers': {
            break
          }
          case '.joyride-step-7-editor-trainer': {
            break
          }
          case '.joyride-step-8-list-of-models': {
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

    const prefix = 'datasets-models.3-image-classification.joyride.steps.'
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
        // {
        //   title    : this.t(prefix + 'dataset.title'),
        //   content  : this.t(prefix + 'dataset.content'),
        //   target   : '.joyride-step-3-dataset',
        //   placement: 'top',
        // },
        // {
        //   title    : this.t(prefix + 'dataset-plot.title'),
        //   content  : this.t(prefix + 'dataset-plot.content'),
        //   target   : '.joyride-step-4-dataset-plot',
        //   placement: 'top',
        // },
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
          placement: 'right',
        },
        {
          title    : this.t(prefix + 'params-editor.title'),
          content  : this.t(prefix + 'params-editor.content'),
          target   : '.joyride-step-7-editor-trainer',
          placement: 'left-start',
        },
        {
          title    : this.t(prefix + 'list-of-models.title'),
          content  : this.t(prefix + 'list-of-models.content'),
          target   : '.joyride-step-8-list-of-models',
          placement: 'bottom',
        },
        {
          title    : this.t(prefix + 'classify.title'),
          content  : this.t(prefix + 'classify.content'),
          target   : '.joyride-step-9-classify',
          placement: 'top',
        },
      ],
    }
    // return {
    //   debug     : process.env.REACT_APP_ENVIRONMENT === "development",
    //   run       : true,
    //   continuous: false,
    //   steps     : []
    // }
  }

  async GET_IMAGE_DATA (_canvas, _canvas_ctx) {
    console.log('TODO')
  }
}
