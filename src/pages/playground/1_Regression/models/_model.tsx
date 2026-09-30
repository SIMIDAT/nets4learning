
import * as _Types from "@core/types"
import { buildJoyride } from '@components/joyride/buildJoyride'
import type { TFunction } from "i18next"

export default abstract class I_MODEL_REGRESSION {
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
  JOYRIDE(): _Types.Joyride_t {
    // Cada paso abre las secciones del acordeón donde está su elemento
    const openManual = () => this.setAccordionActive(['manual'])
    const openDatasetInfo = () => this.setAccordionActive(['manual', 'dataset_info'])
    return buildJoyride(this.t, 'datasets-models.1-regression.joyride.steps.', [
      { key: 'manual', target: '.joyride-step-1-manual', placement: 'top', onShow: openManual },
      { key: 'dataset-info', target: '.joyride-step-2-dataset-info', placement: 'top', onShow: openDatasetInfo },
      { key: 'pre-process-dataset', target: '.joyride-step-3-pre-process-dataset', placement: 'top', onShow: openDatasetInfo },
      { key: 'dataset', target: '.joyride-step-4-dataset', placement: 'top', onShow: openDatasetInfo },
      { key: 'layer-visualizer', target: '.joyride-step-5-layer', placement: 'top', onShow: openDatasetInfo },
      { key: 'layer-editor', target: '.joyride-step-6-editor-layers', placement: 'right', onShow: openDatasetInfo },
      { key: 'params-editor', target: '.joyride-step-7-editor-trainer', placement: 'left-start', onShow: openDatasetInfo },
      { key: 'list-of-models', target: '.joyride-step-8-list-of-models', placement: 'bottom', onShow: openDatasetInfo },
      { key: 'predict-and-visualizer', target: '.joyride-step-9-predict-visualization', placement: 'top', onShow: openDatasetInfo },
    ])
  }
}
