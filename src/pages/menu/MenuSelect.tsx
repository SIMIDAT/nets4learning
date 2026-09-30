import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Form, Button, Row, Col, Container, Card } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'
import N4LModal from '@components/modal/N4LModal'
import alertHelper from '@utils/alertHelper'

import {
  TASK_DATASET_OPTIONS,
  TASK_MODEL_OPTIONS,
  type DATASET_OPTIONS_TYPE,
  type MODEL_OPTIONS_TYPE,
  type TASKS_TYPE_V
} from '@/DATA_MODEL'
import { VERBOSE } from '@/CONSTANTS'
import { useMenuModel } from '@hooks/useMenuModel'


export type MenuKind_t = 'model' | 'dataset'

// Opciones de cada tarea: modelos preentrenados o datasets para entrenar
const TASK_OPTIONS: Record<MenuKind_t, Record<string, MODEL_OPTIONS_TYPE | DATASET_OPTIONS_TYPE>> = {
  model  : TASK_MODEL_OPTIONS,
  dataset: TASK_DATASET_OPTIONS,
}

/**
 * Selector de modelo preentrenado (`kind="model"`) o de dataset (`kind="dataset"`) de una tarea.
 * Las claves de i18n, los test-id y la ruta de destino siguen el mismo patrón en los dos casos.
 */
export default function MenuSelect({ kind }: { kind: MenuKind_t }) {

  const { id } = useParams<{ id: TASKS_TYPE_V }>()
  const { t } = useTranslation()
  const prefix = `pages.menu.select-${kind}.`
  const navigate = useNavigate()
  const NO_SELECTION = `select-${kind}`
  const testId = `Test-MenuSelect${kind === 'model' ? 'Model' : 'Dataset'}`

  const [selectedKey, setSelectedKey] = useState(NO_SELECTION)
  const options = id !== undefined && id in TASK_OPTIONS[kind] ? TASK_OPTIONS[kind][id] : []
  const [showDescription, setShowDescription] = useState(false)
  // Solo se descarga el modelo seleccionado, para mostrar su título y descripción.
  const selectedModel = useMenuModel(id, selectedKey)

  const handleSubmit = async ($event: React.FormEvent<HTMLFormElement>) => {
    $event.preventDefault()
    if (selectedKey === NO_SELECTION) {
      await alertHelper.alertWarning(t(`alert.menu.need-select-${kind}`))
    } else {
      navigate(`/playground/${id}/${kind}/${selectedKey}`)
    }
  }

  useEffect(() => {
    if (!id) {
      console.error('Error, id is undefined')
      return
    }
    if (!(id in TASK_OPTIONS[kind])) {
      console.error(`Error, ${kind} not valid`)
      return
    }
  }, [id, kind])

  const Menu_Title = () => {
    if (!id) return <></>
    if (selectedKey === NO_SELECTION) return <></>
    if (selectedKey === 'UPLOAD') return t(`upload-${kind}`)
    if (!selectedModel) return <></>
    return t(selectedModel.i18n_TITLE)
  }

  const Menu_Body = () => {
    if (!id) return <></>
    if (selectedKey === NO_SELECTION) return <></>
    if (selectedKey === 'UPLOAD') return <>{t(`upload-${kind}-info`)}</>
    if (!selectedModel) return <></>
    return <>{selectedModel.DESCRIPTION()}</>
  }

  if (VERBOSE) console.debug(`render MenuSelect ${kind}`)
  return (
    <>
      <Form onSubmit={handleSubmit}>

        <Container id={testId.replace('Test-', '')} data-testid={testId}>
          <Row className="mt-3 mb-3">
            <Col>
              <Card>
                <Card.Header><h2><Trans i18nKey={'modality.' + id} /></h2></Card.Header>
                <Card.Body>
                  <Card.Text>
                    <Trans i18nKey={`pages.menu-selection-${kind}.form-description-1`} />
                  </Card.Text>
                  <Row>
                    <Col xs={12} sm={12} md={12} lg={10} xl={10} xxl={10}>
                      <Form.Group controlId="FormModel">
                        <Form.Label><Trans i18nKey={`pages.menu-selection-${kind}.form-label`} /></Form.Label>
                        <Form.Select
                          aria-label={t(`pages.menu-selection-${kind}.form-label`)}
                          defaultValue={NO_SELECTION}
                          data-testid={`${testId}-Select`}
                          onChange={(e) => {
                            setSelectedKey(e.target.value)
                          }}>
                          <option value={NO_SELECTION} disabled>{t(`pages.menu-selection-${kind}.form-option-_-1`)}</option>
                          {options.map(({ value, i18n }, index) => {
                            return <option value={value} key={index}>{t(i18n)}</option>
                          })}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col
                      className={'d-flex flex-column-reverse'}
                      xs={12} sm={12} md={12} lg={2} xl={2} xxl={2}>
                      <div className="d-grid gap-2">
                        <Button variant={'outline-info'}
                          className={'mt-3'}
                          disabled={selectedKey === NO_SELECTION}
                          onClick={() => { setShowDescription(true) }}>
                          <Trans i18nKey={prefix + 'description'} />
                        </Button>
                      </div>
                    </Col>
                    <Col 
                    className={'mx-auto'}
                      xs={12} sm={12} md={12} lg={6} xl={6} xxl={6}>
                      <div className="d-grid gap-2">
                        <Button
                          variant={'outline-primary'}
                          className={'mt-3'}
                          size={'lg'}
                          type={'submit'}
                          disabled={selectedKey === NO_SELECTION}
                          data-testid={`${testId}-Submit`}>
                          <Trans i18nKey={`pages.menu-selection-${kind}.form-submit`} />
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
        size={'lg'}
        title={Menu_Title()}
        ComponentBody={Menu_Body()}
        ComponentFooter={<></>}
      />
    </>
  )
}
