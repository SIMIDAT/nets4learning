import React, { useEffect, useState } from 'react'
import { Form, Button, Row, Col, Container, Card } from 'react-bootstrap'
import { useParams, useHistory } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import N4LModal from '@components/modal/N4LModal'
import alertHelper from '@utils/alertHelper'
import {
  TASK_DATASET_OPTIONS,
  TASK_MODEL_OPTIONS_CLASS
} from '@/DATA_MODEL'
import { VERBOSE } from '@/CONSTANTS'

export default function MenuSelectDataset () {

  const { id } = useParams()
  const { t } = useTranslation()
  const history = useHistory()

  const prefix = 'pages.menu.select-dataset.'
  const [datasetKey, setDatasetKey] = useState('select-dataset')
  const [options, setOptions] = useState([])
  const [showDescription, setShowDescription] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (datasetKey === 'select-dataset') {
      await alertHelper.alertWarning(t('alert.menu.need-select-dataset'))
    } else {
      history.push('/playground/' + id + '/dataset/' + datasetKey)
    }
  }

  useEffect(() => {
    let _options = []
    if (id in TASK_DATASET_OPTIONS) {
      _options = TASK_DATASET_OPTIONS[id]
    } else {
      console.error('Error, option not valid')
    }
    setOptions(_options)
  }, [id])

  const Dataset_Title = () => {
    if (!id) return <></>
    if (datasetKey === 'select-model') return <></>
    if (datasetKey === 'UPLOAD') return t('upload-dataset')
    if (!(id in TASK_MODEL_OPTIONS_CLASS)) return <></>
    if (!(datasetKey in TASK_MODEL_OPTIONS_CLASS[id])) return <></>

    const _model = (new TASK_MODEL_OPTIONS_CLASS[id][datasetKey]._class_(t))
    return t(_model.i18n_TITLE)
  }

  const Dataset_Body = () => {
    if (!id) return <></>
    if (datasetKey === 'select-model') return <></>
    if (datasetKey === 'UPLOAD') return <>{t('upload-dataset-info')}</>
    if (!(id in TASK_MODEL_OPTIONS_CLASS)) return <></>
    if (!(datasetKey in TASK_MODEL_OPTIONS_CLASS[id])) return <></>

    const _model = (new TASK_MODEL_OPTIONS_CLASS[id][datasetKey]._class_(t))
    return <>
      {_model.DESCRIPTION()}
    </>
  }

  if (VERBOSE) console.debug('render MenuSelectDataset')
  return <>
    <Form onSubmit={($event) => handleSubmit($event)}>
      <Container id={'MenuSelectDataset'} data-testid={'Test-MenuSelectDataset'}>
        <Row className="mt-3 mb-3">
          <Col>
            <Card>
              <Card.Header><h2><Trans i18nKey={'modality.' + id} /></h2></Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={'pages.menu-selection-dataset.form-description-1'} />
                </Card.Text>
                <Row>
                  <Col xs={12} sm={12} md={12} lg={10} xl={10} xxl={10}>

                    <Form.Group controlId="FormDataset">
                      <Form.Label><Trans i18nKey={'pages.menu-selection-dataset.form-label'} /></Form.Label>
                      <Form.Select aria-label={t('pages.menu-selection-dataset.form-label')}
                                   defaultValue={'select-dataset'}
                                   onChange={(e) => setDatasetKey(e.target.value)}>
                        <option value={'select-dataset'} disabled>{t('pages.menu-selection-dataset.form-option-_-1')}</option>
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
                              disabled={datasetKey === 'select-dataset'}
                              onClick={() => {setShowDescription(true)}}>
                        <Trans i18nKey={prefix + 'description'} />
                      </Button>
                    </div>
                  </Col>

                  <Col className={'mx-auto'}
                       xs={12} sm={12} md={12} lg={6} xl={6} xxl={6}>
                    <div className="d-grid gap-2">
                      <Button variant={'outline-primary'}
                              size={'lg'}
                              className={'mt-3'}
                              type={'submit'}
                              disabled={datasetKey === 'select-dataset'}
                              data-testid={'Test-MenuSelectDataset-Submit'}>
                        <Trans i18nKey={'pages.menu-selection-dataset.form-submit'} />
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
              title={Dataset_Title()}
              ComponentBody={Dataset_Body()}
              ComponentFooter={<></>} />

  </>

}
