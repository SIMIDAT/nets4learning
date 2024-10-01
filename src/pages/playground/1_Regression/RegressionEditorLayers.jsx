import React, { useContext, useEffect, useState } from 'react'
import { Accordion, Button, Card, Form } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { DEFAULT_SELECTOR_DATASET, VERBOSE } from '@/CONSTANTS'
import alertHelper from '@utils/alertHelper'
import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import RegressionContext from '@/context/RegressionContext'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

export default function RegressionEditorLayers() {

  const prefix = 'pages.playground.generator.editor-layers.'
  const { t } = useTranslation()
  const { 
    datasets, 

    params,
    setParams,
   } = useContext(RegressionContext)
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(datasets 
      && datasets.data.length > 0
      && datasets.index !== DEFAULT_SELECTOR_DATASET
      && datasets.index >= 0
      && datasets.data[datasets.index].is_dataset_processed)
  }, [setShow, datasets, datasets.index])

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
          ...prevState.params_layers.map((item)=>({ is_disabled: false, units: item.units, activation: item.activation })),
          // Añadimos una nueva última capa 
          { is_disabled: true, units: 1, activation: 'linear' },
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
    setParams((prevState) => ({
      ...prevState,
      params_layers: params.params_layers
    }))
  }

  if (VERBOSE) console.debug('render RegressionEditorLayers')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h2><Trans i18nKey={prefix + 'title'} /></h2>
        <div className={'d-flex'}>
          <Button disabled={show === false}
                  variant={'outline-primary'}
                  size={'sm'}
                  onClick={() => handlerClick_AddLayer_Start()}>
            <Trans i18nKey={prefix + 'add-layer-start'} />
          </Button>
          <Button disabled={show === false}
                  variant={'outline-primary'}
                  size={'sm'}
                  className={'ms-3'}
                  onClick={() => handlerClick_AddLayer_End()}>
            <Trans i18nKey={prefix + 'add-layer-end'} />
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {!show && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />
        </>}
        {show && <>
          <Accordion defaultValue={''} defaultActiveKey={''}>
            <>
              {params
                .params_layers
                .map((item, index) => {
                  return <Accordion.Item eventKey={index.toString()} key={index}>
                    <Accordion.Header>
                      <Trans i18nKey={prefix + 'layer-id'} values={{ index: index + 1 }} />
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="d-grid gap-2">
                        <Button variant={'outline-danger'} 
                                disabled={item.is_disabled}
                                onClick={() => handlerClick_RemoveLayer(index)}>
                          <Trans i18nKey={prefix + 'delete-layer'} values={{ index: index + 1 }} />
                        </Button>
                      </div>
                      <Form.Group className="mt-3" controlId={'formUnitsLayer' + index}>
                        <Form.Label>
                          <Trans i18nKey={prefix + 'units'} />
                        </Form.Label>
                        <Form.Control type="number"
                                      disabled={item.is_disabled}
                                      min={1} 
                                      max={200}
                                      placeholder={t(prefix + 'units-placeholder')}
                                      value={item.units}
                                      onChange={(e) => handleChange_Layer(index, {
                                        is_disabled: item.is_disabled, 
                                        activation : item.activation,
                                        units      : parseInt(e.target.value),
                                      })} />
                      </Form.Group>

                      <Form.Group className="mt-3" controlId={'formActivationLayer' + index}>
                        <Form.Label>
                          <Trans i18nKey={prefix + 'activation-function-select'} />
                        </Form.Label>
                        <Form.Select aria-label={'Default select example: ' + item.activation}
                                    disabled={item.is_disabled}
                                    value={item.activation}
                                    onChange={(e) => handleChange_Layer(index, {
                                      is_disabled: item.is_disabled, 
                                      activation : e.target.value,
                                      units      : item.units,
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
        </>}
      </Card.Body>
    </Card>
  </>
}