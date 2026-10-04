import { Card, Col, Container, Row } from 'react-bootstrap'
import { Link, Navigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { TASKS, UPLOAD, type TASKS_TYPE_V } from '@/TASKS'
import { taskOptions, type TaskKind_t } from '@/TASK_OPTIONS'
import { isTask, TASK_INFO } from '@components/task/taskInfo'
import N4LBreadcrumb from '@components/breadcrumb/N4LBreadcrumb'

const prefix = 'pages.task.'

type TaskOptionProps = {
  task : TASKS_TYPE_V
  kind : TaskKind_t
  /** Claves i18n del título, el texto y el botón */
  texts: { title: string, text: string, button: string, count: string }
}

/** Una de las dos maneras de usar la tarea: su explicación, sus modelos o conjuntos (cada uno abre el suyo) y el botón */
function TaskOption({ task, kind, texts }: TaskOptionProps) {
  const { t } = useTranslation()
  const options = taskOptions(task, kind)
  const items = options.filter(({ value }) => value !== UPLOAD)
  const canUpload = options.some(({ value }) => value === UPLOAD)
  const href = (value: string) => `/playground/${task}/${kind}/${value}`
  return (
    <Card className={'n4l-task-card h-100'} data-task={task} data-testid={`Test-Task-${kind === 'model' ? 'Pretrained' : 'Design'}`}>
      <Card.Body className={'d-flex flex-column'}>
        <h2 className={'h4'}>{t(texts.title)}</h2>
        <p>{t(texts.text)}</p>
        <p className={'small text-body-secondary mb-2'}>{t(texts.count, { count: items.length })}</p>
        <ul className={'list-unstyled d-flex flex-wrap gap-2 mb-3'} aria-label={t(texts.count, { count: items.length })}>
          {items.map(({ value, i18n }) => (
            <li key={value}><Link to={href(value)} className={'btn btn-outline-secondary btn-sm'}>{t(i18n)}</Link></li>
          ))}
          {canUpload && <li><Link to={href(UPLOAD)} className={'btn btn-outline-secondary btn-sm'}>{t(prefix + 'upload')}</Link></li>}
        </ul>
        <div className={'mt-auto'}>
          <Link to={`/select-${kind}/${task}`} className={'btn btn-primary'} data-testid={`Test-Task-Choose-${kind}`}>{t(texts.button)}</Link>
        </div>
      </Card.Body>
    </Card>
  )
}

/**
 * La página de una tarea (desde «Tareas» en la cabecera): elegir entre probar los modelos ya entrenados o diseñar,
 * crear y entrenar una red con un conjunto de datos. Identificación de objetos solo tiene modelos ya entrenados y
 * el agrupamiento, solo conjuntos de datos (sin red: k-means)
 */
export default function Task() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  if (!isTask(id)) return <Navigate to={'/404'} replace />
  const hasModels = taskOptions(id, 'model').length > 0
  const hasDatasets = taskOptions(id, 'dataset').some(({ value }) => value !== UPLOAD)
  const isClustering = id === TASKS.CLUSTERING

  return (
    <main className={'mb-4'} data-title={'Task'} data-testid={'Test-Task'}>
      <Container className={'mt-3 n4l-container-wide'}>
        <N4LBreadcrumb task={id} />
        <header className={'py-3'} data-task={id}>
          <h1>{t(TASK_INFO[id].i18nTitle)}</h1>
          <p className={'lead mb-0'}>{t(`pages.index.${id}.1-description-1`)}</p>
        </header>
        <Row xs={1} md={2} className={'g-3'}>
          {hasModels &&
            <Col>
              <TaskOption task={id} kind={'model'}
                texts={{ title: prefix + 'pretrained-title', text: prefix + 'pretrained-text', button: prefix + 'pretrained-button', count: prefix + 'pretrained-count' }} />
            </Col>}
          {hasDatasets &&
            <Col>
              <TaskOption task={id} kind={'dataset'}
                texts={isClustering
                  ? { title: prefix + 'cluster-title', text: prefix + 'cluster-text', button: prefix + 'design-button', count: prefix + 'design-count' }
                  : { title: prefix + 'design-title', text: prefix + 'design-text', button: prefix + 'design-button', count: prefix + 'design-count' }} />
            </Col>}
        </Row>
        {/* Si falta una de las dos, por qué */}
        {!hasDatasets && <p className={'text-body-secondary mt-3 mb-0'}>{t(prefix + 'only-pretrained')}</p>}
        {isClustering && <p className={'text-body-secondary mt-3 mb-0'}>{t(prefix + 'only-cluster')}</p>}
      </Container>
    </main>
  )
}
