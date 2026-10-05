
import * as _Types from '@core/types'
import type { TFunction } from 'i18next'

export default abstract class I_MODEL_REGRESSION {
  _KEY = ''
  i18n_TITLE = ''
  URL_DATASET = ''

  t                 : TFunction<'translation', undefined>
  setAccordionActive: React.Dispatch<React.SetStateAction<string[]>>

  constructor(_t: TFunction<'translation', undefined>, _setAccordionActive: React.Dispatch<React.SetStateAction<string[]>>) {
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
      '': [],
    }
    return list_map[dataset] || []
  }

  COMPILE() {}

  /**
   * Cómo predice el modelo ya entrenado del CSV `dataset` con datos que no vio al entrenarlo (los de un paquete .n4l,
   * medidos al entrenarlos); null si no se sabe
   */
  TEST_METRICS(_dataset: string): { test_r2: number, test_mae: number, test_baseline_mae: number } | null {
    return null
  }

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
  async MODELS(_dataset = ''): Promise<_Types.CustomModel_t[]> {
    return []
  }
}
