import { useState } from 'react'
import { Alert, Badge, Button, Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { trackEvent } from '@core/analytics'
import { importN4LPackage, localKey, localPackageName, removeLocalPackage, type LocalPackage_t } from '@core/n4l/localPackages'
import { N4LError } from '@core/n4l/validate'
import { useLocalPackages } from '@hooks/useLocalPackages'
import DragAndDrop from '@components/dragAndDrop/DragAndDrop'
import N4LEmptyState from '@components/loading/N4LEmptyState'
import { isTask, TASK_INFO } from '@components/task/taskInfo'

const prefix = 'n4l.local.'

// Un .n4l es un ZIP: según el sistema llega con un tipo u otro (o ninguno)
const N4L_ACCEPT = { 'application/zip': ['.n4l'], 'application/x-zip-compressed': ['.n4l'], 'application/octet-stream': ['.n4l'], 'application/vnd.nets4learning.n4l+zip': ['.n4l'] }

/** El nombre de un paquete: el de su primera tarea */
const packageName = (info: LocalPackage_t, language: string) => localPackageName(info, info.tasks[0]?.task ?? '', language)

/** Un paquete guardado: en cada una de sus tareas, probar su modelo (si trae alguno) o entrenar con su conjunto */
function LocalPackageCard({ info }: { info: LocalPackage_t }) {
  const { t, i18n } = useTranslation()
  const size = new Intl.NumberFormat(i18n.language, { style: 'unit', unit: 'kilobyte', maximumFractionDigits: 0 })
  const name = packageName(info, i18n.language)
  return (
    <Card className={'n4l-task-card h-100'} data-task={info.tasks[0]?.task} data-testid={`Test-N4LLocal-${info.id}`}>
      <Card.Body>
        <Card.Title as={'h3'} className={'h5'}>{name}</Card.Title>
        <p className={'small text-body-secondary'}>
          {t(prefix + 'version', { version: info.version, size: size.format(Math.max(1, Math.round(info.bytes / 1024))) })}
        </p>
        <ul className={'list-unstyled mb-0 d-grid gap-2'}>
          {info.tasks.map(({ task, models }) => (
            <li key={task} data-testid={`Test-N4LLocal-${info.id}-${task}`}>
              <div className={'small fw-semibold mb-1'}>{isTask(task) ? t(TASK_INFO[task].i18nTitle) : task}</div>
              <div className={'d-flex flex-wrap gap-2'}>
                {models > 0 &&
                  <Link className={'btn btn-sm btn-outline-primary'} to={`/playground/${task}/model/${localKey(info.id)}`}>{t('datasets.try-model')}</Link>}
                <Link className={'btn btn-sm btn-primary'} to={`/playground/${task}/dataset/${localKey(info.id)}`}>{t('datasets.train')}</Link>
              </div>
            </li>
          ))}
        </ul>
      </Card.Body>
      <Card.Footer className={'bg-transparent border-0 pb-3'}>
        <Button size={'sm'} variant={'outline-danger'} onClick={() => removeLocalPackage(info.id)} aria-label={t(prefix + 'remove-title', { name })}>
          {t(prefix + 'remove')}
        </Button>
      </Card.Footer>
    </Card>
  )
}

/**
 * Los paquetes .n4l del usuario: abrir uno (se valida y se guarda en el navegador) y los ya guardados, cada uno con sus
 * tareas (probar su modelo o entrenar con su conjunto) y para quitarlo
 */
export default function N4LLocalPackages() {
  const { t, i18n } = useTranslation()
  const packages = useLocalPackages()
  const [problems, setProblems] = useState<string[] | null>(null)
  const [imported, setImported] = useState<string | null>(null)

  const handleDrop = async (files: File[]) => {
    if (files.length !== 1) return
    setProblems(null)
    setImported(null)
    try {
      const info = await importN4LPackage(await files[0].arrayBuffer())
      setImported(packageName(info, i18n.language))
      trackEvent('n4l_import', { outcome: 'ok', item: info.id })
    } catch (error) {
      setProblems(error instanceof N4LError ? error.problems : [error instanceof Error ? error.message : String(error)])
      trackEvent('n4l_import', { outcome: 'error' })
    }
  }

  return (
    <div data-testid={'Test-N4LLocalPackages'}>
      <Card className={'mt-3'}>
        <Card.Header><h2 className={'h5 mb-0'}>{t(prefix + 'open-title')}</h2></Card.Header>
        <Card.Body>
          <p className={'small text-body-secondary'}>{t(prefix + 'how')}</p>
          <DragAndDrop id={'drop-zone-n4l'} name={'n4l'} accept={N4L_ACCEPT} text={t(prefix + 'drop')} labelFiles={t(prefix + 'files')}
            function_DropAccepted={handleDrop} />
          {imported !== null && <Alert variant={'success'} className={'mt-3 mb-0'} data-testid={'Test-N4LImported'}>{t(prefix + 'imported', { name: imported })}</Alert>}
          {problems !== null &&
            <Alert variant={'danger'} className={'mt-3 mb-0'} data-testid={'Test-N4LImportError'}>
              <p className={'mb-1'}>{t(prefix + 'error')}</p>
              <ul className={'mb-0'}>{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
            </Alert>}
        </Card.Body>
      </Card>

      <section className={'mt-4'}>
        <h2 className={'h4'}>{t(prefix + 'saved')} <Badge pill bg={'secondary'} className={'ms-1 fs-6 align-middle'}>{packages.length}</Badge></h2>
        {packages.length === 0 && <N4LEmptyState i18nKey={prefix + 'empty'} />}
        {packages.length > 0 &&
          <Row xs={1} md={2} lg={3} className={'g-3'}>
            {packages.map((info) => <Col key={info.id}><LocalPackageCard info={info} /></Col>)}
          </Row>}
      </section>
    </div>
  )
}
