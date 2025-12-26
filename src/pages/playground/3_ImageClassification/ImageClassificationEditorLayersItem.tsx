import { Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import { VERBOSE } from '@/CONSTANTS'
import type { Layer_t } from '@/types/types'

type Props = {
  item             : Layer_t,
  indexLayer       : number,
  handleChange_Attr: (e: React.ChangeEvent<any>, indexLayer: number, _param_name_: keyof Layer_t) => void
}

export default function ImageClassificationEditorLayersItem(props: Props) {
  const { item, indexLayer, handleChange_Attr } = props
  const prefix = 'pages.playground.generator.editor-layers.'
  const { t } = useTranslation()

  if (VERBOSE) console.debug('render LayerEdit')
  return (<>
    {item._class === 'flatten' && <Row className={'mt-3'}>
      <Col></Col>
    </Row>}
    {item._class === 'dense' && item.activation !== null && <Row className={'mt-3'}>
      <Col xl={6}>
        <Form.Group className="mb-3" controlId={'formUnitsLayer_' + indexLayer}>
          <Form.Label><Trans i18nKey={prefix + 'units'} /></Form.Label>
          <Form.Control type="number"
            inputMode={'numeric'}
            placeholder={t(prefix + 'units-placeholder')}
            value={item.units}
            onChange={(e) => handleChange_Attr(e, indexLayer, 'units')} />
        </Form.Group>
      </Col>
      {/* ACTIVATION FUNCTION */}
      <Col xl={6}>
        <Form.Group className="mb-3" controlId={'formActivationLayer' + indexLayer}>
          <Form.Label><Trans i18nKey={prefix + 'activation-function-select'} /></Form.Label>
          <Form.Select
            aria-label={t(prefix + 'activation-function-info')}
            value={item.activation}
            onChange={(e) => handleChange_Attr(e, indexLayer, 'activation')}>
            {TYPE_ACTIVATION.map(({ key, label }, indexAct) => {
              return (<option key={indexAct} value={key}>{label}</option>)
            })}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>}
    {item._class === 'conv2d' && item.activation !== null && <Row className={'mt-3'}>
      {/* KERNEL SIZE */}
      <Col xl={6}>
        <Form.Group className="mb-3" controlId={'formKernelLayer' + indexLayer}>
          <Form.Label><Trans i18nKey={prefix + 'kernel-size'} /></Form.Label>
          <Form.Control
            type="number"
            placeholder={t(prefix + 'kernel-size-placeholder')}
            value={item.kernelSize}
            onChange={(e) => handleChange_Attr(e, indexLayer, 'kernelSize')} />
        </Form.Group>
      </Col>

      {/* FILTERS */}
      <Col xl={6}>
        <Form.Group className="mb-3" controlId={'formFiltersLayer' + indexLayer}>
          <Form.Label><Trans i18nKey={prefix + 'filters-size'} /></Form.Label>
          <Form.Control 
          type="number"
            placeholder={t(prefix + 'filters-size-placeholder')}
            value={item.filters}
            onChange={(e) => handleChange_Attr(e, indexLayer, 'filters')} />
        </Form.Group>
      </Col>

      {/* ACTIVATION FUNCTION */}
      <Col xl={12}>
        <Form.Group className="mb-3" controlId={'formActivationLayer' + indexLayer}>
          <Form.Label><Trans i18nKey={prefix + 'activation-function-select'} /></Form.Label>
          <Form.Select
            aria-label={t(prefix + 'activation-function-info')}
            value={item.activation}
            onChange={(e) => handleChange_Attr(e, indexLayer, 'activation')}>
            {TYPE_ACTIVATION.map(({ key, label }, indexAct) => {
              return (<option key={indexAct} value={key}>{label}</option>)
            })}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>}

    {item._class === 'maxPooling2d' && <Row className={'mt-3'}>
      {/* POOLSIZE */}
      <Col xl={6}>
        <Form.Group className="mb-3" controlId={'formPoolSize0Layer' + indexLayer}>
          <Form.Label><Trans i18nKey={prefix + 'pool-size'} /></Form.Label>
          <Form.Control
            type="number"
            placeholder={t(prefix + 'pool-size-placeholder')}
            value={item.poolSize}
            onChange={(e) => handleChange_Attr(e, indexLayer, 'poolSize')} />
        </Form.Group>
      </Col>

      {/* STRIDES */}
      <Col xl={6}>
        <Form.Group className="mb-3" controlId={'formStrides0Layer' + indexLayer}>
          <Form.Label><Trans i18nKey={prefix + 'strides'} /></Form.Label>
          <Form.Control
            type="number"
            placeholder={t(prefix + 'strides-placeholder')}
            value={item.strides}
            onChange={(e) => handleChange_Attr(e, indexLayer, 'strides')} />
        </Form.Group>
      </Col>

    </Row>}
  </>)
}
