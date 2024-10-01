import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Accordion, Button, Card, Form } from 'react-bootstrap'
import { TYPE_ACTIVATION } from '@core/nn-utils/ArchitectureTypesHelper'
import alertHelper from '@utils/alertHelper'
import { VERBOSE } from '@/CONSTANTS'
import { GLOSSARY_ACTIONS, MANUAL_ACTIONS } from '@/CONSTANTS_ACTIONS'

/**
 * @typedef PropsTabularClassificationEditorLayers
 * @property {Array<{units: number, activation: string}>} layers
 * @property {React.Dispatch<Array<{units: number, activation: string}>>} setLayers
 * @property {DatasetProcessed_t[]} datasets
 * @property {number} datasetIndex
 */

/**
 * 
 * @param {PropsTabularClassificationEditorLayers} props 
 * @returns 
 */
export default function TabularClassificationEditorLayers (props) {
  const {
    layers,
    setLayers,
    datasets,
    datasetIndex,
  } = props

  const prefix = 'pages.playground.generator.editor-layers.'
  const { t } = useTranslation()

  useEffect(() => {
    const changeUnitsLastLayer = (old_layer, units_last_layer) => {
      if (old_layer.length > 0) {
        old_layer[old_layer.length - 1].units = units_last_layer
      }
      return old_layer
    }
    const { data_processed } = datasets[datasetIndex]

    setLayers((old_layers) => changeUnitsLastLayer(old_layers, data_processed?.classes?.length ?? 10))
  }, [datasets, datasetIndex, setLayers])
  // region  Layers
  const handlerClick_AddLayer_Start = async () => {
    if (layers.length < 10) {
      setLayers(oldLayers => [{
        units     : 10,
        activation: 'sigmoid',
      }, ...oldLayers])
    } else {
      await alertHelper.alertWarning(t('warning.not-more-layers'))
    }
  }

  const handlerClick_AddLayer_End = async () => {
    if (layers.length < 10) {
      const { data_processed } = datasets[datasetIndex]
      let units = data_processed?.classes?.length ?? 10
      if (units === 0) units = 1
      setLayers(oldLayers => [...oldLayers, {
        units     : units,
        activation: 'softmax',
      }])
    } else {
      await alertHelper.alertWarning(t('warning.not-more-layers'))
    }
  }

  const handlerClick_RemoveLayer = async (_idLayer) => {
    if (layers.length === 1) {
      await alertHelper.alertWarning(t('warning.error-layers'))
      return
    }
    const newArray = layers.filter((item, index) => (index !== _idLayer))
    setLayers(newArray)
  }

  const handleChange_Layer = async (_idLayer, _updateLayer) => {
    const newLayers = layers.map((item, index) => {
      if (_idLayer === index) return { units: _updateLayer.units, activation: _updateLayer.activation }
      return { units: item.units, activation: item.activation }
    })
    setLayers(newLayers)
  }
  // endregion

  if (VERBOSE) console.debug('render TabularClassificationEditorLayers')
  return <>
    <Card>
      <Card.Header className={'d-flex align-items-center justify-content-between'}>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
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
        <Accordion>
          {layers.map((item, index) => {
            return (
              <Accordion.Item key={index} eventKey={index.toString()}>
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
                  {/* UNITS */}
                  <Form.Group className="mt-3"
                              controlId={'formUnitsLayer' + index}>
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
                  {/* ACTIVATION FUNCTION */}
                  <Form.Group className="m3-3"
                              controlId={'formActivationLayer' + index}>
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
            )
          })}
        </Accordion>
      </Card.Body>
      <Card.Footer className={'text-end'}>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-link'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/glossary/',
                                  state   : {
                                    action: GLOSSARY_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_LAYERS,
                                  },
                                }}
                   />,
                 }} />
        </p>
        <p className={'text-muted mb-0 pb-0'}>
          <Trans i18nKey={'more-information-in-tutorial'}
                 components={{
                   link1: <Link className={'text-info'}
                                to={{
                                  pathname: '/manual/',
                                  state   : {
                                    action: MANUAL_ACTIONS.TABULAR_CLASSIFICATION.STEP_3_LAYERS,
                                  },
                                }}
                   />,
                 }} />
        </p>
      </Card.Footer>
    </Card>
  </>
}