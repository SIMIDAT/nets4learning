import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Form, Button, Row, Col, Container, Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import N4LModal from '@components/modal/N4LModal'
import alertHelper from '@utils/alertHelper'

import {
  TASK_MODEL_OPTIONS,
  TASK_MODEL_OPTIONS_CLASS
} from '@/DATA_MODEL'
import { VERBOSE } from '@/CONSTANTS'


export default function MenuSelectModel (_props) {

  const { id } = useParams()
  const { t } = useTranslation()
  const prefix = 'pages.menu.select-model.'
  const history = useHistory()

  const [modelKey, setModelKey] = useState('select-model')
  const [options, setOptions] = useState([])
  const [showDescription, setShowDescription] = useState(false)

  const handleSubmit = async ($event) => {
    $event.preventDefault()
    if (modelKey === 'select-model') {
      await alertHelper.alertWarning(t('alert.menu.need-select-model'))
    } else {
      history.push('/playground/' + id + '/model/' + modelKey)
    }
  }

  useEffect(() => {
    let _options = []
    if (TASK_MODEL_OPTIONS.hasOwnProperty(id)) {
      _options = TASK_MODEL_OPTIONS[id]
    } else {
      console.error('Error, option not valid')
    }

    setOptions(_options)
  }, [id])

  const Model_Title = () => {
    if (!id) return <></>
    if (modelKey === 'select-model') return <></>
    if (modelKey === 'UPLOAD') return t('upload-model')
    if (!TASK_MODEL_OPTIONS_CLASS.hasOwnProperty(id)) return <></>
    if (!TASK_MODEL_OPTIONS_CLASS[id].hasOwnProperty(modelKey)) return <></>

    const _model = (new TASK_MODEL_OPTIONS_CLASS[id][modelKey]._class_(t))
    return t(_model.i18n_TITLE)
  }

  const Model_Body = () => {
    if (!id) return <></>
    if (modelKey === 'select-model') return <></>
    if (modelKey === 'UPLOAD') return <>{t('upload-model-info')}</>
    if (!TASK_MODEL_OPTIONS_CLASS.hasOwnProperty(id)) return <></>
    if (!TASK_MODEL_OPTIONS_CLASS[id].hasOwnProperty(modelKey)) return <></>

    const _model = (new TASK_MODEL_OPTIONS_CLASS[id][modelKey]._class_(t))
    return <>
      {_model.DESCRIPTION()}
    </>
  }

  if (VERBOSE) console.debug('render MenuSelectModel')
  return (
    <>
      <Form onSubmit={($event) => handleSubmit($event)}>

        <Container id={'MenuSelectModel'} data-testid={'Test-MenuSelectModel'}>
          <Row className="mt-3 mb-3">
            <Col>
              <Card>
                <Card.Header><h2><Trans i18nKey={'modality.' + id} /></h2></Card.Header>
                <Card.Body>
                  <Card.Text>
                    <Trans i18nKey={'pages.menu-selection-model.form-description-1'} />
                  </Card.Text>
                  <Row>
                    <Col xs={12} sm={12} md={12} lg={10} xl={10} xxl={10}>
                      <Form.Group controlId="FormModel">
                        <Form.Label><Trans i18nKey={'pages.menu-selection-model.form-label'} /></Form.Label>
                        <Form.Select aria-label={t('pages.menu-selection-model.form-label')}
                                     defaultValue={'select-model'}
                                     data-testid={'Test-MenuSelectModel-Select'}
                                     onChange={(e) => {
                                       setModelKey(e.target.value)
                                     }}>
                          <option value={'select-model'} disabled>{t('pages.menu-selection-model.form-option-_-1')}</option>
                          {options.map(({ value, i18n }, index) => {
                            return <option value={value} key={index}>{t(i18n)}</option>
                          })}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col className={'d-flex flex-column-reverse'}
                         xs={12} sm={12} md={12} lg={2} xl={2} xxl={2}>
                      <div className="d-grid gap-2">
                        <Button variant={'outline-info'}
                                className={'mt-3'}
                                disabled={modelKey === 'select-model'}
                                onClick={() => {setShowDescription(true)}}>
                          <Trans i18nKey={prefix + 'description'} />
                        </Button>
                      </div>
                    </Col>
                    <Col className={'mx-auto'}
                         xs={12} sm={12} md={12} lg={6} xl={6} xxl={6}>
                      <div className="d-grid gap-2">
                        <Button variant={'outline-primary'}
                                className={'mt-3'}
                                size={'lg'}
                                type={'submit'}
                                disabled={modelKey === 'select-model'}
                                data-testid={'Test-MenuSelectModel-Submit'}>
                          <Trans i18nKey={'pages.menu-selection-model.form-submit'} />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Form>

      <N4LModal showModal={showDescription}
                setShowModal={setShowDescription}
                title={Model_Title()}
                ComponentBody={Model_Body()}
                ComponentFooter={<></>}
      />
    </>
  )
}
