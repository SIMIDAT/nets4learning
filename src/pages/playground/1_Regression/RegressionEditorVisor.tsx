import { useContext, useEffect, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import { VERBOSE } from '@/CONSTANTS'
import RegressionContext from '@context/RegressionContext'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'

const DEFAULT_VISOR_OPTIONS = { 
  rmse    : true, 
  val_rmse: true, 
  mae     : true, 
  val_mae : true 
}

/**
 * 
 * @deprecated
 */
export default function RegressionEditorVisor() {

  const prefix = 'pages.playground.generator.visor.'
  const { t } = useTranslation()

  const { 
    datasets,

    params, 
    setParams, 
  } = useContext(RegressionContext)

  const [visorOptions, setVisorOptions] = useState(DEFAULT_VISOR_OPTIONS)
  // const [show, setShow] = useState(false)

  // useEffect(() => {
  //   setShow(datasets.data[datasets.index].is_dataset_processed)
  // }, [setShow, datasets])
  const isReady = datasets.data[datasets.index]?.is_dataset_processed;

  useEffect(() => {
    const params_visor: string[] = []
    if (visorOptions.rmse) params_visor.push('rmse')
    if (visorOptions.val_rmse) params_visor.push('val_rmse')
    if (visorOptions.mae) params_visor.push('mae')
    if (visorOptions.val_mae) params_visor.push('val_mae')

    setParams((prevState) => ({
      ...prevState,
      params_visor
    }))
  }, [visorOptions, setParams])

  const updateVisorOptions = (key: string, value: boolean) => {
    setVisorOptions((prevState) => {
      return {
        ...prevState,
        [key]: value
      }
    })
  }

  if (VERBOSE) console.debug('render RegressionVisor')
  return <>
    <Card>
      <Card.Header>
        <h3><Trans i18nKey={prefix + 'title'} /></h3>
      </Card.Header>
      <Card.Body>
        {!isReady && <>
          <WaitingPlaceholder i18nKey_title={'pages.playground.generator.waiting-for-process'} />
        </>}
        {isReady && <>
          <Row>
            <Col>
              <Form.Check
                type={'checkbox'}
                label={t(prefix + 'rmse')}
                checked={params.params_visor.includes('rmse')}
                onChange={() => updateVisorOptions('rmse', !visorOptions.rmse)}
                id={'rmse'}
              />
              <Form.Check
                type={'checkbox'}
                label={t(prefix + 'val_rmse')}
                checked={params.params_visor.includes('val_rmse')}
                onChange={() => updateVisorOptions('val_rmse', !visorOptions.val_rmse)}
                id={'val_rmse'}
              />
            </Col>
            <Col>
              <Form.Check 
                type={'checkbox'}
                label={t(prefix + 'mae')}
                checked={params.params_visor.includes('mae')}
                onChange={() => updateVisorOptions('mae', !visorOptions.mae)}
                id={'mae'}
              />
              <Form.Check 
                type={'checkbox'}
                label={t(prefix + 'val_mae')}
                checked={params.params_visor.includes('val_mae')}
                onChange={() => updateVisorOptions('val_mae', !visorOptions.val_mae)}
                id={'val_mae'}
              />
            </Col>
          </Row>
        </>}
      </Card.Body>
    </Card>
  </>
}
