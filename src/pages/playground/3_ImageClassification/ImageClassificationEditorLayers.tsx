import { useMemo } from 'react'
import { Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { VERBOSE } from '@/CONSTANTS'
import { MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'
import { TYPE_CLASS } from '@core/nn-utils/ArchitectureTypesHelper'
import { checkImageLayers } from '@core/nn-utils/checkLayers'
import alertHelper from '@utils/alertHelper'
import type { ImageLayer_t } from 'src/types/types'
import N4LEditorLayers from '@components/neural-network/N4LEditorLayers'
import N4LLayerCheck from '@components/neural-network/N4LLayerCheck'
import { flaggedLayers } from '@components/neural-network/layerCheckText'
import { layerSummaryParts } from '@components/neural-network/layerSummary'
import N4LHelpLink from '@components/helpLink/N4LHelpLink'
import ImageClassificationEditorLayersItem from '@pages/playground/3_ImageClassification/ImageClassificationEditorLayersItem'

const DEFAULT_LAYER_END: ImageLayer_t = {
  _class    : 'maxPooling2d',
  poolSize  : 2,
  strides   : 2,
  activation: 'relu',
  units     : 0,
}

const MAP_CLASS_LAYERS: Record<string, ImageLayer_t> = {
  'conv2d': {
    _class    : 'conv2d',
    kernelSize: 3,
    filters   : 16,
    activation: 'relu',
    units     : 0,
  },
  'maxPooling2d': {
    _class    : 'maxPooling2d',
    poolSize  : 2,
    strides   : 2,
    activation: null,
    units     : 0,
  },
  'flatten': {
    _class    : 'flatten',
    activation: null,
    units     : 0,
  },
  'dense': {
    _class    : 'dense',
    units     : 32,
    activation: 'relu'
  }
}

type Props = {
  Layers   : ImageLayer_t[],
  setLayers: React.Dispatch<React.SetStateAction<ImageLayer_t[]>>
  /** Clases del conjunto de datos: la última capa necesita una neurona por cada una */
  classes  : number
}

/**
 * Las capas de la red de imágenes, con el mismo editor que las de los otros entrenadores (N4LEditorLayers): cada una
 * con su tipo (convolución, pooling, aplanado, densa) y sus parámetros. La primera convolución, que recibe la imagen,
 * no se puede quitar ni cambiar de tipo.
 */
export default function ImageClassificationEditorLayers({ Layers, setLayers, classes }: Props) {
  const prefix = 'pages.playground.generator.editor-layers.'
  const { t } = useTranslation()
  const issues = useMemo(() => checkImageLayers(Layers, classes), [Layers, classes])

  const handleClick_AddLayer_End = async () => {
    if (Layers.length < 10) {
      setLayers((oldLayers) => [...oldLayers, DEFAULT_LAYER_END])
    } else {
      await alertHelper.alertWarning(t('warning.not-more-layers'))
    }
  }

  const handleClick_RemoveLayer = async (indexLayer: number) => {
    if (Layers.length === 1) {
      await alertHelper.alertWarning(t('warning.error-layers'))
      return
    }
    setLayers((oldLayers) => oldLayers.filter((_, index) => index !== indexLayer))
  }

  const handleChange_Class = (e: React.ChangeEvent<HTMLSelectElement>, indexLayer: number) => {
    const option = e.target.value
    setLayers((oldLayers) => oldLayers.map((layer, index) => (index === indexLayer ? MAP_CLASS_LAYERS[option] : layer)))
  }

  const handleChange_Attr = (e: React.ChangeEvent<HTMLInputElement>, indexLayer: number, _param_name_: keyof ImageLayer_t) => {
    // La activación es un texto; el resto de parámetros, números
    const value = _param_name_ === 'activation' ? e.target.value : parseInt(e.target.value)
    setLayers((oldLayers) => oldLayers.map((layer, index) => (index === indexLayer ? { ...layer, [_param_name_]: value } : layer)))
  }

  if (VERBOSE) console.debug('render ImageClassificationLayerEditor')
  return (
    <N4LEditorLayers
      layers={Layers}
      summary={(layer) => layerSummaryParts(t, layer).join(' · ')}
      isLocked={(layer) => layer._protected === true}
      renderFields={(layer, index) => <>
        <Form.Group className={'mt-3'} controlId={'formClass' + index}>
          <Form.Label><Trans i18nKey={prefix + 'layer-class'} /></Form.Label>
          <Form.Select value={layer._class} disabled={layer._protected === true} onChange={(e) => handleChange_Class(e, index)}>
            {TYPE_CLASS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
          </Form.Select>
        </Form.Group>
        <hr />
        <ImageClassificationEditorLayersItem item={layer} indexLayer={index} handleChange_Attr={handleChange_Attr} />
      </>}
      check={<N4LLayerCheck issues={issues} onFix={setLayers} />}
      flagged={flaggedLayers(issues)}
      onAddEnd={handleClick_AddLayer_End}
      onRemove={handleClick_RemoveLayer}
      footer={
        <p className={'text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-link'}
            components={{ link1: <N4LHelpLink page={'manual'} action={MANUAL_ACTIONS.IMAGE_CLASSIFICATION.STEP_3_LAYERS} /> }} />
        </p>
      }
    />
  )
}
