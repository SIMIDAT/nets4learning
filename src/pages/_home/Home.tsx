import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useTranslation, Trans } from 'react-i18next'
import { Col, Container, Row, Button, Card } from 'react-bootstrap'


import { TASKS, type TASKS_TYPE_V } from '@/TASKS'
import { isTask } from '@components/task/taskInfo'
import N4LDivider from '@components/divider/N4LDivider'
import { sectionId } from '@components/divider/sectionId'
import { scrollToSection } from '@components/divider/useActiveSection'
import { LEARNING_STEPS, useLearningPath } from '@core/learning/learningPath'

const SELECTED_TASK_STORAGE_KEY = 'selected-task'

// La última tarea que eligió el usuario; sin almacenamiento o sin elección válida, clasificación tabular
const readSelectedTask = (): TASKS_TYPE_V => {
  try {
    const saved = localStorage.getItem(SELECTED_TASK_STORAGE_KEY) ?? undefined
    if (isTask(saved)) return saved
  } catch {
    // Sin localStorage (modo privado, almacenamiento bloqueado…)
  }
  return TASKS.TABULAR_CLASSIFICATION
}

const saveSelectedTask = (task: TASKS_TYPE_V) => {
  try {
    localStorage.setItem(SELECTED_TASK_STORAGE_KEY, task)
  } catch {
    // Sin almacenamiento: la tarea solo dura esta visita
  }
}

const SELECTOR: Record<string, string> = {
  MODEL  : 'MODEL',
  DATASET: 'DATASET',
}

