import { ACTIONS, LIFECYCLE } from "react-joyride"

import * as _Types from "@core/types"
import { delay } from "@utils/utils"
import Errors from "@shared/Errors"
import type { TFunction } from "i18next"

export default class I_MODEL_REGRESSION {
  _KEY = ""
  i18n_TITLE = ""
  URL_DATASET = ""

  t                 : TFunction<"translation", undefined>
  setAccordionActive: React.Dispatch<React.SetStateAction<string[]>>

  constructor(_t: TFunction<"translation", undefined>, _setAccordionActive: React.Dispatch<React.SetStateAction<string[]>>) {
    this.t = _t
    this.setAccordionActive = _setAccordionActive
  }

  DESCRIPTION() {
    return <></>
  }

  ATTRIBUTE_INFORMATION() {
    return <></>
  }

  /**
   * @property {string} dataset
   * @returns {_Types.CustomParamsLayerModel_t[]}
   */
  DEFAULT_LAYERS(dataset: string): _Types.CustomParamsLayerModel_t[] {
    const list_map: { [key: string]: _Types.CustomParamsLayerModel_t[] } = {
      "": [],
    }
    return list_map[dataset] || []
  }

  COMPILE() {}

  /**
   *
   * @return {Promise<Array<_Types.DatasetProcessed_t>>}
   */
  async DATASETS(): Promise<_Types.DatasetProcessed_t[]> {
    return []
  }

  /**
   * @param {string} [_dataset='']
   * @return {Promise<_Types.CustomModel_t[]>}
   */
  async MODELS(_dataset = ""): Promise<_Types.CustomModel_t[]> {
    return []
  }

  /**
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
   * @return {_Types.Joyride_t}
   */
  JOYRIDE() {
    const handleJoyrideCallback = async (data: any) => {
      const { action, lifecycle, step /*, status, type*/ } = data
      const { target } = step
      // const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1)

      if ([ACTIONS.UPDATE.toString()].includes(action) && [LIFECYCLE.TOOLTIP.toString()].includes(lifecycle)) {
        switch (target) {
          case ".joyride-step-1-manual": {
            this.setAccordionActive(["manual"])
            break
          }
          case ".joyride-step-2-dataset-info": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          case ".joyride-step-3-dataset": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          case ".joyride-step-4-dataset-plot": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          case ".joyride-step-5-layer": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          case ".joyride-step-6-editor-layers": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          case ".joyride-step-7-editor-trainer": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          case ".joyride-step-8-list-of-models": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          case ".joyride-step-9-predict-visualization": {
            this.setAccordionActive(["manual", "dataset_info"])
            break
          }
          default: {
            console.warn("Error, option not valid")
            break
          }
        }
        await delay(500)
        const isDispatchedEvent = window.dispatchEvent(new Event("resize"))
        if (!isDispatchedEvent) {
          Errors.notDispatchedEvent()
        }
      }
    }

    const prefix = "datasets-models.1-regression.joyride.steps."
    return {
      run                  : false,
      continuous           : true,
      handleJoyrideCallback: handleJoyrideCallback,
      steps                : [
        {
          title    : this.t(prefix + "manual.title"),
          content  : this.t(prefix + "manual.content"),
          target   : ".joyride-step-1-manual",
          placement: "top",
        },
        {
          title    : this.t(prefix + "dataset-info.title"),
          content  : this.t(prefix + "dataset-info.content"),
          target   : ".joyride-step-2-dataset-info",
          placement: "top",
        },
        {
          title    : this.t(prefix + "pre-process-dataset.title"),
          content  : this.t(prefix + "pre-process-dataset.content"),
          target   : ".joyride-step-3-pre-process-dataset",
          placement: "top",
        },
        {
          title    : this.t(prefix + "dataset.title"),
          content  : this.t(prefix + "dataset.content"),
          target   : ".joyride-step-4-dataset",
          placement: "top",
        },
        {
          title    : this.t(prefix + "layer-visualizer.title"),
          content  : this.t(prefix + "layer-visualizer.content"),
          target   : ".joyride-step-5-layer",
          placement: "top",
        },
        {
          title    : this.t(prefix + "layer-editor.title"),
          content  : this.t(prefix + "layer-editor.content"),
          target   : ".joyride-step-6-editor-layers",
          placement: "right",
        },
        {
          title    : this.t(prefix + "params-editor.title"),
          content  : this.t(prefix + "params-editor.content"),
          target   : ".joyride-step-7-editor-trainer",
          placement: "left-start",
        },
        {
          title    : this.t(prefix + "list-of-models.title"),
          content  : this.t(prefix + "list-of-models.content"),
          target   : ".joyride-step-8-list-of-models",
          placement: "bottom",
        },
        {
          title    : this.t(prefix + "predict-and-visualizer.title"),
          content  : this.t(prefix + "predict-and-visualizer.content"),
          target   : ".joyride-step-9-predict-visualization",
          placement: "top",
        },
      ],
    }
  }
}
