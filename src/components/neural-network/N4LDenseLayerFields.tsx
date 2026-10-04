import { Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'

export type EditableLayer_t = {
  units       : number
  activation  : string | null
  /** Capa que el usuario no puede cambiar ni borrar (p. ej. la salida de regresión) */
  is_disabled?: boolean
}

const prefix = 'pages.playground.generator.editor-layers.'

type N4LDenseLayerFieldsProps = {
  index   : number
  layer   : EditableLayer_t
  onChange: (index: number, layer: { units: number, activation: string | null }) => void
}

/** Lo que se edita de una capa dense (clasificación tabular, regresión, las densas de la red de imágenes): sus neuronas y su activación */
export default function N4LDenseLayerFields({ index, layer, onChange }: N4LDenseLayerFieldsProps) {
  const { t } = useTranslation()
  return <>
    <Form.Group className={'mt-3'} controlId={'formUnitsLayer' + index}>
      <Form.Label><Trans i18nKey={prefix + 'units'} /></Form.Label>
      <Form.Control type={'number'}
        min={1}
        max={200}
        disabled={layer.is_disabled}
        placeholder={t(prefix + 'units-placeholder')}
        value={layer.units}
        onChange={(e) => onChange(index, { units: parseInt(e.target.value), activation: layer.activation })} />
    </Form.Group>
    <Form.Group className={'mt-3'} controlId={'formActivationLayer' + index}>
      <Form.Label><Trans i18nKey={prefix + 'activation-function-select'} /></Form.Label>
      <Form.Select aria-label={t(prefix + 'activation-function-select')}
        disabled={layer.is_disabled}
        value={layer.activation || 'relu'}
        onChange={(e) => onChange(index, { units: layer.units, activation: e.target.value })}>
        {TYPE_ACTIVATION.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
      </Form.Select>
      <Form.Text className={'text-muted'}>
        <Trans i18nKey={prefix + 'activation-function-info'} />
      </Form.Text>
    </Form.Group>
  </>
}
