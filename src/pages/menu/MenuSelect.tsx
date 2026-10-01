import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { Trans, useTranslation } from 'react-i18next'

import N4LModal from '@components/modal/N4LModal'
import N4LBreadcrumb from '@components/breadcrumb/N4LBreadcrumb'
import WaitingPlaceholder from '@components/loading/WaitingPlaceholder'
import { isTask, TASK_INFO } from '@components/task/taskInfo'
import { taskOptions, type TaskKind_t } from '@/TASK_OPTIONS'
import N4LDatasetInfo from '@components/dataset/N4LDatasetInfo'
import { UPLOAD } from '@/TASKS'
import { VERBOSE } from '@/CONSTANTS'
import { useMenuModel } from '@hooks/useMenuModel'

export type MenuKind_t = TaskKind_t

/**
 * Galería de modelos preentrenados (`kind="model"`) o de datasets (`kind="dataset"`) de una tarea. Cada tarjeta
 * abre el playground con un clic; la descripción completa solo se descarga al pedirla (la clase de cada modelo
 * puede arrastrar librerías pesadas).
 */
export default function MenuSelect({ kind }: { kind: MenuKind_t }) {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const testId = `Test-MenuSelect${kind === 'model' ? 'Model' : 'Dataset'}`

  // Modelo cuya descripción se está enseñando en el modal
  const [descriptionKey, setDescriptionKey] = useState<string | null>(null)
  const descriptionModel = useMenuModel(id, descriptionKey ?? '')

  const options = isTask(id) ? taskOptions(id, kind) : []
  if (!isTask(id) || options.length === 0) return <Navigate to={'/404'} replace />
  const { i18nTitle } = TASK_INFO[id]
  const descriptionOption = options.find(({ value }) => value === descriptionKey)
  const uploadOption = options.find(({ value }) => value === UPLOAD)
  // Los modelos preentrenados se entrenaron con el dataset de su misma clave
  const datasetInfo = (value: string) => taskOptions(id, 'dataset').find((option) => option.value === value)?.info
  const listOptions = options.filter(({ value }) => value !== UPLOAD)

  if (VERBOSE) console.debug(`render MenuSelect ${kind}`)
  return (
    <main className={'mb-4'} data-testid={testId}>
      <Container className={'mt-3'}>
        <N4LBreadcrumb task={id} kind={kind} />

        <header className={'py-3'} data-task={id}>
          <h1><Trans i18nKey={i18nTitle} /></h1>
          <p className={'lead mb-0'}><Trans i18nKey={`pages.menu-selection-${kind}.form-description-1`} /></p>
        </header>

        {/* Subir un CSV propio va aparte de los datasets de ejemplo */}
        {uploadOption !== undefined && <>
          <h2 className={'h5 mb-3'}><Trans i18nKey={'pages.menu-selection-dataset.own-dataset'} /></h2>
          <Card className={'n4l-task-card mb-4'} data-task={id} data-testid={`${testId}-Option-${UPLOAD}`}>
            <Card.Body className={'d-flex flex-column flex-md-row align-items-md-center gap-3'}>
              <div className={'flex-grow-1'}>
                <Card.Title as={'h3'} className={'h5'}>{t(uploadOption.i18n)}</Card.Title>
                <Card.Text><Trans i18nKey={'pages.menu-selection-dataset.upload-text'} /></Card.Text>
              </div>
              <Link className={'btn btn-primary px-4'}
                to={`/playground/${id}/${kind}/${UPLOAD}`}
                data-testid={`${testId}-Open-${UPLOAD}`}>
                <Trans i18nKey={'pages.menu.open'} />
              </Link>
            </Card.Body>
          </Card>
          <h2 className={'h5 mb-3'}><Trans i18nKey={'pages.menu-selection-dataset.example-datasets'} /></h2>
        </>}

        <Row xs={1} md={2} lg={3} className={'g-3'}>
          {listOptions.map(({ value, i18n }) => (
            <Col key={value}>
              <Card className={'n4l-task-card h-100'} data-task={id} data-testid={`${testId}-Option-${value}`}>
                <Card.Body>
                  <Card.Title as={'h3'} className={'h5'}>{t(i18n)}</Card.Title>
                  {datasetInfo(value) !== undefined && <N4LDatasetInfo info={datasetInfo(value)!} />}
                </Card.Body>
                <Card.Footer className={'bg-transparent border-0 d-flex gap-2 pb-3'}>
                  <Link className={'btn btn-primary flex-grow-1'}
                    to={`/playground/${id}/${kind}/${value}`}
                    data-testid={`${testId}-Open-${value}`}>
                    <Trans i18nKey={'pages.menu.open'} />
                  </Link>
                  <Button variant={'outline-secondary'} onClick={() => setDescriptionKey(value)}>
                    <Trans i18nKey={`pages.menu.select-${kind}.description`} />
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <N4LModal showModal={descriptionKey !== null}
        setShowModal={() => setDescriptionKey(null)}
        size={'lg'}
        title={descriptionModel !== null ? t(descriptionModel.i18n_TITLE) : descriptionOption && t(descriptionOption.i18n)}
        ComponentBody={descriptionModel !== null ? descriptionModel.DESCRIPTION() : <WaitingPlaceholder />}
        ComponentFooter={descriptionKey !== null &&
          <Link className={'btn btn-primary'} to={`/playground/${id}/${kind}/${descriptionKey}`}>
            <Trans i18nKey={'pages.menu.open'} />
          </Link>
        }
      />
    </main>
  )
}
