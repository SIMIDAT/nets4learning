import { Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import N4LNumberField from '@components/form/N4LNumberField'
import N4LHelpTerm from '@components/helpLink/N4LHelpTerm'

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

/**
 * Lo que se edita de una capa dense (clasificación tabular, regresión, las densas de la red de imágenes): sus neuronas
 * y su activación, cada una con su definición (N4LHelpTerm). Las neuronas, entre 1 y 200: lo que no vale se dice junto
 * al campo y se sigue usando el último valor bueno
 */
export default function N4LDenseLayerFields({ index, layer, onChange }: N4LDenseLayerFieldsProps) {
  const { t } = useTranslation()
  const help = 'pages.playground.generator.help.'
  return <>
    <N4LNumberField className={'mt-3'} controlId={'formUnitsLayer' + index}
      label={<N4LHelpTerm label={<Trans i18nKey={prefix + 'units'} />} help={t(help + 'units')} />}
      value={layer.units} min={1} max={200} disabled={layer.is_disabled}
      onChange={(units) => onChange(index, { units, activation: layer.activation })} />
    <Form.Group className={'mt-3'} controlId={'formActivationLayer' + index}>
      <Form.Label><N4LHelpTerm label={<Trans i18nKey={prefix + 'activation-function-select'} />} help={t(help + 'activation')} /></Form.Label>
      <Form.Select
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
