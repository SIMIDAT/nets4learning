import { ACTIONS, LIFECYCLE } from 'react-joyride'
import * as _tfjs from '@tensorflow/tfjs'

import * as _Types from '@core/types'
import { delay } from '@utils/utils'
import Errors from '@shared/Errors'
import type { TFunction } from 'i18next'

export default abstract class I_MODEL_TABULAR_CLASSIFICATION {
  KEY                  : string = 'I_MODEL_TABULAR_CLASSIFICATION'
  TITLE                : string = ''
  LIST_EXAMPLES_RESULTS: string[] = []
  LIST_EXAMPLES        : any[] = []
  DATA_OBJECT          : Record<string, any> = {}
  TABLE_HEADER         : string[] = []
  CLASSES              : string[] = []
  FORM                 : any[] = []
  DATA_DEFAULT_KEYS    : string[] = []
  DATA_DEFAULT         : Record<string, any> = {}
  DATA                 : any[][] = [[]]
  t                    : TFunction<"translation", undefined>
  callbacks            : any

  constructor(t: TFunction<"translation", undefined>, callbacks: any) {
    this.t = t
    this.callbacks = callbacks
  }

  DESCRIPTION(): React.ReactNode {
    return <></>
  }

  /**
   * @returns {Promise<_Types.DatasetProcessed_t[]>}
   */
  async DATASETS(): Promise<_Types.DatasetProcessed_t[]> {
    return []
  }

  /**
   * @param {any} callbacks 
   * @returns {Promise<ReturnType<typeof _tfjs.LayersModel>>}
   */
  async LOAD_GRAPH_MODEL(callbacks: any): Promise<any> {
    // throw new Error('Error')
    console.error(callbacks)
  }

  /**
   * @param {any} _callbacks 
   * @returns {Promise<ReturnType<typeof _tfjs.LayersModel>>}
   */
  async LOAD_LAYERS_MODEL(_callbacks: any): Promise<any> {
    // throw new Error('Error')
  }

  DEFAULT_LAYERS(): _Types.Layer_t[] {
    return []
  }

  HTML_EXAMPLE() {
    return <></>
  }

  JOYRIDE() {
    const handleJoyrideCallback = async (data: any) => {
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
