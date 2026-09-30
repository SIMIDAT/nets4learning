import { useEffect } from 'react'
import { Link } from 'react-router'
import { Trans, useTranslation } from 'react-i18next'
import N4LEditorLayers from '@components/neural-network/N4LEditorLayers'
import alertHelper from '@utils/alertHelper'
import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import * as _Types from '@core/types'
import { useTabularClassificationContext } from '@context/useTabularClassificationContext'



/**
 * 
 * @param {PropsTabularClassificationEditorLayers} props 
 * @returns 
 */
export default function TabularClassificationEditorLayers() {
    const { layers, setLayers, datasets: datasetsState } = useTabularClassificationContext()
  const { datasets, index: datasetIndex } = datasetsState

  const { t } = useTranslation()

  useEffect(() => {
    // La capa de salida tiene tantas unidades como clases (nuevo array: el estado no se modifica en el sitio)
    const changeUnitsLastLayer = (old_layers: _Types.Layer_t[], units_last_layer: number) => {
      if (old_layers.length === 0) return old_layers
      return old_layers.map((layer, index) => (index === old_layers.length - 1 ? { ...layer, units: units_last_layer } : layer))
    }
    const _selected_dataset = datasets[datasetIndex]
    if (!_selected_dataset) {
      console.warn('TabularClassificationEditorLayers: dataset not found')
      return
    }
    const { data_processed } = _selected_dataset
    setLayers((old_layers) => changeUnitsLastLayer(old_layers, data_processed?.classes?.length ?? 10))
  }, [datasets, datasetIndex, setLayers])
  // region  Layers
  const handlerClick_AddLayer_Start = async () => {
    if (layers.length < 10) {
      setLayers(oldLayers => {
        return [{
          _class    : 'dense',
          units     : 10,
          activation: 'sigmoid',
        },
        ...oldLayers
        ]
      })
    } else {
      await alertHelper.alertWarning(t('warning.not-more-layers'))
    }
  }

  const handlerClick_AddLayer_End = async () => {
    if (layers.length < 10) {
      const { data_processed } = datasets[datasetIndex]
      let units = data_processed?.classes?.length ?? 10
      if (units === 0) units = 1
      setLayers((oldLayers) => {
        return [
          ...oldLayers,
          {
            _class    : 'dense',
            units     : units,
            activation: 'softmax',
          }
        ]
      })
    } else {
      await alertHelper.alertWarning(t('warning.not-more-layers'))
    }
  }

  const handlerClick_RemoveLayer = async (_idLayer: number) => {
    if (layers.length === 1) {
      await alertHelper.alertWarning(t('warning.error-layers'))
      return
    }
    const newArray = layers.filter((_item, index) => (index !== _idLayer))
    setLayers(newArray)
  }

  const handleChange_Layer = async (_idLayer: number, _updateLayer: _Types.Layer_t) => {
    setLayers((prevLayers) => {
      return prevLayers.map((item, index) => {
        if (_idLayer === index) {
          return {
            _class    : item._class,
            units     : _updateLayer.units,
            activation: _updateLayer.activation
          }
        }
        return {
          _class    : item._class,
          units     : item.units,
          activation: item.activation
        }
      })
    })
  }
  // endregion

  if (VERBOSE) console.debug('render TabularClassificationEditorLayers')
  return (
    <N4LEditorLayers
      layers={layers}
      onAddStart={handlerClick_AddLayer_Start}
      onAddEnd={handlerClick_AddLayer_End}
      onRemove={handlerClick_RemoveLayer}
      onChange={(index, layer) => handleChange_Layer(index, {
        _class    : layers[index]._class,
        units     : layer.units,
        activation: layer.activation || 'relu',
      })}
      footer={<>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-link'}
            components={{
              link1: <Link
                className={'text-info'}
                state={{
                  action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_LAYERS,
                }}
                to={{
                  pathname: '/glossary/',
                }}
              />,
            }}
          />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans
            i18nKey={'more-information-in-tutorial'}
            components={{
              link1: <Link
                className={'text-info'}
                state={{
                  action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_LAYERS,
                }}
                to={{
                  pathname: '/manual/',
                }} />,
            }} />
        </p>
      </>}
    />
  )
}