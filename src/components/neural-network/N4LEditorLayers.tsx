import React from 'react'
import { Accordion, Button, Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

export type EditableLayer_t = {
  units       : number
  activation  : string | null
  /** Capa que el usuario no puede cambiar ni borrar (p. ej. la salida de regresión) */
  is_disabled?: boolean
}

type N4LEditorLayersProps = {
  layers    : EditableLayer_t[]
  onAddStart: () => void
  onAddEnd  : () => void
  onRemove  : (index: number) => void
  onChange  : (index: number, layer: { units: number, activation: string | null }) => void
  /** Sin dataset procesado todavía: se muestra la espera y no se pueden añadir capas */
  waiting?  : boolean
  titleAs?  : 'h2' | 'h3'
  footer?   : React.ReactNode
}

const prefix = 'pages.playground.generator.editor-layers.'

/**
 * Editor de capas dense: añadir al principio o al final, borrar y cambiar unidades y activación.
 * Las reglas de cada tarea (capa de salida, número máximo de capas…) las pone quien lo usa.
 */
export default function N4LEditorLayers(props: N4LEditorLayersProps) {
  const { layers, onAddStart, onAddEnd, onRemove, onChange, waiting = false, titleAs: Title = 'h3', footer } = props
  const { t } = useTranslation()

  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <Title><Trans i18nKey={prefix + 'title'} /></Title>
        <div className={'d-flex'}>
          <Button disabled={waiting} variant={'outline-primary'} size={'sm'} onClick={onAddStart}>
            <Trans i18nKey={prefix + 'add-layer-start'} />
          </Button>
          <Button disabled={waiting} variant={'outline-primary'} size={'sm'} className={'ms-3'} onClick={onAddEnd}>
            <Trans i18nKey={prefix + 'add-layer-end'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {waiting && <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />}
        {!waiting && (
          <Accordion>
            {layers.map((item, index) => (
              <Accordion.Item key={index} eventKey={index.toString()}>
                <Accordion.Header>
                  <Trans i18nKey={prefix + 'layer-id'} values={{ index: index + 1 }} />
                </Accordion.Header>
                <Accordion.Body>
                  <div className="d-grid gap-2">
                    <Button variant={'outline-danger'} disabled={item.is_disabled} onClick={() => onRemove(index)}>
                      <Trans i18nKey={prefix + 'delete-layer'} values={{ index: index + 1 }} />
                    </Button>
                  </div>
                  <Form.Group className="mt-3" controlId={'formUnitsLayer' + index}>
                    <Form.Label><Trans i18nKey={prefix + 'units'} /></Form.Label>
                    <Form.Control type="number"
                      min={1}
                      max={200}
                      disabled={item.is_disabled}
                      placeholder={t(prefix + 'units-placeholder')}
                      value={item.units}
                      onChange={(e) => onChange(index, { units: parseInt(e.target.value), activation: item.activation })} />
                  </Form.Group>
                  <Form.Group className="mt-3" controlId={'formActivationLayer' + index}>
                    <Form.Label><Trans i18nKey={prefix + 'activation-function-select'} /></Form.Label>
                    <Form.Select aria-label={'Default select example: ' + item.activation}
                      disabled={item.is_disabled}
                      value={item.activation || 'relu'}
                      onChange={(e) => onChange(index, { units: item.units, activation: e.target.value })}>
                      {TYPE_ACTIVATION.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      <Trans i18nKey={prefix + 'activation-function-info'} />
                    </Form.Text>
                  </Form.Group>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Card.Body>
      {footer && <Card.Footer className={'text-end'}>{footer}</Card.Footer>}
    </Card>
  </>
}