const MenuSelection = ({ activeTask }: { activeTask: TASKS_TYPE_V }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const handleClick_TrainEdit = (selector: keyof typeof SELECTOR) => {
    switch (selector) {
      case SELECTOR.MODEL:
        navigate(`/select-model/${activeTask}`)
        break
      case SELECTOR.DATASET:
        navigate(`/select-dataset/${activeTask}`)
        break
      default:
        console.warn('Selector no válido:', { selector, activeTask })
    }
  }
  switch (activeTask) {
    case TASKS.TABULAR_CLASSIFICATION:
      return (
        <>
          <Card className={'border border-2 border-primary'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.tabular-classification.1-title'} t={t} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.tabular-classification.1-description-1'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.tabular-classification.1-description-2'} /></Card.Text>
              <div className="d-flex gap-2 justify-content-center">
                <Button onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)}>
                  <Trans i18nKey={'pages.index.tabular-classification.1-button'} />
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className={'border border-2 border-primary mt-3'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.tabular-classification.2-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.tabular-classification.2-description-1'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.tabular-classification.2-description-2'} /></Card.Text>
              <Row>
                <Col sm>
                  <ul>
                    <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.1'} /></li>
                    <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.2'} /></li>
                    <li><Trans i18nKey={'pages.index.tabular-classification.2-description-list.3'} /></li>
                  </ul>
                </Col>
                <Col sm>
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
    case TASKS.REGRESSION:
      return (
        <>
          <Card className={'border border-2 border-danger'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.regression.1-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.regression.1-description-1'} /></Card.Text>
              <div className="d-flex gap-2 justify-content-center">
                <Button data-testid={'Test-GoTo-SelectModel-LinearRegression'}
                  onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)}>
                  <Trans i18nKey={'pages.index.regression.1-button'} />
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className={'border border-2 border-danger mt-3'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.regression.2-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.regression.2-description-1'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.regression.2-description-2'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.regression.2-description-list.title'} /></Card.Text>
              <Row>
                <Col sm>
                  <ul>
                    <li><Trans i18nKey={'pages.index.regression.2-description-list.1'} /></li>
                    <li><Trans i18nKey={'pages.index.regression.2-description-list.2'} /></li>
                    <li><Trans i18nKey={'pages.index.regression.2-description-list.3'} /></li>
                  </ul>
                </Col>
                <Col sm>
                  <ul>
                    <li><Trans i18nKey={'pages.index.regression.2-description-list.4'} /></li>
                    <li><Trans i18nKey={'pages.index.regression.2-description-list.5'} /></li>
                    <li><Trans i18nKey={'pages.index.regression.2-description-list.6'} /></li>
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
          <Card className={'border border-2 border-warning'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.object-detection.1-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.object-detection.1-description-1'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.object-detection.1-description-2'} /></Card.Text>
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
          <Card className={'border border-2 border-info'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.image-classification.1-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.image-classification.1-description-1'} /></Card.Text>
              <div className="d-flex gap-2 justify-content-center">
                <Button onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)}>
                  <Trans i18nKey={'pages.index.image-classification.1-button'} />
                </Button>
              </div>
            </Card.Body>
          </Card>
          <Card className={'mt-3 border border-2 border-info'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.image-classification.2-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.image-classification.2-description-1'} /></Card.Text>
              <Row>
                <Col sm>
                  <ul>
                    <li><Trans i18nKey={'pages.index.image-classification.2-description-list.1'} /></li>
                    <li><Trans i18nKey={'pages.index.image-classification.2-description-list.2'} /></li>
                    <li><Trans i18nKey={'pages.index.image-classification.2-description-list.3'} /></li>
                  </ul>
                </Col>
                <Col sm>
                  <ul>
                    <li><Trans i18nKey={'pages.index.image-classification.2-description-list.4'} /></li>
                    <li><Trans i18nKey={'pages.index.image-classification.2-description-list.5'} /></li>
                    <li><Trans i18nKey={'pages.index.image-classification.2-description-list.6'} /></li>
                  </ul>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-center">
                <Button onClick={() => handleClick_TrainEdit(SELECTOR.DATASET)}>
                  <Trans i18nKey={'pages.index.image-classification.2-button'} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )
    case TASKS.CLUSTERING:
      return (
        <>
          <Card className={'border border-2 border-success'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.clustering.1-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.clustering.1-description-1'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.clustering.1-description-2'} /></Card.Text>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant={'success'} onClick={() => handleClick_TrainEdit(SELECTOR.DATASET)} data-testid={'Test-GoTo-SelectDataset-Clustering'}>
                  <Trans i18nKey={'pages.index.clustering.1-button'} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )
    case TASKS.TIME_SERIES:
      return (
        <>
          <Card className={'border border-2 border-purple'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.time-series.1-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.time-series.1-description-1'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.time-series.1-description-2'} /></Card.Text>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant={'purple'} onClick={() => handleClick_TrainEdit(SELECTOR.MODEL)} data-testid={'Test-GoTo-SelectModel-TimeSeries'}>
                  <Trans i18nKey={'pages.index.time-series.1-button'} />
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className={'border border-2 border-purple mt-3'}>
            <Card.Header>
              <h3 className={'h2'}><Trans i18nKey={'pages.index.time-series.2-title'} /></h3>
            </Card.Header>
            <Card.Body>
              <Card.Text><Trans i18nKey={'pages.index.time-series.2-description-1'} /></Card.Text>
              <Card.Text><Trans i18nKey={'pages.index.time-series.2-description-2'} /></Card.Text>
              <Row>
                <Col sm>
                  <ul>
                    <li><Trans i18nKey={'pages.index.time-series.2-description-list.1'} /></li>
                    <li><Trans i18nKey={'pages.index.time-series.2-description-list.2'} /></li>
                    <li><Trans i18nKey={'pages.index.time-series.2-description-list.3'} /></li>
                  </ul>
                </Col>
                <Col sm>
                  <ul>
                    <li><Trans i18nKey={'pages.index.time-series.2-description-list.4'} /></li>
                    <li><Trans i18nKey={'pages.index.time-series.2-description-list.5'} /></li>
                    <li><Trans i18nKey={'pages.index.time-series.2-description-list.6'} /></li>
                  </ul>
                </Col>
              </Row>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant={'purple'} onClick={() => handleClick_TrainEdit(SELECTOR.DATASET)} data-testid={'Test-GoTo-SelectDataset-TimeSeries'}>
                  <Trans i18nKey={'pages.index.time-series.2-button'} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )
    default:
      return ''
  }
}


