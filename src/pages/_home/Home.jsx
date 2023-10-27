import React, { useState } from 'react'
import { Col, Container, Row, Button, Card } from 'react-bootstrap'
import { useTranslation, Trans } from 'react-i18next'

import CookiesModal from '@components/cookiesModal/CookiesModal'

import { useHistory } from 'react-router-dom'
import { TASKS } from '@/DATA_MODEL'
import N4LDivider from '@components/divider/N4LDivider'

const SELECTOR = {
  MODEL  : 'MODEL',
  DATASET: 'DATASET',
}

export default function Home () {
  const history = useHistory()
  const { t } = useTranslation()

  const [buttonActive, setButtonActive] = useState(TASKS.TABULAR_CLASSIFICATION)

  const handleClick_TrainEdit = (selector) => {
    if (selector === SELECTOR.MODEL)
      history.push('/select-model/' + buttonActive)
    if (selector === SELECTOR.DATASET)
      history.push('/select-dataset/' + buttonActive)
  }

  const handleClick_OpenCardModel = (modelType) => {
    setButtonActive(modelType)
  }

  const MenuSelection = () => {
    switch (buttonActive) {
      case TASKS.TABULAR_CLASSIFICATION:
        return (
          <>
            <Card className={'border-primary'}>
              <Card.Header>
                <h2><Trans i18nKey={'pages.index.tabular-classification.1-title'} t={t} /></h2>
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={'pages.index.tabular-classification.1-description-1'} />
                </Card.Text>
                <Card.Text>
                  <Trans i18nKey={'pages.index.tabular-classification.1-description-2'} />
                </Card.Text>
                <div className="d-flex gap-2 justify-content-center">
                  <Button onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)}>
                    <Trans i18nKey={'pages.index.tabular-classification.1-button'} />
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className={'border-primary mt-3'}>
              <Card.Header>
                <h2><Trans i18nKey={'pages.index.tabular-classification.2-title'} /></h2>
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={'pages.index.tabular-classification.2-description-1'} />
                </Card.Text>
                <Card.Text>
                  <Trans i18nKey={'pages.index.tabular-classification.2-description-2'} />
                </Card.Text>
                <Row>
                  <Col>
                    <ul>
                      <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.1'} /></li>
                      <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.2'} /></li>
                      <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.3'} /></li>
                    </ul>
                  </Col>
                  <Col>
                    <ul>
                      <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.4'} /></li>
                      <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.5'} /></li>
                      <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.6'} /></li>
                    </ul>
                  </Col>
                </Row>
                {/*
                <Card.Text>
                  <Trans i18nKey={"pages.index.tabular-classification.2-description-footer"} />
                </Card.Text>
                */}
                <div className="d-flex gap-2 justify-content-center">
                  <Button onClick={() => handleClick_TrainEdit(SELECTOR.DATASET)}>
                    <Trans i18nKey={'pages.index.tabular-classification.2-button'} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </>
        )
      case TASKS.LINEAR_REGRESSION:
        return (
          <>
            <Card className={'border-danger'}>
              <Card.Header>
                <h2><Trans i18nKey={'pages.index.linear-regression.1-title'} /></h2>
              </Card.Header>
              <Card.Body>
                <Card.Text><Trans i18nKey={'pages.index.linear-regression.1-description-1'} /></Card.Text>
                <div className="d-flex gap-2 justify-content-center">
                  <Button data-testid={'Test-GoTo-SelectModel-LinearRegression'}
                          onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)}>
                    <Trans i18nKey={'pages.index.linear-regression.1-button'} />
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className={'border-danger mt-3'}>
              <Card.Header>
                <h2><Trans i18nKey={'pages.index.linear-regression.2-title'} /></h2>
              </Card.Header>
              <Card.Body>
                <Card.Text><Trans i18nKey={'pages.index.linear-regression.2-description-1'} /></Card.Text>
                <Card.Text><Trans i18nKey={'pages.index.linear-regression.2-description-2'} /></Card.Text>
                <Card.Text><Trans i18nKey={'pages.index.linear-regression.2-description-list.title'} /></Card.Text>
                <Row>
                  <Col>
                    <ul>
                      <li><Trans i18nKey={'pages.index.linear-regression.2-description-list.1'} /></li>
                      <li><Trans i18nKey={'pages.index.linear-regression.2-description-list.2'} /></li>
                      <li><Trans i18nKey={'pages.index.linear-regression.2-description-list.3'} /></li>
                    </ul>
                  </Col>
                  <Col>
                    <ul>
                      <li><Trans i18nKey={'pages.index.linear-regression.2-description-list.4'} /></li>
                      <li><Trans i18nKey={'pages.index.linear-regression.2-description-list.5'} /></li>
                      <li><Trans i18nKey={'pages.index.linear-regression.2-description-list.6'} /></li>
                    </ul>
                  </Col>
                </Row>
                <div className="d-flex gap-2 justify-content-center">
                  <Button onClick={() => handleClick_TrainEdit(SELECTOR.DATASET)}>
                    <Trans i18nKey={'pages.index.tabular-classification.2-button'} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </>
        )
      case TASKS.OBJECT_DETECTION:
        return (
          <>
            <Card className={'border-warning'}>
              <Card.Header>
                <h2><Trans i18nKey={'pages.index.object-detection.1-title'} /></h2>
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={'pages.index.object-detection.1-description-1'} />
                </Card.Text>
                <Card.Text>
                  <Trans i18nKey={'pages.index.object-detection.1-description-2'} />
                </Card.Text>
                <div className="d-flex gap-2 justify-content-center">
                  <Button onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)}>
                    <Trans i18nKey={'pages.index.object-detection.1-button'} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </>
        )
      case TASKS.IMAGE_CLASSIFICATION:
        return (
          <>
            <Card className={'border-info'}>
              <Card.Header>
                <h2><Trans i18nKey={'pages.index.image-classification.1-title'} /></h2>
              </Card.Header>
              <Card.Body>
                <Card.Text>
                  <Trans i18nKey={'pages.index.image-classification.1-description-1'} />
                </Card.Text>
                <div className="d-flex gap-2 justify-content-center">
                  <Button onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)}>
                    <Trans i18nKey={'pages.index.image-classification.1-button'} />
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&
              <Card className={'mt-3 border-info'}>
                <Card.Header>
                  <h2><Trans i18nKey={'pages.index.image-classification.2-title'} /></h2>
                </Card.Header>
                <Card.Body>
                  <Card.Text>
                    <Trans i18nKey={'pages.index.image-classification.2-description-1'} />
                  </Card.Text>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button onClick={() => handleClick_TrainEdit(SELECTOR.DATASET)}>
                      <Trans i18nKey={'pages.index.image-classification.2-button'} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            }
          </>
        )
      default:
        return ''
    }
  }

  return (
    <>
      <main className={'mb-3'} data-title={'Home'}>
        <Container>
          <Row>
            <Col>
              <h1 className="mt-3"><Trans i18nKey={'welcome'} /></h1>
              <h2 className="mt-3"><Trans i18nKey={'welcome-2'} /></h2>
            </Col>
          </Row>
        </Container>

        <CookiesModal />

        <Container>
          <Row>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2">
                <Button variant={'primary'}
                        size={'lg'}
                        onClick={() => handleClick_OpenCardModel(TASKS.TABULAR_CLASSIFICATION)}>
                  <Trans i18nKey={'pages.index.tabular-classification.1-title'} />
                </Button>
              </div>
            </Col>
            {process.env.REACT_APP_SHOW_NEW_FEATURE === 'true' &&
              <Col className={'mt-3'}>
                <div className="d-grid gap-2">
                  <Button variant={'danger'}
                          size={'lg'}
                          data-testid={'Test-InitialMenu-LinearRegression'}
                          onClick={() => handleClick_OpenCardModel(TASKS.LINEAR_REGRESSION)}>
                    <Trans i18nKey={'pages.index.linear-regression.1-title'} />
                  </Button>
                </div>
              </Col>
            }
            <Col className={'mt-3'}>
              <div className="d-grid gap-2">
                <Button variant={'info'}
                        size={'lg'}
                        onClick={() => handleClick_OpenCardModel(TASKS.IMAGE_CLASSIFICATION)}>
                  <Trans i18nKey={'pages.index.image-classification.1-title'} />
                </Button>
              </div>
            </Col>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2">
                <Button variant={'warning'}
                        size={'lg'}
                        onClick={() => handleClick_OpenCardModel(TASKS.OBJECT_DETECTION)}>
                  <Trans i18nKey={'pages.index.object-detection.1-title'} />
                </Button>
              </div>
            </Col>
          </Row>
          <N4LDivider i18nKey={'hr.tasks'} />
          <Row className={'mt-3'}>
            <Col xl={12}>
              <MenuSelection />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  )
}
