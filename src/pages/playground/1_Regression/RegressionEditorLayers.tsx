import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { DEFAULT_SELECTOR_DATASET_INDEX, VERBOSE } from '@/CONSTANTS'
import type { CustomParamsLayerModel_t } from '@core/types'
import alertHelper from '@utils/alertHelper'
import { useRegressionContext } from '@context/useRegressionContext'
import N4LEditorLayers from '@components/neural-network/N4LEditorLayers'
import N4LLayerCheck from '@components/neural-network/N4LLayerCheck'
import { flaggedLayers } from '@components/neural-network/layerCheckText'
import { checkDenseLayers } from '@core/nn-utils/checkLayers'

export default function RegressionEditorLayers() {

  const { t } = useTranslation()
  const {
    datasets,

    params,
    setParams,
  } = useRegressionContext()
  const show = datasets.data.length > 0
    && datasets.index !== DEFAULT_SELECTOR_DATASET_INDEX
    && datasets.index >= 0
    && datasets.data[datasets.index].is_dataset_processed
  // La salida (una neurona, lineal) la fija la página: se miran las unidades y las activaciones de las ocultas
  const issues = useMemo(() => checkDenseLayers(params.params_layers), [params.params_layers])

  const handlerClick_AddLayer_Start = async () => {
    if (params.params_layers.length <= 10) {
      setParams((prevState) => ({
        ...prevState,
        params_layers: [
          { is_disabled: false, units: 1, activation: 'relu' },
          ...prevState.params_layers
        ]
      }))
    } else {
      await alertHelper.alertWarning(t('error.layers-length'))
    }
  }

  const handlerClick_AddLayer_End = async () => {
    if (params.params_layers.length <= 10) {
      setParams((prevState) => ({
        ...prevState,
        params_layers: [
          // Cambiamos la ultima capa previa para que esté habilitada
          ...prevState.params_layers.map((item) => ({ is_disabled: false, units: item.units, activation: item.activation })),
          // Añadimos una nueva última capa 
          { is_disabled: true, units: 1, activation: 'linear' },
        ]
      }))
    } else {
      await alertHelper.alertWarning(t('error.layers-length'))
    }
  }

  const handlerClick_RemoveLayer = async (index: number) => {
    if (params.params_layers.length > 1) {
      setParams((prevState) => ({
        ...prevState,
        params_layers: prevState.params_layers.filter((_layer, i) => i !== index),
      }))
    } else {
      await alertHelper.alertWarning(t('error.layers-length'))
    }
  }

  const handleChange_Layer = (index: number, value: CustomParamsLayerModel_t) => {
    setParams((prevState) => ({
      ...prevState,
      params_layers: prevState.params_layers.map((layer, i) => (i === index ? value : layer)),
    }))
  }

  if (VERBOSE) console.debug('render RegressionEditorLayers')
  return (
    <N4LEditorLayers
      layers={params.params_layers}
      check={<N4LLayerCheck issues={issues} onFix={(params_layers) => setParams((prevState) => ({ ...prevState, params_layers }))} />}
      flagged={flaggedLayers(issues)}
      onAddStart={handlerClick_AddLayer_Start}
      onAddEnd={handlerClick_AddLayer_End}
      onRemove={handlerClick_RemoveLayer}
      onChange={(index, layer) => handleChange_Layer(index, {
        is_disabled: params.params_layers[index].is_disabled,
        units      : layer.units,
        activation : layer.activation,
      })}
      waiting={!show}
      titleAs={'h2'}
    />
  )
}