export default function Home() {

  // Suscribimos Home a los cambios de idioma: así se re-renderiza al cambiar idioma y los
  // botones de disciplina (que usan <Trans>) se actualizan al momento, no solo las tarjetas.
  const { i18n } = useTranslation()

  // ?task=… (la miga de pan de la tarea en el playground): esa tarea manda mientras esté en la dirección
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTask = searchParams.get('task') ?? undefined
  const urlTask = isTask(requestedTask) ? requestedTask : undefined
  const [selectedTask, setSelectedTask] = useState<TASKS_TYPE_V>(() => urlTask ?? readSelectedTask())
  const activeTask = urlTask ?? selectedTask

  // La que llega por la dirección también se recuerda para la próxima visita
  useEffect(() => {
    if (urlTask !== undefined) saveSelectedTask(urlTask)
  }, [urlTask])

  // Al elegir una tarea, la página baja hasta sus tarjetas, con el foco en su separador. Después de pintarlas: con las
  // de antes, más cortas o más largas, el sitio al que bajar sería otro
  const [scrollRequest, setScrollRequest] = useState(0)
  useEffect(() => {
    if (scrollRequest > 0) scrollToSection(sectionId('hr.tasks'))
  }, [scrollRequest])

  const handleClick_OpenCardModel = (task: TASKS_TYPE_V) => {
    setSelectedTask(task)
    saveSelectedTask(task)
    if (searchParams.has('task')) setSearchParams({}, { replace: true })
    setScrollRequest((request) => request + 1)
  }



  return (
    <>
      <main className={'mb-3'} data-title={'Home'} data-lang={i18n.language} data-testid={'Test-InitialMenu'}>
        <Container>
          <Row>
            <Col>
              <h1 className="mt-3"><Trans i18nKey={'welcome'} /></h1>
              <p className="lead mb-0"><Trans i18nKey={'pages.index.hero.text'} /></p>
              <N4LStartHere />
              <h2 className="mt-3"><Trans i18nKey={'welcome-2'} /></h2>
            </Col>
          </Row>
        </Container>

        <Container>
          <Row>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2 h-100">
                <Button variant={'primary'}
                  size={'lg'}
                  data-testid={'Test-InitialMenu-TabularClassification'}
                  onClick={() => handleClick_OpenCardModel(TASKS.TABULAR_CLASSIFICATION)}>
                  <Trans i18nKey={'pages.index.tabular-classification.1-title'} />
                </Button>
              </div>
            </Col>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2 h-100">
                <Button variant={'danger'}
                  size={'lg'}
                  data-testid={'Test-InitialMenu-LinearRegression'}
                  onClick={() => handleClick_OpenCardModel(TASKS.REGRESSION)}>
                  <Trans i18nKey={'pages.index.regression.1-title'} />
                </Button>
              </div>
            </Col>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2 h-100">
                <Button variant={'info'}
                  size={'lg'}
                  data-testid={'Test-InitialMenu-ImageClassification'}
                  onClick={() => handleClick_OpenCardModel(TASKS.IMAGE_CLASSIFICATION)}>
                  <Trans i18nKey={'pages.index.image-classification.1-title'} />
                </Button>
              </div>
            </Col>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2 h-100">
                <Button variant={'warning'}
                  size={'lg'}
                  data-testid={'Test-InitialMenu-ObjectDetection'}
                  onClick={() => handleClick_OpenCardModel(TASKS.OBJECT_DETECTION)}>
                  <Trans i18nKey={'pages.index.object-detection.1-title'} />
                </Button>
              </div>
            </Col>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2 h-100">
                <Button variant={'success'}
                  size={'lg'}
                  data-testid={'Test-InitialMenu-Clustering'}
                  onClick={() => handleClick_OpenCardModel(TASKS.CLUSTERING)}>
                  <Trans i18nKey={'pages.index.clustering.1-title'} />
                </Button>
              </div>
            </Col>
            <Col className={'mt-3'}>
              <div className="d-grid gap-2 h-100">
                <Button variant={'purple'}
                  size={'lg'}
                  data-testid={'Test-InitialMenu-TimeSeries'}
                  onClick={() => handleClick_OpenCardModel(TASKS.TIME_SERIES)}>
                  <Trans i18nKey={'pages.index.time-series.1-title'} />
                </Button>
              </div>
            </Col>
          </Row>
          <N4LDivider i18nKey={'hr.tasks'} />
          <Row className={'mt-3'}>
            <Col xl={12}>
              <MenuSelection activeTask={activeTask} />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  )
}

/** ¿Primera vez? El enlace a «Empieza aquí» (/learn) o, si ya se empezó, cuántos pasos van */
function N4LStartHere() {
  const { started, done } = useLearningPath()
  const count = LEARNING_STEPS.filter(({ id }) => done.includes(id)).length
  const key = !started ? 'first' : count < LEARNING_STEPS.length ? 'continue' : 'finished'
  return (
    <p className={'mt-2 mb-0'} data-testid={'Test-StartHere'}>
      <Trans i18nKey={'pages.learn.home.' + key}
        values={{ count, total: LEARNING_STEPS.length }}
        components={{ link1: <Link to={'/learn'} className={'fw-semibold'} /> }} />
    </p>
  )
}
