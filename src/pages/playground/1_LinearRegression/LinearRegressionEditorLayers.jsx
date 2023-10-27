import React, { useContext } from 'react'
import { Accordion, Button, Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { VERBOSE } from '@/CONSTANTS'
import LinearRegressionContext from '@context/LinearRegressionContext'
import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import alertHelper from '@utils/alertHelper'

export default function LinearRegressionEditorLayers () {

  const prefix = 'pages.playground.generator.editor-layers.'
  const { t } = useTranslation()
  const { params, setParams } = useContext(LinearRegressionContext)

  const handlerClick_AddLayer_Start = async () => {
    if (params.params_layers.length <= 10) {
      setParams((prevState) => ({
        ...prevState,
        params_layers: [
          { units: 1, activation: 'relu' },
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
          ...prevState.params_layers,
          { units: 1, activation: 'relu' },
        ]
      }))
    } else {
      await alertHelper.alertWarning(t('error.layers-length'))
    }
  }

  const handlerClick_RemoveLayer = async (index) => {
    if (params.params_layers.length > 1) {
      params.params_layers.splice(index, 1)
      const nuevoArray = params.params_layers
      setParams((prevState) => ({
        ...prevState,
        params_layers: nuevoArray
      }))
    } else {
      await alertHelper.alertWarning(t('error.layers-length'))
    }
  }

  const handleChange_Layer = (index, value) => {
    params.params_layers[index] = value
    const nuevoArray = params.params_layers
    setParams((prevState) => ({
      ...prevState,
      params_layers: nuevoArray
    }))
  }

  if (VERBOSE) console.debug('render LinearRegressionEditorLayers')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={prefix + 'title'} /></h2>
        <div className={'d-flex'}>
          <Button variant={'outline-primary'}
                  size={'sm'}
                  onClick={() => handlerClick_AddLayer_Start()}>
            <Trans i18nKey={prefix + 'add-layer-start'} />
          </Button>
          <Button variant={'outline-primary'}
                  size={'sm'}
                  className={'ms-3'}
                  onClick={() => handlerClick_AddLayer_End()}>
            <Trans i18nKey={prefix + 'add-layer-end'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>

        <Accordion defaultValue={''} defaultActiveKey={''}>
          <>
            {params.params_layers
              .map((item, index) => {
                return <Accordion.Item eventKey={index.toString()} key={index}>
                  <Accordion.Header>
                    <Trans i18nKey={prefix + 'layer-id'}
                           values={{ index: index + 1 }} />
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="d-grid gap-2">
                      <Button variant={'outline-danger'}
                              onClick={() => handlerClick_RemoveLayer(index)}>
                        <Trans i18nKey={prefix + 'delete-layer'}
                               values={{ index: index + 1 }} />
                      </Button>
                    </div>
                    <Form.Group className="mt-3" controlId={'formUnitsLayer' + index}>
                      <Form.Label>
                        <Trans i18nKey={prefix + 'units'} />
                      </Form.Label>
                      <Form.Control type="number"
                                    min={1} max={200}
                                    placeholder={t(prefix + 'units-placeholder')}
                                    value={item.units}
                                    onChange={(e) => handleChange_Layer(index, {
                                      units     : parseInt(e.target.value),
                                      activation: item.activation,
                                    })} />
                    </Form.Group>

                    <Form.Group className="mt-3" controlId={'formActivationLayer' + index}>
                      <Form.Label>
                        <Trans i18nKey={prefix + 'activation-function-select'} />
                      </Form.Label>
                      <Form.Select aria-label={'Default select example: ' + item.activation}
                                   value={item.activation}
                                   onChange={(e) => handleChange_Layer(index, {
                                     units     : item.units,
                                     activation: e.target.value,
                                   })}>
                        {TYPE_ACTIVATION.map(({ key, label }, index) => {
                          return (<option key={index} value={key}>{label}</option>)
                        })}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        <Trans i18nKey={prefix + 'activation-function-info'} />
                      </Form.Text>
                    </Form.Group>
                  </Accordion.Body>
                </Accordion.Item>
              })}
          </>
        </Accordion>

      </Card.Body>
    </Card>
  </>
}